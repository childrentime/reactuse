---
title: "React useCookie Hook：把 Cookie 變成響應式狀態（2026）"
description: "一篇實用的 useCookie 上手指南：像元件狀態一樣讀、寫、刪 cookie——js-cookie 選項（expires、path、sameSite）、同標籤頁自動同步、伺服器寫入後的 refresh 逃生口，以及 SSR 下 defaultValue 規則詳解。TypeScript 優先。"
slug: react-usecookie-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-22
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useCookie, useCookie hook, usecookie react, react cookie hook, react cookie 狀態, js-cookie react, react 讀取 cookie, react 設定 cookie hook, react 刪除 cookie, cookie 狀態管理 react, useCookie typescript, react cookie ssr, useLocalStorage vs useCookie]
image: /img/og.png
---

# React useCookie Hook：把 Cookie 變成響應式狀態（2026）

一個主題切換按鈕把使用者的選擇存進 cookie，好讓伺服器在下一次請求時直接渲染出正確的主題——不閃一下錯誤的模式。元件寫下 `document.cookie = 'theme=dark'`，然後……什麼都沒有重新渲染。`document.cookie` 不是 React 狀態：寫入不會通知任何人，讀取意味著解析一串分號分隔的字串，而且它變化時沒有任何事件可以訂閱。每個關心這個 cookie 的元件，都在安靜地讀著一份過期的副本。

[`@reactuses/core`](https://reactuse.com) 的 `useCookie` 把 cookie 變成普通的元件狀態：像狀態一樣讀、像狀態一樣寫，同一標籤頁裡監聽同一個 key 的所有實例一起更新。它構建在 [`js-cookie`](https://github.com/js-cookie/js-cookie) 之上，屬性處理（過期時間、路徑、`SameSite`）是久經考驗的那種。以下都是真實 API，TypeScript 優先。

<!-- truncate -->

## 手寫版本，以及它在哪裡散架

Cookie 比你用過的每一個框架都古老，它的 API 也毫不掩飾這一點。手寫的 React 版本長這樣：

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('theme='))
      ?.split('=')[1] ?? 'light'
  );

  const update = (next: string) => {
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
    setTheme(next);
  };
  // ...
}
```

它散架的幾個常見位置：

- **字串解析是你的問題。** 按 `'; '` 切分、前綴匹配 key、解碼值——這是一個你現在要在每個元件裡維護的 cookie 解析器。
- **別的地方不會更新。** 兩個顯示同一個 cookie 的元件各自握著自己的 `useState` 副本。一個寫入了；另一個繼續渲染舊值，直到某個無關的更新碰巧讓它重渲染。
- **屬性全靠字串拼接。** `path`、`expires`、`secure`、`SameSite` 都是手工拼接的片段——拼錯了不會報錯，只會悄悄產出一個作用域錯誤的 cookie。
- **在伺服器端直接崩潰。** SSR 期間不存在 `document`，就算加了守衛，伺服器端渲染和客戶端首次渲染也可能不一致——hydration 不匹配。

## useCookie——Cookie 即狀態

```tsx
import { useCookie } from '@reactuses/core';

