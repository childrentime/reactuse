---
title: "React 19 Hooks：新功能與如何有效使用"
description: "React 19 新 hooks 完整指南，包括 use()、useActionState、useFormStatus 和 useOptimistic。學習讓 React 19 開發更快速、更直覺的模式。"
slug: react-19-hooks-guide
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, react-19, guide]
keywords: [react 19 hooks, react 19 use hook, useActionState, useFormStatus, useOptimistic, new react hooks 2026, react 19 guide]
image: /img/og.png
date: 2026-03-13
---

# React 19 Hooks：新功能與如何有效使用

React 19 引入了四個新的內建 hooks，改變了開發者處理非同步資料、表單互動和樂觀 UI 更新的方式。這些 hooks — `use()`、`useActionState`、`useFormStatus` 和 `useOptimistic` — 減少了樣板程式碼，消除了以前需要第三方程式碼的常見模式，並使 React 更加貼近現代的伺服器優先架構。

<!-- truncate -->

## React 19 的新 Hooks

### use()

`use()` 不同於任何之前的 React hook。它可以在條件語句中、迴圈中甚至 `if` 語句中被呼叫 — 打破了自 16.8 版本以來約束 React 的「hooks 規則」。它讀取一個資源的值，可以是 Promise 或 Context，並與 Suspense 邊界整合以處理載入狀態。

```tsx
import { use, Suspense } from "react";

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  const userPromise = fetchUser(1);
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

`use()` 也可以在讀取 context 值時取代 `useContext`，優勢在於它可以被條件式呼叫：

```tsx
function ThemeLabel({ showTheme }: { showTheme: boolean }) {
  if (showTheme) {
    const theme = use(ThemeContext);
    return <span>{theme}</span>;
  }
  return null;
}
```

### useActionState

`useActionState` 管理表單提交狀態，取代了早期 React DOM canary 版本中的 `useFormState`。它追蹤一個非同步 action 函式的回傳值以及一個 pending 旗標，使載入指示器和錯誤處理變得簡單明瞭。

```tsx
import { useActionState } from "react";

async function submitComment(
  previousState: { message: string } | null,
  formData: FormData
) {
  const comment = formData.get("comment") as string;
  if (comment.length < 3) {
    return { message: "Comment must be at least 3 characters." };
  }
  await saveComment(comment);
  return { message: "Comment posted!" };
}

