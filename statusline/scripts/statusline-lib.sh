#!/usr/bin/env bash
# Shared state schema for the statusline renderer and controller.
#
# SL_SCHEMA below is the ONLY declaration. Defaults, parsing, validation and
# serialization are all loops over it, so adding a field means adding one line
# and nothing else — there is no second list to keep in step. Both scripts source
# this file from their own directory (see the
# `. "${BASH_SOURCE[0]%/*}/statusline-lib.sh"` line at the top of each), so they
# cannot drift apart in how ~/.claude/statusline.state is read OR written.

# Location of the live state file (overridable before sourcing, e.g. for tests).
: "${STATE:=$HOME/.claude/statusline.state}"

# KEY|default|allowed values. Row order is also the order written to the file.
#
#   THEME          powerline background gradient
#   STYLE          plain (dim ">" separators) | powerline (filled bg + arrows)
#   LINES          auto (fit terminal) | 1 (A B C) | 2 (A B / C) | 3 (A / B / C)
#   HIDDEN         1 emits a single blank status line
#   SHOW_BAR       1 renders the context gauge as a ████░░ bar
#   ACCOUNT_LOCAL  1 truncates the account email at "@"
#   SHOW_ACCOUNT   0 hides the account segment
#   SHOW_RESET     1 appends rate-limit reset countdowns
#   SHOW_WEATHER   1 adds Token Weather to the context gauge: a forecast icon
#                  and a sparkline of the session's recent context fill
#   ICONS          nerd draws the weather icons from a Nerd Font, which sizes
#                  them to one cell; unicode uses standard symbols that most
#                  fonts lack, so the terminal borrows them from another font
SL_SCHEMA='THEME|gray|gray aurora sunset forest
STYLE|plain|plain powerline
LINES|1|auto 1 2 3
HIDDEN|0|0 1
SHOW_BAR|0|0 1
ACCOUNT_LOCAL|1|0 1
SHOW_ACCOUNT|1|0 1
SHOW_RESET|0|0 1
SHOW_WEATHER|1|0 1
ICONS|unicode|unicode nerd'

# The loops below split SL_SCHEMA with `local IFS` and parameter expansion rather
# than a subshell: this runs on every render, and a command substitution per
# field would put eight forks in the hot path.

# sl_state_defaults — set every state variable to its compiled-in default.
sl_state_defaults() {
  local IFS=$'\n' line k d
  for line in $SL_SCHEMA; do
    k=${line%%|*}; d=${line#*|}; d=${d%%|*}
    printf -v "$k" '%s' "$d"
  done
}

# _sl_accept <key> <value> — assign only when the key is known AND the value is
# one of its allowed tokens; otherwise leave the compiled-in default in place.
#
# Every field is a closed enum, so an unrecognised value is a corrupt state file,
# not a new feature. Validating on READ means a hand-edited or half-written file
# degrades to the default instead of silently selecting a different branch:
# without this, STYLE=bogus falls through the "is it plain?" test and quietly
# renders powerline, while THEME=bogus lands on gray — two different recoveries
# for the same class of corruption.
_sl_accept() {
  local IFS=$'\n' line k ok a
  for line in $SL_SCHEMA; do
    k=${line%%|*}
    [ "$k" = "$1" ] || continue
    ok=${line##*|}
    IFS=' '
    for a in $ok; do
      [ "$2" = "$a" ] && { printf -v "$k" '%s' "$2"; return 0; }
    done
    return 1
  done
  return 1
}

# sl_load_state — apply the defaults, then overlay any VALID values from $STATE.
# Reads the final line even when the file has no trailing newline, tolerates
# CRLF, and strips one layer of surrounding double quotes.
sl_load_state() {
  sl_state_defaults
  [ -f "$STATE" ] || return 0
  local k v
  while IFS='=' read -r k v || [ -n "$k" ]; do
    # A CRLF state file (hand-edited on Windows, or moved through a tool that
    # rewrites line endings) otherwise leaves a literal CR on every value, so
    # "plain\r" != "plain" and each key silently takes its else-branch.
    k=${k%$'\r'}; v=${v%$'\r'}
    # Strip quotes only as a matched pair — a lone leading or trailing quote is
    # corruption, and removing half of it would hide that.
    case $v in '"'*'"') v=${v#\"}; v=${v%\"} ;; esac
    _sl_accept "$k" "$v"
  done < "$STATE"
}

# sl_write_state — serialize the current state variables to $STATE.
#
# Writes through a unique temp then atomically renames, so concurrent
# invocations can't corrupt one another's temp file and a failed write never
# leaves the state half-updated. The EXIT trap covers interruption between
# mktemp and mv, which plain error handling would leave as an orphan temp.
# Returns non-zero on failure so the caller can report it.
#
# The caller's own EXIT trap is captured and restored rather than discarded:
# this is a library function, and a bare `trap - EXIT` here would silently
# disarm cleanup belonging to whatever script sourced us.
sl_write_state() {
  local IFS=$'\n' tmp line k prev_trap rc
  prev_trap=$(trap -p EXIT)
  tmp=$(mktemp "$STATE.XXXXXX") || return 1
  trap 'rm -f "$tmp"' EXIT
  if { for line in $SL_SCHEMA; do k=${line%%|*}; printf '%s=%s\n' "$k" "${!k}"; done; } > "$tmp" \
     && mv "$tmp" "$STATE"; then
    rc=0
  else
    rm -f "$tmp"
    rc=1
  fi
  if [ -n "$prev_trap" ]; then eval "$prev_trap"; else trap - EXIT; fi
  return "$rc"
}
