---
title: "Voice and Camera Input in React: Speech Recognition, Media Devices, and Permissions"
description: "Build voice search, mic level meters, camera selectors, and push-to-talk features in React with useSpeechRecognition, useMediaDevices, usePermission, and useKeyModifier from ReactUse."
slug: react-voice-speech-input
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, speech, camera, microphone, tutorial]
keywords: [react speech recognition, useSpeechRecognition, useMediaDevices, usePermission, react voice search, react microphone, react camera selector, push to talk react, react permissions api]
image: /img/og.png
---

# Voice and Camera Input in React: Speech Recognition, Media Devices, and Permissions

Voice and camera are the two senses that turn a static web app into something that feels alive. A search bar that you can talk to. A note-taking app that transcribes you in real time. A meeting tool that lets you pick which webcam to use. A walkie-talkie that talks when you hold a key. None of these are exotic anymore -- the browser has had the APIs for years -- but every one of them lives behind a gauntlet of permission prompts, vendor prefixes, and lifecycle quirks that make them painful to integrate into a React component.

<!-- truncate -->

This post walks through four browser capabilities for voice and camera input: live speech recognition with interim results, enumerating the user's cameras and microphones, querying permissions in a way that survives revocation, and using the Shift key as a push-to-talk modifier. As always, we will start with the manual implementation so you understand the plumbing, then swap it out for a focused hook from [ReactUse](https://reactuse.com). At the end, we will combine all four into a complete voice search component with a device picker, a permission gate, and a push-to-talk hold-to-record interaction.

## 1. Live Speech Recognition

### The Manual Way

The Web Speech API is one of the older browser APIs that never really got standardized -- Chrome ships it as `webkitSpeechRecognition`, and the unprefixed `SpeechRecognition` is still missing in most engines. The minimal viable React wrapper looks like this:

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
    recognition.lang = "en-US";
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
        {listening ? "Stop" : "Start"} listening
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

This works, but it ignores the rough edges. There is no `isFinal` distinction, so the UI cannot tell when the user pauses (the difference between "interim" and "final" results is what makes voice UIs feel responsive). There is no error handling -- if the user denies microphone permission or there is no network, the transcript just silently never updates. There is no language negotiation. And `SR` typing is awful, because TypeScript does not ship types for `webkitSpeechRecognition`.

### The ReactUse Way: useSpeechRecognition

`useSpeechRecognition` returns a clean object with the right primitives:

```tsx
import { useSpeechRecognition } from "@reactuses/core";

function VoiceNote() {
  const { isSupported, isListening, isFinal, result, error, start, stop } =
    useSpeechRecognition({
      lang: "en-US",
      interimResults: true,
      continuous: true,
    });

  if (!isSupported) {
    return <p>Speech recognition is not supported in this browser.</p>;
  }

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? "Stop" : "Start"} dictation
      </button>
      <p
        style={{
          fontStyle: isFinal ? "normal" : "italic",
          color: isFinal ? "#0f172a" : "#64748b",
        }}
      >
        {result || "Say something..."}
      </p>
      {error && <p style={{ color: "#ef4444" }}>Error: {error.error}</p>}
    </div>
  );
}
```

Things you get for free:

1. **`isFinal`** -- the hook tracks whether the current `result` is the speech engine's tentative guess (italicized in the example) or the locked-in transcript. This is the single biggest UX improvement over the naive version.
2. **`error` object** -- when permission is denied, the network drops, or the engine fails, you get a typed error you can show the user instead of silently freezing.
3. **Hot config**. `start({ lang: "fr-FR" })` switches languages mid-session without requiring you to tear down the recognizer.
4. **Cleanup on unmount**. The hook calls `abort()` automatically, so navigating away never leaves the microphone hot.

The most powerful pattern is binding the result to a search input as the user speaks. Because the hook re-renders with each interim result, you can drive a live search query directly from spoken input and let the user see results as they talk.

## 2. Enumerating Cameras and Microphones

### The Manual Way

