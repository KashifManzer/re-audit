export type QuoteCheck =
  | { status: 'found' }
  | { status: 'moved'; line: number }
  | { status: 'missing' }

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

// Is `quote` really in `text` at 1-based `line`? Whitespace is ignored, so
// re-indented or reflowed quotes still match. A real quote at the wrong line
// is 'moved' (nearest match wins); one that appears nowhere is 'missing'.
export function checkQuote(text: string, line: number, quote: string): QuoteCheck {
  const want = squash(quote)
  if (!want) return { status: 'missing' }
  const lines = text.split(/\r?\n/)
  const span = quote.trim().split(/\r?\n/).length
  const at = (i: number) => squash(lines.slice(i, i + span).join(' ')).includes(want)

  if (line >= 1 && at(line - 1)) return { status: 'found' }
  // ponytail: linear scan of the whole file; fine for source files
  let best = -1
  for (let i = 0; i < lines.length; i++) {
    if (at(i) && (best < 0 || Math.abs(i + 1 - line) < Math.abs(best + 1 - line))) best = i
  }
  return best < 0 ? { status: 'missing' } : { status: 'moved', line: best + 1 }
}
