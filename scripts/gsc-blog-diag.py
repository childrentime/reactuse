#!/usr/bin/env python3
"""临时诊断：为什么博客文章 CTR 这么低。

对每个博客页对比两组数据:
  A) 页面级 (含匿名查询) —— 真实总曝光/点击/CTR/平均排名
  B) 具名查询级 —— GSC 愿意透露的查询，看排名分布和意图匹配

A 和 B 的曝光差 = 匿名长尾查询量。若差额巨大且 B 排名尚可却 0 点击，
说明问题是"意图错配 + 长尾噪音曝光"，不是单纯排名低。

用法: python3 scripts/gsc-blog-diag.py [天数, 默认 28]
"""
import datetime
import json
import subprocess
import sys
import urllib.parse
import urllib.request

DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 28
GSC_SITE = "sc-domain:reactuse.com"
GCP_QUOTA_PROJECT = "iron-tracker-kdv8p"

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


def query(dimensions, row_limit=25000):
    body = {"startDate": START, "endDate": END, "rowLimit": row_limit,
            "dimensions": dimensions}
    req = urllib.request.Request(_url, data=json.dumps(body).encode(), headers=_headers)
    with urllib.request.urlopen(req) as r:
        return json.load(r).get("rows", [])


def pct(x):
    return f"{x * 100:.2f}%"


# A) 页面级（含匿名查询）
page_rows = {r["keys"][0]: r for r in query(["page"]) if "/blog/" in r["keys"][0]}

# B) 具名查询级
nq = {}
for r in query(["page", "query"]):
    page, q = r["keys"]
    if "/blog/" not in page:
        continue
    nq.setdefault(page, []).append((q, r["clicks"], r["impressions"],
                                    r["ctr"], r["position"]))

ranked = sorted(page_rows.items(),
                key=lambda kv: kv[1]["impressions"], reverse=True)

print(f"========== 博客 CTR 诊断 ({START} → {END}, {DAYS}天) ==========\n")

for page, pr in ranked:
    if pr["impressions"] < 150:
        continue
    qs = nq.get(page, [])
    named_impr = sum(x[2] for x in qs)
    named_clicks = sum(x[1] for x in qs)
    anon_impr = pr["impressions"] - named_impr
    anon_share = anon_impr * 100 // pr["impressions"] if pr["impressions"] else 0

    print(f"### {page}")
    print(f"  [页面级/含匿名] 曝光 {pr['impressions']}  点击 {pr['clicks']}  "
          f"CTR {pct(pr['ctr'])}  平均排名 {pr['position']:.1f}")
    print(f"  [具名查询]     曝光 {named_impr}  点击 {named_clicks}  "
          f"查询词数 {len(qs)}")
    print(f"  [匿名长尾]     曝光 {anon_impr} ({anon_share}% of total) — GSC 不透露的查询")

    if qs:
        buckets = {"1-3": 0, "4-10": 0, "11-20": 0, "21+": 0}
        for _, _, impr, _, pos in qs:
            k = ("1-3" if pos <= 3 else "4-10" if pos <= 10
                 else "11-20" if pos <= 20 else "21+")
            buckets[k] += impr
        print(f"  具名查询排名分布(按曝光): "
              + "  ".join(f"{k}:{v}" for k, v in buckets.items()))
        top_q = sorted(qs, key=lambda x: x[2], reverse=True)[:8]
        for q, c, i, ct, p in top_q:
            print(f"    曝光{i:>4} 点击{c:>2} 排名{p:>5.1f}  {q}")
    print()