function ThemeToggle() {
  const [theme, setTheme] = useCookie('theme', { expires: 365, path: '/' }, 'light');

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      當前主題：{theme}
    </button>
  );
}
```

簽名：

```ts
function useCookie(
  key: string,
  options?: Cookies.CookieAttributes,
  defaultValue?: string
): readonly [
  string | undefined,                                    // 當前值
  (value: string | undefined | ((prev) => string | undefined)) => void, // 更新
  () => void                                             // 刷新
];
```

三點值得注意：

- **值是字串。** Cookie 本質是字串傳輸——這個 hook 不替你猜序列化方式。要存物件？自己 `JSON.stringify`，或者先想想它是否真的該放在 cookie 裡（每個 cookie 約 4KB 預算，而且每個位元組都會跟著每次 HTTP 請求上路）。
- **設為 `undefined` 就是刪除。** `setTheme(undefined)` 直接移除 cookie——不需要額外匯入一個 `remove` 函數。函數式更新也支援：`setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))`。
- **掛載時 cookie 不存在，預設值會被寫入。** 傳 `'light'` 作為預設值，首次渲染時 cookie 就會以 `theme=light` 的形式落地——這意味著*伺服器*在下一次請求就能看到它。對主題 cookie 來說，這正是目的所在。

## Cookie 屬性——有型別，不拼接

`options` 參數原樣透傳給 `js-cookie`，所以就是完整的 `Cookies.CookieAttributes`：

| 屬性 | 作用 |
| --- | --- |
| `expires` | 從現在起的天數（`365`），或一個精確時刻的 `Date`。省略則是隨瀏覽器關閉消失的會話 cookie |
| `path` | 哪些路徑能看到這個 cookie——幾乎總是想要 `'/'` |
| `domain` | 跨子網域共享（`'.example.com'`） |
| `secure` | 僅 HTTPS |
| `sameSite` | `'strict'`、`'lax'` 或 `'none'`——跨站發送策略 |

options 物件按值比較，不按引用——每次渲染都內聯傳 `{ expires: 365, path: '/' }` 完全沒問題，不會引起任何抖動。

一個值得知道的鋒利邊緣：屬性是*寫入時*的配置。瀏覽器不允許 JavaScript 讀回一個 cookie 的 path 或過期時間——所以刪除走的是你寫入時用的同一組 `path`/`domain`。同一個 key 的 options 保持一致，這一點就永遠咬不到你。

## 同步模型：同標籤頁、其他標籤頁、以及伺服器

這是 cookie 與 Web Storage 真正不同的地方，這個 hook 對此很誠實。

**同標籤頁：自動。** 標籤頁裡每一個 `useCookie('theme', …)` 實例都會在任何一個寫入時一起更新。Cookie 沒有原生的變化事件，所以 hook 在寫入時派發一個內部 window 事件——兄弟元件保持同步，你什麼都不用接。

**其他標籤頁：不自動。** `localStorage` 有跨標籤頁的 `storage` 事件；cookie 什麼都沒有。別的標籤頁寫了 cookie，這個標籤頁自己不會知道。跨標籤頁的偏好同步是 [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 的領域——完整工具箱見[《React 跨標籤頁狀態》](https://reactuse.com/blog/react-cross-tab-state/)。

**伺服器（或任何外部寫入）：`refreshCookie`。** Cookie 的超能力是*伺服器*也能寫它——比如 fetch 響應裡的 `Set-Cookie` 標頭。這種寫入同樣不觸發任何客戶端事件，所以元組的第三個元素用來按需重讀：

```tsx
const [session, , refreshSession] = useCookie('session_hint', {}, '');

