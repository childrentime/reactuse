---
title: 贊助 ReactUse
sidebar_label: 贊助支持
description: "贊助 ReactUse——讓你的產品出現在每月安裝 @reactuses/core 超過 160 萬次的 React 開發者面前。金、銀、銅三檔贊助，README 與官網 logo 展示位。"
---
# 贊助 ReactUse

ReactUse 免費、以 Unlicense 釋入公有領域，由維護者利用業餘時間維護。贊助不僅支撐著 100+ hooks 的持續維護、SSR 相容與互動式文件，也是把你的產品直接呈現給第一線 React 開發者的最有效方式。

## 為什麼值得贊助

- [`@reactuses/core`](https://www.npmjs.com/package/@reactuses/core) **每月 npm 安裝量超過 <span id="live-npm-dl">160 萬</span>次**——你的 logo 會出現在開發者正在寫程式的那一刻
- **100+ 生產可用的 hooks**，拼多多、Shopee、攜程等公司在生產環境使用
- **reactuse.com 每月出現在 10 萬+ 次 Google 搜尋中**——文件是開發者反覆查閱的日常參考，不是一次性流量
- **純開發者受眾**：看到你 logo 的人，正是天天為團隊選型函式庫、工具和基礎設施的人

## 贊助檔位

| 檔位 | 每月 | 你將獲得 |
| --- | --- | --- |
| 🥇 **金牌贊助** | $500 | 大尺寸 logo + 連結，置於 **GitHub README 頂部**及本頁。首位展示，曝光最大化。 |
| 🥈 **銀牌贊助** | $150 | 中尺寸 logo + 連結，展示於 GitHub README 及本頁。 |
| 🥉 **銅牌贊助** | $50 | 小尺寸 logo + 連結，展示於 GitHub README 及本頁。 |
| ☕ **支持者** | $5 | 你的名字列在本頁 + 我們真誠的感謝。 |

所有檔位均透過 [**GitHub Sponsors**](https://github.com/sponsors/childrentime) 結算——發票由 GitHub 開立，多數公司無需走採購流程即可報銷。隨時可取消。

**logo 會在贊助後 48 小時內上線**——README 和本頁同步展示，亮色 / 暗色模式都會適配。

## 目前贊助商

以上所有展示位目前**全部空缺**——第一位金牌贊助商將獨享這個每週被數千名開發者看到的 README 頂部位置。

<p align="center">
  <a href="https://github.com/sponsors/childrentime"><img alt="金牌贊助位——虛位以待" src="https://img.shields.io/badge/%F0%9F%A5%87%20Gold-your%20logo%20here-FFD700?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="銀牌贊助位——虛位以待" src="https://img.shields.io/badge/%F0%9F%A5%88%20Silver-your%20logo%20here-C0C0C0?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="銅牌贊助位——虛位以待" src="https://img.shields.io/badge/%F0%9F%A5%89%20Bronze-your%20logo%20here-CD7F32?style=for-the-badge&labelColor=24292e"></a>
</p>

## 如何贊助

- **按月贊助（公司或個人）：** [github.com/sponsors/childrentime](https://github.com/sponsors/childrentime)
- **一次性支持：** [Buy me a coffee](https://www.buymeacoffee.com/lianwenwu)，或在 GitHub Sponsors 選擇一次性金額
- **客製合作**（其他展示位置、直接開票、長期合作）：來信 [wul55267@gmail.com](mailto:wul55267@gmail.com)——48 小時內回覆

## 贊助資金的去向

贊助將直接用於維護工作：修復 bug 與審查 PR、保持每個 hook 相容新版 React 與瀏覽器、撰寫測試與互動式文件，以及支付基礎設施費用（CI、搜尋、託管）。沒有中間環節——100% 投入開發。

感謝你讓開源永續。🥰

<script>
// 實時安裝量（API 不可達時回退到上文的靜態數字）
fetch("https://api.npmjs.org/downloads/point/last-month/@reactuses/core")
  .then(function (r) { return r.json(); })
  .then(function (d) {
    var el = document.getElementById("live-npm-dl");
    if (el && d && d.downloads) el.textContent = Math.round(d.downloads / 10000) + " 萬";
  })
  .catch(function () {});
</script>
