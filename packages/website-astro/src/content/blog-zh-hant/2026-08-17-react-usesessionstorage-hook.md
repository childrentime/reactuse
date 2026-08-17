---
title: "React useSessionStorage Hook：重新整理不丟、只屬於當前分頁的狀態 (2026)"
description: "useSessionStorage 實用指南：sessionStorage 到底承諾了什麼（重新整理、導航、跳出去再跳回來都還在；分頁一關就沒；絕不會漏到別的分頁），什麼時候該選它而不是 useLocalStorage 和 useCookie，多步表單、OAuth 重新導向、按分頁隔離的視圖狀態、每次會話只彈一次這四種模式，物件/Map/Set/Date 的自動序列化，setValue(null) 刪除 key，同分頁元件同步，以及從 SSR 水合到瀏覽器恢復分頁的每一個坑。TypeScript 優先，SSR 安全。"
slug: react-usesessionstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-17
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react usesessionstorage, usesessionstorage, usesessionstorage react, useSessionStorage hook, react sessionstorage hook, sessionstorage react, react session storage 狀態, react 重新整理保留狀態 分頁, react 多步表單 狀態持久化, react 嚮導 重新整理, sessionstorage vs localstorage react, useSessionStorage vs useLocalStorage, react sessionstorage typescript, ssr 安全 sessionstorage, sessionstorage next.js 水合, react sessionstorage hook typescript, react 表單狀態 重新整理不丟]
image: /img/og.png
---

# React useSessionStorage Hook：重新整理不丟、只屬於當前分頁的狀態 (2026)

這是一個會在第三步把顧客弄丟的結帳流程：

```tsx
function Checkout() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  // 第 1 步：地址，第 2 步：配送，第 3 步：支付……
}
```

顧客填好地址、選好配送方式，到支付這一步，支付服務商把他們跳到 3-D Secure 驗證頁再跳回來。或者他們只是按了下重新整理。不管哪種，`step` 又回到 `0`，`form` 又是空的。`useState` 的壽命就是元件實例的壽命——一次重新整理、一次重新導向、一次整頁導航，它就沒了。

