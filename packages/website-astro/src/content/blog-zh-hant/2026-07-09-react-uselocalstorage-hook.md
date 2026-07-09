---
title: "React useLocalStorage Hook：SSR 安全的持久化狀態（2026）"
description: "一篇實用的 useLocalStorage 上手指南：一個長得像 useState 的 API，但狀態能跨重新整理存活，自動序列化物件、Map、Set 和 Date，跨分頁、跨元件保持同步，並且在伺服器端渲染下安全無虞。手寫版本的每一種翻車方式，它都處理好了。"
slug: react-uselocalstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-09
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react useLocalStorage, useLocalStorage hook, uselocalstorage react, react localstorage hook, react 持久化狀態, react localstorage typescript, ssr 安全 localstorage, react localstorage 跨分頁同步, react 重新整理保存狀態, localstorage react 水合, useLocalStorage next.js, react 持久化 hook, useSessionStorage, localstorage json react]
image: /img/og.png
---

# React useLocalStorage Hook：SSR 安全的持久化狀態（2026）

使用者花兩分鐘在你的儀表板上設定好篩選條件，按了下重新整理，一切歸零。`useState` 天生就是短命的——每次重新整理都從頭再來。所有人都知道的解法是 `localStorage`；而所有人手寫的接線方式——用 `useState` 的初始化函式讀儲存，再用一個 `useEffect` 寫回去——至少帶著四個 bug：SSR 下會崩潰或水合不匹配、遇到損壞資料會拋例外、多個瀏覽器分頁之間會失去同步、兩個元件用同一個 key 會各說各話。

