#!/usr/bin/env bash
# Characterization + contract tests for the statusline scripts.
#
#   bash tests/run.sh record   # capture current behavior as the golden baseline
#   bash tests/run.sh check    # assert current behavior still matches the baseline
#   bash tests/run.sh          # same as check
#
# Golden-master cases pin the renderer's EXACT bytes and the controller's EXACT
# state-file output across a broad input matrix — the safety net for behavior-
# preserving refactors. Contract cases assert specific guarantees (injection
# blocked, clamping, path boundary, tty fallback) with explicit expectations.
set -u

HERE="${BASH_SOURCE[0]%/*}"; [ "$HERE" = "${BASH_SOURCE[0]}" ] && HERE=.
SCRIPTS="$HERE/../scripts"
CMD="$SCRIPTS/statusline-command.sh"
CTL="$SCRIPTS/statusline-ctl.sh"
GOLDEN="$HERE/golden"
MODE="${1:-check}"
mkdir -p "$GOLDEN"

pass=0; fail=0; fails=()
ok()   { pass=$((pass+1)); }
bad()  { fail=$((fail+1)); fails+=("$1"); echo "FAIL $1${2:+: $2}"; }

# Default state used unless a case overrides it (matches the scripts' compiled defaults).
DEF_STATE=$'THEME=gray\nSTYLE=plain\nLINES=1\nHIDDEN=0\nSHOW_BAR=0\nACCOUNT_LOCAL=1\nSHOW_ACCOUNT=1\nSHOW_RESET=0\nSHOW_WEATHER=0\nICONS=unicode\n'

