---
title: "React 中的语音与摄像头输入：语音识别、媒体设备与权限"
description: "用 ReactUse 中的 useSpeechRecognition、useMediaDevices、usePermission 和 useKeyModifier 在 React 中构建语音搜索、麦克风电平表、摄像头选择器和按住说话功能。"
slug: react-voice-speech-input
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, speech, camera, microphone, tutorial]
keywords: [react speech recognition, useSpeechRecognition, useMediaDevices, usePermission, react voice search, react microphone, react camera selector, push to talk react, react permissions api]
image: /img/og.png
---

# React 中的语音与摄像头输入：语音识别、媒体设备与权限

语音和摄像头是把一个静态 Web 应用变得鲜活的两种感官。一个能对它说话的搜索栏。一个实时把你说的话转成文字的笔记应用。一个让你选择用哪个摄像头的会议工具。一个按住按键就能说话的对讲机。这些早已不再罕见——浏览器有这些 API 已经好多年了——但每一个都被一连串权限弹窗、厂商前缀和生命周期的怪癖挡在前面，让人很难干净地把它们集成进 React 组件。

<!-- truncate -->

本文将带你走过四种用于语音和摄像头输入的浏览器能力：带中间结果的实时语音识别、枚举用户的摄像头和麦克风、在权限被撤销时仍能存活的权限查询，以及把 Shift 键当作按住说话修饰符使用。和往常一样，我们会先用手动实现来开局，让你看清底层的管道，然后再换成 [ReactUse](https://reactuse.com) 里专门的 Hook。最后，我们会把四个 Hook 组合成一个完整的语音搜索组件，包含设备选择器、权限闸门，以及按住说话的录音交互。

## 1. 实时语音识别

### 手动实现

Web Speech API 是一个比较老的浏览器 API，但从未真正被标准化——Chrome 把它实现成 `webkitSpeechRecognition`，而无前缀的 `SpeechRecognition` 在大多数引擎里仍然缺失。最小可用的 React 包装看起来像这样：

```tsx
function ManualSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";
    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      setTranscript(result[0].transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  const start = () => {
    recognitionRef.current?.start();
    setListening(true);
  };
  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div>
      <button onClick={listening ? stop : start}>
        {listening ? "停止" : "开始"}识别
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

这个能跑，但忽略了那些粗糙的边角。它没有区分 `isFinal`，所以 UI 无法判断用户什么时候停顿了（"中间结果"和"最终结果"的区别正是让语音 UI 显得有响应的关键）。它没有错误处理——如果用户拒绝了麦克风权限或网络断了，转录就会默默地永远不更新。它没有语言协商。而且 `SR` 的类型很糟糕，因为 TypeScript 没有为 `webkitSpeechRecognition` 提供类型。

### ReactUse 的方式：useSpeechRecognition

`useSpeechRecognition` 返回一个干净的对象，提供恰当的原语：

```tsx
import { useSpeechRecognition } from "@reactuses/core";

function VoiceNote() {
  const { isSupported, isListening, isFinal, result, error, start, stop } =
    useSpeechRecognition({
      lang: "zh-CN",
      interimResults: true,
      continuous: true,
    });

  if (!isSupported) {
    return <p>当前浏览器不支持语音识别。</p>;
  }

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? "停止" : "开始"}口述
      </button>
      <p
        style={{
          fontStyle: isFinal ? "normal" : "italic",
          color: isFinal ? "#0f172a" : "#64748b",
        }}
      >
        {result || "说点什么..."}
      </p>
      {error && <p style={{ color: "#ef4444" }}>错误：{error.error}</p>}
    </div>
  );
}
```

你不用写就能拿到的好处：

1. **`isFinal`** —— Hook 会跟踪当前 `result` 是语音引擎的临时猜测（在示例里是斜体）还是已经锁定的转录。这是相比朴素版本最大的 UX 提升。
2. **`error` 对象** —— 当权限被拒、网络断开或引擎失败时，你能拿到一个带类型的错误对象，可以展示给用户而不是默默地卡住。
3. **热配置**。`start({ lang: "fr-FR" })` 让你能在会话中途切换语言，无需重建识别器。
4. **卸载时清理**。Hook 会自动调用 `abort()`，所以离开页面永远不会让麦克风一直开着。

最有威力的模式是把识别结果绑到一个搜索输入框上，让用户在说话时实时输入查询。因为 Hook 会在每个中间结果到来时重渲，你可以直接用语音输入来驱动一个实时搜索查询，让用户在说话时就能看到结果。

## 2. 枚举摄像头和麦克风

### 手动实现

列出用户的音频和视频设备需要 `navigator.mediaDevices.enumerateDevices()`。有个陷阱：在用户对*某个*设备授予权限之前，返回的标签是空的——你只能拿到一组 `deviceId`，但拿不到像 "FaceTime HD Camera" 这样的 `label`。要拿到标签，你必须先调用 `getUserMedia` 触发权限弹窗，然后再枚举一次。

```tsx
function ManualDeviceList() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        // 触发权限以填充标签
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        const list = await navigator.mediaDevices.enumerateDevices();
        if (mounted) setDevices(list);
      } catch (e) {
        console.error(e);
      }
    };
    refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", refresh);
    };
  }, []);

  return (
    <ul>
      {devices.map((d) => (
        <li key={d.deviceId}>
          {d.kind}: {d.label || "（标签隐藏）"}
        </li>
      ))}
    </ul>
  );
}
```

形状是对的，但你每次都要写权限触发的舞蹈、临时流的清理，以及 device-change 监听器。

### ReactUse 的方式：useMediaDevices

`useMediaDevices` 把整套流程打包了起来：

```tsx
import { useMediaDevices } from "@reactuses/core";

function CameraPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [{ devices }, ensurePermissions] = useMediaDevices({
    requestPermissions: true,
    constraints: { video: true, audio: false },
  });

  const cameras = devices.filter((d) => d.kind === "videoinput");

  return (
    <div>
      <button onClick={() => ensurePermissions()}>刷新设备</button>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        style={{ marginLeft: 8 }}
      >
        {cameras.map((cam) => (
          <option key={cam.deviceId} value={cam.deviceId}>
            {cam.label || `摄像头 ${cam.deviceId.slice(0, 6)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Hook 处理了三件你本来要自己写的事：

- **权限协商**。传 `requestPermissions: true`，Hook 会在挂载时根据你指定的 constraints 触发 `getUserMedia`，然后立即停止临时音视轨道，让摄像头指示灯熄灭。
- **实时设备列表**。Hook 监听 `devicechange` 并自动重新枚举——如果用户插入新麦克风或拔掉耳机，列表会自动更新，不需要额外代码。
- **手动刷新**。返回的 `ensurePermissions` 让你随时能再触发一次提示，对于"用户拒绝了一次后想再试一次"的按钮非常有用。

constraints 参数会直接转发给 `getUserMedia`，所以你只需要视频时（跳过那种"想要麦克风权限吗"的别扭弹窗）就只请求视频。

## 3. 正确地查询权限

### 手动实现

要在*不触发弹窗*的情况下检查用户是否已经授予（或拒绝）麦克风或摄像头权限，需要 Permissions API。它支持得很好但很啰嗦：

```tsx
function ManualMicPermission() {
  const [state, setState] = useState<PermissionState | "unknown">("unknown");

  useEffect(() => {
    let mounted = true;
    let status: PermissionStatus | null = null;
    (async () => {
      try {
        status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (mounted) setState(status.state);
        status.onchange = () => mounted && status && setState(status.state);
      } catch {
        // 此名称的 Permissions API 不可用
      }
    })();
    return () => {
      mounted = false;
      if (status) status.onchange = null;
    };
  }, []);

  return <p>麦克风权限：{state}</p>;
}
```

三件值得注意的事。第一，API 通过 `onchange` 提供回调，对 React 不友好。第二，你必须同时特性检测 Permissions API 本身和具体的 name（某些浏览器不支持 `"microphone"`）。第三，change 监听器必须显式清理，而不能通过 effect 返回值。

### ReactUse 的方式：usePermission

`usePermission` 把整段舞蹈减到一次调用：

```tsx
import { usePermission } from "@reactuses/core";

function MicStatusBadge() {
  const state = usePermission("microphone");

  const color =
    state === "granted"
      ? "#10b981"
      : state === "denied"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <span style={{ color, fontWeight: 600 }}>
      麦克风：{state || "未知"}
    </span>
  );
}
```

state 是一个 React 原生字符串，每当底层权限状态变化时就会更新——包括外部变化，比如用户进入浏览器设置撤销了权限，你的组件 `state` 就会翻转到 `"denied"`，不需要你做任何操作。

你可以传一个像 `"microphone"` 或 `"camera"` 这样的字符串，也可以传一个完整的 `PermissionDescriptor` 对象，用于像 `"push"` 这样需要额外字段的权限。形状和 `navigator.permissions.query` 完全一致，只是变成了一个 Hook。

## 4. 用 useKeyModifier 实现按住说话

### 手动实现

按住说话按钮比看起来要难。你想检测用户是否在按住某个键（比如 Space 或 Shift），按住时开始录音，松开时立即停止。你还得处理这种情况：用户按住按键、把焦点切到另一个窗口、在你的页面隐藏时松开按键、然后再回来——否则录音器会一直卡在录制状态。

```tsx
function ManualPushToTalk() {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setPressed(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setPressed(false);
    };
    const onBlur = () => setPressed(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return <p>{pressed ? "正在录制..." : "按住空格说话"}</p>;
}
```

这个*差不多*能跑。bug 是：如果 Space 键在按住时自动重复（大多数操作系统都会这样），你会先收到一个 `keydown`，然后又一个 `keydown`，最后才是 `keyup`。这个你处理了。但如果用户按的是 Shift 并把它当成与其他键的组合修饰符使用，你的手动跟踪就不知道了。

### ReactUse 的方式：useKeyModifier

`useKeyModifier` 把 OS 级别的修饰键状态（和你从 `event.getModifierState` 拿到的值一样）暴露为 React state：

```tsx
import { useKeyModifier } from "@reactuses/core";

function ShiftToRecord({ onTalkStart, onTalkEnd }: {
  onTalkStart: () => void;
  onTalkEnd: () => void;
}) {
  const shift = useKeyModifier("Shift");

  useEffect(() => {
    if (shift) onTalkStart();
    else onTalkEnd();
  }, [shift, onTalkStart, onTalkEnd]);

  return (
    <div
      style={{
        padding: 16,
        background: shift ? "#fef3c7" : "#f1f5f9",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      {shift ? "正在录制（松开 Shift 停止）" : "按住 Shift 说话"}
    </div>
  );
}
```

相比 keydown/keyup 版本的好处：

- **OS 感知**。Hook 读取 `getModifierState`，从 OS 查询实际的修饰键状态。它能正确应对自动重复、焦点丢失和奇怪的组合键。
- **支持任何修饰键**。传 `"Control"`、`"Alt"`、`"Meta"`、`"CapsLock"`、`"NumLock"`——浏览器追踪的任何修饰键都行。
- **初始值**。如果你想让 React state 初始为 `true`，就配置 `initial: true`（不常见，但调试时有用）。

## 全部组合：带设备选择器的语音搜索

我们把四个 Hook 组合成一个语音驱动的搜索组件。用户可以选择用哪个麦克风、看到一个权限徽章、按住 Shift 开始口述、并在说话时实时看到转录更新。当他们松开 Shift 时，最终转录就成了搜索查询。

```tsx
import { useEffect, useState } from "react";
import {
  useSpeechRecognition,
  useMediaDevices,
  usePermission,
  useKeyModifier,
} from "@reactuses/core";

function VoiceSearch() {
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [query, setQuery] = useState("");

  const micPermission = usePermission("microphone");
  const [{ devices }, requestDevices] = useMediaDevices({
    requestPermissions: false,
    constraints: { audio: true, video: false },
  });

  const microphones = devices.filter((d) => d.kind === "audioinput");

  const {
    isSupported,
    isListening,
    isFinal,
    result,
    error,
    start,
    stop,
  } = useSpeechRecognition({
    lang: "zh-CN",
    interimResults: true,
    continuous: false,
  });

  const shiftDown = useKeyModifier("Shift");

  // 按住说话：按下 Shift 时开始，松开时停止
  useEffect(() => {
    if (!isSupported || micPermission !== "granted") return;
    if (shiftDown) {
      start();
    } else if (isListening) {
      stop();
    }
  }, [shiftDown, isSupported, micPermission, start, stop, isListening]);

  // 当识别最终化时，把结果提交到查询
  useEffect(() => {
    if (isFinal && result) {
      setQuery(result);
    }
  }, [isFinal, result]);

  const permissionColor =
    micPermission === "granted"
      ? "#10b981"
      : micPermission === "denied"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <div
      style={{
        maxWidth: 640,
        padding: 24,
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>语音搜索</h2>
        <span style={{ color: permissionColor, fontSize: 13, fontWeight: 600 }}>
          ● 麦克风：{micPermission || "未知"}
        </span>
      </header>

      {!isSupported && (
        <p style={{ color: "#64748b" }}>
          当前浏览器不支持语音识别。请试试 Chrome。
        </p>
      )}

      {isSupported && micPermission !== "granted" && (
        <button
          onClick={requestDevices}
          style={{
            width: "100%",
            padding: 12,
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          授权麦克风访问
        </button>
      )}

      {isSupported && micPermission === "granted" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <select
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="">默认麦克风</option>
              {microphones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `麦克风 ${mic.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: 16,
              background: shiftDown ? "#dcfce7" : "#f8fafc",
              borderRadius: 8,
              border: shiftDown
                ? "2px solid #10b981"
                : "2px dashed #cbd5e1",
              textAlign: "center",
              transition: "all 120ms ease",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
              {shiftDown ? "正在监听..." : "按住 Shift 进行口述"}
            </p>
            {result && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontStyle: isFinal ? "normal" : "italic",
                  color: isFinal ? "#0f172a" : "#64748b",
                }}
              >
                {result}
              </p>
            )}
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>
              识别错误：{error.error}
            </p>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索查询..."
            style={{
              width: "100%",
              marginTop: 12,
              padding: 10,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 16,
            }}
          />
        </>
      )}
    </div>
  );
}
```

四个 Hook，四个相互正交的关注点：

- **`usePermission`** 驱动 header 中的徽章，并把 UI 的其余部分挡在用户实际决策之后。因为它是响应式的，如果用户在浏览器设置里撤销了麦克风权限，徽章会自动更新，输入框会自动消失。
- **`useMediaDevices`** 填充麦克风选择器，除非用户点击"授权"，否则不会强制弹出权限对话框。
- **`useSpeechRecognition`** 完成实际的转录，区分中间结果和最终结果，并以带类型的方式暴露引擎错误。
- **`useKeyModifier`** 把 Shift 键变成按住说话的触发器，能正确应对焦点丢失、OS 自动重复和奇怪的组合键。

整个组件大概 130 行，绝大多数都是标签。浏览器 API 那些历来最难做对的部分，每个关注点只占一行 import。

## 关于测试的一点说明

语音和摄像头功能出了名地难测试，因为它们依赖的浏览器 API 需要真实的人手势和物理硬件。这些 Hook 都暴露了 `isSupported` 标志，所以你的测试环境（jsdom、Vitest、用 mock navigator 的 Storybook）可以在底层 API 缺失时干净地分支并渲染 fallback 状态。如果你在做严肃的语音 UI，请专门划出一小层在 headless Chrome 里用假媒体流跑的集成测试——那才是抓真正 bug 的唯一方式。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useSpeechRecognition`](https://reactuse.com/browser/useSpeechRecognition/) —— 实时语音转文字，跟踪中间和最终结果
- [`useMediaDevices`](https://reactuse.com/browser/useMediaDevices/) —— 枚举摄像头和麦克风，处理权限
- [`usePermission`](https://reactuse.com/browser/usePermission/) —— 响应式地查询任意权限的 Permissions API
- [`useKeyModifier`](https://reactuse.com/browser/useKeyModifier/) —— 跟踪 OS 级别的修饰键状态（Shift、Control 等）
- [`useSupported`](https://reactuse.com/state/useSupported/) —— 响应式地检查浏览器 API 是否可用
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) —— 声明式地附加事件监听器，可用于自定义语音流程
- [`useObjectUrl`](https://reactuse.com/browser/useObjectUrl/) —— 为录制的音频 blob 创建临时 URL 以预览

---

ReactUse 提供了 100+ 个 React Hook。[全部探索 →](https://reactuse.com)
