// Bundled from @zombie-mermaid/ascii-renderer 3.2.0 (MIT) into mermaid-ascii.js.
export function renderMermaidAscii(
  source: string,
  options?: {
    useAscii?: boolean
    colorMode?: 'none' | 'ansi16' | 'ansi256' | 'truecolor' | 'html'
    hyperlinks?: boolean
    direction?: 'TD' | 'LR'
  },
): string