Listing the user's audio and video devices requires `navigator.mediaDevices.enumerateDevices()`. There is a catch: until the user has granted permission to *some* device, the labels come back empty -- you get a list of `deviceId`s but no `label` like "FaceTime HD Camera". To get labels, you have to first call `getUserMedia` to trigger the permission prompt, then re-enumerate.

```tsx
function ManualDeviceList() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        // Trigger permission so labels are populated
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
          {d.kind}: {d.label || "(label hidden)"}
        </li>
      ))}
    </ul>
  );
}
```

That is the right shape, but you have to write the permission-trigger dance, the cleanup of the temporary stream, and the device-change listener every single time.

### The ReactUse Way: useMediaDevices

`useMediaDevices` packages the whole thing:

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
      <button onClick={() => ensurePermissions()}>Refresh devices</button>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        style={{ marginLeft: 8 }}
      >
        {cameras.map((cam) => (
          <option key={cam.deviceId} value={cam.deviceId}>
            {cam.label || `Camera ${cam.deviceId.slice(0, 6)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

The hook handles three things you would otherwise write yourself:

- **Permission negotiation**. Pass `requestPermissions: true` and the hook will trigger `getUserMedia` on mount with the constraints you specify, then immediately stop the temporary tracks so the camera light goes off.
- **Live device list**. The hook listens for `devicechange` and re-enumerates automatically -- if a user plugs in a new microphone or unplugs their headphones, the list updates with no extra code.
- **Manual refresh**. The returned `ensurePermissions` lets you re-prompt at any time, useful if the user denied permission once and you want a "Try again" button.

The constraints argument is forwarded directly to `getUserMedia`, so you can ask only for video (and skip the awkward "do you want microphone access" prompt) when you only need to pick a camera.

## 3. Querying Permissions Properly

### The Manual Way

Checking whether the user has already granted (or denied) microphone or camera permission, *without* triggering a prompt, requires the Permissions API. It is well-supported but verbose:

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
        // Permissions API not available for this name
      }
    })();
    return () => {
      mounted = false;
      if (status) status.onchange = null;
    };
  }, []);

  return <p>Microphone permission: {state}</p>;
}
```

Three things to notice. First, the API is callback-based via `onchange`, not React-friendly. Second, you have to feature-detect both the Permissions API itself and the specific name (some browsers do not support `"microphone"`). Third, the change listener has to be cleaned up explicitly, not via effect return.

### The ReactUse Way: usePermission

`usePermission` reduces the entire dance to a single call:

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
      Microphone: {state || "unknown"}
    </span>
  );
}
```

The state is a React-native string that updates whenever the underlying permission status changes -- including out-of-band, when the user goes into browser settings and revokes the permission, your component's `state` will flip to `"denied"` without any action from you.

You can pass a string like `"microphone"` or `"camera"`, or a full `PermissionDescriptor` object for permissions like `"push"` that need extra fields. The shape is identical to `navigator.permissions.query`, just turned into a hook.

## 4. Push-To-Talk With useKeyModifier

### The Manual Way

A push-to-talk button is harder than it looks. You want to detect when the user is holding a key (say, the Space bar or the Shift key), start recording while it is held, and stop the moment they release it. You also have to handle the case where the user holds the key, switches focus to another window, releases the key while your tab is hidden, and then returns -- otherwise the recorder is stuck on.

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

  return <p>{pressed ? "Recording..." : "Hold space to talk"}</p>;
}
```

This *almost* works. The bug: if the Space key auto-repeats while held (which it does on most operating systems), you will get a `keydown` followed by another `keydown` followed by an eventual `keyup`. You handled that. But if the user holds Shift instead and uses it as a modifier with another key combination, your manual tracking does not know about it.

### The ReactUse Way: useKeyModifier

`useKeyModifier` exposes the OS-level modifier state (the same values you would get from `event.getModifierState`) as React state:

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
      {shift ? "Recording (release Shift to stop)" : "Hold Shift to talk"}
    </div>
  );
}
```

The benefits over the keydown/keyup version:

- **OS-aware**. The hook reads `getModifierState`, which queries the actual modifier state from the OS. It survives auto-repeat, focus loss, and weird key combinations correctly.
- **Works for any modifier**. Pass `"Control"`, `"Alt"`, `"Meta"`, `"CapsLock"`, `"NumLock"` -- anything the browser tracks as a modifier.
- **Initial value**. Configure `initial: true` if you want the React state to start as `true` (uncommon but useful for debugging).

## Putting It All Together: A Voice Search With Device Picker

We will combine all four hooks into a single voice-driven search component. The user can pick which microphone to use, sees a permission badge, holds Shift to start dictating, and watches the transcript update live as they speak. When they release Shift, the final transcript becomes the search query.

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
    lang: "en-US",
    interimResults: true,
    continuous: false,
  });

  const shiftDown = useKeyModifier("Shift");

  // Push-to-talk: start when Shift is pressed, stop when released
  useEffect(() => {
    if (!isSupported || micPermission !== "granted") return;
    if (shiftDown) {
      start();
    } else if (isListening) {
      stop();
    }
  }, [shiftDown, isSupported, micPermission, start, stop, isListening]);

  // When recognition finalizes, commit the result to the query
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
        <h2 style={{ margin: 0, fontSize: 18 }}>Voice Search</h2>
        <span style={{ color: permissionColor, fontSize: 13, fontWeight: 600 }}>
          ● Mic: {micPermission || "unknown"}
        </span>
      </header>

      {!isSupported && (
        <p style={{ color: "#64748b" }}>
          This browser does not support speech recognition. Try Chrome.
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
          Grant microphone access
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
              <option value="">Default microphone</option>
              {microphones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Mic ${mic.deviceId.slice(0, 6)}`}
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
              {shiftDown ? "Listening..." : "Hold Shift to dictate"}
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
              Recognition error: {error.error}
            </p>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search query..."
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

