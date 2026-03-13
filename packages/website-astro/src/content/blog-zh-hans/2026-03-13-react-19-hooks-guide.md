---
title: "React 19 Hooks：新特性及高效使用指南"
description: "一份关于 React 19 新 Hooks 的完整指南，包括 use()、useActionState、useFormStatus 和 useOptimistic。学习让 React 19 开发更快更直观的模式。"
slug: react-19-hooks-guide
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, react-19, guide]
keywords: [react 19 hooks, react 19 use hook, useActionState, useFormStatus, useOptimistic, new react hooks 2026, react 19 guide]
image: /img/og.png
date: 2026-03-13
---

# React 19 Hooks：新特性及高效使用指南

React 19 引入了四个新的内置 Hooks，改变了开发者处理异步数据、表单交互和乐观 UI 更新的方式。这些 Hooks — `use()`、`useActionState`、`useFormStatus` 和 `useOptimistic` — 减少了样板代码，消除了之前需要第三方代码才能实现的常见模式，并使 React 更贴近现代的服务端优先架构。

<!-- truncate -->

## React 19 的新 Hooks

### use()

`use()` 不同于任何之前的 React Hook。它可以在条件语句、循环内部甚至 `if` 语句中调用——打破了自 React 16.8 以来一直约束 React 的"Hooks 规则"。它读取资源的值，可以是 Promise 或 Context，并与 Suspense 边界集成以处理加载状态。

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

`use()` 还可以替代 `useContext` 来读取 context 值，优势在于它可以条件调用：

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

`useActionState` 管理表单提交状态，取代了之前 React DOM canary 版本中的 `useFormState`。它追踪异步 action 函数的返回值以及一个 pending 标志，使加载指示器和错误处理变得简单直接。

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

`useFormStatus` 让子组件可以访问父 `<form>` 的提交状态。这个 Hook 必须在表单内部渲染的组件中调用——它不接受任何参数，而是从最近的父表单元素读取状态。

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

`useOptimistic` 让你在异步操作（如网络请求）在后台完成时，在 UI 中立即显示乐观更新。如果操作失败，React 会自动回退到之前的状态。

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

## ReactUse 如何与 React 19 互补

React 19 的新 Hooks 涵盖了异步数据读取、表单状态和乐观更新。然而，它们并不能替代生产应用所需的广泛实用 Hooks。浏览器 API、DOM 测量、传感器访问、动画控制和状态持久化仍然不在 React 内置 Hooks 的范围之内。

[ReactUse](https://reactuse.com) 提供了 **115+ 个生产级 Hooks** 来填补这些空白。它以 TypeScript 为先、支持 Tree-shaking、兼容 SSR——设计为与 React 19 的内置 Hooks 并行使用，没有重叠或冲突。

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

ReactUse 还提供了与 React 19 Hooks 类似模式的向后兼容实现，因此正在逐步迁移或需要支持旧版 React 的团队可以立即采用相同的模式。

## 内置 vs 库：你仍然需要什么

| 能力 | React 19 内置 | ReactUse (@reactuses/core) |
|---|---|---|
| 读取 Promises/Context | `use()` | — |
| 表单 action 状态 | `useActionState` | — |
| 表单提交状态 | `useFormStatus` | — |
| 乐观 UI 更新 | `useOptimistic` | — |
| LocalStorage / SessionStorage | — | `useLocalStorage`、`useSessionStorage` |
| 深色模式 | — | `useDarkMode` |
| 剪贴板访问 | — | `useClipboard` |
| 地理定位 | — | `useGeolocation` |
| 元素尺寸 / 大小调整 | — | `useElementSize`、`useResizeObserver` |
| 交叉观察器 | — | `useIntersectionObserver` |
| 防抖 / 节流 | — | `useDebounce`、`useThrottle` |
| 事件监听器 | — | `useEventListener` |
| 媒体查询 | — | `useMediaQuery` |
| 拖放 | — | `useDraggable` |
| 定时器和间隔 | — | `useInterval`、`useTimeout` |
| 外部点击检测 | — | `useClickOutside` |
| 网络状态 | — | `useNetwork` |
| 滚动位置 | — | `useScroll` |
| 空闲检测 | — | `useIdle` |
| SSR 安全检查 | — | `useSupported` |

React 19 覆盖了数据流和表单层。ReactUse 覆盖了你的 UI 与浏览器和用户交互所需的一切。

## 迁移建议

**1. 用 `useActionState` 替换 `useFormState`。** 如果你之前使用的是来自 `react-dom` canary 版本的 `useFormState`，请切换到来自 `react` 的 `useActionState`。API 几乎完全相同，但 `useActionState` 增加了 `isPending` 作为第三个返回值。

**2. 逐步采用 `use()`。** 你不需要一次性重写所有数据获取组件。从已经使用 Suspense 边界的新组件开始，在重构时逐步迁移现有组件。

**3. 将 `useOptimistic` 与 Server Actions 配合使用。** 乐观更新与 React 19 的 Server Action 模型配合使用效果最佳，但它们也可以与客户端异步函数一起工作。从简单的场景开始，如切换点赞按钮或向列表添加项目。

**4. 保留你的实用 Hooks 库。** React 19 的新 Hooks 不能替代浏览器 API Hooks、状态持久化或 DOM 测量。继续使用 ReactUse（或你现有的实用库）来处理这些关注点——它们是互补的，而非竞争的。

**5. 更新你的 TypeScript 配置。** React 19 附带了更新的类型定义。确保你的 `@types/react` 和 `@types/react-dom` 包在版本 19，以获得新 Hooks 的正确类型推断。

## 常见问题

### `use()` 能替代 `useEffect` 进行数据获取吗？

不能直接替代。`use()` 读取已创建的 Promise 的值并与 Suspense 集成。它不触发副作用或管理 fetch 的生命周期。对于客户端发起的请求，你仍然需要一种机制来创建和缓存 Promise，无论是像 Next.js 这样的框架、像 React Query 这样的库，还是你自己的实现。`use()` 最好被理解为"读取"步骤，而非"获取"步骤。

### 我可以在 Next.js 和其他框架中使用 React 19 Hooks 吗？

可以。React 19 Hooks 在客户端组件和服务端组件中都可以工作。`useActionState` 和 `useFormStatus` 在使用 Server Actions 处理表单提交的 Next.js App Router 项目中特别有用。`use()` 非常适合读取从服务端组件以 Promise 形式传递给客户端组件的数据。

### 有了 React 19，我还需要像 ReactUse 这样的 Hooks 库吗？

需要。React 19 的新 Hooks 解决了数据读取、表单状态和乐观更新。它们不提供浏览器 API（剪贴板、地理定位、媒体查询）、DOM 测量（resize observer、intersection observer）、状态工具（防抖、节流、localStorage 持久化）或传感器输入（鼠标位置、空闲检测）的 Hooks。ReactUse 的 115+ 个 Hooks 覆盖了这些领域，并且设计为与 React 19 内置 Hooks 并行使用。

### `useFormState` 发生了什么？

`useFormState` 在 `react-dom` 的 canary 版本中可用，但在 React 19 稳定版发布时被重命名为 `useActionState` 并移至 `react` 包。API 相同，唯一的区别是 `useActionState` 返回第三个值 `isPending`，这在许多简单场景中消除了使用 `useFormStatus` 的需要。

---

React 19 的新 Hooks 是框架向前迈出的重要一步。结合像 [ReactUse](https://reactuse.com) 这样的综合实用库，它们为你提供了在 2026 年构建快速、响应式和可维护的 React 应用所需的一切。

[开始使用 ReactUse →](https://reactuse.com)
