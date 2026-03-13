---
title: "React 19 Hooks: What's New and How to Use Them Effectively"
description: "A complete guide to React 19's new hooks including use(), useActionState, useFormStatus, and useOptimistic. Learn the patterns that make React 19 development faster and more intuitive."
slug: react-19-hooks-guide
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, react-19, guide]
keywords: [react 19 hooks, react 19 use hook, useActionState, useFormStatus, useOptimistic, new react hooks 2026, react 19 guide]
image: /img/og.png
date: 2026-03-13
---

# React 19 Hooks: What's New and How to Use Them Effectively

React 19 introduced four new built-in hooks that change how developers handle asynchronous data, form interactions, and optimistic UI updates. These hooks — `use()`, `useActionState`, `useFormStatus`, and `useOptimistic` — reduce boilerplate, eliminate common patterns that previously required third-party code, and align React more closely with modern server-first architectures.

<!-- truncate -->

## The New React 19 Hooks

### use()

`use()` is unlike any previous React hook. It can be called conditionally, inside loops, and even within `if` statements — breaking the "rules of hooks" that have governed React since version 16.8. It reads the value of a resource, either a Promise or a Context, and integrates with Suspense boundaries for loading states.

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

`use()` also replaces `useContext` when reading context values, with the advantage that it can be called conditionally:

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

`useActionState` manages form submission state, replacing the earlier `useFormState` from the React DOM canary releases. It tracks the return value of an async action function alongside a pending flag, which makes loading indicators and error handling straightforward.

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

`useFormStatus` gives child components access to the submission state of a parent `<form>`. This hook must be called from a component rendered inside a form — it does not accept any arguments and reads status from the nearest parent form element.

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

`useOptimistic` lets you show an immediate, optimistic update in the UI while an async operation (like a network request) completes in the background. If the operation fails, React automatically reverts to the previous state.

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

## How ReactUse Complements React 19

React 19's new hooks cover asynchronous data reading, form state, and optimistic updates. They do not, however, replace the wide range of utility hooks that production applications require. Browser APIs, DOM measurement, sensor access, animation control, and state persistence all remain outside the scope of React's built-in hooks.

[ReactUse](https://reactuse.com) provides **115+ production-ready hooks** that fill these gaps. It is TypeScript-first, tree-shakable, and SSR-compatible — designed to work alongside React 19's built-in hooks without overlap or conflict.

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

ReactUse also provides backward-compatible implementations of patterns similar to React 19's hooks, so teams that are migrating incrementally or supporting older React versions can adopt the same patterns today.

## Built-in vs Library: What You Still Need

| Capability | React 19 Built-in | ReactUse (@reactuses/core) |
|---|---|---|
| Read promises/context | `use()` | — |
| Form action state | `useActionState` | — |
| Form submission status | `useFormStatus` | — |
| Optimistic UI updates | `useOptimistic` | — |
| LocalStorage / SessionStorage | — | `useLocalStorage`, `useSessionStorage` |
| Dark mode | — | `useDarkMode` |
| Clipboard access | — | `useClipboard` |
| Geolocation | — | `useGeolocation` |
| Element size / resize | — | `useElementSize`, `useResizeObserver` |
| Intersection observer | — | `useIntersectionObserver` |
| Debounce / throttle | — | `useDebounce`, `useThrottle` |
| Event listeners | — | `useEventListener` |
| Media queries | — | `useMediaQuery` |
| Drag and drop | — | `useDraggable` |
| Timers and intervals | — | `useInterval`, `useTimeout` |
| Click outside detection | — | `useClickOutside` |
| Network status | — | `useNetwork` |
| Scroll position | — | `useScroll` |
| Idle detection | — | `useIdle` |
| SSR-safe checks | — | `useSupported` |

React 19 covers the data-flow and form layer. ReactUse covers everything else your UI needs to interact with the browser and the user.

## Migration Tips

**1. Replace `useFormState` with `useActionState`.** If you were using the canary `useFormState` from `react-dom`, switch to `useActionState` from `react`. The API is nearly identical, but `useActionState` adds the `isPending` return value as a third element.

**2. Adopt `use()` gradually.** You do not need to rewrite every data-fetching component at once. Start with new components that already use Suspense boundaries, and migrate existing ones as you refactor.

**3. Pair `useOptimistic` with server actions.** Optimistic updates are most effective when combined with React 19's server action model, but they also work with client-side async functions. Begin with simple cases like toggling a like button or adding an item to a list.

**4. Keep your utility hooks library.** React 19's new hooks do not replace browser API hooks, state persistence, or DOM measurement. Continue using ReactUse (or your existing utility library) for those concerns — they are complementary, not competing.

**5. Update your TypeScript configuration.** React 19 ships updated type definitions. Make sure your `@types/react` and `@types/react-dom` packages are on version 19 to get correct type inference for the new hooks.

## Frequently Asked Questions

### Does `use()` replace `useEffect` for data fetching?

Not directly. `use()` reads the value of an already-created Promise and integrates with Suspense. It does not trigger side effects or manage the lifecycle of a fetch. For client-initiated fetching you still need a mechanism to create and cache the Promise, whether that is a framework like Next.js, a library like React Query, or your own implementation. `use()` is best thought of as the "read" step, not the "fetch" step.

### Can I use React 19 hooks with Next.js and other frameworks?

Yes. React 19 hooks work in both client and server components. `useActionState` and `useFormStatus` are particularly useful in Next.js App Router projects where server actions handle form submissions. `use()` works well for reading data passed from server components to client components as Promises.

### Do I still need a hooks library like ReactUse with React 19?

Yes. React 19's new hooks address data reading, form state, and optimistic updates. They do not provide hooks for browser APIs (clipboard, geolocation, media queries), DOM measurement (resize observer, intersection observer), state utilities (debounce, throttle, localStorage persistence), or sensor input (mouse position, idle detection). ReactUse's 115+ hooks cover these areas and are designed to work alongside React 19's built-in hooks.

### What happened to `useFormState`?

`useFormState` was available in canary releases of `react-dom` but was renamed to `useActionState` and moved to the `react` package in the stable React 19 release. The API is the same except that `useActionState` returns a third value, `isPending`, which eliminates the need to use `useFormStatus` in many simple cases.

---

React 19's new hooks are a meaningful step forward for the framework. Combined with a comprehensive utility library like [ReactUse](https://reactuse.com), they give you everything you need to build fast, responsive, and maintainable React applications in 2026.

[Get started with ReactUse →](https://reactuse.com)
