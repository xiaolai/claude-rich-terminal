# Claude Rich Terminal

Mermaid diagrams drawn inside Claude Code replies, instead of raw source, and a Token Weather band above the prompt that forecasts the context window, with an optional full status.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/demo-dark.gif">
  <img alt="A Claude Code reply with a Mermaid flowchart: first drawn as box-drawing text, then replaced by a picture of the same diagram." src="docs/images/demo-light.gif" width="960">
</picture>

The diagram in the animation is the plugin's own output: its text drawing, then its picture in Ghostty or kitty. The window around it is recreated. The [gallery](#gallery) shows one diagram of every supported type.

## What it does

- **Draws diagrams in place.** Each Mermaid block in a reply, including one inside a quote or list, is replaced by a drawing on screen only. The stored message is unchanged, and ctrl+o shows the source.
- **Fits the terminal.** A left-to-right flowchart too wide for the window is redrawn top-to-bottom. If it still does not fit, the source is shown. Changing the terminal's width redraws.
- **Optional pictures.** In Ghostty or kitty, diagrams can be drawn as real images instead (see [Settings](#settings)).
- **Full view in the browser.** `/rich open` opens a diagram as a zoomable page that works offline.
- **Token Weather.** A band above the prompt forecasts the context window, from ☀ Clear to ↯ Compact soon, with a sparkline of recent turns.
- **Status band.** With `/rich status rows all`, the band also shows the folder and git state, model and effort, session time and cost, account and rate limits, restyled live with `/rich status` (see [Status band](#status-band)).

Terminal drawings cover flowcharts, sequence, state, class, ER and xy charts. Other types (pie, gantt, mindmap, timeline, gitGraph, journey) stay as source, unless pictures are on.

## Gallery

<!-- gallery:start -->

One diagram of every supported type, in a reply in a terminal 120 columns wide. Each diagram is the plugin's own output; only the window around it is recreated. The first six types are drawn as text in any terminal and as pictures in Ghostty and kitty; the rest are pictures only. Charts marked "example data" or "illustrative" show made-up numbers.

<details><summary><b>Flowchart</b> (text and picture)</summary>

Text drawing. Too wide left to right for the terminal, so the plugin redrew it top to bottom.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/flowchart-text-dark.png">
  <img alt="Flowchart drawn as box-drawing text in a terminal reply" src="docs/images/gallery/flowchart-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/flowchart-picture-dark.png">
  <img alt="Flowchart drawn as a picture in a terminal reply" src="docs/images/gallery/flowchart-picture-light.png">
</picture>

Source:

```text
flowchart LR
    subgraph reply [Assistant reply]
        M[Markdown text]
    end
    M --> F{Mermaid fence?}
    F -->|no| N[Draw as usual]
    F -->|yes| W{Fits the width?}
    W -->|LR fits| T[Text drawing]
    W -->|only TD fits| R[Redraw top to bottom] --> T
    W -->|neither| S[Keep the source]
    T --> P{Pictures on?}
    P -->|Ghostty or kitty| C[(Headless Chrome)]
    C --> I([PNG in place])
    P -->|other terminal| K([Text stays])
```

</details>

<details><summary><b>Sequence diagram</b> (text and picture)</summary>

Text drawing.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/sequence-text-dark.png">
  <img alt="Sequence diagram drawn as box-drawing text in a terminal reply" src="docs/images/gallery/sequence-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/sequence-picture-dark.png">
  <img alt="Sequence diagram drawn as a picture in a terminal reply" src="docs/images/gallery/sequence-picture-light.png">
</picture>

Source:

```text
sequenceDiagram
    actor U as User
    participant CC as Claude Code
    participant RT as rich-terminal
    participant HC as Headless Chrome
    U->>CC: Prompt
    activate CC
    loop each streamed chunk
        CC->>RT: ui.render(text)
        RT-->>CC: Text drawing or source
    end
    CC-->>U: Reply complete
    deactivate CC
    alt images on
        RT->>HC: Image page
        HC-->>RT: Screenshot PNG
        RT-->>CC: Picture
    else images off
        Note over RT: Text drawing stays
    end
    U->>CC: /rich open 2
    CC->>RT: Command
    RT-->>U: Browser view
```

</details>

<details><summary><b>State diagram</b> (text and picture)</summary>

Text drawing.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/state-text-dark.png">
  <img alt="State diagram drawn as box-drawing text in a terminal reply" src="docs/images/gallery/state-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/state-picture-dark.png">
  <img alt="State diagram drawn as a picture in a terminal reply" src="docs/images/gallery/state-picture-light.png">
</picture>

Source:

```text
stateDiagram-v2
    [*] --> Streaming
    Streaming --> Placeholder: fence open
    Placeholder --> Drawn: fence closed
    state Drawn {
        [*] --> LeftToRight
        LeftToRight --> TopToBottom: too wide
        TopToBottom --> Source: still too wide
    }
    Drawn --> Picture
    Picture --> Drawn: file cleared
    Picture --> [*]
```

</details>

<details><summary><b>Class diagram</b> (text and picture)</summary>

Text drawing.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/class-text-dark.png">
  <img alt="Class diagram drawn as box-drawing text in a terminal reply" src="docs/images/gallery/class-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/class-picture-dark.png">
  <img alt="Class diagram drawn as a picture in a terminal reply" src="docs/images/gallery/class-picture-light.png">
</picture>

Source:

```text
classDiagram
    class Diagram {
        +id: string
        +kind: string
        +source: string
        +start: number
        +end: number
        +closed: boolean
        +lead: string
        +prefix: string
    }
    class Segment {
        <<union>>
        +kind: string
    }
    class TextSegment {
        +text: string
    }
    class DiagramSegment {
        +diagram: Diagram
    }
    Segment <|-- TextSegment
    Segment <|-- DiagramSegment
    DiagramSegment --> "1" Diagram : diagram
```

</details>

<details><summary><b>Entity relationship diagram</b> (text and picture)</summary>

Text drawing.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/er-text-dark.png">
  <img alt="Entity relationship diagram drawn as box-drawing text in a terminal reply" src="docs/images/gallery/er-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/er-picture-dark.png">
  <img alt="Entity relationship diagram drawn as a picture in a terminal reply" src="docs/images/gallery/er-picture-light.png">
</picture>

Source:

```text
erDiagram
    MARKETPLACE ||--o{ PLUGIN : lists
    PLUGIN ||--o{ RELEASE : publishes
    PLUGIN ||--o{ INSTALL : "installed as"
    PROJECT ||--o{ INSTALL : scopes
    RELEASE ||--o{ INSTALL : pins
    MARKETPLACE {
        string name PK
        string repo
    }
    PLUGIN {
        string name PK
        string description
    }
    RELEASE {
        string version PK
        string commit
    }
    INSTALL {
        string scope
        string installPath
    }
```

</details>

<details><summary><b>XY chart</b> (text and picture)</summary>

Text drawing.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/xychart-text-dark.png">
  <img alt="XY chart drawn as box-drawing text in a terminal reply" src="docs/images/gallery/xychart-text-light.png">
</picture>

Picture.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/xychart-picture-dark.png">
  <img alt="XY chart drawn as a picture in a terminal reply" src="docs/images/gallery/xychart-picture-light.png">
</picture>

Source:

```text
xychart-beta
    title "Diagrams drawn per day, example data"
    x-axis [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    y-axis "Diagrams" 0 --> 60
    bar [12, 28, 35, 41, 52, 18, 9]
    line [10, 22, 30, 38, 47, 20, 11]
```

</details>

<details><summary><b>Pie chart</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/pie-picture-dark.png">
  <img alt="Pie chart drawn as a picture in a terminal reply" src="docs/images/gallery/pie-picture-light.png">
</picture>

Source:

```text
pie showData title Diagram types in replies, example data
    "Flowchart" : 46
    "Sequence" : 21
    "State" : 9
    "Class" : 8
    "ER" : 6
    "Other" : 10
```

</details>

<details><summary><b>Gantt chart</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/gantt-picture-dark.png">
  <img alt="Gantt chart drawn as a picture in a terminal reply" src="docs/images/gallery/gantt-picture-light.png">
</picture>

Source:

```text
gantt
    title One reply with pictures on, illustrative timing
    dateFormat x
    axisFormat %S s
    section Claude Code
        Reply streams             :stream, 0, 3000ms
    section rich-terminal
        Placeholder, fence open   :hold, 1000, 1000ms
        Text drawing              :text, after hold, 2500ms
        Headless Chrome draws PNG :chrome, after stream, 1500ms
        Picture shown             :milestone, after chrome, 0ms
```

</details>

<details><summary><b>Mindmap</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/mindmap-picture-dark.png">
  <img alt="Mindmap drawn as a picture in a terminal reply" src="docs/images/gallery/mindmap-picture-light.png">
</picture>

Source:

```text
mindmap
  root((rich-terminal))
    Text drawings
      Flowchart
      Sequence
      State
      Class
      ER
      XY chart
    Pictures
      Ghostty
      kitty
      Headless Chrome
    Browser view
      Zoom and pan
      Source toggle
      Offline only
```

</details>

<details><summary><b>Timeline</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/timeline-picture-dark.png">
  <img alt="Timeline drawn as a picture in a terminal reply" src="docs/images/gallery/timeline-picture-light.png">
</picture>

Source:

```text
timeline
    title rich-terminal so far
    2026-10-01 : Getting started with Claude Code mods published
    2026-10-03 : v0.1.0 text drawings, pictures, browser view
               : v0.1.1 cache folder fixes
    2026-10-04 : Text renderer 4.0.0
               : README demo and gallery
```

</details>

<details><summary><b>Git graph</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/gitgraph-picture-dark.png">
  <img alt="Git graph drawn as a picture in a terminal reply" src="docs/images/gallery/gitgraph-picture-light.png">
</picture>

Source:

```text
gitGraph
    commit id: "draw diagrams" tag: "v0.1.0"
    commit id: "cache under data"
    commit id: "retry cache" tag: "v0.1.1"
    branch readme-demo
    checkout readme-demo
    commit id: "renderer 4.0.0"
    commit id: "ER edge patch"
    commit id: "README demo and gallery"
    checkout main
    merge readme-demo
```

</details>

<details><summary><b>User journey</b> (picture)</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/gallery/journey-picture-dark.png">
  <img alt="User journey drawn as a picture in a terminal reply" src="docs/images/gallery/journey-picture-light.png">
</picture>

Source:

```text
journey
    title Reading a diagram in a reply
    section Without the plugin
        Scroll past raw source: 2: User
        Copy it to a renderer: 1: User
    section With the plugin
        See the text drawing: 4: User
        See the picture: 5: User
        Open it in the browser: 5: User
```

</details>

<!-- gallery:end -->

## Status band

A band above the prompt, drawn by the plugin in interactive terminal sessions. By default it is Token Weather alone, one row:

```
☂  Showers > 67% of context  134.4k / 200k > last turns ▁▂▃▅█  ▲ +98.3k last turn
```

That default suits a setup with a `statusLine` command, which Claude Code draws under the prompt. A plugin cannot draw there itself: its only slot under the prompt is a one-line notice without color. Without a `statusLine` command, `/rich status rows all` adds the full status above the weather. In the default `plain` look, at a width where everything fits on one row:

```
my-app/src > main ↑1 > +12 -3 ?2 > Opus · xhigh > 12m · $1.23 > me > 5h 12% · 7d 67%
☂  Showers > 67% of context  134.4k / 200k > last turns ▁▂▃▅█  ▲ +98.3k last turn
```

The other looks (`gray`, `aurora`, `sunset`, `forest`) draw each segment on a background gradient with powerline arrows, which need a font with the U+E0B0 glyph (a Nerd Font; Ghostty bundles one). The colors are tuned for a dark terminal.

| Group | Segment | Shows |
|---|---|---|
| A | Folder | The path relative to the project when inside it, else the `~`-abbreviated path |
| A | Branch | Green when the working tree is clean, amber when anything changed; `↑n ↓m` against the upstream. Neither color when git could not measure the tree |
| A | Changes | `+added -deleted` against `HEAD`, and `?n` untracked files |
| B | Model | The model and the effort the main loop's latest request used (effort appears after the first request) |
| B | Context | `ctx 42%`, or an 8-cell gauge with `bar on`; shown here only when Token Weather is off |
| B | Time · cost | How long the session has run, and what it has cost |
| C | Account | The signed-in account from Claude Code's own `.claude.json`: the email's local part, the whole email, or hidden |
| C | Limits | 5-hour and 7-day rate-limit use, with reset countdowns when `resets on` |
| — | Token Weather | Its own last row: the forecast, the context fill, and the last 12 turns as a sparkline with the latest change |

A segment with no data is left out. The context and limit figures share one scale: green below 60 %, amber from 60 %, red from 85 %. `lines auto` puts groups A, B and C on the fewest rows that fit the band's width.

The figures are read every 5 seconds and after each model request; with `rows weather`, only the session's own figures, never git or the account. Git gets a 3-second budget per reading (2 seconds a call): a slow repository loses its git segments, never the band. Nothing is read in `claude -p` runs or outside a terminal.

The band sits above the prompt; Claude Code's own `statusLine` setting draws below it. With `rows all` and a `statusLine` command, the same figures show twice.

## Commands

| Command | Effect |
|---|---|
| `/rich list` | Number the diagrams in this conversation, with their ids |
| `/rich open [n\|id]` | Open diagram *n* (or by id) in the default browser; the latest without one. Uses `open` on macOS and `xdg-open` on Linux |
| `/rich on` / `/rich off` | Draw diagrams, or leave replies as Claude Code draws them |
| `/rich status` | Show the status band's settings |
| `/rich status on` / `off` | Show or hide the band |
| `/rich status rows [which]` | `weather` (Token Weather alone, the default) or `all` (every segment); without one, the other |
| `/rich status look [name]` | `plain`, `gray`, `aurora`, `sunset` or `forest`; without a name, the next one |
| `/rich status lines [n]` | `auto`, `1`, `2` or `3` rows for groups A, B and C; without one, the next |
| `/rich status account [show]` | `name`, `email` or `off`; without one, the next |
| `/rich status bar` / `resets` / `weather [on\|off]` | The context gauge, the reset countdowns, Token Weather; without a value, toggle |

Status band changes apply at once and are kept across sessions.

## Settings

In `/config`, under this plugin:

| Setting | Default | Meaning |
|---|---|---|
| `images` | off | Draw diagrams as pictures. Needs a terminal with the kitty graphics protocol (Ghostty, kitty; not inside tmux) and Chrome, Chromium, Edge or Brave. Elsewhere the text drawing is kept |
| `imageTheme` | `dark` | Mermaid theme for pictures: `dark`, or `default` for a light terminal |
| `browser` | empty | Path to the browser that draws pictures; empty finds one |

Pictures are drawn once per diagram by headless Chrome. The text drawing shows until the picture is ready, about a second and a half. Pages are drawn offline: their content policy blocks every network request, so a diagram cannot make the browser fetch anything.

## Cache

Browser pages and pictures are kept in `~/.claude/plugins/data/rich-terminal/`, an owner-only folder. They contain the source of the diagrams you opened or drew as pictures, plus a headless-Chrome profile per session. Nothing is removed automatically; delete the folder at any time to clear it.

## Install

Requires Claude Code 2.1.287 or later.

```bash
claude plugin marketplace add xiaolai/claude-plugin-marketplace
claude plugin install rich-terminal@xiaolai
```

To try it from a checkout instead, run `claude --plugin-dir /path/to/claude-rich-terminal`.

## Limitations

- A Mermaid block is recognised at top level and inside quotes and list items whose markers sit on the fence's own line or directly above it. Unusual Markdown nesting, such as lazy continuation lines, can leave a block as source or end it early.
- In a dense text drawing, an edge label can land on another line or a container's border, and an edge can cross a box. The picture and `/rich open` draw such diagrams exactly.
- The terminal renderer skips a line it cannot parse and draws the rest; a diagram with a syntax error can therefore be drawn incompletely. `/rich open` shows Mermaid's own error.
- A diagram that loads external images draws in the browser without them: the pages block every network request.
- The status band shows the effort only after the session's first model request: no earlier figure is available to a plugin.
- Token Weather's sparkline counts main-loop turns only; a subagent's turn takes no reading.

## Background

This plugin came out of reading [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/), published on claude.dev on October 1, 2026. Token Weather is that tutorial's example, adapted into the status band.

## Development

```bash
claude plugin validate .claude-plugin/plugin.json
claude plugin test .                       # hooks and core logic, in Claude Code's test kit
node scripts/check-pages.mjs               # browser pages in headless Chrome: drawn, no links, no network
npx tsc -p . && npx tsc -p tsconfig.viewer.json
```

`hooks/core.ts` (diagrams) and `hooks/status.ts` (the status band) hold the logic that does not touch Claude Code; `hooks/register.tsx` holds the hooks. The renderers are vendored; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

MIT; see [LICENSE](LICENSE). The bundled Mermaid renderers are MIT as well; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
