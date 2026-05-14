# GSC.md — 用 Google Search Console 分析 reactuse.com

reactuse.com 的搜索数据（曝光/点击/排名/索引）都在 Google Search Console。这份文档说明怎么拉数据做 SEO 优化。

## 日常用法

```bash
python3 scripts/gsc-report.py        # 近 28 天
python3 scripts/gsc-report.py 90     # 近 90 天
```

输出（分析导向，不只是原始 dump）：

- **概览** — 总点击/曝光/CTR/平均排名
- **按日趋势** — 看增长曲线、发现异常掉量
- **Top 25 关键词 / Top 25 页面** — 当前主力流量来源
- **优化机会 1：临门一脚关键词** — 排名 4-20、曝光 ≥50。这些词离第一页/前列只差一点，优化对应页面内容或拿外链，性价比最高。
- **优化机会 2：高曝光低点击页面** — 曝光 ≥200 但 CTR <1%。通常是 `<title>` / meta description 不够吸引人，或排名还不够靠前。

## 配置（已就绪，换环境时照做）

走 `gcloud` ADC（用户账号 OAuth），**不需要 service account**。GSC 属性 `sc-domain:reactuse.com` 已在 Google 账号 `wul55267@gmail.com` 下，siteOwner 权限。

如果 `gcloud auth application-default print-access-token` 报 scope 不足，重新授权（注意整条命令别换行粘贴）：

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/webmasters.readonly
gcloud auth application-default set-quota-project iron-tracker-kdv8p
```

并确保 Search Console API 已启用：
```bash
gcloud services enable searchconsole.googleapis.com --project=iron-tracker-kdv8p
```

## 坑

- 调 API 必须带请求头 `x-goog-user-project: iron-tracker-kdv8p`，否则 403（脚本已处理）。
- GSC 数据有 **2-3 天结算延迟**，最近两天的点击/曝光会偏低，不是掉量。
- 用 `sc-domain:reactuse.com` 这个 domain 属性（覆盖全协议/子域）。另有个 `https://www.reactuse.com/` 属性是空的，别用。
- 想看更细的维度（country / device / 搜索类型），改 `scripts/gsc-report.py` 里 `query()` 的 `dimensions` 参数，GSC 支持 `["query","page","country","device","date","searchAppearance"]` 组合。

## 优化打法（拿到数据之后）

1. **临门一脚关键词** → 找到对应的 hook 文档页，补充该关键词相关的内容/示例。
2. **高曝光低点击页面** → 改 `<title>` 和 meta description，加数字/动词/年份让它更可点。
3. **趋势异常** → 某天突然掉量，先查 GSC 的「网页索引」报告和 `sitemap` 状态。
