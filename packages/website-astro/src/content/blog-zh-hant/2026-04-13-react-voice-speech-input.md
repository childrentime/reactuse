---
title: "React 中的語音與相機輸入:語音識別、媒體裝置與權限"
description: "用 ReactUse 中的 useSpeechRecognition、useMediaDevices、usePermission 和 useKeyModifier 在 React 中構建語音搜尋、麥克風電平表、相機選擇器和按住說話功能。"
slug: react-voice-speech-input
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, speech, camera, microphone, tutorial]
keywords: [react speech recognition, useSpeechRecognition, useMediaDevices, usePermission, react voice search, react microphone, react camera selector, push to talk react, react permissions api]
image: /img/og.png
---

# React 中的語音與相機輸入:語音識別、媒體裝置與權限

語音和相機是把一個靜態 Web 應用變得鮮活的兩種感官。一個能對它說話的搜尋欄。一個即時把你說的話轉成文字的筆記應用。一個讓你選擇用哪個相機的會議工具。一個按住按鍵就能說話的對講機。這些早已不再罕見——瀏覽器有這些 API 已經好多年了——但每一個都被一連串權限彈窗、廠商前綴和生命週期的怪癖擋在前面,讓人很難乾淨地把它們整合進 React 元件。

<!-- truncate -->