Four hooks, four orthogonal concerns:

- **`usePermission`** drives the badge in the header and gates the rest of the UI behind the user's actual decision. Because it is reactive, if the user revokes mic access in browser settings, the badge updates and the input vanishes automatically.
- **`useMediaDevices`** populates the microphone picker without forcing a permission prompt unless the user clicks "Grant".
- **`useSpeechRecognition`** does the actual transcription, distinguishes interim from final results, and surfaces engine errors in a typed way.
- **`useKeyModifier`** turns the Shift key into a push-to-talk trigger that survives focus loss, OS auto-repeat, and weird key combinations.

The component is roughly 130 lines, the vast majority of which is markup. The browser-API plumbing -- the parts that historically take the longest to get right -- is one import line per concern.

## A Note on Testing

Voice and camera features are notoriously hard to test because the browser APIs they depend on require human gestures and physical hardware. The hooks all expose `isSupported` flags so your test environments (jsdom, Vitest, Storybook with mocked navigators) can branch cleanly on the absence of the underlying APIs and render fallback states. If you are building a serious voice UI, dedicate a small layer of integration tests that run in headless Chrome with a fake media stream -- that is the only way to catch the real bugs.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useSpeechRecognition`](https://reactuse.com/browser/useSpeechRecognition/) -- Live speech-to-text with interim and final result tracking
- [`useMediaDevices`](https://reactuse.com/browser/useMediaDevices/) -- Enumerate cameras and microphones with permission handling
- [`usePermission`](https://reactuse.com/browser/usePermission/) -- Reactively query the Permissions API for any permission name
- [`useKeyModifier`](https://reactuse.com/browser/useKeyModifier/) -- Track OS-level modifier key state (Shift, Control, etc.)
- [`useSupported`](https://reactuse.com/state/useSupported/) -- Reactively check whether a browser API is available
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) -- Attach event listeners declaratively for custom voice flows
- [`useObjectUrl`](https://reactuse.com/browser/useObjectUrl/) -- Create temporary URLs for recorded audio blobs to preview them

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