const login = async (creds: Credentials) => {
  await fetch('/api/login', { method: 'POST', body: JSON.stringify(creds) });
  refreshSession(); // 拿到響應剛剛設定的 cookie
};
```

心智模型一行一個：同標籤頁寫入自我傳播；跨標籤頁交給 `localStorage`；外部寫入需要 `refreshCookie()`。

## useCookie vs useLocalStorage vs useSessionStorage

三者都讓持久化的值變成響應式；區別在於*誰能看到這個值、能看多久*：

| | [`useCookie`](https://reactuse.com/state/usecookie/) | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| --- | --- | --- | --- |
| 伺服器能看到 | ✅ 每次請求都帶上 | ❌ | ❌ |
| 生命週期 | 你來定（`expires`） | 永久直到清除 | 標籤頁關閉 |
| 跨標籤頁同步 | ❌（無原生事件） | ✅ | ❌ |
| 容量預算 | 約 4KB，每次請求都發送 | 約 5MB，留在本地 | 約 5MB，留在本地 |
| 值型別 | `string` | 任意（型別化序列化器） | 任意（型別化序列化器） |

決策規則一句話：**伺服器需要這個值才能正確渲染嗎？** 主題、語言、同意狀態、A/B 分桶——答案是「是」的，就放 cookie，因為伺服器在發出第一個位元組的 HTML 之前就能從請求標頭裡讀到它。如果值只屬於客戶端——表單草稿、面板位置、伺服器從不渲染的快取偏好——Web Storage 更寬敞，還能跨標籤頁同步。儲存那一側的完整指南見[《React 裡的 useLocalStorage》](https://reactuse.com/blog/react-uselocalstorage-hook/)。

（把房間裡的大象說明白：真正的鑑權 token 屬於 `HttpOnly` cookie，JavaScript——包括這個 hook——*根本讀不到它*。這是特性，不是缺陷。`useCookie` 面向的是可讀層：偏好、提示、開關。）

## 真實使用場景

- **不閃爍的主題切換。** 主題 cookie 隨請求上行，伺服器直接渲染 `<html class="dark">`，客戶端不需要任何修正。這個場景用 `localStorage` *不可能*實現——伺服器永遠看不到 storage。
- **語言選擇。** 同樣的形狀：使用者選了語言，cookie 持久化，伺服器端渲染讀到它，從第一個位元組開始就用正確的語言響應。
- **Cookie 同意橫幅。** 用長 `expires` 寫下同意決定；客戶端程式碼和伺服器端中介軟體都能在載入分析腳本前檢查它。
- **A/B 實驗分桶。** 用函數式更新只分配一次（`setBucket((prev) => prev ?? assignBucket())`），分桶結果對伺服器端渲染、邊緣中介軟體和客戶端同時可見。
- **登入後的 UI 提示。** 一個非敏感的 `logged_in=1` 提示 cookie（由伺服器隨真正的 `HttpOnly` 會話一起設定），讓客戶端立刻渲染帳戶相關的介面——登入呼叫之後 `refreshCookie()` 把它撿起來。

## SSR：defaultValue 規則

伺服器端渲染期間沒有 `document.cookie`，hook 什麼都讀不到。規則就一句話：**做 SSR 時，永遠傳 `defaultValue`。** 伺服器渲染預設值，客戶端首次渲染產出相同的標記（hydration 要求的正是這個——React 會比對兩者），真正的 cookie 值緊接著在 effect 裡落地。SSR 應用裡省略預設值，hook 會在開發環境警告你，因為伺服器（渲染空）和客戶端（渲染 cookie）會不一致——hydration 不匹配。

如果你的框架能在伺服器端讀 cookie（Next.js 的 `cookies()`、Remix 的 loader），還可以更進一步：把*真實的*請求 cookie 作為 `defaultValue` 傳進來，首屏直接正確，不需要任何 hydration 後的修正。更宏觀的模式——為什麼所有瀏覽器 API 都需要這種紀律——見[《SSR 安全的 React Hooks》](https://reactuse.com/blog/ssr-safe-react-hooks/)。

## 要點回顧

- **`document.cookie` 不是狀態**——沒有響應性、要解析字串、屬性靠手拼。[`useCookie`](https://reactuse.com/state/usecookie/) 把它變成 `js-cookie` 加持的 `[value, set, refresh]` 元組。
- **設 `undefined` 即刪除；支援函數式更新；** cookie 缺失時會用你的 `defaultValue` 初始化，伺服器下一次請求就能看到。
- **記住同步模型：** 同標籤頁實例自動同步；跨標籤頁不行（那是 [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 的事）；伺服器寫入的 cookie 需要顯式 `refreshCookie()`。
- **按受眾選擇：** 伺服器渲染需要的值——主題、語言、同意、A/B——放 cookie。純客戶端資料放 Web Storage。
- **SSR 規則：** 伺服器端渲染時永遠傳 `defaultValue`——更好的做法是把真實的請求 cookie 作為預設值傳入。

從 [`@reactuses/core`](https://reactuse.com/state/usecookie/) 拿來用，讓你的 cookie 變成它一直想成為的那種狀態。