所有人都知道解法是 Web Storage。多數人伸手拿的是 `localStorage`，它確實管用——直到它管得太多。填了一半的結帳單現在出現在顧客開啟的每一個分頁裡，下週他們回來買別的東西時它還在，而如果他們開了兩個分頁比較配送方案，[`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 會忠實地把兩張表單互相同步成一樣。你真正想要的，是能在*這個分頁*的重新整理和重新導向中活下來、分頁關掉就跟著消失的狀態。那就是 `sessionStorage`，而 [`@reactuses/core`](https://reactuse.com) 裡的 [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) 就是它的 `useState` 形態。這篇文章講 `sessionStorage` 真正承諾了什麼（以及沒承諾什麼），什麼時候選它而不是 `localStorage` 和 cookie，它天生適合的四種模式，以及那些會咬到手寫版本的坑——水合、分頁恢復、`window.open`。

<!-- truncate -->

## 快速開始

```bash
npm install @reactuses/core
```

```tsx
import { useSessionStorage } from "@reactuses/core";

function Checkout() {
  const [step, setStep] = useSessionStorage("checkout:step", 0);
  const [form, setForm] = useSessionStorage<CheckoutForm>("checkout:form", EMPTY_FORM);

  return (
    <Wizard step={step ?? 0} onNext={() => setStep(s => (s ?? 0) + 1)}>
      <AddressStep value={form!.address} onChange={address => setForm(f => ({ ...f!, address }))} />
      {/* … */}
    </Wizard>
  );
}
```

`useSessionStorage(key, defaultValue)` 返回和 `useState` 一樣的 `[value, setValue]` 元組，支援一樣的函式式更新。值在掛載時從 `sessionStorage` 讀出，每次更新寫回，型別是 `T | null`——之所以有 `null`，是因為 `setValue(null)` 會刪掉這個 key（下文細說）。重新整理頁面、被跳到支付服務商再跳回來、離開頁面再按瀏覽器後退：`step` 和 `form` 都停在顧客離開時的位置。關掉分頁：它們就沒了，這正是目的。

## sessionStorage 到底承諾了什麼

這個名字會誤導人以為 "session" 指的是"登入會話"或"瀏覽器會話"。它指的是**一個頂層瀏覽上下文——一個分頁或視窗——裡的一個源（origin）**。具體來說：

| 事件 | 存活？ |
| --- | --- |
| 重新整理 / 強制重新整理 | ✅ |
| 客戶端路由切換（SPA） | ✅ |
| 整頁導航到同源的另一個頁面 | ✅ |
| 跳轉到第三方網站再回來（OAuth、支付、SSO） | ✅ —— 同一個分頁，回來時同一個源 |
| 瀏覽器後退 / 前進 | ✅ |
| 在**新分頁**裡開啟同一個 URL | ❌ 全新的空儲存 |
| 關閉分頁 | ❌ 清除（有個例外：能恢復已關閉分頁的瀏覽器也會把它的 `sessionStorage` 一起恢復） |
| 關閉瀏覽器 | ❌ |

有兩個邊緣情況會讓人意外。第一，**`window.open()` 會複製**開啟者的 `sessionStorage` 到新視窗（按 HTML 規範，只要新視窗保留了 `opener`），Chrome 的"複製分頁"也會複製——但那是一次性快照，不是即時連結；從那一刻起兩個分頁各走各的。現代瀏覽器預設以 `noopener` 開啟 `target="_blank"` 連結，所以普通連結是乾淨起步的。第二，`sessionStorage` **和同一分頁裡的同源 iframe 是共享的**——它們屬於同一個瀏覽上下文組——這也是瀏覽器原生 `storage` 事件對它唯一有意義的地方（見下文）。

其餘部分和 `localStorage` 契約相同：同步、只存字串、每個源大約 5 MB、頁面上任何指令碼都能讀——所以它**不是安全邊界**。它比 `localStorage` *更短命*，洩露時的爆炸半徑更小，但 XSS 讀它一樣輕鬆。任何必須對 JavaScript 保密的東西屬於 `httpOnly` cookie，不屬於這裡。

## useSessionStorage vs useLocalStorage vs useCookie vs useState

按值該住在*哪裡*、活*多久*來選：

| 你需要的狀態…… | 用 |
| --- | --- |
| 和元件活得一樣久 | `useState` |
| 在**這個分頁**裡重新整理、重新導向都還在，然後消失 | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| 瀏覽器重啟還在，且**跨分頁**保持同步 | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) |
| **伺服器端**在第一個請求就需要 | [`useCookie`](https://reactuse.com/state/usecookie/) |
| 是分頁之間的訊息，不是儲存 | [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) |

一條能解決 90% "local 還是 session？"爭論的經驗法則：**如果兩個分頁顯示不同的值算 bug，用 `localStorage`；如果兩個分頁顯示相同的值算 bug，用 `sessionStorage`。**主題、語言、"永遠別再顯示"——使用者期望它們在任何地方都是同一個值，所以是 local。填了一半的表單、*這個*儀表板視圖上的篩選條件、跳去認證之前所在的頁面——它們屬於某一個分頁，所以是 session。

`useSessionStorage` 和 `useLocalStorage` 共享**完全相同的 API、序列化和內部實現**——換個 import，生命週期變了，其他什麼都沒變。[useLocalStorage 深度解析](https://reactuse.com/blog/react-uselocalstorage-hook/)裡關於水合、`setValue(null)`、自定義序列化器和 `onError` 的一切原樣適用，所以下面我只回顧要緊的部分，把篇幅留給 session 特有的模式和坑。

## 相比手寫版本你得到了什麼

每個程式碼庫裡都有一個用 `useState` 初始化函式讀儲存、再用 `useEffect` 寫回去的版本。下面是那個版本做錯、而 `useSessionStorage` 做對的地方：

- **SSR 與水合。**這個 hook 建立在 `useSyncExternalStore` 上，伺服器端快照返回預設值。它在伺服器端從不碰 `window`，客戶端第一次渲染與伺服器端 HTML 一致，然後透過正規路徑用儲存裡的值重新渲染——不崩潰、沒有水合不匹配警告、你的程式碼裡不需要 `typeof window` 守衛。
- **按預設值型別自動序列化。**傳數字就拿回數字；傳物件就是 `JSON.stringify`/`JSON.parse`；傳 `Map`、`Set` 或 `Date` 也能正確往返（裸的 `JSON.stringify(new Map())` 給你的是 `{}`）。需要特定的儲存格式？傳 `serializer: { read, write }`。
- **`setValue(null)` 刪除 key。**"已清除"是一個真實的狀態，區別於"重置為預設值"：`setForm(null)` 之後值是 `null`，下次掛載時又回到 `EMPTY_FORM`。這就是你的"重新開始"按鈕，也是型別是 `T | null` 的原因。
- **資料損壞不會崩。**有人在 DevTools 裡手改了、舊版本部署寫了另一種結構、`JSON.parse` 拋了例外——hook 返回預設值並透過 `onError`（預設 `console.error`）回報，而不是把元件帶崩。
- **儲存不可用？降級到記憶體。**某些隱私模式和嵌入上下文存取儲存會拋例外。hook 捕捉它、呼叫 `onError`，之後的會話裡表現得像普通 `useState`。
- **同一個 key 上的所有元件保持一致。**兩處 `useSessionStorage("checkout:step", 0)`——頁首的進度條、嚮導主體——每次寫入都一起重渲染。原生 `storage` 事件永遠不會在發起修改的那個文件裡觸發，所以手寫版本會漂移；hook 在內部把每次寫入重新廣播一遍，所以漂不了。

## 模式

### 多步表單與嚮導

開頭的結帳流程，正確的做法。有兩個細節值得照抄：**給 key 加名稱空間**（`checkout:step`、`checkout:form`），這樣"重新開始"能一起清掉它們，同源上不相干的功能也永遠不會撞 key；把*草稿*和已*提交*的內容分開存，這樣下單成功後可以只清草稿、不動別的：

```tsx
const [step, setStep] = useSessionStorage("checkout:step", 0);
const [draft, setDraft] = useSessionStorage<CheckoutForm>("checkout:form", EMPTY_FORM);

async function submit() {
  await api.placeOrder(draft!);
  setDraft(null); // 刪掉 key —— 分頁裡什麼都不留
  setStep(null);
  navigate("/thank-you");
}
```

對於每個欄位每次按鍵都更新的大表單，儲存寫入是同步的但很便宜（幾 KB 的 JSON）；如果你更想批次寫，把欄位更新包進 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)，在尾沿寫入草稿。

### 撐過一次重新導向往返

OAuth、SSO、支付服務商、跳回應用的"驗證你的信箱"連結——任何把分頁帶走再送回來的東西，都需要把"我剛才在哪？"存在一個能撐過整頁卸載、但不該和隔壁分頁共享的地方。這正是 `sessionStorage` 的主場：像 MSAL 這樣的驗證函式庫預設把 PKCE verifier 和 `state` 放在這裡，就是這個原因。

```tsx
function useReturnTo() {
  const [returnTo, setReturnTo] = useSessionStorage<string>("auth:returnTo", null);
  const navigate = useNavigate();

  const stashAndRedirect = () => {
    setReturnTo(window.location.pathname + window.location.search);
    window.location.assign(buildAuthorizeUrl());
  };

  const restore = () => {
    const target = returnTo ?? "/";
    setReturnTo(null); // 用掉它 —— 一次往返，一次恢復
    navigate(target, { replace: true });
  };

  return { stashAndRedirect, restore };
}
```

兩個分頁、兩次登入、兩個不同的 `returnTo`——互不串擾。要是用了 `localStorage`，分頁 B 的重新導向會覆蓋分頁 A 的返回路徑。

### 絕*不能*同步的按分頁視圖狀態

讓 `useLocalStorage` 粉絲措手不及的場景：使用者開了同一個儀表板的兩個分頁，比較"最近 7 天"和"最近 30 天"。用 `localStorage` 加跨分頁同步，在一個分頁裡改時間範圍，另一個也跟著變，使用者只會覺得這個應用鬧鬼。任何關於*這個視窗*的視圖狀態——篩選、排序列、展開的行、開啟的是哪個側邊欄——都是 `sessionStorage` 的值：

```tsx
const [range, setRange] = useSessionStorage<"7d" | "30d" | "90d">("dashboard:range", "7d");
```

重新整理保留它，第二個分頁從預設值開始，兩者永不打架。如果你*還*想要一個跨會話持久的"上次使用"預設值，把它放在 `localStorage` 裡，讀出來當作 session 的預設值——兩個 hook，兩種生命週期，都寫得明明白白。

### 每次會話只一次

公告橫幅、"我們使用 cookie"提示、新手引導氣泡——使用者應該能在本次造訪期間把它們關掉，而你不必承諾永遠隱藏：

```tsx
function ReleaseBanner() {
  const [dismissed, setDismissed] = useSessionStorage("banner:v6.5-dismissed", false);
  if (dismissed) return null;
  return (
    <aside>
      v6.5 新功能 —— <a href="/changelog">看看改了什麼</a>
      <button onClick={() => setDismissed(true)}>關閉</button>
    </aside>
  );
}
```

把版本寫進 key（`banner:v6.5-dismissed`），新版本釋出就有一條新橫幅，不用動舊標記。同樣的形態也適用於"使用者這次會話已經看過開場動畫了"——如果那是本來就該跳過的那種動畫，配上 [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/)。

### 穩定的按分頁 ID

`sessionStorage` 是唯一天然給你"每個分頁一個值、重新整理不變"的瀏覽器原語。這正是分頁識別符號想要的——給標記分析事件、關聯日誌，或者讓 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 的訊息能按傳送者區分。`mountStorageValue` 只在首次掛載且 key 不存在時寫入種子值：

```tsx
const [tabId] = useSessionStorage<string>("tab:id", null, {
  mountStorageValue: () => crypto.randomUUID(),
});
// 第一次渲染時是 null，之後是一個在這個分頁的多次重新整理間保持穩定的 UUID
```

## 值得知道的坑

- **預設值會在儲存值之前閃一下，只閃一次。**SSR 下伺服器端看不見瀏覽器的儲存，所以首屏顯示預設值，儲存裡的值在水合後的那次渲染才到。對嚮導步驟來說無所謂；對"哪個面板是開啟的"這類東西，你可能想先顯示骨架畫面直到值就位。權衡與 `localStorage` 相同——見 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。
- **"分頁關閉即清除"帶星號。**Chrome、Firefox 和 Safari 在使用者重新開啟已關閉的分頁、或瀏覽器崩潰後恢復會話時，都會把 `sessionStorage` 一起恢復。別把關分頁當作敏感資料的*保證*清除；必須刪的東西，自己 `setValue(null)`。
- **新分頁 ≠ 同一個分頁。**按住 Ctrl 點你的連結、在新分頁開啟的使用者，帶著空的 `sessionStorage` 到達。這通常是對的（他們想要一個全新的視圖），但意味著"使用者已經關掉橫幅了"和"嚮導在第 3 步"不會帶過去。如果應該帶，那是 `localStorage` 的值。
- **`window.open()` 先複製，再分叉。**如果你 `window.open()` 一個同源彈窗（預覽、列印檢視），它以開啟者 `sessionStorage` 的一份*副本*起步。彈窗裡的寫入到不了開啟者；需要的話用 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 或 `postMessage`。
- **`listenToStorageChanges` 對 sessionStorage 基本沒意義。**原生 `storage` 事件只會到達*共享同一個儲存區的其他文件*——對 `sessionStorage` 來說，就是同一分頁裡的同源 iframe，不是別的分頁。同分頁元件之間的同步是另一套始終開啟的機制，不受這個選項影響；除非你有 iframe，否則保持預設、忘了它。
- **不是保險箱。**它是 JavaScript 可讀的儲存。放 PKCE verifier 沒問題（一次性、短命、沒有授權碼就一文不值），放草稿和視圖狀態也沒問題；放一個被竊取會讓你惱火的長期 access token 就放錯了地方。伺服器端會話和 `httpOnly` cookie 就是為那個存在的。
- **儲存可能滿或被禁。**配額很小，還和同源上的其他一切共用；某些嵌入/隱私上下文存取就拋例外。兩者都透過 `onError` 回報，hook 繼續在記憶體裡工作。記下日誌——一條"我的表單重置了"的 bug 回報，追到最後往往是一個沒人看的 `QuotaExceededError`。
- **值是 `T | null`，這是故意的。**`setValue(null)` 之後 key 沒了，你拿到 `null`，不是預設值。如果你的程式碼處理不了 `null`，要麼永遠不調 `setValue(null)`（改成寫預設值），要麼在讀的地方正規化：`const s = step ?? 0`。

## 什麼時候不該用 useSessionStorage

- **值應該在任何地方、永遠都是同一個**（主題、語言、"永不再顯示"）→ [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/)。
- **伺服器端在第一個請求就需要它**（無閃爍的主題、A/B 分桶、認證會話）→ [`useCookie`](https://reactuse.com/state/usecookie/)。
- **分頁之間需要*對話*，不是*儲存***（"你在另一個分頁裡登出了"）→ [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/)。
- **你要跨渲染保留一個值，不是跨重新整理** → `useState`、`useRef` 或 [`useLatest`](https://reactuse.com/state/uselatest/)——[本系列上一篇](https://reactuse.com/blog/react-uselatest-hook/)講了各自什麼時候用。
- **你想把它放進 URL**（可分享的篩選、可深層連結的步驟）→ 放進查詢字串；當一個連結應該復現視圖時，它勝過所有儲存 API。

## 要點

- `sessionStorage` = 一個分頁、一個源、直到分頁關閉。它能撐過重新整理、SPA 與整頁導航、後退/前進、重新導向往返；它**不會**跨進新分頁（除了透過 `window.open()` / 複製分頁的一次性複製），而且瀏覽器在重新開啟已關閉分頁時可能恢復它。
- [`useSessionStorage(key, default)`](https://reactuse.com/state/usesessionstorage/) 是帶著這種生命週期的即插即用 `useState`：同樣的元組、函式式更新、物件/Map/Set/Date 自動序列化、`setValue(null)` 刪除、`onError` 處理損壞資料和被禁的儲存、透過 `useSyncExternalStore` 做到 SSR 安全，同一個 key 上的所有元件保持同步。
- 經驗法則：兩個分頁不一致算 bug → `localStorage`；兩個分頁*一致*算 bug → `sessionStorage`。多步表單、重新導向往返、按分頁的視圖狀態、每會話一次的標記、按分頁的 ID 都是 session 值。
- 它是一種生命週期，不是安全邊界。秘密放 `httpOnly` cookie，敏感 key 自己用 `setValue(null)` 清，別信任關分頁。

`useSessionStorage`、`useLocalStorage`、`useCookie` 以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，可 tree-shake，零依賴負擔。

```bash
npm install @reactuses/core
```
