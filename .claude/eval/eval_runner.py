#!/usr/bin/env python3
"""
ReactUse prompt-eval runner.

The runnable analog of Chromium's `agents/testing/eval_prompts.py`, sized for this repo and
driven by Claude Code headless (`claude -p`) instead of the Gemini CLI. Stdlib only — no pip
install. Live runs spawn real Claude Code sessions and cost tokens, so you start them.

Per eval case under `.claude/eval/<case>/` (a dir containing `prompt.md`):
  1. Spin up an isolated git worktree (Chromium uses btrfs snapshots; a worktree is the
     portable analog) so runs never touch your working tree.
  2. Overlay the prompt system (`.claude/` + `CLAUDE.md`) from the version under test — your
     working tree by default, or a git ref via --baseline — so *uncommitted* prompt edits are
     actually exercised.
  3. Run `claude -p` on the case's `prompt.md`, capturing tool calls + the resulting git diff.
  4. Score the run against `assert.json` (machine assertions mirroring Chromium's
     check_files_changed / check_file_content / check_tool_used_with_args_match).
  5. Optionally run the case's shell checks (--run-tests) and/or an LLM judge vs `eval.md`
     (--judge).
  6. Repeat K times for Pass@K, and print an A/B table when --baseline is given.

Examples:
  python3 .claude/eval/eval_runner.py --list
  python3 .claude/eval/eval_runner.py --self-test          # validate the assertion engine, no LLM
  python3 .claude/eval/eval_runner.py add_hook             # run one case (spends tokens)
  python3 .claude/eval/eval_runner.py --repeat 3 --pass-threshold 2
  python3 .claude/eval/eval_runner.py --baseline HEAD~1    # A/B: committed prompts vs working tree
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent
REPO = EVAL_DIR.parent.parent
# Prompt-system files overlaid into each run. Add to this if the agent's behavior starts
# depending on another always-loaded file.
PROMPT_PATHS = [".claude", "CLAUDE.md"]
# node_modules dirs symlinked into the worktree when --run-tests is set (pnpm workspace).
NODE_MODULES_PATHS = ["", "packages/core", "packages/website-astro"]


def sh(args, cwd=None, check=False, capture=True, env=None):
    return subprocess.run(
        args, cwd=cwd, check=check, env=env,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
        text=True,
    )


# --------------------------------------------------------------------------- discovery

def discover_cases(names):
    cases = []
    for d in sorted(EVAL_DIR.iterdir()):
        if not d.is_dir() or d.name in {"results", "__pycache__"}:
            continue
        if not (d / "prompt.md").exists():
            continue
        if names and d.name not in names:
            continue
        cases.append(d)
    return cases


def load_assert(case_dir):
    f = case_dir / "assert.json"
    if not f.exists():
        return {}
    return json.loads(f.read_text())


# ------------------------------------------------------------------------ assertions

@dataclass
class Check:
    name: str
    passed: bool
    detail: str = ""


def run_assertions(spec, changed: set[str], read_file, tool_blob: str) -> list[Check]:
    """Pure assertion engine. `read_file(path) -> str|None`; `changed` = changed repo-rel paths;
    `tool_blob` = stringified tool calls. Returns one Check per assertion."""
    checks: list[Check] = []

    for path in spec.get("files_changed", []):
        ok = path in changed
        checks.append(Check(f"files_changed: {path}", ok,
                            "" if ok else "not created/modified"))

    for rule in spec.get("file_content", []):
        path = rule["path"]
        content = read_file(path)
        if content is None:
            checks.append(Check(f"file_content: {path}", False, "file missing"))
            continue
        missing = [s for s in rule.get("present", []) if s not in content]
        leaked = [s for s in rule.get("absent", []) if s in content]
        ok = not missing and not leaked
        detail = ""
        if missing:
            detail += f"missing {missing} "
        if leaked:
            detail += f"should-be-absent {leaked}"
        checks.append(Check(f"file_content: {path}", ok, detail.strip()))

    for pat in spec.get("tools_required", []):
        ok = re.search(pat, tool_blob) is not None
        checks.append(Check(f"tools_required: /{pat}/", ok,
                            "" if ok else "no matching tool call"))

    for pat in spec.get("tools_forbidden", []):
        ok = re.search(pat, tool_blob) is None
        checks.append(Check(f"tools_forbidden: /{pat}/", ok,
                            "" if ok else "forbidden tool call was made"))

    return checks


# ---------------------------------------------------------------------- agent driver

def parse_stream_json(stdout: str):
    """Parse `claude -p --output-format stream-json --verbose` output.
    Returns (result_text, tool_calls[list of dict])."""
    result_text, tools = "", []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        etype = ev.get("type")
        if etype == "assistant":
            for block in ev.get("message", {}).get("content", []):
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    tools.append({"name": block.get("name", ""),
                                  "input": block.get("input", {})})
        elif etype == "result":
            result_text = ev.get("result", "") or result_text
    return result_text, tools


def make_worktree(stack):
    wt = Path(tempfile.mkdtemp(prefix="ru-eval-"))
    shutil.rmtree(wt)  # git worktree add wants a non-existent path
    sh(["git", "worktree", "add", "--detach", str(wt), "HEAD"], cwd=REPO, check=True)
    stack.append(("worktree", wt))
    return wt


def overlay_prompts(wt: Path, baseline_ref: str | None):
    """Put the prompt-system version under test into the worktree."""
    if baseline_ref:
        # committed baseline: check the prompt files out of the given ref
        for p in PROMPT_PATHS:
            r = sh(["git", "checkout", baseline_ref, "--", p], cwd=wt)
            if r.returncode != 0:
                print(f"  ! baseline {baseline_ref} lacks '{p}' "
                      f"(commit the agent system to get a real A/B baseline)")
    else:
        # variant: copy from the live working tree (captures uncommitted edits)
        for p in PROMPT_PATHS:
            src, dst = REPO / p, wt / p
            if not src.exists():
                continue
            if dst.exists():
                shutil.rmtree(dst) if dst.is_dir() else dst.unlink()
            shutil.copytree(src, dst) if src.is_dir() else shutil.copy2(src, dst)


def link_node_modules(wt: Path):
    for p in NODE_MODULES_PATHS:
        src, dst = REPO / p / "node_modules", wt / p / "node_modules"
        try:
            if src.exists() and not dst.exists():
                dst.parent.mkdir(parents=True, exist_ok=True)
                os.symlink(src, dst)
        except OSError as e:
            print(f"  ! could not link {p}/node_modules ({e}); tests may fail")


def changed_files(wt: Path) -> set[str]:
    out = sh(["git", "status", "--porcelain"], cwd=wt).stdout
    paths = set()
    for line in out.splitlines():
        if len(line) > 3:
            paths.add(line[3:].strip().strip('"'))
    return paths


def run_agent(wt: Path, prompt: str, model: str | None, max_turns: int) -> tuple[str, list]:
    cmd = ["claude", "-p", prompt,
           "--output-format", "stream-json", "--verbose",
           "--permission-mode", "bypassPermissions",
           "--max-turns", str(max_turns)]
    if model:
        cmd += ["--model", model]
    proc = sh(cmd, cwd=wt)
    if proc.returncode != 0 and not proc.stdout:
        print(f"  ! claude exited {proc.returncode} with no output. Is the CLI installed/auth'd?")
    return parse_stream_json(proc.stdout)


def run_commands(spec, wt: Path, run_tests: bool) -> list[Check]:
    checks = []
    for cmd in spec.get("commands", []):
        if cmd.get("requires") == "run-tests" and not run_tests:
            continue
        r = sh(["bash", "-lc", cmd["run"]], cwd=wt)
        ok = r.returncode == cmd.get("expect_exit", 0)
        checks.append(Check(f"command: {cmd['run']}", ok,
                            "" if ok else f"exit {r.returncode}"))
    return checks


# --------------------------------------------------------------------------- judge

JUDGE_TEMPLATE = """You are grading an AI coding agent's attempt at a task, against a rubric.

