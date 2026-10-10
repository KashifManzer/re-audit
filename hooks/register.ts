import type { Register } from 'claude-code'
import { checkQuote, type QuoteCheck } from './check'

type Citation = { file: string; line: number; quote: string }
type Checked = Citation & (QuoteCheck | { status: 'missing'; reason: string })

const TOOL = 'mcp__re-audit__verify_quotes'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'verify_quotes',
      isDeferred: false,
      description:
        'Checks that each quoted snippet really appears in its file at the cited line. ' +
        'Returns found, moved (with the real line), or missing for each citation. ' +
        'Use it to drop any audit finding whose quote is missing.',
      inputSchema: {
        type: 'object',
        properties: {
          citations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file: { type: 'string', description: 'Path, relative to the working directory or absolute' },
                line: { type: 'integer', description: '1-based line the quote starts on' },
                quote: { type: 'string', description: 'Exact code copied from the file' },
              },
              required: ['file', 'line', 'quote'],
            },
          },
        },
        required: ['citations'],
      },
    })
    return next(e)
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const citations = (e as unknown as { citations?: Citation[] }).citations ?? []
    const files = new Map<string, Promise<string | undefined>>()
    const read = (f: string) => {
      if (!files.has(f)) files.set(f, $.fs.read(f).then(t => t as string, () => undefined))
      return files.get(f)!
    }

    const results: Checked[] = await Promise.all(
      citations.map(async c => {
        const text = await read(c.file)
        return text === undefined
          ? { ...c, status: 'missing' as const, reason: 'file not readable' }
          : { ...c, ...checkQuote(text, c.line, c.quote) }
      }),
    )

    const count = (s: string) => results.filter(r => r.status === s).length
    const summary = { found: count('found'), moved: count('moved'), missing: count('missing') }
    $.ui.status(`re-audit: ${summary.found} found · ${summary.moved} moved · ${summary.missing} dropped`)
    return { result: JSON.stringify({ summary, results }, null, 2) }
  }).catch(() => ({ deny: 're-audit: verify_quotes failed on this input; check the quotes with Grep instead.' }))
}
