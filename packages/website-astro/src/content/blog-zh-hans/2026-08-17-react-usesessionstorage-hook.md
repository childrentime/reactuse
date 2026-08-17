---
title: "React useSessionStorage Hook：刷新不丢、只属于当前标签页的状态 (2026)"
description: "useSessionStorage 实用指南：sessionStorage 到底承诺了什么（刷新、导航、跳出去再跳回来都还在；标签页一关就没；绝不会漏到别的标签页），什么时候该选它而不是 useLocalStorage 和 useCookie，多步表单、OAuth 重定向、按标签页隔离的视图状态、每次会话只弹一次这四种模式，对象/Map/Set/Date 的自动序列化，setValue(null) 删除 key，同标签页组件同步，以及从 SSR 水合到浏览器恢复标签页的每一个坑。TypeScript 优先，SSR 安全。"
slug: react-usesessionstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-17
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react usesessionstorage, usesessionstorage, usesessionstorage react, useSessionStorage hook, react sessionstorage hook, sessionstorage react, react session storage 状态, react 刷新保留状态 标签页, react 多步表单 状态持久化, react 向导 刷新, sessionstorage vs localstorage react, useSessionStorage vs useLocalStorage, react sessionstorage typescript, ssr 安全 sessionstorage, sessionstorage next.js 水合, react sessionstorage hook typescript, react 表单状态 刷新不丢]
image: /img/og.png
---

# React useSessionStorage Hook：刷新不丢、只属于当前标签页的状态 (2026)

这是一个会在第三步把顾客弄丢的结账流程：

```tsx
function Checkout() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  // 第 1 步：地址，第 2 步：配送，第 3 步：支付……
}
```

顾客填好地址、选好配送方式，到支付这一步，支付服务商把他们跳到 3-D Secure 验证页再跳回来。或者他们只是按了下刷新。不管哪种，`step` 又回到 `0`，`form` 又是空的。`useState` 的寿命就是组件实例的寿命——一次刷新、一次重定向、一次整页导航，它就没了。

