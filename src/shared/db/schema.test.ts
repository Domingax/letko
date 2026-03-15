import { describe, it, expect } from 'vitest'
import { languages, books, sections, tokens, vocabulary, readingProgress } from './schema'

describe('Drizzle schema', () => {
  it('exports all 6 tables', () => {
    expect(languages).toBeDefined()
    expect(books).toBeDefined()
    expect(sections).toBeDefined()
    expect(tokens).toBeDefined()
    expect(vocabulary).toBeDefined()
    expect(readingProgress).toBeDefined()
  })
  it('vocabulary has wordKey and language columns', () => {
    expect(Object.keys(vocabulary)).toContain('wordKey')
    expect(Object.keys(vocabulary)).toContain('language')
  })
  it('readingProgress has sectionId FK (not sectionIndex)', () => {
    expect(Object.keys(readingProgress)).toContain('sectionId')
    expect(Object.keys(readingProgress)).not.toContain('sectionIndex')
  })
  it('books has language FK column', () => {
    expect(Object.keys(books)).toContain('language')
  })
})