`useLocalStorage` 就是把這一切都做對的那個 hook。它長得和 `useState` 一模一樣，但值能在重新整理後存活，不只能存字串，跨分頁*和*跨元件都保持同步，而且在伺服器端渲染下也安全。下面寫的全是真實的 [`@reactuses/core`](https://reactuse.com) API，TypeScript 優先。

<!-- truncate -->

## 為什麼不直接 useState + useEffect？

下面是大多數程式碼庫裡最終會出現的版本，它比看上去更容易翻車：

```tsx
function usePersistedState(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key); // 🐛 見下文
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

1. **SSR 下直接壞掉。** 伺服器端沒有 `localStorage`，初始化函式直接拋例外。加個 `typeof window` 守衛？那就把崩潰換成了水合不匹配：伺服器端渲染的是預設值，客戶端一上來就渲染儲存值，React 發出警告——更糟的情況是悄悄打了錯誤的 DOM 補丁。
2. **遇到壞資料就拋例外。** 對一個被手動改過、寫到一半、或者由舊版應用存下的值跑 `JSON.parse`，整個元件跟著一起掛。
3. **無視其他分頁。** 使用者在分頁 A 改了設定，分頁 B 一直顯示——而且還在反覆保存——那個過期的舊值，直到整頁重新整理。
4. **無視其他元件。** 兩個元件都呼叫 `usePersistedState('theme', …)`，各自持有一份 `useState`。一個更新了，另一個不重新渲染。同一個 key，兩個真相。

每個 bug 都能手動修，而修完加起來，恰好就是一個好 hook 本來的樣子。

## useLocalStorage——重新整理後還活著的 useState

API 刻意做成了 `useState` 的形狀：回傳值和 setter 組成的元組，預設值是第二個參數。

```tsx
import { useLocalStorage } from '@reactuses/core';

function Settings() {
  const [layout, setLayout] = useLocalStorage('dashboard-layout', 'grid');

  return (
    <select value={layout ?? 'grid'} onChange={(e) => setLayout(e.target.value)}>
      <option value="grid">網格</option>
      <option value="list">列表</option>
    </select>
  );
}
```

簽名是 `useLocalStorage(key, defaultValue, options?)`：

```ts
const [value, setValue] = useLocalStorage<T>(key, defaultValue, options);
// value: T | null      setValue: Dispatch<SetStateAction<T | null>>
```

首次造訪時 `value` 是預設值；任何一次 `setValue` 之後，值就被寫進 `localStorage`，下次重新整理原樣回來。函式式更新和 `useState` 完全一致：`setValue(prev => …)` 拿到的是當前儲存的值。和 `useState` 唯一肉眼可見的區別是型別：`value` 是 `T | null`，因為一個持久化的 key 還可以被*刪除*——下文細說。

## 物件、Map、Set、Date——序列化全自動

`localStorage` 只能存字串；hook 會根據預設值的型別自動挑選正確的序列化器。傳物件就自動走 `JSON.stringify`/`JSON.parse` 往返；傳數字拿回來的就是數字，而不是 `"42"`：

```tsx
const [filters, setFilters] = useLocalStorage('filters', {
  status: 'open',
  assignee: null as string | null,
});

const [fontSize, setFontSize] = useLocalStorage('font-size', 16);
const [seen, setSeen] = useLocalStorage('seen-ids', new Set<string>());
const [lastVisit, setLastVisit] = useLocalStorage('last-visit', new Date());
```

最後那兩個正是手寫版本永遠不會處理的部分：`Map`、`Set`、`Date` 預設值有各自專屬的序列化器（`Set` → JSON 陣列、`Date` → ISO 字串，再原樣讀回來），所以重新整理之後 `seen` 依然是一個帶 `.has()` 的真 `Set`——而不是一具字串化的空殼。

內建序列化器不夠用時——比如這個值要和其他系統寫下的格式保持相容——傳你自己的：

```tsx
const [config, setConfig] = useLocalStorage('legacy-config', defaultConfig, {
  serializer: {
    read: (raw) => parseLegacyFormat(raw),
    write: (value) => toLegacyFormat(value),
  },
});
```

## 刪除 key：setValue(null)

持久化狀態有一個 `useState` 沒有的操作：*把這個忘了*。把值設成 `null`，key 會從 `localStorage` 裡被整個移除：

```tsx
const [token, setToken] = useLocalStorage<string>('auth-token', null);

// 登入
setToken(response.token);
// 登出——key 從 localStorage 刪除，值變為 null
setToken(null);
```

這就是值的型別是 `T | null` 的原因。被刪除的 key 在本次工作階段裡會一直保持 `null`——**不會**彈回預設值——而這正是你想要的：「已登出」和「從未登入、顯示預設值」是兩個不同的狀態，hook 不會把它們混為一談。

## SSR 與水合，真正的安全

`useLocalStorage` 構建在 `useSyncExternalStore` 之上——React 官方的外部資料訂閱原語——伺服器端快照回傳預設值。這一個設計決定換來三件事：

- **伺服器端不崩。** hook 在伺服器端渲染期間絕不觸碰 `window` 或 `localStorage`。你的程式碼裡不需要任何 `typeof window` 守衛。
- **沒有水合不匹配。** 客戶端的首次渲染刻意與伺服器端 HTML（預設值）保持一致，然後 React 透過 `useSyncExternalStore` 的正規路徑重新渲染出儲存值——沒有警告，沒有被錯誤覆蓋的 DOM。
- **並行安全的讀取。** 因為儲存被當作外部 store 對待，React 18+ 的 transition 等特性永遠不會讀到撕裂的值。

有一件事是任何 localStorage hook 都消除不了的：儲存值出現之前，預設值會閃現一瞬——伺服器端是真的不知道瀏覽器儲存裡有什麼。對閃現很傷的值（主題色是經典案例），解法在 React 之外，靠一段阻塞的行內腳本；相關取捨見 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。

而當儲存本身不可用時——某些隱私模式，或者存取儲存直接拋例外——hook 會退化成一個純記憶體的狀態容器，並透過 `onError` 回報失敗，而不是崩潰：

```tsx
const [draft, setDraft] = useLocalStorage('draft', '', {
  onError: (e) => trackWarning('storage unavailable', e), // 預設：console.error
});
```

同一個 `onError` 還會接住損壞資料（樸素版本裡那個 `JSON.parse` bug——hook 會回傳預設值而不是拋例外）以及超出配額的寫入。

## 跨分頁同步——也跨元件

在一個分頁裡改值，其他所有分頁立刻更新，因為 hook 監聽了瀏覽器原生的 `storage` 事件：

```tsx
// 分頁 A 和分頁 B 都渲染這段——在一邊切換，兩邊都更新。
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

跨分頁同步預設開啟；如果某個分頁應該保持自己的視圖直到重新整理，用 `listenToStorageChanges: false` 關掉。

更隱蔽的另一半是**同分頁**的同步。原生 `storage` 事件永遠不會在發起修改的那個分頁裡觸發，所以在手寫 hook 裡，頁首的 `theme` 開關更新了頁首——而讀同一個 key 的側邊欄還抱著過期的副本。`useLocalStorage` 在內部會把每次寫入重新廣播一遍，所以同一個 key 上的所有元件永遠一起重新渲染。兩個元件，一個 key，一個真相——樸素版本的漂移 bug 根本不存在。（如果你要跨分頁同步的不只是持久化狀態，[React 跨分頁狀態](https://reactuse.com/blog/react-cross-tab-state/)有完整的工具箱。）

## 儲存家族

`useLocalStorage` 有幾個兄弟姊妹；按值應該*活在哪裡*、*活多久*來選：

| Hook | 存在… | 存活週期 | 跨分頁 |
| --- | --- | --- | --- |
| [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | `localStorage` | 跨重新整理 + 跨瀏覽器重啟 | ✅ 同步 |
| [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) | `sessionStorage` | 跨重新整理，按分頁隔離 | ❌ 設計上就按分頁隔離 |
| [`useCookie`](https://reactuse.com/state/usecookie/) | cookie | 由 cookie 選項決定；會隨請求發給伺服器端 | ✅ |
| [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) | 不儲存（純訊息） | — | ✅ 即時訊息 |

`useSessionStorage` 的 API 和序列化行為完全一致——換個 import，值就變成按分頁隔離的。當*伺服器端*在第一個請求裡就需要這個值時，該選的是 `useCookie`（這也是主題色閃現問題的真正解法）。`useBroadcastChannel` 根本不是儲存，但當分頁之間需要*對話*而不是*持久化*時，它才是對的工具。

## 要點回顧

- 手寫的 `useState` + `useEffect` + `localStorage` 組合自帶四個 bug：SSR 崩潰或水合不匹配、`JSON.parse` 遇壞資料崩潰、沒有跨分頁同步、共享 key 的元件之間漂移。
- **`useLocalStorage(key, defaultValue)`** 是能持久化的 `useState` 平替——同樣的元組、同樣的函式式更新，型別是 `T | null`。
- 序列化全自動，由預設值的型別驅動——物件、陣列、數字、布林值，甚至 `Map`、`Set`、`Date` 都能正確往返。需要特定格式時傳自訂 `serializer`。
- **`setValue(null)` 會刪除 key**——「已清除」是一個真實狀態，和預設值是兩回事。
- 構建在 `useSyncExternalStore` 之上：SSR 安全、無需守衛、沒有水合不匹配，儲存被停用時退化為記憶體狀態（配合 `onError`）。
- 同步是全方位的：跨分頁靠原生 `storage` 事件（用 `listenToStorageChanges` 開關），同分頁跨元件靠內部重新廣播——始終開啟。
- 同一套 API，不同的生命週期：按分頁隔離用 [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/)，伺服器端也需要時用 [`useCookie`](https://reactuse.com/state/usecookie/)。

從 [`@reactuses/core`](https://reactuse.com/state/uselocalstorage/) 裡把它拿走，讓「重新整理」不再等於「歸零」。
