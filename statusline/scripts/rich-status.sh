#!/usr/bin/env bash
# Claude Code statusLine — smooth truecolor powerline (Ghostty / 24-bit)
#
# Segments, each shown only when it has data, grouped for multi-line layouts:
#   group A:  cwd | git branch ↑↓ | git diff +ins -del ?untracked
#   group B:  model · effort | weather ctx % | time · $cost
#   group C:  account | 5h% · 7d% usage
#
# STYLE=powerline → filled gradient backgrounds + solid  arrows
# STYLE=plain     → no background, dim ">" separators (colors tuned for dark terminals)
# LINES=1 → A B C on one line · LINES=2 → (A B) / C · LINES=3 → A / B / C
#   (Claude Code doesn't pass terminal width, so more lines is the reliable way to fit long paths.)
#
# Toggles (defaults below; overridden live by ~/.claude/rich-status.state via /sl-* shortcuts):
#   THEME=aurora|sunset|forest|gray · STYLE=powerline|plain · LINES=1|2|3 · HIDDEN=0|1
#   SHOW_BAR=0|1 · SHOW_ACCOUNT=0|1 · ACCOUNT_LOCAL=0|1 · SHOW_RESET=0|1 · SHOW_WEATHER=0|1

# Ensure Homebrew/system tooling is found when Claude Code runs this non-interactively.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
# jq always emits JSON numbers with a "." decimal; force C so printf/arithmetic agree in any locale.
export LC_NUMERIC=C
# Native jq.exe under Git Bash on Windows (OSTYPE msys or cygwin, depending on the Git for
# Windows build; cygwin on 2.55) writes CRLF line endings. The stray \r
# breaks `read`, arithmetic, and printf %f downstream. --binary makes it write plain LF.
case "${OSTYPE:-}" in msys*|cygwin*) jq() { command jq --binary "$@"; } ;; esac

# Shared state schema (defaults + parser), loaded from next to this script.
_sl_dir="${BASH_SOURCE[0]%/*}"; [ "$_sl_dir" = "${BASH_SOURCE[0]}" ] && _sl_dir=.
. "$_sl_dir/rich-status-lib.sh"

input=$(cat)
jqr()   { printf '%s' "$input" | jq -r "$1" 2>/dev/null; }
# strip: drop newlines/tabs AND backslashes and other C0 control bytes, so external
# display strings (path, branch, model, effort, account) cannot inject escapes or
# truncation through the final `printf '%b'`.
# C0 alone was not enough: DEL (0x7f) and the C1 range U+0080–U+009F also reach
# the terminal, and U+009B is a one-character CSI. Three stages, all byte-wise
# (LC_ALL=C) so the result does not depend on the caller's locale:
#   1. iconv -c drops invalid UTF-8. jq output is always valid, but the branch
#      name is git output and may hold a LONE 0x9b — under LC_ALL=C, tr passed
#      it to the terminal; under UTF-8, tr errored and the segment vanished.
#   2. tr removes backslash, C0 and DEL.
#   3. sed removes C1, which in valid UTF-8 is always the two bytes \302\200-\237,
#      so no other multibyte character is touched.
_sl_c1=$(printf '\302[\200-\237]')
strip() {
  printf '%s' "$1" | LC_ALL=C iconv -f UTF-8 -t UTF-8 -c 2>/dev/null \
    | LC_ALL=C tr -d '\\\000-\037\177' | LC_ALL=C sed "s/$_sl_c1//g"
}