# render <state> <json> [claudejson]  -> stdout of the renderer (trailing newline trimmed)
# @HOME@ in <json> is replaced with the case's isolated HOME so path segments are testable.
render() {
  local state="$1" json="$2" cj="${3-}" h out
  h=$(mktemp -d); mkdir -p "$h/.claude"
  [ -n "$state" ] && printf '%s' "$state" > "$h/.claude/statusline.state"
  [ -n "$cj" ] && printf '%s' "$cj" > "$h/.claude.json"
  json=${json//@HOME@/$h}
  out=$(printf '%s' "$json" | HOME="$h" bash "$CMD" 2>/dev/null)
  rm -rf "$h"
  printf '%s' "$out"
}

# golden <id> <output>
golden() {
  local id="$1" out="$2" f="$GOLDEN/$1.txt"
  if [ "$MODE" = record ]; then
    printf '%s' "$out" > "$f"
  elif [ -f "$f" ] && [ "$out" = "$(cat "$f")" ]; then
    ok
  else
    bad "$id" "golden mismatch"
    diff <(cat "$f" 2>/dev/null) <(printf '%s' "$out") | sed 's/\x1b/^[/g' | head -6
  fi
}

# grender <id> <state> <json> [claudejson]
grender() { golden "$1" "$(render "$2" "$3" "${4-}")"; }

# with STATE=<k=v ...> overrides applied on top of DEF_STATE
state_with() { # args: key=value ...
  local s="$DEF_STATE" kv k
  for kv in "$@"; do k=${kv%%=*}; s=$(printf '%s' "$s" | sed "s/^$k=.*/$kv/"); done
  printf '%s' "$s"
}

# ── Payloads ────────────────────────────────────────────────────────────────
FULL='{"model":{"display_name":"Claude Fable 5","reasoning_effort":{"level":"xhigh"}},"workspace":{"current_dir":"/tmp/demo"},"context_window":{"used_percentage":42},"cost":{"total_cost_usd":1.23,"total_duration_ms":754000},"rate_limits":{"five_hour":{"used_percentage":12},"seven_day":{"used_percentage":67}}}'
MINIMAL='{"model":{"display_name":"Claude Opus 5"},"workspace":{"current_dir":"/tmp/demo"}}'
CTXONLY='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"context_window":{"used_percentage":72}}'
COSTONLY='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"cost":{"total_cost_usd":9.9}}'
DURONLY='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"cost":{"total_duration_ms":3671000}}'
U5ONLY='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"rate_limits":{"five_hour":{"used_percentage":88}}}'
GAUGES='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"context_window":{"used_percentage":90},"rate_limits":{"five_hour":{"used_percentage":65},"seven_day":{"used_percentage":30}}}'
CLAMP='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"context_window":{"used_percentage":150},"rate_limits":{"five_hour":{"used_percentage":-12},"seven_day":{"used_percentage":240}}}'
BADNUM='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/demo"},"context_window":{"used_percentage":"abc"},"cost":{"total_cost_usd":"x","total_duration_ms":"y"}}'
HOMEPATH='{"model":{"display_name":"X"},"workspace":{"current_dir":"@HOME@/proj/src"}}'
PROJREL='{"model":{"display_name":"X"},"workspace":{"project_dir":"@HOME@/proj","current_dir":"@HOME@/proj/lib/deep"}}'
BOUNDARY='{"model":{"display_name":"X"},"workspace":{"project_dir":"/work/app","current_dir":"/work/application"}}'
CJ='{"oauthAccount":{"emailAddress":"someone@example.com"}}'

# ── Golden matrix: renderer ──────────────────────────────────────────────────
grender full-plain-1 "$(state_with LINES=1)" "$FULL"
grender full-plain-2 "$(state_with LINES=2)" "$FULL"
grender full-plain-3 "$(state_with LINES=3)" "$FULL"
grender full-pl-gray-1    "$(state_with STYLE=powerline THEME=gray LINES=1)"   "$FULL"
grender full-pl-aurora-2  "$(state_with STYLE=powerline THEME=aurora LINES=2)" "$FULL"
grender full-pl-sunset-3  "$(state_with STYLE=powerline THEME=sunset LINES=3)" "$FULL"
grender full-pl-forest-1  "$(state_with STYLE=powerline THEME=forest LINES=1)" "$FULL"
grender full-bar          "$(state_with SHOW_BAR=1)" "$FULL"
grender minimal           "$DEF_STATE" "$MINIMAL"
grender ctx-only          "$DEF_STATE" "$CTXONLY"
grender cost-only         "$DEF_STATE" "$COSTONLY"
grender dur-only          "$DEF_STATE" "$DURONLY"
grender u5-only           "$DEF_STATE" "$U5ONLY"
grender gauges            "$DEF_STATE" "$GAUGES"
grender gauges-bar        "$(state_with SHOW_BAR=1)" "$GAUGES"
grender clamp             "$DEF_STATE" "$CLAMP"
grender badnum            "$DEF_STATE" "$BADNUM"
grender home-path         "$DEF_STATE" "$HOMEPATH"
grender proj-rel          "$DEF_STATE" "$PROJREL"
grender boundary          "$DEF_STATE" "$BOUNDARY"
grender account-local     "$DEF_STATE" "$FULL" "$CJ"
grender account-full      "$(state_with ACCOUNT_LOCAL=0)" "$FULL" "$CJ"
grender account-off       "$(state_with SHOW_ACCOUNT=0)" "$FULL" "$CJ"
grender full-pl-aurora-1  "$(state_with STYLE=powerline THEME=aurora LINES=1)" "$FULL"

# ── Contract: security & correctness ─────────────────────────────────────────

# Arithmetic injection through total_duration_ms must NOT execute and the segment drops.
h=$(mktemp -d); mkdir -p "$h/.claude"
inj='{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp"},"cost":{"total_duration_ms":"x[$(touch @PWN@)]","total_cost_usd":1.2}}'
inj=${inj//@PWN@/$h/PWNED}
out=$(printf '%s' "$inj" | HOME="$h" bash "$CMD" 2>/dev/null)
[ -f "$h/PWNED" ] && bad "inj-exec" "command executed" || ok
case "$out" in *'$1.20'*) ok ;; *) bad "inj-cost-kept" "cost segment missing" ;; esac
case "$out" in *m[0-9]*m*[0-9]s*|*ms*) bad "inj-dur-dropped" "dur segment present" ;; *) ok ;; esac
rm -rf "$h"

# printf '%b' escape injection through the cwd path is neutralized (no raw ESC survives).
escout=$(render "$DEF_STATE" '{"model":{"display_name":"X"},"workspace":{"current_dir":"/tmp/a\\033[31mRED\\c"}}')
case "$escout" in *$'\033''[31m'*) bad "esc-inject" "injected ESC survived" ;; *) ok ;; esac

# 8-bit controls: U+009B is a one-character CSI (C1) and DEL is 0x7f; neither is
# in the \000-\037 range. Through the model name AND the account label (which
# comes from ~/.claude.json, where displayName is user-editable on claude.ai).
h=$(mktemp -d); mkdir -p "$h/.claude"
printf '{"oauthAccount":{"emailAddress":"a\\u009b31m\\u007f@b.c"}}' > "$h/.claude.json"
c1out=$(printf '%s' '{"model":{"display_name":"M\u009b2J\u0085"},"workspace":{"current_dir":"/tmp"}}' \
  | HOME="$h" bash "$CMD" 2>/dev/null)
