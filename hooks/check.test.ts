import { describe, expect, test } from 'claude-code/testing'
import { checkQuote } from './check'

const FILE = [
  'def average(nums):',
  '    total = sum(nums)',
  '    return total / len(nums)',
  '',
  'def unused():',
  '    return 1',
].join('\n')

describe('checkQuote', () => {
  test('found on the cited line', () => {
    expect(checkQuote(FILE, 3, 'return total / len(nums)')).toEqual({ status: 'found' })
  })

  test('ignores extra or missing spaces', () => {
    expect(checkQuote(FILE, 2, 'total  =  sum(nums)')).toEqual({ status: 'found' })
  })

  test('multi-line quote starting at the cited line', () => {
    expect(checkQuote(FILE, 2, 'total = sum(nums)\n    return total / len(nums)')).toEqual({ status: 'found' })
  })

  test('real quote at the wrong line reports where it is', () => {
    expect(checkQuote(FILE, 1, 'return total / len(nums)')).toEqual({ status: 'moved', line: 3 })
  })

  test('quote seen twice picks the nearest one', () => {
    const twice = 'x = 1\ny = 2\nx = 1\nz = 3\nw = 4\nx = 1'
    expect(checkQuote(twice, 5, 'x = 1')).toEqual({ status: 'moved', line: 6 })
  })

  test('line past the end still finds a real quote', () => {
    expect(checkQuote(FILE, 99, 'def unused():')).toEqual({ status: 'moved', line: 5 })
  })

  test('line 0 or negative still finds a real quote', () => {
    expect(checkQuote(FILE, 0, 'def average(nums):')).toEqual({ status: 'moved', line: 1 })
    expect(checkQuote(FILE, -3, 'def average(nums):')).toEqual({ status: 'moved', line: 1 })
  })

  test('invented quote is missing', () => {
    expect(checkQuote(FILE, 3, 'if not nums: return 0')).toEqual({ status: 'missing' })
  })

  test('empty or blank quote is missing (nothing to check)', () => {
    expect(checkQuote(FILE, 1, '')).toEqual({ status: 'missing' })
    expect(checkQuote(FILE, 1, '   \n  ')).toEqual({ status: 'missing' })
  })

  test('empty file is missing', () => {
    expect(checkQuote('', 1, 'anything')).toEqual({ status: 'missing' })
  })

  test('Windows line endings', () => {
    expect(checkQuote('a = 1\r\nb = 2\r\n', 2, 'b = 2')).toEqual({ status: 'found' })
  })
})