function CommentForm() {
  const [state, formAction, isPending] = useActionState(submitComment, null);

  return (
    <form action={formAction}>
      <textarea name="comment" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Posting..." : "Post Comment"}
      </button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

### useFormStatus

`useFormStatus` 讓子元件可以存取父 `<form>` 的提交狀態。此 hook 必須從表單內部渲染的元件中呼叫 — 它不接受任何引數，而是從最近的父表單元素讀取狀態。

```tsx
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending, data, method } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

function SignupForm() {
  return (
    <form action={signupAction}>
      <input name="email" type="email" required />
      <SubmitButton />
    </form>
  );
}
```

### useOptimistic

`useOptimistic` 讓你在非同步操作（如網路請求）在背景完成時，在 UI 中顯示即時的樂觀更新。如果操作失敗，React 會自動恢復到之前的狀態。

```tsx
import { useOptimistic } from "react";

function TodoList({
  todos,
  addTodoAction,
}: {
  todos: Todo[];
  addTodoAction: (formData: FormData) => Promise<void>;
}) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (currentTodos, newTitle: string) => [
      ...currentTodos,
      { id: crypto.randomUUID(), title: newTitle, pending: true },
    ]
  );

  async function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string;
    addOptimisticTodo(title);
    await addTodoAction(formData);
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="title" required />
        <button type="submit">Add</button>
      </form>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## ReactUse 如何補充 React 19

React 19 的新 hooks 涵蓋了非同步資料讀取、表單狀態和樂觀更新。然而，它們並沒有取代生產應用程式所需的廣泛工具 hooks。瀏覽器 API、DOM 量測、感測器存取、動畫控制和狀態持久化都仍然不在 React 內建 hooks 的範圍之內。

[ReactUse](https://reactuse.com) 提供**超過 115 個生產就緒的 hooks** 來填補這些缺口。它以 TypeScript 為優先、支援 tree-shaking、相容 SSR — 設計為與 React 19 的內建 hooks 並行使用，不會重疊或衝突。

```tsx
import { useActionState } from "react";
import {
  useLocalStorage,
  useDarkMode,
  useGeolocation,
  useClipboard,
  useDebounce,
} from "@reactuses/core";
```

ReactUse 還提供與 React 19 hooks 相似模式的向後相容實作，讓正在漸進式遷移或支援舊版 React 的團隊也能立即採用相同的模式。

## 內建 vs 函式庫：你還需要什麼

| 功能 | React 19 內建 | ReactUse (@reactuses/core) |
|---|---|---|
| 讀取 promises/context | `use()` | — |
| 表單 action 狀態 | `useActionState` | — |
| 表單提交狀態 | `useFormStatus` | — |
| 樂觀 UI 更新 | `useOptimistic` | — |
| LocalStorage / SessionStorage | — | `useLocalStorage`、`useSessionStorage` |
| 深色模式 | — | `useDarkMode` |
| 剪貼簿存取 | — | `useClipboard` |
| 地理定位 | — | `useGeolocation` |
| 元素大小 / 調整大小 | — | `useElementSize`、`useResizeObserver` |
| 交叉觀察器 | — | `useIntersectionObserver` |
| 防抖 / 節流 | — | `useDebounce`、`useThrottle` |
| 事件監聽器 | — | `useEventListener` |
| 媒體查詢 | — | `useMediaQuery` |
| 拖放 | — | `useDraggable` |
| 計時器和間隔 | — | `useInterval`、`useTimeout` |
| 點擊外部偵測 | — | `useClickOutside` |
| 網路狀態 | — | `useNetwork` |
| 捲動位置 | — | `useScroll` |
| 閒置偵測 | — | `useIdle` |
| SSR 安全檢查 | — | `useSupported` |

React 19 涵蓋了資料流和表單層。ReactUse 涵蓋了你的 UI 與瀏覽器和使用者互動所需的其他一切。

## 遷移建議

**1. 用 `useActionState` 取代 `useFormState`。** 如果你之前使用的是 `react-dom` 中的 canary 版 `useFormState`，請切換到 `react` 中的 `useActionState`。API 幾乎相同，但 `useActionState` 新增了 `isPending` 作為第三個回傳值。

**2. 漸進式採用 `use()`。** 你不需要一次重寫每個資料獲取元件。從已經使用 Suspense 邊界的新元件開始，在重構時遷移現有的元件。

**3. 將 `useOptimistic` 與 server actions 搭配使用。** 樂觀更新與 React 19 的 server action 模型結合時最為有效，但它們也可以與客戶端非同步函式搭配使用。從簡單的案例開始，如切換按讚按鈕或新增項目到列表。

**4. 保留你的工具 hooks 函式庫。** React 19 的新 hooks 不會取代瀏覽器 API hooks、狀態持久化或 DOM 量測。繼續使用 ReactUse（或你現有的工具函式庫）來處理這些問題 — 它們是互補的，而非競爭的。

**5. 更新你的 TypeScript 設定。** React 19 附帶了更新的類型定義。確保你的 `@types/react` 和 `@types/react-dom` 套件使用版本 19，以獲得新 hooks 的正確類型推斷。

## 常見問題

### `use()` 是否取代了用於資料獲取的 `useEffect`？

不完全是。`use()` 讀取一個已建立的 Promise 的值並與 Suspense 整合。它不會觸發副作用或管理 fetch 的生命週期。對於客戶端發起的資料獲取，你仍然需要一個機制來建立和快取 Promise，無論是像 Next.js 這樣的框架、像 React Query 這樣的函式庫，還是你自己的實作。`use()` 最好被理解為「讀取」步驟，而非「獲取」步驟。

### React 19 hooks 能否與 Next.js 和其他框架搭配使用？

可以。React 19 hooks 在客戶端和伺服器元件中都能運作。`useActionState` 和 `useFormStatus` 在 Next.js App Router 專案中特別有用，因為 server actions 負責處理表單提交。`use()` 非常適合讀取從伺服器元件傳遞到客戶端元件的 Promise 資料。

### 有了 React 19，我還需要像 ReactUse 這樣的 hooks 函式庫嗎？

需要。React 19 的新 hooks 處理的是資料讀取、表單狀態和樂觀更新。它們不提供瀏覽器 API（剪貼簿、地理定位、媒體查詢）、DOM 量測（resize observer、intersection observer）、狀態工具（防抖、節流、localStorage 持久化）或感測器輸入（滑鼠位置、閒置偵測）的 hooks。ReactUse 的 115+ 個 hooks 涵蓋這些領域，並設計為與 React 19 的內建 hooks 並行使用。

### `useFormState` 發生了什麼事？

`useFormState` 在 `react-dom` 的 canary 版本中可用，但在 React 19 穩定版中被重新命名為 `useActionState` 並移到 `react` 套件中。API 相同，只是 `useActionState` 回傳第三個值 `isPending`，這在許多簡單情況下消除了使用 `useFormStatus` 的需要。

---

React 19 的新 hooks 是框架的重要進步。結合像 [ReactUse](https://reactuse.com) 這樣的綜合工具函式庫，它們為你提供了在 2026 年建構快速、響應式和可維護的 React 應用程式所需的一切。

[開始使用 ReactUse →](https://reactuse.com)