case "$c1out" in *$'\302\233'*|*$'\302\205'*) bad "c1-inject" "C1 control survived" ;; *) ok ;; esac
case "$c1out" in *$'\177'*) bad "del-inject" "DEL survived" ;; *) ok ;; esac
case "$c1out" in *M2J*) ok ;; *) bad "c1-text-kept" "text around the control was lost" ;; esac
rm -rf "$h"

# A branch name is git output, not jq output, so it can carry a LONE 0x9b byte
# (invalid UTF-8). A cloned repo chooses its default branch name. HEAD is plain
# text, so the byte needs no ref file. Under LC_ALL=C, tr passed it straight to
# the terminal; under UTF-8, tr errored and the branch vanished. Both locales.
h=$(mktemp -d); mkdir -p "$h/.claude"
git init -q "$h/repo" && git -C "$h/repo" -c user.name=t -c user.email=t@t commit -q --allow-empty -m i
printf 'ref: refs/heads/feat\2332Jx\n' > "$h/repo/.git/HEAD"
for loc in C en_US.UTF-8; do
  bout=$(printf '{"model":{"display_name":"X"},"workspace":{"current_dir":"%s","project_dir":"%s"}}' "$h/repo" "$h/repo" \
    | LC_ALL=$loc HOME="$h" bash "$CMD" 2>/dev/null)
  case "$bout" in *$'\233'*) bad "branch-c1-$loc" "lone C1 byte survived" ;; *) ok ;; esac
  case "$bout" in *feat2Jx*) ok ;; *) bad "branch-kept-$loc" "branch segment lost" ;; esac
done
rm -rf "$h"

# Clamp: context 150 -> 100, negative -> 0, 240 -> 100 (compare on ANSI-stripped text,
# since usage segments colour the number separately from its label).
strip_ansi() { sed $'s/\033\\[[0-9;]*m//g'; }
cstrip=$(render "$DEF_STATE" "$CLAMP" | strip_ansi)
case "$cstrip" in *'ctx 100%'*) ok ;; *) bad "clamp-ctx" "context not clamped to 100" ;; esac
case "$cstrip" in *'5h 0%'*)    ok ;; *) bad "clamp-neg" "negative not clamped to 0" ;; esac
case "$cstrip" in *'7d 100%'*)  ok ;; *) bad "clamp-hi"  "240 not clamped to 100" ;; esac

# Path boundary: /work/application is NOT rendered as inside /work/app.
case "$(render "$DEF_STATE" "$BOUNDARY")" in *appication*) bad "boundary" "leaked prefix appication" ;; *application*) ok ;; *) bad "boundary" "unexpected path" ;; esac

# Malformed numerics drop their segments, no diagnostics leak into output.
bo=$(render "$DEF_STATE" "$BADNUM")
case "$bo" in *ctx*) bad "badnum-ctx" "ctx shown for non-number" ;; *) ok ;; esac
case "$bo" in *'$'*) bad "badnum-cost" "cost shown for non-number" ;; *) ok ;; esac

# Hidden state emits exactly one blank line.
h=$(mktemp -d); mkdir -p "$h/.claude"; printf 'HIDDEN=1\n' > "$h/.claude/statusline.state"
n=$(printf '%s' "$MINIMAL" | HOME="$h" bash "$CMD" 2>/dev/null | wc -l | tr -d ' ')
[ "$n" = "1" ] && ok || bad "hidden" "expected 1 line, got $n"
firstline=$(printf '%s' "$MINIMAL" | HOME="$h" bash "$CMD" 2>/dev/null)
[ -z "$firstline" ] && ok || bad "hidden-blank" "line not blank"
rm -rf "$h"

# State file without a trailing newline: the last key still applies.
nonl=$(printf 'STYLE=plain\nACCOUNT_LOCAL=0')   # no trailing \n
case "$(render "$nonl" "$FULL" "$CJ")" in *someone@example.com*) ok ;; *) bad "no-trailing-nl" "last state line ignored" ;; esac

# LINES=auto renders one of the three fixed layouts byte-for-byte (tty-independent).
au=$(render "$(state_with LINES=auto)" "$FULL")
v1=$(render "$(state_with LINES=1)" "$FULL")
v2=$(render "$(state_with LINES=2)" "$FULL")
v3=$(render "$(state_with LINES=3)" "$FULL")
if [ "$au" = "$v1" ] || [ "$au" = "$v2" ] || [ "$au" = "$v3" ]; then ok; else bad "lines-auto" "auto output matches no fixed layout"; fi

