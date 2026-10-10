import { expect, test } from 'claude-code/testing'

const FILES: Record<string, string> = {
  'calc.py': 'def average(nums):\n    return sum(nums) / len(nums)\n',
}

test('verify_quotes checks each citation and sets the status line', async ($, on) => {
  on('fs.read', ($, e) => {
    const text = FILES[e.path.split('/').pop()!]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e) => (statuses.push(e.text), { value: undefined }))

  const { result } = await $.tool.call({
    tool: 'mcp__re-audit__verify_quotes',
    citations: [
      { file: 'calc.py', line: 2, quote: 'return sum(nums) / len(nums)' },
      { file: 'calc.py', line: 1, quote: 'return sum(nums) / len(nums)' },
      { file: 'calc.py', line: 2, quote: 'if not nums: return 0' },
      { file: 'nope.py', line: 1, quote: 'x' },
    ],
  })
  const out = JSON.parse(result as string)

  expect(out.summary).toEqual({ found: 1, moved: 1, missing: 2 })
  expect(out.results.map((r: { status: string }) => r.status)).toEqual(['found', 'moved', 'missing', 'missing'])
  expect(out.results[1].line).toBe(2)
  expect(out.results[3].reason).toBe('file not readable')
  expect(statuses).toEqual(['re-audit: 1 found · 1 moved · 2 dropped'])
})

test('verify_quotes with no citations reports zeros', async ($, on) => {
  on('ui.status', () => ({ value: undefined }))
  const { result } = await $.tool.call({ tool: 'mcp__re-audit__verify_quotes', citations: [] })
  expect(JSON.parse(result as string).summary).toEqual({ found: 0, moved: 0, missing: 0 })
})

test('bad input is refused with a Grep fallback hint', async ($, on) => {
  on('fs.read', () => ({ value: 'x = 1\n' }))
  const out = await $.tool.call({ tool: 'mcp__re-audit__verify_quotes', citations: [{ file: 'a.py', line: 1, quote: 42 }] })
  expect(out.deny).toContain('Grep')
})