所有人都知道解法是 Web Storage。多数人伸手拿的是 `localStorage`，它确实管用——直到它管得太多。填了一半的结账单现在出现在顾客打开的每一个标签页里，下周他们回来买别的东西时它还在，而如果他们开了两个标签页比较配送方案，[`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 会忠实地把两张表单互相同步成一样。你真正想要的，是能在*这个标签页*的刷新和重定向中活下来、标签页关掉就跟着消失的状态。那就是 `sessionStorage`，而 [`@reactuses/core`](https://reactuse.com) 里的 [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) 就是它的 `useState` 形态。这篇文章讲 `sessionStorage` 真正承诺了什么（以及没承诺什么），什么时候选它而不是 `localStorage` 和 cookie，它天生适合的四种模式，以及那些会咬到手写版本的坑——水合、标签页恢复、`window.open`。

<!-- truncate -->

## 快速开始

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

`useSessionStorage(key, defaultValue)` 返回和 `useState` 一样的 `[value, setValue]` 元组，支持一样的函数式更新。值在挂载时从 `sessionStorage` 读出，每次更新写回，类型是 `T | null`——之所以有 `null`，是因为 `setValue(null)` 会删掉这个 key（下文细说）。刷新页面、被跳到支付服务商再跳回来、离开页面再按浏览器后退：`step` 和 `form` 都停在顾客离开时的位置。关掉标签页：它们就没了，这正是目的。

## sessionStorage 到底承诺了什么

这个名字会误导人以为 "session" 指的是"登录会话"或"浏览器会话"。它指的是**一个顶层浏览上下文——一个标签页或窗口——里的一个源（origin）**。具体来说：

| 事件 | 存活？ |
| --- | --- |
| 刷新 / 强制刷新 | ✅ |
| 客户端路由切换（SPA） | ✅ |
| 整页导航到同源的另一个页面 | ✅ |
| 跳转到第三方站点再回来（OAuth、支付、SSO） | ✅ —— 同一个标签页，回来时同一个源 |
| 浏览器后退 / 前进 | ✅ |
| 在**新标签页**里打开同一个 URL | ❌ 全新的空存储 |
| 关闭标签页 | ❌ 清除（有个例外：能恢复已关闭标签页的浏览器也会把它的 `sessionStorage` 一起恢复） |
| 关闭浏览器 | ❌ |

有两个边缘情况会让人意外。第一，**`window.open()` 会复制**打开者的 `sessionStorage` 到新窗口（按 HTML 规范，只要新窗口保留了 `opener`），Chrome 的"复制标签页"也会复制——但那是一次性快照，不是实时链接；从那一刻起两个标签页各走各的。现代浏览器默认以 `noopener` 打开 `target="_blank"` 链接，所以普通链接是干净起步的。第二，`sessionStorage` **和同一标签页里的同源 iframe 是共享的**——它们属于同一个浏览上下文组——这也是浏览器原生 `storage` 事件对它唯一有意义的地方（见下文）。

其余部分和 `localStorage` 契约相同：同步、只存字符串、每个源大约 5 MB、页面上任何脚本都能读——所以它**不是安全边界**。它比 `localStorage` *更短命*，泄露时的爆炸半径更小，但 XSS 读它一样轻松。任何必须对 JavaScript 保密的东西属于 `httpOnly` cookie，不属于这里。

## useSessionStorage vs useLocalStorage vs useCookie vs useState

按值该住在*哪里*、活*多久*来选：

| 你需要的状态…… | 用 |
| --- | --- |
| 和组件活得一样久 | `useState` |
| 在**这个标签页**里刷新、重定向都还在，然后消失 | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| 浏览器重启还在，且**跨标签页**保持同步 | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) |
| **服务端**在第一个请求就需要 | [`useCookie`](https://reactuse.com/state/usecookie/) |
| 是标签页之间的消息，不是存储 | [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) |

一条能解决 90% "local 还是 session？"争论的经验法则：**如果两个标签页显示不同的值算 bug，用 `localStorage`；如果两个标签页显示相同的值算 bug，用 `sessionStorage`。**主题、语言、"永远别再显示"——用户期望它们在任何地方都是同一个值，所以是 local。填了一半的表单、*这个*仪表盘视图上的筛选条件、跳去认证之前所在的页面——它们属于某一个标签页，所以是 session。

`useSessionStorage` 和 `useLocalStorage` 共享**完全相同的 API、序列化和内部实现**——换个 import，生命周期变了，其他什么都没变。[useLocalStorage 深度解析](https://reactuse.com/blog/react-uselocalstorage-hook/)里关于水合、`setValue(null)`、自定义序列化器和 `onError` 的一切原样适用，所以下面我只回顾要紧的部分，把篇幅留给 session 特有的模式和坑。

## 相比手写版本你得到了什么

每个代码库里都有一个用 `useState` 初始化函数读存储、再用 `useEffect` 写回去的版本。下面是那个版本做错、而 `useSessionStorage` 做对的地方：

- **SSR 与水合。**这个 hook 建立在 `useSyncExternalStore` 上，服务端快照返回默认值。它在服务端从不碰 `window`，客户端第一次渲染与服务端 HTML 一致，然后通过正规路径用存储里的值重新渲染——不崩溃、没有水合不匹配警告、你的代码里不需要 `typeof window` 守卫。
- **按默认值类型自动序列化。**传数字就拿回数字；传对象就是 `JSON.stringify`/`JSON.parse`；传 `Map`、`Set` 或 `Date` 也能正确往返（裸的 `JSON.stringify(new Map())` 给你的是 `{}`）。需要特定的存储格式？传 `serializer: { read, write }`。
- **`setValue(null)` 删除 key。**"已清除"是一个真实的状态，区别于"重置为默认值"：`setForm(null)` 之后值是 `null`，下次挂载时又回到 `EMPTY_FORM`。这就是你的"重新开始"按钮，也是类型是 `T | null` 的原因。
- **数据损坏不会崩。**有人在 DevTools 里手改了、旧版本部署写了另一种结构、`JSON.parse` 抛了异常——hook 返回默认值并通过 `onError`（默认 `console.error`）上报，而不是把组件带崩。
- **存储不可用？降级到内存。**某些隐私模式和嵌入上下文访问存储会抛异常。hook 捕获它、调用 `onError`，之后的会话里表现得像普通 `useState`。
- **同一个 key 上的所有组件保持一致。**两处 `useSessionStorage("checkout:step", 0)`——头部的进度条、向导主体——每次写入都一起重渲染。原生 `storage` 事件永远不会在发起修改的那个文档里触发，所以手写版本会漂移；hook 在内部把每次写入重新广播一遍，所以漂不了。

## 模式

### 多步表单与向导

开头的结账流程，正确的做法。有两个细节值得照抄：**给 key 加命名空间**（`checkout:step`、`checkout:form`），这样"重新开始"能一起清掉它们，同源上不相干的功能也永远不会撞 key；把*草稿*和已*提交*的内容分开存，这样下单成功后可以只清草稿、不动别的：

```tsx
const [step, setStep] = useSessionStorage("checkout:step", 0);
const [draft, setDraft] = useSessionStorage<CheckoutForm>("checkout:form", EMPTY_FORM);

async function submit() {
  await api.placeOrder(draft!);
  setDraft(null); // 删掉 key —— 标签页里什么都不留
  setStep(null);
  navigate("/thank-you");
}
```

对于每个字段每次按键都更新的大表单，存储写入是同步的但很便宜（几 KB 的 JSON）；如果你更想批量写，把字段更新包进 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)，在尾沿写入草稿。

### 撑过一次重定向往返

OAuth、SSO、支付服务商、跳回应用的"验证你的邮箱"链接——任何把标签页带走再送回来的东西，都需要把"我刚才在哪？"存在一个能撑过整页卸载、但不该和隔壁标签页共享的地方。这正是 `sessionStorage` 的主场：像 MSAL 这样的认证库默认把 PKCE verifier 和 `state` 放在这里，就是这个原因。

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
    setReturnTo(null); // 用掉它 —— 一次往返，一次恢复
    navigate(target, { replace: true });
  };

  return { stashAndRedirect, restore };
}
```

两个标签页、两次登录、两个不同的 `returnTo`——互不串扰。要是用了 `localStorage`，标签页 B 的重定向会覆盖标签页 A 的返回路径。

### 绝*不能*同步的按标签页视图状态

让 `useLocalStorage` 粉丝措手不及的场景：用户开了同一个仪表盘的两个标签页，比较"最近 7 天"和"最近 30 天"。用 `localStorage` 加跨标签页同步，在一个标签页里改时间范围，另一个也跟着变，用户只会觉得这个应用闹鬼。任何关于*这个窗口*的视图状态——筛选、排序列、展开的行、打开的是哪个侧边栏——都是 `sessionStorage` 的值：

```tsx
const [range, setRange] = useSessionStorage<"7d" | "30d" | "90d">("dashboard:range", "7d");
```

刷新保留它，第二个标签页从默认值开始，两者永不打架。如果你*还*想要一个跨会话持久的"上次使用"默认值，把它放在 `localStorage` 里，读出来当作 session 的默认值——两个 hook，两种生命周期，都写得明明白白。

### 每次会话只一次

公告横幅、"我们使用 cookie"提示、新手引导气泡——用户应该能在本次访问期间把它们关掉，而你不必承诺永远隐藏：

```tsx
function ReleaseBanner() {
  const [dismissed, setDismissed] = useSessionStorage("banner:v6.5-dismissed", false);
  if (dismissed) return null;
  return (
    <aside>
      v6.5 新特性 —— <a href="/changelog">看看改了什么</a>
      <button onClick={() => setDismissed(true)}>关闭</button>
    </aside>
  );
}
```

把版本写进 key（`banner:v6.5-dismissed`），新版本发布就有一条新横幅，不用动旧标记。同样的形态也适用于"用户这次会话已经看过开场动画了"——如果那是本来就该跳过的那种动画，配上 [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/)。

### 稳定的按标签页 ID

`sessionStorage` 是唯一天然给你"每个标签页一个值、刷新不变"的浏览器原语。这正是标签页标识符想要的——给分析事件打标、关联日志，或者让 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 的消息能按发送者区分。`mountStorageValue` 只在首次挂载且 key 不存在时写入种子值：

```tsx
const [tabId] = useSessionStorage<string>("tab:id", null, {
  mountStorageValue: () => crypto.randomUUID(),
});
// 第一次渲染时是 null，之后是一个在这个标签页的多次刷新间保持稳定的 UUID
```

## 值得知道的坑

- **默认值会在存储值之前闪一下，只闪一次。**SSR 下服务端看不见浏览器的存储，所以首屏显示默认值，存储里的值在水合后的那次渲染才到。对向导步骤来说无所谓；对"哪个面板是打开的"这类东西，你可能想先显示骨架屏直到值就位。权衡与 `localStorage` 相同——见 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。
- **"标签页关闭即清除"带星号。**Chrome、Firefox 和 Safari 在用户重新打开已关闭的标签页、或浏览器崩溃后恢复会话时，都会把 `sessionStorage` 一起恢复。别把关标签页当作敏感数据的*保证*清除；必须删的东西，自己 `setValue(null)`。
- **新标签页 ≠ 同一个标签页。**按住 Ctrl 点你的链接、在新标签页打开的用户，带着空的 `sessionStorage` 到达。这通常是对的（他们想要一个全新的视图），但意味着"用户已经关掉横幅了"和"向导在第 3 步"不会带过去。如果应该带，那是 `localStorage` 的值。
- **`window.open()` 先复制，再分叉。**如果你 `window.open()` 一个同源弹窗（预览、打印视图），它以打开者 `sessionStorage` 的一份*副本*起步。弹窗里的写入到不了打开者；需要的话用 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 或 `postMessage`。
- **`listenToStorageChanges` 对 sessionStorage 基本没意义。**原生 `storage` 事件只会到达*共享同一个存储区的其他文档*——对 `sessionStorage` 来说，就是同一标签页里的同源 iframe，不是别的标签页。同标签页组件之间的同步是另一套始终开启的机制，不受这个选项影响；除非你有 iframe，否则保持默认、忘了它。
- **不是保险箱。**它是 JavaScript 可读的存储。放 PKCE verifier 没问题（一次性、短命、没有授权码就一文不值），放草稿和视图状态也没问题；放一个被窃取会让你上火的长期 access token 就放错了地方。服务端会话和 `httpOnly` cookie 就是为那个存在的。
- **存储可能满或被禁。**配额很小，还和同源上的其他一切共用；某些嵌入/隐私上下文访问就抛异常。两者都通过 `onError` 上报，hook 继续在内存里工作。记下日志——一条"我的表单重置了"的 bug 反馈，追到最后往往是一个没人看的 `QuotaExceededError`。
- **值是 `T | null`，这是故意的。**`setValue(null)` 之后 key 没了，你拿到 `null`，不是默认值。如果你的代码处理不了 `null`，要么永远不调 `setValue(null)`（改成写默认值），要么在读的地方归一化：`const s = step ?? 0`。

## 什么时候不该用 useSessionStorage

- **值应该在任何地方、永远都是同一个**（主题、语言、"永不再显示"）→ [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/)。
- **服务端在第一个请求就需要它**（无闪烁的主题、A/B 分桶、认证会话）→ [`useCookie`](https://reactuse.com/state/usecookie/)。
- **标签页之间需要*对话*，不是*存储***（"你在另一个标签页里登出了"）→ [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/)。
- **你要跨渲染保留一个值，不是跨刷新** → `useState`、`useRef` 或 [`useLatest`](https://reactuse.com/state/uselatest/)——[本系列上一篇](https://reactuse.com/blog/react-uselatest-hook/)讲了各自什么时候用。
- **你想把它放进 URL**（可分享的筛选、可深链的步骤）→ 放进查询串；当一个链接应该复现视图时，它胜过所有存储 API。

## 要点

- `sessionStorage` = 一个标签页、一个源、直到标签页关闭。它能撑过刷新、SPA 与整页导航、后退/前进、重定向往返；它**不会**跨进新标签页（除了通过 `window.open()` / 复制标签页的一次性拷贝），而且浏览器在重新打开已关闭标签页时可能恢复它。
- [`useSessionStorage(key, default)`](https://reactuse.com/state/usesessionstorage/) 是带着这种生命周期的即插即用 `useState`：同样的元组、函数式更新、对象/Map/Set/Date 自动序列化、`setValue(null)` 删除、`onError` 处理损坏数据和被禁的存储、通过 `useSyncExternalStore` 做到 SSR 安全，同一个 key 上的所有组件保持同步。
- 经验法则：两个标签页不一致算 bug → `localStorage`；两个标签页*一致*算 bug → `sessionStorage`。多步表单、重定向往返、按标签页的视图状态、每会话一次的标记、按标签页的 ID 都是 session 值。
- 它是一种生命周期，不是安全边界。秘密放 `httpOnly` cookie，敏感 key 自己用 `setValue(null)` 清，别信任关标签页。

`useSessionStorage`、`useLocalStorage`、`useCookie` 以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，可 tree-shake，零依赖负担。

```bash
npm install @reactuses/core
```
