#!/usr/bin/env bash
# statusline-ctl.sh — flip status line appearance by writing ~/.claude/statusline.state,
# which statusline-command.sh reads on its next render (so changes appear within a tick).
#
# Actions:
#   theme   cycle the look: plain → gray → aurora → sunset → forest → plain
#   style   toggle powerline <-> plain
#   lines   cycle auto -> 1 -> 2 -> 3 lines  (auto measures the terminal)
#   toggle  flip the status line hidden <-> visible
#   hide    force hidden · show  force visible
#   bar     toggle ████░░ gauges <-> lean percentages
#   account toggle the account segment
#   reset   toggle reset countdowns after 5h/7d
#   weather toggle Token Weather (forecast icon + sparkline) on the context gauge
#   icons   toggle the weather icons between standard Unicode and Nerd Font glyphs
#   status  print every setting; changes nothing
#
# Usage:  bash ~/.claude/statusline-ctl.sh {theme|style|lines|toggle|hide|show|bar|account|reset|weather|icons|status}
set -u

# Shared state schema (defaults + parser), loaded from next to this script.
_sl_dir="${BASH_SOURCE[0]%/*}"; [ "$_sl_dir" = "${BASH_SOURCE[0]}" ] && _sl_dir=.
. "$_sl_dir/statusline-lib.sh"
sl_load_state

# status: report every setting and stop, before anything is written.
if [ "${1:-}" = "status" ]; then
  onoff() { [ "$1" = "1" ] && echo on || echo off; }
  if [ "$STYLE" = "plain" ]; then shown=plain; else shown="powerline/$THEME"; fi
  if [ "$SHOW_ACCOUNT" != "1" ]; then acct=off; elif [ "$ACCOUNT_LOCAL" = "1" ]; then acct=name; else acct=email; fi
  echo "status line → look=${shown} · lines=${LINES} · $([ "$HIDDEN" = "1" ] && echo hidden || echo visible) · bar=$(onoff "$SHOW_BAR") · account=${acct} · reset=$(onoff "$SHOW_RESET") · weather=$(onoff "$SHOW_WEATHER") · icons=${ICONS}"
  exit 0
fi

# current "look" = plain, or the active gradient name
if [ "$STYLE" = "plain" ]; then look=plain; else look=$THEME; fi

case "${1:-}" in
  theme)
    case "$look" in
      plain)  STYLE=powerline; THEME=gray ;;
      gray)   STYLE=powerline; THEME=aurora ;;
      aurora) STYLE=powerline; THEME=sunset ;;
      sunset) STYLE=powerline; THEME=forest ;;
      *)      STYLE=plain;     THEME=gray ;;   # forest → back to plain
    esac ;;
  style)  [ "$STYLE" = "plain" ] && STYLE=powerline || STYLE=plain ;;
  lines)  case "$LINES" in auto) LINES=1 ;; 1) LINES=2 ;; 2) LINES=3 ;; *) LINES=auto ;; esac ;;
  bar)     [ "$SHOW_BAR" = "1" ] && SHOW_BAR=0 || SHOW_BAR=1 ;;
  account) [ "$SHOW_ACCOUNT" = "1" ] && SHOW_ACCOUNT=0 || SHOW_ACCOUNT=1 ;;
  reset)   [ "$SHOW_RESET" = "1" ] && SHOW_RESET=0 || SHOW_RESET=1 ;;
  weather) [ "$SHOW_WEATHER" = "1" ] && SHOW_WEATHER=0 || SHOW_WEATHER=1 ;;
  icons)   [ "$ICONS" = "nerd" ] && ICONS=unicode || ICONS=nerd ;;
  toggle) [ "$HIDDEN" = "1" ] && HIDDEN=0 || HIDDEN=1 ;;
  hide)   HIDDEN=1 ;;
  show)   HIDDEN=0 ;;
  *) printf 'usage: statusline-ctl.sh {theme|style|lines|toggle|hide|show|bar|account|reset|weather|icons|status}\n' >&2; exit 2 ;;
esac

# Serialization (unique temp + atomic rename) lives in statusline-lib.sh next to
# the defaults and the parser, so the key list cannot drift between read and write.
if ! sl_write_state; then
  printf 'statusline-ctl: failed to write %s\n' "$STATE" >&2; exit 1
fi

if [ "$STYLE" = "plain" ]; then shown=plain; else shown="powerline/$THEME"; fi
msg="status line → look=${shown} · lines=${LINES} · $([ "$HIDDEN" = "1" ] && echo hidden || echo visible)"
# The look/lines/visibility summary can't express the three independent flags, so
# a `bar`/`account`/`reset` toggle would otherwise print an identical line before
# and after and leave the user unable to tell whether it took effect.
case "${1:-}" in
  bar)     msg="$msg · bar=$([ "$SHOW_BAR" = "1" ] && echo on || echo off)" ;;
  account) msg="$msg · account=$([ "$SHOW_ACCOUNT" = "1" ] && echo on || echo off)" ;;
  reset)   msg="$msg · reset=$([ "$SHOW_RESET" = "1" ] && echo on || echo off)" ;;
  weather) msg="$msg · weather=$([ "$SHOW_WEATHER" = "1" ] && echo on || echo off)" ;;
  icons)   msg="$msg · icons=$ICONS" ;;
esac
echo "$msg"