# ── Parse all seven numeric fields in ONE jq call ───────────────────────────
# The renderer runs on every status update, so the numerics are read in a single
# fork rather than one per field. Each still passes through `numbers`, so a
# non-number yields an empty line and can never reach bash arithmetic or numeric
# printf — the exact type guard the per-field parse had. Numbers contain no spaces
# or newlines, so newline-joining and reading line-by-line is unambiguous. The
# free-form string fields (paths, model, effort) stay on jqr: their values can
# contain spaces, so bundling them safely would need fragile encoding for no real
# additional gain.
{
  IFS= read -r ctx
  IFS= read -r cost
  IFS= read -r dur
  IFS= read -r u5
  IFS= read -r u7
  IFS= read -r r5
  IFS= read -r r7
# `numbers` guards the TYPE but not the MAGNITUDE or the FORM. A valid JSON
# number can sit far outside int64, and jq renders anything very large or very
# small in scientific notation — so `1e+30` and `1E-20` both reach
# `$(( ms / 1000 ))` and raise a bash arithmetic error, while the `-gt 100`
# clamps silently fail their own test and leave the raw value on screen.
# Clamping fixes the magnitude; `floor` fixes the form, and is what keeps a
# small-but-legal `1E-20` out of bash arithmetic. The two fields that feed
# `$(( ))` directly (duration, reset epochs) are floored to integers; the
# percentages and the cost only ever reach printf, which handles any form.
# `floor` matches the `${dur%.*}` truncation this replaced, so in-range values
# render exactly as before.
} < <(printf '%s' "$input" | jq -r '
  def clamp(lo; hi): if . < lo then lo elif . > hi then hi else . end;
  ((.context_window.used_percentage        | numbers | clamp(0; 100))                   // ""),
  ((.cost.total_cost_usd                    | numbers | clamp(0; 1000000000))            // ""),
  ((.cost.total_duration_ms                 | numbers | clamp(0; 315360000000)  | floor) // ""),
  ((.rate_limits.five_hour.used_percentage  | numbers | clamp(0; 100))                   // ""),
  ((.rate_limits.seven_day.used_percentage  | numbers | clamp(0; 100))                   // ""),
  ((.rate_limits.five_hour.resets_at        | numbers | clamp(0; 1000000000000) | floor) // ""),
  ((.rate_limits.seven_day.resets_at        | numbers | clamp(0; 1000000000000) | floor) // "")
' 2>/dev/null)

# ── Options ─────────────────────────────────────────────────────────
# Defaults + state overlay live in rich-status-lib.sh (shared with the controller).
sl_load_state
[ "$HIDDEN" = "1" ] && { printf '\n'; exit 0; }

case "$THEME" in
  aurora) SR=30; SG=42; SB=74;  ER=82; EG=48; EB=79 ;;   # #1e2a4a → #52304f
  sunset) SR=36; SG=31; SB=66;  ER=94; EG=48; EB=64 ;;   # #241f42 → #5e3040
  forest) SR=22; SG=58; SB=52;  ER=44; EG=58; EB=85 ;;   # #163a34 → #2c3a55
  *)      SR=74; SG=74; SB=74;  ER=30; EG=30; EB=30 ;;   # gray #4a4a4a → #1e1e1e
esac

# Foreground colors "R;G;B" — color = meaning (tuned for a dark terminal ground)
FG="229;233;240"
ACCOUNT_FG="208;135;112"; DIR_FG="136;192;208"; MODEL_FG="197;168;216"; EFFORT_FG="150;140;185"
CLEAN_FG="163;190;140"; DIRTY_FG="236;196;135"
AHEAD_FG="163;190;140"; BEHIND_FG="236;196;135"; UNTRACKED_FG="154;165;196"
LO_FG="163;190;140"; MID_FG="236;196;135"; HI_FG="224;108;117"
COST_FG="235;203;139"; TIME_FG="154;165;196"
ADD_FG="163;190;140"; DEL_FG="224;108;117"
SEP_DIM="96;104;122"

SEP=$(printf '\356\202\260')       # U+E0B0 solid powerline separator (STYLE=powerline)
PLAIN_SEP=">"                       # separator for STYLE=plain — plain char, colored via SEP_DIM
EMPTY_TREE=4b825dc642cb6eb9a060e54bf8d69288fbee4904

# ── Helpers ─────────────────────────────────────────────────────────
# Weighted average of start/end by t∈[0,100]; the numerator stays non-negative so
# rounding is symmetric whether the channel rises or falls between start and end.
lerp() { echo $(( ( $1 * (100 - $3) + $2 * $3 + 50 ) / 100 )); }
gauge_fg() {
  if   [ "${1:-0}" -ge 85 ] 2>/dev/null; then echo "$HI_FG"
  elif [ "${1:-0}" -ge 60 ] 2>/dev/null; then echo "$MID_FG"
  else echo "$LO_FG"; fi
}
# Round a percentage to an integer in [0,100]. Shared by the context gauge and
# the rate-limit segments so the two cannot drift apart in how they validate.
pct_norm() {
  local p; p=$(printf '%.0f' "${1:-0}" 2>/dev/null) || p=0
  [ "$p" -gt 100 ] 2>/dev/null && p=100
  [ "$p" -lt 0 ] 2>/dev/null && p=0
  printf '%s' "$p"
}
mk_bar() {
  local p=${1:-0} cells=8 f i out=""
  [ "$p" -gt 100 ] 2>/dev/null && p=100; [ "$p" -lt 0 ] 2>/dev/null && p=0
  f=$(( (p * cells + 50) / 100 ))
  for ((i=0; i<f; i++));     do out+="█"; done
  for ((i=f; i<cells; i++)); do out+="░"; done
  printf '%s' "$out"
}
fmt_dur() {
  local ms=${1:-0} s; s=$(( ms / 1000 ))
  if   [ "$s" -lt 60 ];   then printf '%ds' "$s"
  elif [ "$s" -lt 3600 ]; then printf '%dm' "$(( s / 60 ))"
  else printf '%dh%dm' "$(( s / 3600 ))" "$(( (s % 3600) / 60 ))"; fi
}
fmt_reset() {
  local now s d h; now=$(date +%s 2>/dev/null || echo 0)
  s=$(( ${1:-0} - now )); [ "$s" -lt 0 ] && s=0
  d=$(( s / 86400 )); h=$(( (s % 86400) / 3600 ))
  if [ "$d" -gt 0 ]; then printf '%dd%dh' "$d" "$h"; else printf '%dh' "$h"; fi
}
# Every git call is bounded. CC kills the whole status line at 5s and
# renders a BLANK line with no explanation, so a slow repo (huge worktree,
# cold cache, network filesystem) silently costs you the status line
# entirely. Better to drop the git segment and keep the rest.
#
# `timeout` is GNU coreutils and absent on stock macOS; perl is not. The
# alarm wrapper is the portable form.
#
# GIT_BUDGET bounds ONE call, but a dirty repo runs up to eight of them
# (is-inside-work-tree, symbolic-ref, rev-parse @{u}, rev-list, rev-parse HEAD,
# diff, ls-files). Per-call bounding therefore allowed ~16s in the exact
# situation it exists to protect against, blowing CC's 5s kill and producing the
# blank status line anyway. GIT_TOTAL is the deadline for the whole collection:
# each call gets whatever is left, and once it is gone the rest fail fast.
#
# GIT_TOTAL is 3, not 4, because the deadline has whole-second granularity: a
# call that starts with 1s left may still run that full second, so the true
# worst case is GIT_TOTAL+1. Three keeps that under CC's 5s kill with room for
# the rest of the render. Note the last-resort `_bounded` below cannot bound a
# single call at all when neither `timeout` nor `perl` exists — there is no
# portable primitive for it — but the deadline still stops the REMAINING calls
# once the budget is gone.
GIT_BUDGET=${GIT_BUDGET:-2}
GIT_TOTAL=${GIT_TOTAL:-3}
# Both come from the environment and GIT_TOTAL feeds $(( )), where bash runs a
# crafted value such as a[$(cmd)]. Anything but 1-60 whole seconds is the default.
case "$GIT_BUDGET" in [1-9]|[1-5][0-9]|60) ;; *) GIT_BUDGET=2 ;; esac
case "$GIT_TOTAL" in [1-9]|[1-5][0-9]|60) ;; *) GIT_TOTAL=3 ;; esac
if command -v timeout >/dev/null 2>&1; then
  _bounded() { local s=$1; shift; timeout "$s" "$@"; }