本文將帶你走過四種用於語音和相機輸入的瀏覽器能力:帶中間結果的即時語音識別、列舉使用者的相機和麥克風、在權限被撤銷時仍能存活的權限查詢,以及把 Shift 鍵當作按住說話修飾符使用。和往常一樣,我們會先用手動實作來開局,讓你看清底層的管道,然後再換成 [ReactUse](https://reactuse.com) 裡專門的 Hook。最後,我們會把四個 Hook 組合成一個完整的語音搜尋元件,包含裝置選擇器、權限閘門,以及按住說話的錄音互動。

## 1. 即時語音識別

### 手動實作

Web Speech API 是一個比較老的瀏覽器 API,但從未真正被標準化——Chrome 把它實作成 `webkitSpeechRecognition`,而無前綴的 `SpeechRecognition` 在大多數引擎裡仍然缺失。最小可用的 React 包裝看起來像這樣:

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
    recognition.lang = "zh-TW";
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
        {listening ? "停止" : "開始"}識別
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

這個能跑,但忽略了那些粗糙的邊角。它沒有區分 `isFinal`,所以 UI 無法判斷使用者什麼時候停頓了(「中間結果」和「最終結果」的區別正是讓語音 UI 顯得有響應的關鍵)。它沒有錯誤處理——如果使用者拒絕了麥克風權限或網路斷了,轉錄就會默默地永遠不更新。它沒有語言協商。而且 `SR` 的型別很糟糕,因為 TypeScript 沒有為 `webkitSpeechRecognition` 提供型別。

### ReactUse 的方式:useSpeechRecognition

`useSpeechRecognition` 回傳一個乾淨的物件,提供恰當的原語:

```tsx
import { useSpeechRecognition } from "@reactuses/core";

function VoiceNote() {
  const { isSupported, isListening, isFinal, result, error, start, stop } =
    useSpeechRecognition({
      lang: "zh-TW",
      interimResults: true,
      continuous: true,
    });

  if (!isSupported) {
    return <p>當前瀏覽器不支援語音識別。</p>;
  }

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? "停止" : "開始"}口述
      </button>
      <p
        style={{
          fontStyle: isFinal ? "normal" : "italic",
          color: isFinal ? "#0f172a" : "#64748b",
        }}
      >
        {result || "說點什麼..."}
      </p>
      {error && <p style={{ color: "#ef4444" }}>錯誤:{error.error}</p>}
    </div>
  );
}
```

你不用寫就能拿到的好處:

1. **`isFinal`** —— Hook 會追蹤當前 `result` 是語音引擎的臨時猜測(在範例裡是斜體)還是已經鎖定的轉錄。這是相比樸素版本最大的 UX 提升。
2. **`error` 物件** —— 當權限被拒、網路斷開或引擎失敗時,你能拿到一個帶型別的錯誤物件,可以展示給使用者而不是默默地卡住。
3. **熱配置**。`start({ lang: "fr-FR" })` 讓你能在會話中途切換語言,無需重建識別器。
4. **卸載時清理**。Hook 會自動呼叫 `abort()`,所以離開頁面永遠不會讓麥克風一直開著。

最有威力的模式是把識別結果繫結到一個搜尋輸入框上,讓使用者在說話時即時輸入查詢。因為 Hook 會在每個中間結果到來時重渲,你可以直接用語音輸入來驅動一個即時搜尋查詢,讓使用者在說話時就能看到結果。

## 2. 列舉相機和麥克風

### 手動實作

列出使用者的音訊和視訊裝置需要 `navigator.mediaDevices.enumerateDevices()`。有個陷阱:在使用者對*某個*裝置授予權限之前,回傳的標籤是空的——你只能拿到一組 `deviceId`,但拿不到像 "FaceTime HD Camera" 這樣的 `label`。要拿到標籤,你必須先呼叫 `getUserMedia` 觸發權限彈窗,然後再列舉一次。

```tsx
function ManualDeviceList() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        // 觸發權限以填充標籤
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
          {d.kind}: {d.label || "(標籤隱藏)"}
        </li>
      ))}
    </ul>
  );
}
```

形狀是對的,但你每次都要寫權限觸發的舞蹈、臨時流的清理,以及 device-change 監聽器。

### ReactUse 的方式:useMediaDevices

`useMediaDevices` 把整套流程打包了起來:

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
      <button onClick={() => ensurePermissions()}>重新整理裝置</button>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        style={{ marginLeft: 8 }}
      >
        {cameras.map((cam) => (
          <option key={cam.deviceId} value={cam.deviceId}>
            {cam.label || `相機 ${cam.deviceId.slice(0, 6)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Hook 處理了三件你本來要自己寫的事:

- **權限協商**。傳 `requestPermissions: true`,Hook 會在掛載時根據你指定的 constraints 觸發 `getUserMedia`,然後立即停止臨時音視軌道,讓相機指示燈熄滅。
- **即時裝置列表**。Hook 監聽 `devicechange` 並自動重新列舉——如果使用者插入新麥克風或拔掉耳機,列表會自動更新,不需要額外程式碼。
- **手動重新整理**。回傳的 `ensurePermissions` 讓你隨時能再觸發一次提示,對於「使用者拒絕了一次後想再試一次」的按鈕非常有用。

constraints 參數會直接轉發給 `getUserMedia`,所以你只需要視訊時(跳過那種「想要麥克風權限嗎」的彆扭彈窗)就只請求視訊。

## 3. 正確地查詢權限

### 手動實作

要在*不觸發彈窗*的情況下檢查使用者是否已經授予(或拒絕)麥克風或相機權限,需要 Permissions API。它支援得很好但很囉嗦:

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
        // 此名稱的 Permissions API 不可用
      }
    })();
    return () => {
      mounted = false;
      if (status) status.onchange = null;
    };
  }, []);

  return <p>麥克風權限:{state}</p>;
}
```

三件值得注意的事。第一,API 透過 `onchange` 提供回呼,對 React 不友好。第二,你必須同時特性檢測 Permissions API 本身和具體的 name(某些瀏覽器不支援 `"microphone"`)。第三,change 監聽器必須顯式清理,而不能透過 effect 回傳值。

### ReactUse 的方式:usePermission

`usePermission` 把整段舞蹈減到一次呼叫:

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
      麥克風:{state || "未知"}
    </span>
  );
}
```

state 是一個 React 原生字串,每當底層權限狀態變化時就會更新——包括外部變化,比如使用者進入瀏覽器設定撤銷了權限,你的元件 `state` 就會翻轉到 `"denied"`,不需要你做任何操作。

你可以傳一個像 `"microphone"` 或 `"camera"` 這樣的字串,也可以傳一個完整的 `PermissionDescriptor` 物件,用於像 `"push"` 這樣需要額外欄位的權限。形狀和 `navigator.permissions.query` 完全一致,只是變成了一個 Hook。

## 4. 用 useKeyModifier 實作按住說話

### 手動實作

按住說話按鈕比看起來要難。你想偵測使用者是否在按住某個鍵(比如 Space 或 Shift),按住時開始錄音,鬆開時立即停止。你還得處理這種情況:使用者按住按鍵、把焦點切到另一個視窗、在你的頁面隱藏時鬆開按鍵、然後再回來——否則錄音器會一直卡在錄製狀態。

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

  return <p>{pressed ? "正在錄製..." : "按住空白鍵說話"}</p>;
}
```

這個*差不多*能跑。bug 是:如果 Space 鍵在按住時自動重複(大多數作業系統都會這樣),你會先收到一個 `keydown`,然後又一個 `keydown`,最後才是 `keyup`。這個你處理了。但如果使用者按的是 Shift 並把它當成與其他鍵的組合修飾符使用,你的手動追蹤就不知道了。

### ReactUse 的方式:useKeyModifier

`useKeyModifier` 把 OS 級別的修飾鍵狀態(和你從 `event.getModifierState` 拿到的值一樣)暴露為 React state:

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
      {shift ? "正在錄製(鬆開 Shift 停止)" : "按住 Shift 說話"}
    </div>
  );
}
```

相比 keydown/keyup 版本的好處:

- **OS 感知**。Hook 讀取 `getModifierState`,從 OS 查詢實際的修飾鍵狀態。它能正確應對自動重複、焦點丟失和奇怪的組合鍵。
- **支援任何修飾鍵**。傳 `"Control"`、`"Alt"`、`"Meta"`、`"CapsLock"`、`"NumLock"`——瀏覽器追蹤的任何修飾鍵都行。
- **初始值**。如果你想讓 React state 初始為 `true`,就配置 `initial: true`(不常見,但除錯時有用)。

## 全部組合:帶裝置選擇器的語音搜尋

我們把四個 Hook 組合成一個語音驅動的搜尋元件。使用者可以選擇用哪個麥克風、看到一個權限徽章、按住 Shift 開始口述、並在說話時即時看到轉錄更新。當他們鬆開 Shift 時,最終轉錄就成了搜尋查詢。

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
    lang: "zh-TW",
    interimResults: true,
    continuous: false,
  });

  const shiftDown = useKeyModifier("Shift");

  // 按住說話:按下 Shift 時開始,鬆開時停止
  useEffect(() => {
    if (!isSupported || micPermission !== "granted") return;
    if (shiftDown) {
      start();
    } else if (isListening) {
      stop();
    }
  }, [shiftDown, isSupported, micPermission, start, stop, isListening]);

  // 當識別最終化時,把結果提交到查詢
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
        <h2 style={{ margin: 0, fontSize: 18 }}>語音搜尋</h2>
        <span style={{ color: permissionColor, fontSize: 13, fontWeight: 600 }}>
          ● 麥克風:{micPermission || "未知"}
        </span>
      </header>

      {!isSupported && (
        <p style={{ color: "#64748b" }}>
          當前瀏覽器不支援語音識別。請試試 Chrome。
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
          授權麥克風存取
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
              <option value="">預設麥克風</option>
              {microphones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `麥克風 ${mic.deviceId.slice(0, 6)}`}
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
              {shiftDown ? "正在監聽..." : "按住 Shift 進行口述"}
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
              識別錯誤:{error.error}
            </p>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋查詢..."
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

四個 Hook,四個相互正交的關注點:

- **`usePermission`** 驅動 header 中的徽章,並把 UI 的其餘部分擋在使用者實際決策之後。因為它是響應式的,如果使用者在瀏覽器設定裡撤銷了麥克風權限,徽章會自動更新,輸入框會自動消失。
- **`useMediaDevices`** 填充麥克風選擇器,除非使用者點擊「授權」,否則不會強制彈出權限對話框。
- **`useSpeechRecognition`** 完成實際的轉錄,區分中間結果和最終結果,並以帶型別的方式暴露引擎錯誤。
- **`useKeyModifier`** 把 Shift 鍵變成按住說話的觸發器,能正確應對焦點丟失、OS 自動重複和奇怪的組合鍵。

整個元件大概 130 行,絕大多數都是標籤。瀏覽器 API 那些歷來最難做對的部分,每個關注點只佔一行 import。

## 關於測試的一點說明

語音和相機功能出了名地難測試,因為它們依賴的瀏覽器 API 需要真實的人手勢和物理硬體。這些 Hook 都暴露了 `isSupported` 旗標,所以你的測試環境(jsdom、Vitest、用 mock navigator 的 Storybook)可以在底層 API 缺失時乾淨地分支並渲染 fallback 狀態。如果你在做嚴肅的語音 UI,請專門劃出一小層在 headless Chrome 裡用假媒體流跑的整合測試——那才是抓真正 bug 的唯一方式。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useSpeechRecognition`](https://reactuse.com/browser/useSpeechRecognition/) —— 即時語音轉文字,追蹤中間和最終結果
- [`useMediaDevices`](https://reactuse.com/browser/useMediaDevices/) —— 列舉相機和麥克風,處理權限
- [`usePermission`](https://reactuse.com/browser/usePermission/) —— 響應式地查詢任意權限的 Permissions API
- [`useKeyModifier`](https://reactuse.com/browser/useKeyModifier/) —— 追蹤 OS 級別的修飾鍵狀態(Shift、Control 等)
- [`useSupported`](https://reactuse.com/state/useSupported/) —— 響應式地檢查瀏覽器 API 是否可用
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) —— 宣告式地附加事件監聽器,可用於自訂語音流程
- [`useObjectUrl`](https://reactuse.com/browser/useObjectUrl/) —— 為錄製的音訊 blob 建立臨時 URL 以預覽

---

ReactUse 提供了 100+ 個 React Hook。[全部探索 →](https://reactuse.com)
