#!/usr/bin/env python3
"""验证:新写的英文 meta description 是否命中每个 hook 页实际排名的关键词。

meta description 的核心作用是匹配搜索意图。所以"够不够好"的硬指标是:
GSC 里这个页面实际排名的查询词,描述里有没有自然覆盖到。

对每个有 GSC 查询数据的 hook 文档页:
  - 取它按曝光排序的 Top 查询
  - 抽出查询里的"实义词"(去掉 react/use/hook 等停用词)
  - 检查新描述(连同 hook 名 camelCase 拆词)是否包含这些词
  - 汇总覆盖率,并列出未命中的页面

用法: python3 scripts/gsc-desc-coverage.py [天数, 默认 90]
"""
import datetime
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 90
DOCS = Path(__file__).resolve().parent.parent / "packages/website-astro/src/content/docs"
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


# 文件查找表: (category, hookname_lower) -> Path
file_lookup = {}
for p in DOCS.rglob("*.mdx"):
    file_lookup[(p.parent.name, p.stem.lower())] = p

# 停用词:这些词在 hook 文档里无差别出现,不算"命中关键词"
STOP = {"react", "use", "hook", "hooks", "js", "the", "a", "an", "to", "for",
        "in", "of", "and", "or", "on", "with", "is", "how", "example",
        "examples", "docs", "documentation", "tutorial", "guide", "usage",
        "library", "core", "reactuses", "reactuse", ""}

URL_RE = re.compile(r"^https://reactuse\.com/(browser|effect|element|state|integrations)/([^/]+)/$")


def camel_split(name):
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", name).lower()


def tokens(text):
    return set(re.findall(r"[a-z0-9]+", text.lower()))


# 拉 (page, query)
page_q = {}
for r in query(["page", "query"]):
    page, q = r["keys"]
    m = URL_RE.match(page)
    if not m:
        continue
    page_q.setdefault((m.group(1), m.group(2)), []).append(
        (q, r["clicks"], r["impressions"]))

print(f"========== 新描述 vs GSC 实际关键词 覆盖率 ({START} → {END}, {DAYS}天) ==========\n")

full, partial, none_, analyzed = 0, 0, 0, 0
misses = []

for (cat, hook_lower), qs in sorted(page_q.items()):
    path = file_lookup.get((cat, hook_lower))
    if not path:
        continue
    # 读新描述
    fm = path.read_text().split("---", 2)[1]
    desc_m = re.search(r'^description:\s*"?(.+?)"?\s*$', fm, re.M)
    if not desc_m:
        continue
    desc = desc_m.group(1)
    # 描述可命中的 token 池 = 描述本身 + hook 名 camelCase 拆词
    haystack = tokens(desc) | tokens(camel_split(path.stem))

    qs.sort(key=lambda x: x[2], reverse=True)
    top_impr = sum(x[2] for x in qs)
    # 取累计曝光占 80% 的查询,或至少前 3 条
    key_terms = set()
    acc = 0
    for i, (q, c, impr) in enumerate(qs):
        key_terms |= (tokens(q) - STOP)
        acc += impr
        if i >= 2 and acc >= top_impr * 0.8:
            break
    if not key_terms:
        continue
    analyzed += 1
    hit = key_terms & haystack
    missv = key_terms - haystack
    cover = len(hit) / len(key_terms)
    if cover == 1:
        full += 1
    elif cover > 0:
        partial += 1
    else:
        none_ += 1
    if missv:
        misses.append((top_impr, cover, cat, path.stem, sorted(missv),
                       qs[0][0], desc))

print(f"分析了 {analyzed} 个有 GSC 查询数据的 hook 页:")
print(f"  完全覆盖(描述含全部实义关键词): {full}  ({full*100//analyzed}%)")
print(f"  部分覆盖:                      {partial}  ({partial*100//analyzed}%)")
print(f"  完全未命中:                    {none_}  ({none_*100//analyzed}%)\n")

print("【未完全命中的页面 — 按曝光排序】(missing = 描述没覆盖到的查询实义词)")
for top_impr, cover, cat, hook, missv, topq, desc in sorted(misses, reverse=True):
    print(f"  曝光{top_impr:>5} 覆盖{cover*100:>3.0f}%  {cat}/{hook}")
    print(f"    missing: {missv}   | top query: \"{topq}\"")
    print(f"    desc: {desc}")

# 长度分布
print("\n【描述长度分布(全部 113 页)】")
lens = []
for p in DOCS.rglob("*.mdx"):
    fm = p.read_text().split("---", 2)[1]
    m = re.search(r'^description:\s*"?(.+?)"?\s*$', fm, re.M)
    if m:
        lens.append(len(m.group(1)))
lens.sort()
import statistics
print(f"  最短 {lens[0]}  中位数 {statistics.median(lens):.0f}  最长 {lens[-1]}  "
      f"平均 {statistics.mean(lens):.0f}")
in_range = sum(1 for x in lens if 120 <= x <= 160)
print(f"  落在 SEO 推荐区间 120-160 字符: {in_range}/{len(lens)} ({in_range*100//len(lens)}%)")