elif command -v perl >/dev/null 2>&1; then
  _bounded() { local s=$1; shift; perl -e 'alarm shift; exec @ARGV' "$s" "$@"; }
else
  _bounded() { shift; "$@"; }
fi
# $EPOCHSECONDS is a bash 5 builtin — free. Older bash pays one fork per check.
_now() { if [ -n "${EPOCHSECONDS:-}" ]; then printf '%s' "$EPOCHSECONDS"; else date +%s 2>/dev/null || echo 0; fi; }
_git_deadline=0
git_c() {
  local budget=$GIT_BUDGET left
  if [ "$_git_deadline" -gt 0 ]; then
    left=$(( _git_deadline - $(_now) ))
    [ "$left" -le 0 ] && return 124                      # budget spent — fail like a timeout
    [ "$left" -lt "$budget" ] && budget=$left
  fi
  # No fsmonitor command from the repository's config: a status read must run nothing but git.
  _bounded "$budget" git --no-optional-locks -c core.fsmonitor=false -C "$current_dir" "$@" 2>/dev/null
}
acct_label() {
  local cache="$HOME/.claude/.rich-status-account" src="$HOME/.claude.json" ttl=180 now mt age
  now=$(date +%s 2>/dev/null || echo 0)
  # Cache by existence + mtime, not by content: an empty file is a valid negative
  # cache (API-key users have no account) and must be honored for its full TTL
  # instead of re-running jq on every render.
  # GNU `stat -c %Y` first (Linux, Git Bash on Windows), then BSD `stat -f %m` (macOS). The
  # order matters: GNU stat reads `-f %m` as "file-system info for a file named %m" and prints
  # a multi-line report for $cache, which the arithmetic below cannot parse. BSD stat rejects
  # `-c` with no stdout, so macOS falls through cleanly. Anything non-numeric means "stale".
  if [ -f "$cache" ]; then
    mt=$(stat -c %Y "$cache" 2>/dev/null || stat -f %m "$cache" 2>/dev/null || echo 0)
    case "$mt" in ''|*[!0-9]*) mt=0 ;; esac
    age=$(( now - mt ))
  else age=$ttl; fi
  if [ ! -f "$cache" ] || [ "$age" -ge "$ttl" ]; then
    # jq runs BEFORE the temp file exists, and the temp file lives in $TMPDIR.
    # CC kills a slow render mid-flight; writing jq straight into "$cache.$$"
    # left one orphan in ~/.claude per kill (50 had piled up by 2026-10-05).
    # Now the kill window is one printf, and an orphan lands where the OS sweeps.
    local val tmp
    if val=$(jq -r '.oauthAccount.emailAddress // .oauthAccount.displayName // empty' \
               "$src" 2>/dev/null) \
       && tmp=$(mktemp "${TMPDIR:-/tmp}/rich-status-account.XXXXXX" 2>/dev/null); then
      [ -n "$val" ] && val="$val"$'\n'
      { printf '%s' "$val" > "$tmp" && mv "$tmp" "$cache"; } 2>/dev/null || rm -f "$tmp"
    fi
  fi
  strip "$(cat "$cache" 2>/dev/null)"
}

