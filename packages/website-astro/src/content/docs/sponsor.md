---
title: Sponsor ReactUse
sidebar_label: sponsor
description: "Sponsor ReactUse — put your product in front of the React developers who install @reactuses/core 1.6M+ times a month. Gold, Silver and Bronze tiers with README + website logo placement."
---
# Sponsor ReactUse

ReactUse is free, MIT-licensed and maintained in spare time. Sponsorship is what keeps 100+ hooks maintained, SSR-safe and documented with interactive demos — and it's also the single most effective way to put your product in front of working React developers.

## Why sponsor

- **<span id="live-npm-dl">1.6M+</span> npm installs per month** of [`@reactuses/core`](https://www.npmjs.com/package/@reactuses/core) — your logo reaches developers at the exact moment they're building
- **100+ production-ready hooks**, used in production at PDD, Shopee and Ctrip
- **reactuse.com appears in 100k+ Google searches every month** — the docs are a daily reference, not a one-time visit
- A **developer-only audience**: the people who see your logo choose libraries, tools and infrastructure for a living

## Tiers

| Tier | Per month | What you get |
| --- | --- | --- |
| 🥇 **Gold** | $500 | Large logo + link at the **top of the GitHub README** and this page. First position, maximum visibility. |
| 🥈 **Silver** | $150 | Medium logo + link in the GitHub README and on this page. |
| 🥉 **Bronze** | $50 | Small logo + link in the GitHub README and on this page. |
| ☕ **Backer** | $5 | Your name listed on this page + our sincere gratitude. |

All tiers are billed through [**GitHub Sponsors**](https://github.com/sponsors/childrentime) — invoices are issued by GitHub, so most companies can expense it without a procurement process. Cancel anytime.

**Logos go live within 48 hours** of sponsorship — in the README, on this page, in both light and dark mode.

## Current sponsors

Every slot above is currently **open** — the first Gold sponsor gets the top of a README seen by thousands of developers a week, exclusively.

<p align="center">
  <a href="https://github.com/sponsors/childrentime"><img alt="Gold Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%87%20Gold-your%20logo%20here-FFD700?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="Silver Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%88%20Silver-your%20logo%20here-C0C0C0?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="Bronze Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%89%20Bronze-your%20logo%20here-CD7F32?style=for-the-badge&labelColor=24292e"></a>
</p>

## How to sponsor

- **Monthly (companies & individuals):** [github.com/sponsors/childrentime](https://github.com/sponsors/childrentime)
- **One-time:** [Buy me a coffee](https://www.buymeacoffee.com/lianwenwu), or a one-time amount on GitHub Sponsors
- **Custom arrangements** (different placement, direct invoicing, longer commitments): email [wul55267@gmail.com](mailto:wul55267@gmail.com) — replies within 48 hours

## Where the money goes

Sponsorship directly funds maintenance: fixing bugs and reviewing PRs, keeping every hook compatible with new React and browser releases, writing tests and interactive documentation, and covering infrastructure (CI, search, hosting). No middlemen — 100% goes to development.

Thank you for keeping open source sustainable. 🥰

<script>
// Live install count (falls back to the static figure above if the API is unreachable)
fetch("https://api.npmjs.org/downloads/point/last-month/@reactuses/core")
  .then(function (r) { return r.json(); })
  .then(function (d) {
    var el = document.getElementById("live-npm-dl");
    if (el && d && d.downloads) el.textContent = (d.downloads / 1e6).toFixed(1) + "M+";
  })
  .catch(function () {});
</script>
