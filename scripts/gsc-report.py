#!/usr/bin/env python3
"""reactuse.com — Google Search Console 数据分析（优化导向）。

用法:
    python3 scripts/gsc-report.py [天数, 默认 28]

不只 dump 原始数据，直接算出可优化的机会：
  - 概览 + 按日趋势
  - Top 关键词 / Top 页面
  - 「临门一脚」关键词：排名 4-20、曝光高，小幅提升排名就能换大量点击
  - 高曝光低点击的页面：标题/描述待优化

依赖：标准库 + gcloud CLI（ADC 已全局授权，含 webmasters scope）。
配置说明见 GSC.md。
"""
import datetime
import json
import subprocess
import sys
import urllib.parse
import urllib.request

DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 28

GSC_SITE = "sc-domain:reactuse.com"
GCP_QUOTA_PROJECT = "iron-tracker-kdv8p"  # ADC 必须带这个 quota project，否则 403

today = datetime.date.today()
START = (today - datetime.timedelta(days=DAYS)).isoformat()
END = today.isoformat()

_token = subprocess.check_output(
    ["gcloud", "auth", "application-default", "print-access-token"], text=True
).strip()
_headers = {
    "Authorization": f"Bearer {_token}",
    "x-goog-user-project": GCP_QUOTA_PROJECT,
    "Content-Type": "application/json",
}
_site_enc = urllib.parse.quote(GSC_SITE, safe="")
_url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{_site_enc}/searchAnalytics/query"


def query(dimensions=None, row_limit=25):
    body = {"startDate": START, "endDate": END, "rowLimit": row_limit}
    if dimensions:
        body["dimensions"] = dimensions
    req = urllib.request.Request(_url, data=json.dumps(body).encode(), headers=_headers)
    with urllib.request.urlopen(req) as r:
        return json.load(r).get("rows", [])


def pct(x):
    return f"{x * 100:.1f}%"


print(f"========== reactuse.com GSC 报告 ({START} → {END}, {DAYS}天) ==========")
print("注: GSC 数据有 2-3 天结算延迟，最近两天偏低属正常。\n")

# ---- 概览 ----
overview = query()
if overview:
    o = overview[0]
    print("【概览】")
    print(f"  点击 {o['clicks']}  |  曝光 {o['impressions']}  |  "
          f"CTR {pct(o['ctr'])}  |  平均排名 {o['position']:.1f}\n")

# ---- 按日趋势 ----
print("【按日趋势】")
for row in query(["date"], row_limit=DAYS + 2):
    d = row["keys"][0]
    print(f"  {d}   点击 {row['clicks']:>4}   曝光 {row['impressions']:>6}   "
          f"CTR {pct(row['ctr']):>6}   排名 {row['position']:.1f}")
print()

# ---- Top 关键词 ----
print("【Top 25 关键词（按点击）】")
for row in query(["query"], row_limit=25):
    q = row["keys"][0]
    print(f"  {row['clicks']:>4}点击 {row['impressions']:>6}曝光 CTR{pct(row['ctr']):>6} "
          f"排名{row['position']:>5.1f}  {q}")
print()

# ---- Top 页面 ----
print("【Top 25 页面（按点击）】")
for row in query(["page"], row_limit=25):
    p = row["keys"][0]
    print(f"  {row['clicks']:>4}点击 {row['impressions']:>6}曝光 CTR{pct(row['ctr']):>6} "
          f"排名{row['position']:>5.1f}  {p}")
print()

# ---- 优化机会：临门一脚关键词 ----
# 排名 4-20（第1页底部~第2页）、曝光 >= 50：小幅提升排名就能换大量点击。
all_q = query(["query"], row_limit=2000)
striking = sorted(
    [r for r in all_q if 4 <= r["position"] <= 20 and r["impressions"] >= 50],
    key=lambda r: r["impressions"], reverse=True,
)[:30]
print("【优化机会 1 — 临门一脚关键词】（排名4-20 + 曝光≥50，推排名性价比最高）")
for row in striking:
    q = row["keys"][0]
    print(f"  曝光{row['impressions']:>6} 排名{row['position']:>5.1f} CTR{pct(row['ctr']):>6} "
          f"点击{row['clicks']:>4}  {q}")
print()

# ---- 优化机会：高曝光低点击页面 ----
# 曝光高但 CTR 明显偏低 → 标题/meta description 没吸引力，或排名不够。
all_p = query(["page"], row_limit=2000)
low_ctr = sorted(
    [r for r in all_p if r["impressions"] >= 200 and r["ctr"] < 0.01],
    key=lambda r: r["impressions"], reverse=True,
)[:20]
print("【优化机会 2 — 高曝光低点击页面】（曝光≥200 且 CTR<1%，标题/描述待优化）")
for row in low_ctr:
    p = row["keys"][0]
    print(f"  曝光{row['impressions']:>6} CTR{pct(row['ctr']):>6} 排名{row['position']:>5.1f} "
          f"点击{row['clicks']:>4}  {p}")