# ── Golden matrix + contract: controller ─────────────────────────────────────
# ctl <id> <initial-state> <action>  -> golden the resulting state file AND stdout
ctl() {
  local id="$1" state="$2" action="$3" h so st
  h=$(mktemp -d); mkdir -p "$h/.claude"
  [ -n "$state" ] && printf '%s' "$state" > "$h/.claude/statusline.state"
  so=$(HOME="$h" bash "$CTL" "$action" 2>&1)
  st=$(cat "$h/.claude/statusline.state" 2>/dev/null)
  rm -rf "$h"
  golden "ctl-$id-state" "$st"
  golden "ctl-$id-out" "$so"
}
ctl theme-from-plain  "$DEF_STATE" theme
ctl theme-from-forest "$(state_with STYLE=powerline THEME=forest)" theme
ctl style             "$DEF_STATE" style
ctl lines-from-1      "$DEF_STATE" lines
ctl lines-from-auto   "$(state_with LINES=auto)" lines
ctl lines-from-3      "$(state_with LINES=3)" lines
ctl toggle            "$DEF_STATE" toggle
ctl hide              "$DEF_STATE" hide
ctl show              "$(state_with HIDDEN=1)" show
ctl bar               "$DEF_STATE" bar
ctl account           "$DEF_STATE" account
ctl reset             "$DEF_STATE" reset

# Controller contract: bogus action exits 2, writes usage to stderr, leaves state untouched.
h=$(mktemp -d); mkdir -p "$h/.claude"; printf '%s' "$DEF_STATE" > "$h/.claude/statusline.state"
so_out=$(HOME="$h" bash "$CTL" bogus 2>/dev/null)   # stdout only
so_err=$(HOME="$h" bash "$CTL" bogus 2>&1 >/dev/null) # stderr only
HOME="$h" bash "$CTL" bogus >/dev/null 2>&1; rc=$?
[ "$rc" = 2 ] && ok || bad "ctl-bogus-rc" "exit $rc"
[ -z "$so_out" ] && ok || bad "ctl-bogus-stdout" "usage went to stdout"
case "$so_err" in *usage*) ok ;; *) bad "ctl-bogus-stderr" "no usage on stderr" ;; esac
[ "$(cat "$h/.claude/statusline.state")" = "$(printf '%s' "$DEF_STATE")" ] && ok || bad "ctl-bogus-state" "state changed"
ls "$h/.claude/"statusline.state.?????? >/dev/null 2>&1 && bad "ctl-orphan" "orphan temp left" || ok
rm -rf "$h"

# Controller contract: no trailing newline in the initial state is still parsed.
h=$(mktemp -d); mkdir -p "$h/.claude"; printf 'THEME=gray\nSTYLE=powerline\nLINES=2' > "$h/.claude/statusline.state"
HOME="$h" bash "$CTL" bar >/dev/null 2>&1
grep -q 'LINES=2' "$h/.claude/statusline.state" && ok || bad "ctl-no-nl" "last line dropped"
rm -rf "$h"

# Contract: a repository's config cannot make the renderer run a command
# (core.fsmonitor on index refresh, a textconv driver on diff).
r=$(mktemp -d); h=$(mktemp -d); mkdir -p "$h/.claude"
printf '%s' "$DEF_STATE" > "$h/.claude/statusline.state"
git -C "$r" init -q && printf 'a\n' > "$r/f.txt" && git -C "$r" add f.txt \
  && git -C "$r" -c user.name=t -c user.email=t@example.com commit -qm init
printf 'b\n' >> "$r/f.txt"
git -C "$r" config core.fsmonitor "touch $h/pwned-fsmonitor"
git -C "$r" config diff.evil.textconv "touch $h/pwned-textconv; cat"
printf '*.txt diff=evil\n' > "$r/.gitattributes"
out=$(printf '{"workspace":{"current_dir":"%s","project_dir":"%s"}}' "$r" "$r" | HOME="$h" bash "$CMD" 2>/dev/null)
[ ! -e "$h/pwned-fsmonitor" ] && ok || bad "git-fsmonitor" "repo config ran core.fsmonitor"
[ ! -e "$h/pwned-textconv" ] && ok || bad "git-textconv" "repo config ran a textconv driver"
case "$out" in *+1*) ok ;; *) bad "git-hardened-diff" "diff stat missing: $out" ;; esac
rm -rf "$r" "$h"