# ── Segments: add <group 1|2|3> <text> ──────────────────────────────────
seg_row=(); seg_txt=()
add() { seg_row+=("$1"); seg_txt+=("$2"); }

# ── group A: cwd ──────────────────────────────────────────────────────
project_dir=$(jqr '.workspace.project_dir // ""')
current_dir=$(jqr '.workspace.current_dir // .cwd // ""')
# Match only on a path-component boundary: current_dir must equal project_dir or sit
# below it. A raw prefix test would put /work/application "inside" /work/app.
pd="${project_dir%/}"; rest="${current_dir#"$pd"}"
if [ -n "$pd" ] && { [ "$current_dir" = "$pd" ] || [ "$rest" != "$current_dir" ] && [ "${rest#/}" != "$rest" ]; }; then
  dirtext="$(basename -- "$pd")${rest}"
else
  case "$current_dir" in
    "$HOME")   dirtext="~" ;;
    "$HOME"/*) dirtext="~${current_dir#"$HOME"}" ;;
    *)         dirtext="$current_dir" ;;
  esac
fi
dirtext=$(strip "$dirtext"); [ -z "$dirtext" ] && dirtext="~"
add 1 "\033[38;2;${DIR_FG}m${dirtext}"

# ── group A: git branch + diff stat ───────────────────────────────────
[ -n "$current_dir" ] && _git_deadline=$(( $(_now) + GIT_TOTAL ))
if [ -n "$current_dir" ] && git_c rev-parse --is-inside-work-tree >/dev/null; then
  branch=$(strip "$(git_c symbolic-ref --short HEAD || git_c rev-parse --short HEAD)")
  ahead=0; behind=0
  if git_c rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null; then
    # Captured before the read for the same reason as the diff below: consuming
    # rev-list through a pipe discards its exit status, so a timeout arrives
    # looking exactly like a genuine "0 0" and quietly claims in-sync. On
    # failure leave both at 0, which omits the markers rather than inventing one.
    counts=$(git_c rev-list --left-right --count 'HEAD...@{u}'); rlrc=$?
    if [ "$rlrc" -eq 0 ]; then
      read -r ahead behind <<< "$counts"
      ahead=${ahead:-0}; behind=${behind:-0}
    fi
  fi
  # Exit 1 means HEAD genuinely does not resolve (unborn branch) and diffing
  # against the empty tree is right. Anything else is a timeout or a broken
  # repo, where the empty tree would report every tracked file as inserted —
  # "+48000" on a slow repo. Leave dbase empty and skip the diff instead.
  git_c rev-parse -q --verify HEAD >/dev/null; hrc=$?
  case $hrc in
    0) dbase=HEAD ;;
    1) dbase=$EMPTY_TREE ;;
    *) dbase="" ;;
  esac
  # Each dirty-state probe is captured BEFORE any pipeline, because `| awk` and
  # `| wc -l` both swallow git's exit status and turn a timeout into a confident
  # "0" — i.e. a clean-looking repo that is merely unmeasured. dirty_known
  # records whether we actually learned anything.
  ins=0; del=0; untracked=0; dirty_known=1
  if [ -n "$dbase" ]; then
    # Nor an external diff or textconv driver the repository names.
    numstat=$(git_c diff --no-ext-diff --no-textconv --numstat "$dbase"); drc=$?
    if [ "$drc" -eq 0 ]; then
      read -r ins del < <(printf '%s\n' "$numstat" \
          | awk 'BEGIN{a=0;d=0}{if($1!="-")a+=$1; if($2!="-")d+=$2}END{print a" "d}')
      ins=${ins:-0}; del=${del:-0}
    else
      dirty_known=0
    fi
  else
    dirty_known=0
  fi
  ulist=$(git_c ls-files --others --exclude-standard); urc=$?
  if [ "$urc" -eq 0 ]; then
    [ -n "$ulist" ] && untracked=$(printf '%s\n' "$ulist" | wc -l | tr -d ' ')
    untracked=${untracked:-0}
  else
    dirty_known=0
  fi

  # Only claim clean/dirty when the probes succeeded; otherwise stay neutral
  # rather than paint a green branch over an unmeasured worktree.
  if [ "$dirty_known" -eq 0 ]; then bcol=$FG
  elif [ $(( ins + del + untracked )) -gt 0 ]; then bcol=$DIRTY_FG
  else bcol=$CLEAN_FG; fi
  # An empty branch means both name probes failed (bounded out). Emitting the
  # segment anyway paints a coloured blank between two separators.
  if [ -n "$branch" ]; then
    gtext="\033[38;2;${bcol}m${branch}\033[38;2;${FG}m"
    [ "$ahead"  -gt 0 ] 2>/dev/null && gtext+=" \033[38;2;${AHEAD_FG}m↑$ahead\033[38;2;${FG}m"
    [ "$behind" -gt 0 ] 2>/dev/null && gtext+=" \033[38;2;${BEHIND_FG}m↓$behind\033[38;2;${FG}m"
    add 1 "$gtext"
  fi

  dtext=""
  if [ "$ins" -gt 0 ] || [ "$del" -gt 0 ]; then
    dtext="\033[38;2;${ADD_FG}m+$ins\033[38;2;${FG}m \033[38;2;${DEL_FG}m-$del\033[38;2;${FG}m"
  fi
  [ "$untracked" -gt 0 ] && dtext="${dtext:+$dtext }\033[38;2;${UNTRACKED_FG}m?$untracked\033[38;2;${FG}m"
  [ -n "$dtext" ] && add 1 "$dtext"
fi

# ── group B: model · effort ───────────────────────────────────────────
model=$(jqr '.model.display_name // "Claude"'); model=${model#Claude }; model=${model%% *}; model=$(strip "$model")
effort=$(jqr '[.effort.level?, .effort?, .reasoning_effort.level?, .reasoning_effort?, .model.reasoning_effort.level?, .model.reasoning_effort?] | map(select(type=="string")) | .[0] // empty')
# No settings.json fallback. `.effortLevel` there is the CONFIGURED DEFAULT,
# not the live session value — /effort changes the session without touching
# the file, so the fallback could confidently display a level the session is
# not using. The payload documents `effort.level` as absent only when the
# model has no effort parameter, in which case showing nothing is correct.
effort=$(strip "$effort")
mtext="\033[38;2;${MODEL_FG}m${model}"
[ -n "$effort" ] && mtext="$mtext\033[38;2;${TIME_FG}m · \033[38;2;${EFFORT_FG}m${effort}"
add 2 "$mtext"

# ── Token Weather: a forecast icon for the context fill ───────────────
# wx_icon <pct> -> "icon|R;G;B": Clear, Cloudy, Showers, Storm, Compact soon.
# ICONS=nerd takes Nerd Font weather glyphs (day_sunny, cloudy, showers,
# thunderstorm, tornado), one cell wide in a Mono variant; the standard
# symbols are in few coding fonts and arrive from a fallback font.
if [ "$ICONS" = "nerd" ]; then
  # U+E30D U+E312 U+E319 U+E31D U+E351 as UTF-8 bytes: bash 3.2 has no \u escape.
  WX_ICONS=($'\356\214\215' $'\356\214\222' $'\356\214\231' $'\356\214\235' $'\356\215\221')
else
  WX_ICONS=(☀ ☁ ☂ ☇ ↯)
fi
wx_icon() {
  if   [ "$1" -lt 25 ]; then printf '%s|235;203;139' "${WX_ICONS[0]}"
  elif [ "$1" -lt 50 ]; then printf '%s|136;192;208' "${WX_ICONS[1]}"
  elif [ "$1" -lt 75 ]; then printf '%s|129;161;193' "${WX_ICONS[2]}"
  elif [ "$1" -lt 90 ]; then printf '%s|180;142;173' "${WX_ICONS[3]}"
  else printf '%s|224;108;117' "${WX_ICONS[4]}"; fi
}

# ── group B: context (ctx parsed above) ───────────────────────────────
if [ -n "$ctx" ]; then
  ci=$(pct_norm "$ctx")
  cfg=$(gauge_fg "$ci")
  if [ "$SHOW_BAR" = "1" ]; then ctxstr="$(mk_bar "$ci") ${ci}%"; else ctxstr="ctx ${ci}%"; fi
  if [ "$SHOW_WEATHER" = "1" ]; then
    wx=$(wx_icon "$ci")
    add 2 "\033[38;2;${wx#*|}m${wx%%|*} \033[38;2;${cfg}m${ctxstr}"
  else
    add 2 "\033[38;2;${cfg}m${ctxstr}"
  fi
fi

# ── group B: time · cost (cost/dur parsed above) ──────────────────────
tparts=()
[ -n "$dur" ]  && tparts+=("\033[38;2;${TIME_FG}m$(fmt_dur "${dur%.*}")")
[ -n "$cost" ] && tparts+=("\033[38;2;${COST_FG}m$(printf '$%.2f' "$cost")")
if [ ${#tparts[@]} -gt 0 ]; then
  ct="${tparts[0]}"; [ ${#tparts[@]} -gt 1 ] && ct="$ct \033[38;2;${TIME_FG}m· ${tparts[1]}"
  add 2 "$ct"
fi

# ── group C: account ──────────────────────────────────────────────────
if [ "$SHOW_ACCOUNT" = "1" ]; then
  acct=$(acct_label)
  [ "$ACCOUNT_LOCAL" = "1" ] && acct=${acct%%@*}
  [ -n "$acct" ] && add 3 "\033[38;2;${ACCOUNT_FG}m${acct}"
fi

# ── group C: rate-limit usage: 5h · 7d (u5/u7/r5/r7 parsed above) ──────
uparts=()
# usage_seg <label> <pct> <resets_at> — validate, clamp, and build one "5h 12%" chunk.
usage_seg() {
  local label=$1 pct=$2 reset=$3 p c s
  [ -n "$pct" ] || return 1
  p=$(pct_norm "$pct")
  c=$(gauge_fg "$p")
  s="\033[38;2;${TIME_FG}m${label} \033[38;2;${c}m${p}%"
  [ "$SHOW_RESET" = "1" ] && [ -n "$reset" ] && s="$s\033[38;2;${TIME_FG}m ($(fmt_reset "${reset%.*}"))"
  printf '%s' "$s"
}
s=$(usage_seg 5h "$u5" "$r5") && uparts+=("$s")
s=$(usage_seg 7d "$u7" "$r7") && uparts+=("$s")
if [ ${#uparts[@]} -gt 0 ]; then
  utext="${uparts[0]}"; [ ${#uparts[@]} -gt 1 ] && utext="$utext \033[38;2;${TIME_FG}m· ${uparts[1]}"
  add 3 "$utext\033[38;2;${FG}m"
fi

# ── Render one line from a list of segment indices ──────────────────
render_row() {
  local idx=("$@") m=${#idx[@]} i st out=""
  [ "$m" -eq 0 ] && return
  if [ "$STYLE" = "plain" ]; then
    local sepd=" \033[38;2;${SEP_DIM}m${PLAIN_SEP}\033[0m "
    for ((i=0; i<m; i++)); do
      out+="${seg_txt[${idx[i]}]}\033[0m"
      [ $((i + 1)) -lt "$m" ] && out+="$sepd"
    done
  else
    local R=() G=() B=()
    for ((i=0; i<m; i++)); do
      if [ "$m" -eq 1 ]; then st=50; else st=$(( i * 100 / (m - 1) )); fi
      R+=("$(lerp "$SR" "$ER" "$st")"); G+=("$(lerp "$SG" "$EG" "$st")"); B+=("$(lerp "$SB" "$EB" "$st")")
    done
    for ((i=0; i<m; i++)); do
      out+="\033[48;2;${R[i]};${G[i]};${B[i]}m\033[38;2;${FG}m ${seg_txt[${idx[i]}]} "
      if [ $((i + 1)) -lt "$m" ]; then
        out+="\033[48;2;${R[i+1]};${G[i+1]};${B[i+1]}m\033[38;2;${R[i]};${G[i]};${B[i]}m${SEP}"
      else
        out+="\033[0m\033[38;2;${R[i]};${G[i]};${B[i]}m${SEP}\033[0m"
      fi
    done
  fi
  printf '%b\n' "$out"
}

n=${#seg_row[@]}
gA=(); gB=(); gC=()
for ((i=0; i<n; i++)); do
  case "${seg_row[i]}" in
    2) gB+=("$i") ;;
    3) gC+=("$i") ;;
    *) gA+=("$i") ;;
  esac
done

# ── LINES=auto ────────────────────────────────────────────────────────
# Claude Code doesn't PASS the terminal width — but the command can still
# READ it. CC pipes our stdout, so `[ -t 1 ]` is false and $COLUMNS is
# unset, yet /dev/tty still resolves to the session's terminal. Measured:
# inside a pty with stdout piped, `stty size < /dev/tty` returns the real
# width. That removes the guess LINES=1|2|3 exists to work around.
#
# Falls back to 3 wherever /dev/tty isn't there (Windows, cron, no
# controlling terminal) — a fixed layout is always safe, a wrong width
# is not.
# Display width, not character count. `${#s}` counts characters, so a CJK path
# ("~/文档/项目") measures at half its real width and auto-layout picks a row
# that then wraps. jq is already a hard dependency and works in codepoints via
# `explode`, so it can strip the ANSI and weigh East-Asian Wide / Fullwidth
# characters as two cells and combining marks as zero. Ranges are decimal
# because jq has no hex literals.
_sl_widths_prog='
  def w: if   . == 8203                                         # ZWSP
              or (. >= 768    and . <= 879)                     # combining diacriticals
              or (. >= 12441  and . <= 12442)                   # combining kana marks
              or (. >= 65024  and . <= 65039)                   # variation selectors
              or (. >= 127995 and . <= 127999) then 0           # emoji skin-tone modifiers
         elif (. >= 4352   and . <= 4447)                       # Hangul Jamo
           or (. >= 11904  and . <= 12350)                      # CJK radicals, Kangxi
           or (. >= 12353  and . <= 13311)                      # Kana, CJK symbols
           or (. >= 13312  and . <= 19903)                      # CJK Ext-A
           or (. >= 19968  and . <= 40959)                      # CJK Unified
           or (. >= 40960  and . <= 42191)                      # Yi
           or (. >= 44032  and . <= 55203)                      # Hangul syllables
           or (. >= 63744  and . <= 64255)                      # CJK Compatibility
           or (. >= 65072  and . <= 65135)                      # Vertical/compat forms
           or (. >= 65280  and . <= 65376)                      # Fullwidth forms
           or (. >= 65504  and . <= 65510)                      # Fullwidth signs
           or (. >= 127744 and . <= 128767)                     # Emoji, transport/map
           or (. >= 129280 and . <= 129791)                     # Supplemental symbols
           or (. >= 131072 and . <= 178207)                     # CJK Ext-B..E (SIP)
           or (. >= 194560 and . <= 195103) then 2              # CJK Compat Ideographs Supp
         else 1 end;
  # The ESC must be part of the pattern. Stripping only the "[38;2;...m" tail
  # leaves the ESC byte behind, and since every segment carries colour that adds
  # a phantom cell per escape and pushes auto-layout onto rows it does not need.
  #
  # A ZWJ fuses an EMOJI that follows into the preceding glyph, so that
  # codepoint contributes nothing and the family sequence measures 2 cells —
  # one cluster, which is what a terminal draws. The `>= 126976` guard (the
  # emoji planes) matters: ZWJ ligation is an emoji behaviour, and suppressing
  # unconditionally measured "a<ZWJ>b" as 1 instead of 2 and CJK joined by a
  # ZWJ as 2 instead of 4.
  #
  # This is a deliberate approximation, not UAX #29 grapheme segmentation,
  # which is far out of scope for a status line. Where it is wrong it rounds UP
  # (a couple-with-heart sequence measures 3 rather than 2), because for layout
  # an overestimate costs one extra row while an underestimate wraps the line.
  inputs
  | gsub("\u001b\\[[0-9;]*m"; "")
  | explode
  | reduce .[] as $c ({p: 0, t: 0};
        if   $c == 8205                      then {p: 8205, t: .t}
        elif .p == 8205 and $c >= 126976     then {p: $c,   t: .t}
        else                                      {p: $c,   t: (.t + ($c | w))} end)
  | .t'
# One jq call measures every segment (the old code forked sed per segment).
# `printf -v` expands the \033 escapes in-process, so nothing else forks.
compute_seg_widths() {
  local i expanded joined=""
  seg_w=()
  for ((i=0; i<n; i++)); do
    printf -v expanded '%b' "${seg_txt[i]}"
    joined+="$expanded"$'\n'
  done
  while IFS= read -r wv; do seg_w+=("$wv"); done \
    < <(printf '%s' "$joined" | jq -Rrn "$_sl_widths_prog" 2>/dev/null)
  # jq missing or erroring must not wedge the layout — fall back to char counts.
  if [ "${#seg_w[@]}" -ne "$n" ]; then
    seg_w=()
    for ((i=0; i<n; i++)); do
      printf -v expanded '%b' "${seg_txt[i]}"
      expanded=${expanded//$'\033'\[[0-9\;]*m/}
      seg_w+=("${#expanded}")
    done
  fi
}
# Width of ONE rendered row. Must be measured on the row actually rendered:
# summing per-group widths drops the separators BETWEEN groups (3 cells each).
# Powerline wraps every segment as " text " plus a 1-cell arrow — 3 per segment,
# with no extra trailing cell; plain joins with " > " — 3 per gap.
row_width() {
  local idx=("$@") m=${#idx[@]} i w=0
  [ "$m" -eq 0 ] && { printf '0'; return; }
  for ((i=0; i<m; i++)); do w=$(( w + ${seg_w[${idx[i]}]:-0} )); done
  if [ "$STYLE" = "plain" ]; then w=$(( w + (m - 1) * 3 )); else w=$(( w + m * 3 )); fi
  printf '%s' "$w"
}
if [ "$LINES" = "auto" ]; then
  # `[ -r /dev/tty ]` passes on permissions even where opening it fails
  # (no controlling terminal), and the failed redirect is reported by the
  # SHELL, not by stty — so the suppression has to wrap the whole group or
  # a "Device not configured" line hits stderr on every render.
  cols=$( { stty size < /dev/tty; } 2>/dev/null | awk '{print $2}' )
  case "$cols" in ''|*[!0-9]*) cols="" ;; esac
  if [ -z "$cols" ]; then
    LINES=3
  else
    # CC renders its own notifications (MCP errors, auto-update, context-low)
    # on the RIGHT of this same row, so the usable width is less than the
    # terminal's. Reserve a margin rather than filling edge to edge.
    avail=$(( cols - 12 )); [ "$avail" -lt 20 ] && avail=20
    compute_seg_widths
    # Measure the candidate ROWS, not the groups: LINES=1 renders A B C as a
    # single row, so its separator count is (total-1), not the sum of each
    # group's internal separators.
    w1=$(row_width "${gA[@]}" "${gB[@]}" "${gC[@]}")
    w2ab=$(row_width "${gA[@]}" "${gB[@]}"); w2c=$(row_width "${gC[@]}")
    if   [ "$w1" -le "$avail" ]; then LINES=1
    elif [ "$w2ab" -le "$avail" ] && [ "$w2c" -le "$avail" ]; then LINES=2
    else LINES=3
    fi
  fi
fi

case "$LINES" in
  3) render_row "${gA[@]}"; render_row "${gB[@]}"; render_row "${gC[@]}" ;;
  2) render_row "${gA[@]}" "${gB[@]}"; render_row "${gC[@]}" ;;
  1) render_row "${gA[@]}" "${gB[@]}" "${gC[@]}" ;;
  *) render_row "${gA[@]}" "${gB[@]}" "${gC[@]}" ;;
esac
