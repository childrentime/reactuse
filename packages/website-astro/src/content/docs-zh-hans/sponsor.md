---
title: 赞助 ReactUse
sidebar_label: 赞助支持
description: "赞助 ReactUse——让你的产品出现在每月安装 @reactuses/core 超过 160 万次的 React 开发者面前。金、银、铜三档赞助，README 与官网 logo 展示位。"
---
# 赞助 ReactUse

ReactUse 免费、MIT 协议开源，由维护者利用业余时间维护。赞助不仅支撑着 100+ hooks 的持续维护、SSR 兼容与交互式文档，也是把你的产品直接呈现给一线 React 开发者的最有效方式。

## 为什么值得赞助

- [`@reactuses/core`](https://www.npmjs.com/package/@reactuses/core) **每月 npm 安装量超过 <span id="live-npm-dl">160 万</span>次**——你的 logo 会出现在开发者正在写代码的那一刻
- **100+ 生产可用的 hooks**，拼多多、Shopee、携程等公司在生产环境使用
- **reactuse.com 每月出现在 10 万+ 次 Google 搜索中**——文档是开发者反复查阅的日常参考，不是一次性流量
- **纯开发者受众**：看到你 logo 的人，正是天天为团队选型库、工具和基础设施的人

## 赞助档位

| 档位 | 每月 | 你将获得 |
| --- | --- | --- |
| 🥇 **金牌赞助** | $500 | 大尺寸 logo + 链接，置于 **GitHub README 顶部**及本页。首位展示，曝光最大化。 |
| 🥈 **银牌赞助** | $150 | 中尺寸 logo + 链接，展示于 GitHub README 及本页。 |
| 🥉 **铜牌赞助** | $50 | 小尺寸 logo + 链接，展示于 GitHub README 及本页。 |
| ☕ **支持者** | $5 | 你的名字列在本页 + 我们真诚的感谢。 |

所有档位均通过 [**GitHub Sponsors**](https://github.com/sponsors/childrentime) 结算——发票由 GitHub 开具，多数公司无需走采购流程即可报销。随时可取消。

**logo 会在赞助后 48 小时内上线**——README 和本页同步展示，亮色 / 暗色模式都会适配。

## 当前赞助商

以上所有展示位目前**全部空缺**——第一位金牌赞助商将独享这个每周被数千名开发者看到的 README 头部位置。

<p align="center">
  <a href="https://github.com/sponsors/childrentime"><img alt="金牌赞助位——虚位以待" src="https://img.shields.io/badge/%F0%9F%A5%87%20Gold-your%20logo%20here-FFD700?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="银牌赞助位——虚位以待" src="https://img.shields.io/badge/%F0%9F%A5%88%20Silver-your%20logo%20here-C0C0C0?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="铜牌赞助位——虚位以待" src="https://img.shields.io/badge/%F0%9F%A5%89%20Bronze-your%20logo%20here-CD7F32?style=for-the-badge&labelColor=24292e"></a>
</p>

## 如何赞助

- **按月赞助（公司或个人）：** [github.com/sponsors/childrentime](https://github.com/sponsors/childrentime)
- **一次性支持：** [Buy me a coffee](https://www.buymeacoffee.com/lianwenwu)，或在 GitHub Sponsors 选择一次性金额
- **定制合作**（其他展示位置、直接开票、长期合作）：发邮件至 [wul55267@gmail.com](mailto:wul55267@gmail.com)——48 小时内回复

## 赞助资金的去向

赞助将直接用于维护工作：修复 bug 与审查 PR、保持每个 hook 兼容新版 React 与浏览器、编写测试与交互式文档，以及支付基础设施费用（CI、搜索、托管）。没有中间环节——100% 投入开发。

感谢你让开源可持续。🥰

<script>
// 实时安装量（API 不可达时回退到上文的静态数字）
fetch("https://api.npmjs.org/downloads/point/last-month/@reactuses/core")
  .then(function (r) { return r.json(); })
  .then(function (d) {
    var el = document.getElementById("live-npm-dl");
    if (el && d && d.downloads) el.textContent = Math.round(d.downloads / 10000) + " 万";
  })
  .catch(function () {});
</script>