# Contract: Token Weather. One HOME across renders, so the history persists.
WX_STATE=${DEF_STATE/SHOW_WEATHER=0/SHOW_WEATHER=1}
h=$(mktemp -d); mkdir -p "$h/.claude"; printf '%s' "$WX_STATE" > "$h/.claude/statusline.state"
wx() { printf '{"session_id":"%s","context_window":{"used_percentage":%s}}' "$1" "$2" | HOME="$h" bash "$CMD" 2>/dev/null | strip_ansi; }
for pc in "10 ☀" "30 ☁" "60 ☂" "80 ☇" "95 ↯"; do
  o=$(wx "icons-${pc% *}" "${pc% *}")
  case "$o" in *"${pc#* } ctx ${pc% *}%"*) ok ;; *) bad "wx-icon-${pc% *}" "$o" ;; esac
done
o=$(wx s1 10); case "$o" in *"ctx 10%"[▁-█]*) bad "wx-first" "sparkline from one reading: $o" ;; *) ok ;; esac
wx s1 10 >/dev/null; o=$(wx s1 40)
case "$o" in *"ctx 40% ▂█"*) ok ;; *) bad "wx-spark" "repeat recorded or bars wrong: $o" ;; esac
for i in $(seq 1 20); do wx s2 "$i" >/dev/null; done
[ "$(wc -w < "$h/.claude/.statusline-weather/s2" | tr -d ' ')" = 12 ] && ok || bad "wx-cap" "history not capped at 12"
# A tampered history file: arithmetic injection and non-numbers are dropped, nothing runs.
printf '%s\n' 'a[$(>'"$h"'/pwned)] 50 999 -3 x 70' > "$h/.claude/.statusline-weather/s3"
o=$(wx s3 90)
[ ! -e "$h/pwned" ] && ok || bad "wx-inject" "history value ran a command"
case "$o" in *"ctx 90% "[▁-█][▁-█][▁-█]) ok ;; *) bad "wx-tampered" "$o" ;; esac
# A session id that is not a plain token keeps no history and writes nowhere.
wx '../../escape' 20 >/dev/null
[ ! -e "$h/escape" ] && [ ! -e "$h/.claude/escape" ] && ok || bad "wx-sid" "session id named a path"
# ICONS=nerd: Nerd Font weather glyphs, as bytes, under the stock macOS bash 3.2 too.
printf '%s' "${WX_STATE/ICONS=unicode/ICONS=nerd}" > "$h/.claude/statusline.state"
for sh in bash /bin/bash; do
  for pc in "10 ee8c8d" "30 ee8c92" "60 ee8c99" "80 ee8c9d" "95 ee8d91"; do
    hex=$(printf '{"context_window":{"used_percentage":%s}}' "${pc% *}" | HOME="$h" "$sh" "$CMD" 2>/dev/null | od -An -tx1 | tr -d ' \n')
    case "$hex" in *"${pc#* }"*) ok ;; *) bad "wx-nerd-$sh-${pc% *}" "glyph bytes missing" ;; esac
  done
done
# Off: no icon, no sparkline.
printf '%s' "$DEF_STATE" > "$h/.claude/statusline.state"
o=$(wx s1 40); [ "$o" = "~ > Claude > ctx 40%" ] && ok || bad "wx-off" "$o"
rm -rf "$h"

# Controller contract: status reports every setting and writes nothing.
h=$(mktemp -d); mkdir -p "$h/.claude"; printf '%s' "$DEF_STATE" > "$h/.claude/statusline.state"
before=$(cat "$h/.claude/statusline.state")
so=$(HOME="$h" bash "$CTL" status 2>/dev/null); rc=$?
[ "$rc" = 0 ] && ok || bad "ctl-status-rc" "exit $rc"
[ "$so" = "status line → look=plain · lines=1 · visible · bar=off · account=name · reset=off · weather=off · icons=unicode" ] && ok || bad "ctl-status-out" "$so"
[ "$(cat "$h/.claude/statusline.state")" = "$before" ] && ok || bad "ctl-status-write" "status changed the state file"
rm -rf "$h"

# ── Summary ──────────────────────────────────────────────────────────────────
if [ "$MODE" = record ]; then
  echo "recorded $(ls "$GOLDEN" | wc -l | tr -d ' ') golden files; contract asserts run: pass=$pass fail=$fail"
  [ "$fail" -eq 0 ] || { printf '  %s\n' "${fails[@]}"; exit 1; }
  exit 0
fi
echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ] || { echo "failed:"; printf '  %s\n' "${fails[@]}"; exit 1; }