== TASK GIVEN TO THE AGENT ==
{prompt}

== RUBRIC (eval.md) ==
{rubric}

== AGENT'S FINAL MESSAGE ==
{result}

== FILES THE AGENT CHANGED ==
{diff}

Judge ONLY against the rubric's "Must do" / "Must not" items. Reply with a single JSON object:
{{"pass": true|false, "reason": "<one sentence>"}}"""


def judge(case_dir, prompt, result, diff, model):
    rubric = (case_dir / "eval.md").read_text() if (case_dir / "eval.md").exists() else ""
    msg = JUDGE_TEMPLATE.format(prompt=prompt, rubric=rubric, result=result, diff=diff[:6000])
    cmd = ["claude", "-p", msg, "--output-format", "json"]
    if model:
        cmd += ["--model", model]
    out = sh(cmd).stdout
    try:
        text = json.loads(out).get("result", out)
        m = re.search(r"\{.*\}", text, re.DOTALL)
        verdict = json.loads(m.group(0)) if m else {"pass": False, "reason": "unparseable"}
    except Exception:
        verdict = {"pass": False, "reason": "judge output unparseable"}
    return Check("llm_judge", bool(verdict.get("pass")), verdict.get("reason", ""))


# ----------------------------------------------------------------------------- run

@dataclass
class RunResult:
    case: str
    version: str
    iteration: int
    checks: list[Check] = field(default_factory=list)

    @property
    def passed(self):
        return bool(self.checks) and all(c.passed for c in self.checks)


def run_case(case_dir, version_label, baseline_ref, args) -> RunResult:
    spec = load_assert(case_dir)
    prompt = (case_dir / "prompt.md").read_text()
    res = RunResult(case_dir.name, version_label, 0)
    stack = []
    try:
        wt = make_worktree(stack)
        overlay_prompts(wt, baseline_ref)
        if args.run_tests:
            link_node_modules(wt)
        result_text, tools = run_agent(wt, prompt, args.model, args.max_turns)
        changed = changed_files(wt)
        tool_blob = json.dumps(tools)

        def read_file(p):
            f = wt / p
            return f.read_text() if f.exists() else None

        res.checks += run_assertions(spec, changed, read_file, tool_blob)
        res.checks += run_commands(spec, wt, args.run_tests)
        if args.judge:
            diff = sh(["git", "diff", "HEAD"], cwd=wt).stdout
            res.checks.append(judge(case_dir, prompt, result_text, diff, args.model))
    finally:
        for kind, wt in reversed(stack):
            if kind == "worktree" and not args.keep_worktrees:
                sh(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
    return res


# --------------------------------------------------------------------------- report

def print_run(res: RunResult):
    mark = "PASS" if res.passed else "FAIL"
    print(f"  [{mark}] {res.version} #{res.iteration}")
    for c in res.checks:
        print(f"      {'ok ' if c.passed else 'XX '} {c.name}"
              + (f"  — {c.detail}" if c.detail and not c.passed else ""))


def self_test():
    """Validate the assertion engine with synthetic data — no LLM, no network."""
    spec = {
        "files_changed": ["a.ts", "missing.ts"],
        "file_content": [
            {"path": "a.ts", "present": ["export const useX"], "absent": ["pnpm newHook"]},
            {"path": "a.ts", "present": ["NOT THERE"]},
        ],
        "tools_required": ["test"],
        "tools_forbidden": ["newHook"],
    }
    changed = {"a.ts"}
    files = {"a.ts": "export const useX = () => {}\n"}
    checks = run_assertions(spec, changed, lambda p: files.get(p), '[{"name":"Bash","input":{"command":"pnpm test useX"}}]')
    expected = {
        "files_changed: a.ts": True,
        "files_changed: missing.ts": False,
        "tools_required: /test/": True,
        "tools_forbidden: /newHook/": True,
    }
    by_name = {c.name: c.passed for c in checks}
    ok = True
    for name, want in expected.items():
        got = by_name.get(name)
        status = "ok " if got == want else "XX "
        if got != want:
            ok = False
        print(f"  {status} {name}: got {got}, want {want}")
    # the two file_content checks: first passes, second fails (missing substring)
    fc = [c for c in checks if c.name == "file_content: a.ts"]
    fc_ok = len(fc) == 2 and fc[0].passed and not fc[1].passed
    print(f"  {'ok ' if fc_ok else 'XX '} file_content pass+fail pair")
    ok = ok and fc_ok
    print("\nself-test:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description="ReactUse prompt-eval runner")
    ap.add_argument("cases", nargs="*", help="case names (default: all)")
    ap.add_argument("--list", action="store_true", help="list cases + assertions, then exit")
    ap.add_argument("--self-test", action="store_true", help="validate the assertion engine (no LLM)")
    ap.add_argument("--repeat", type=int, default=1, help="runs per case (Pass@K)")
    ap.add_argument("--pass-threshold", type=int, default=1, help="passes needed out of --repeat")
    ap.add_argument("--baseline", metavar="REF", help="also run prompts from this git ref, for an A/B")
    ap.add_argument("--model", help="model override passed to claude -p")
    ap.add_argument("--max-turns", type=int, default=50)
    ap.add_argument("--run-tests", action="store_true", help="execute each case's shell checks (symlinks node_modules)")
    ap.add_argument("--judge", action="store_true", help="grade vs eval.md with an LLM judge")
    ap.add_argument("--keep-worktrees", action="store_true", help="don't auto-remove worktrees (debug)")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    cases = discover_cases(args.cases)
    if not cases:
        print("no eval cases found")
        return 1

    if args.list:
        for c in cases:
            spec = load_assert(c)
            n = sum(len(spec.get(k, [])) for k in
                    ("files_changed", "file_content", "tools_required", "tools_forbidden", "commands"))
            judge_note = "" if (c / "eval.md").exists() else " (no eval.md)"
            print(f"  {c.name:20} {n} assertions{judge_note}")
        return 0

    versions = [("variant", None)]
    if args.baseline:
        versions.insert(0, (f"baseline:{args.baseline}", args.baseline))

    summary = {}  # (case, version) -> passes
    for c in cases:
        print(f"\n=== {c.name} ===")
        for label, ref in versions:
            passes = 0
            for i in range(args.repeat):
                res = run_case(c, label, ref, args)
                res.iteration = i
                print_run(res)
                passes += int(res.passed)
            summary[(c.name, label)] = passes

    print("\n================ SUMMARY (Pass@{}) ================".format(args.repeat))
    for (case, label), passes in summary.items():
        verdict = "PASS" if passes >= args.pass_threshold else "FAIL"
        print(f"  {case:20} {label:22} {passes}/{args.repeat}  {verdict}")
    if args.baseline:
        print("\n(A/B: compare baseline vs variant rows above — a drop is a regression.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
