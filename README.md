# Claude Rich Terminal

Mermaid diagrams drawn inside Claude Code replies, instead of raw source.

```text
⏺ Here is the pipeline:
  ┌────────────────────┐     ◇────────────◇     ╭─────────────────╮
  │ Reply with Mermaid ├────►│ Plugin on? ├─yes►│ Drawn in place  │
  └────────────────────┘     ◇──────┬─────◇     ╰─────────────────╯
                                    └────no────► Raw source
```

## What it does

- **Draws diagrams in place.** Each Mermaid block in a reply, including one inside a quote or list, is replaced by a drawing on screen only. The stored message is unchanged, and ctrl+o shows the source.
- **Fits the terminal.** A left-to-right flowchart too wide for the window is redrawn top-to-bottom. If it still does not fit, the source is shown. Changing the terminal's width redraws.
- **Optional pictures.** In Ghostty or kitty, diagrams can be drawn as real images instead (see [Settings](#settings)).
- **Full view in the browser.** `/rich open` opens a diagram as a zoomable page that works offline.

Terminal drawings cover flowcharts, sequence, state, class, ER and xy charts. Other types (pie, gantt, mindmap, timeline, gitGraph, journey) stay as source, unless pictures are on.

## Commands

| Command | Effect |
|---|---|
| `/rich list` | Number the diagrams in this conversation, with their ids |
| `/rich open [n\|id]` | Open diagram *n* (or by id) in the default browser; the latest without one. Uses `open` on macOS and `xdg-open` on Linux |
| `/rich on` / `/rich off` | Draw diagrams, or leave replies as Claude Code draws them |

## Settings

In `/config`, under this plugin:

| Setting | Default | Meaning |
|---|---|---|
| `images` | off | Draw diagrams as pictures. Needs a terminal with the kitty graphics protocol (Ghostty, kitty; not inside tmux) and Chrome, Chromium, Edge or Brave. Elsewhere the text drawing is kept |
| `imageTheme` | `dark` | Mermaid theme for pictures: `dark`, or `default` for a light terminal |
| `browser` | empty | Path to the browser that draws pictures; empty finds one |

Pictures are drawn once per diagram by headless Chrome. The text drawing shows until the picture is ready, about a second and a half. Pages are drawn offline: their content policy blocks every network request, so a diagram cannot make the browser fetch anything.

## Cache

Browser pages and pictures are kept in `~/.claude/plugins/data/rich-terminal/` (or `$CLAUDE_PLUGIN_DATA`). They contain the source of the diagrams you opened or drew as pictures, plus a headless-Chrome profile per session. Nothing is removed automatically; delete the folder at any time to clear it.

## Install

Requires Claude Code 2.1.287 or later.

```bash
claude plugin marketplace add xiaolai/claude-plugin-marketplace
claude plugin install rich-terminal@xiaolai
```

To try it from a checkout instead, run `claude --plugin-dir /path/to/claude-rich-terminal`.

## Limitations

- A Mermaid block is recognised at top level and inside quotes and list items whose markers sit on the fence's own line or directly above it. Unusual Markdown nesting, such as lazy continuation lines, can leave a block as source or end it early.
- The terminal renderer skips a line it cannot parse and draws the rest; a diagram with a syntax error can therefore be drawn incompletely. `/rich open` shows Mermaid's own error.
- A diagram that loads external images draws in the browser without them: the pages block every network request.

## Background

This plugin came out of reading [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/), published on claude.dev on October 1, 2026.

## Development

```bash
claude plugin validate .claude-plugin/plugin.json
claude plugin test .                       # hooks and core logic, in Claude Code's test kit
node scripts/check-pages.mjs               # browser pages in headless Chrome: drawn, no links, no network
npx tsc -p . && npx tsc -p tsconfig.viewer.json
```

`hooks/core.ts` holds the logic that does not touch Claude Code; `hooks/register.tsx` holds the hooks. The renderers are vendored; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

MIT; see [LICENSE](LICENSE). The bundled Mermaid renderers are MIT as well; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
