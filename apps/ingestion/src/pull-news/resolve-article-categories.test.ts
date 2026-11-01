import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  addToCategoryFilingIndex,
  buildCategoryFilingIndex,
  resolveArticleCategories,
  type FilingCategory,
} from './resolve-article-categories.ts'

const categories: FilingCategory[] = [
  { id: 1, parentId: null, medtopId: 'medtop:01000000' },
  { id: 6, parentId: null, medtopId: 'medtop:04000000' },
  { id: 18, parentId: null, medtopId: null },
  { id: 49, parentId: 6, medtopId: 'medtop:20000344' },
  { id: 204, parentId: 49, medtopId: 'medtop:20000350' },
]

const categoryIndex = buildCategoryFilingIndex(categories)

describe('resolveArticleCategories', () => {
  it('when the only topic is central bank, then the pin is Finance and the join includes that topic and each ancestor', () => {
    const resolved = resolveArticleCategories(categoryIndex, ['medtop:20000350'])
    assert.equal(resolved.categoryId, 6)
    assert.deepEqual(resolved.categoryIds, [204, 49, 6])
    assert.equal(resolved.unknownTopics, 0)
  })

  it('when two topics match, then the pin is the root with the smallest id', () => {
    const resolved = resolveArticleCategories(categoryIndex, ['medtop:20000350', 'medtop:01000000'])
    assert.equal(resolved.categoryId, 1)
    assert.deepEqual(resolved.categoryIds, [204, 49, 6, 1])
  })

  it('when no topic matches, then the pin is the loaded root with no medtop id', () => {
    const loaded: FilingCategory[] = [
      { id: 6, parentId: null, medtopId: 'medtop:04000000' },
      { id: 77, parentId: null, medtopId: null },
    ]
    const resolved = resolveArticleCategories(buildCategoryFilingIndex(loaded), ['medtop:99999999'])
    assert.equal(resolved.categoryId, 77)
    assert.deepEqual(resolved.categoryIds, [77])
    assert.equal(resolved.unknownTopics, 1)
  })

  it('when one topic is unknown, then the pin uses the known topic and the unknown topic is counted', () => {
    const resolved = resolveArticleCategories(categoryIndex, ['medtop:20000350', 'medtop:99999999'])
    assert.equal(resolved.categoryId, 6)
    assert.deepEqual(resolved.categoryIds, [204, 49, 6])
    assert.equal(resolved.unknownTopics, 1)
  })

  it('when a category is added under a known parent, then the next resolve includes that chain', () => {
    const next = buildCategoryFilingIndex(categories)
    addToCategoryFilingIndex(next, { id: 1087, parentId: 204, medtopId: 'medtop:20009999' })
    const resolved = resolveArticleCategories(next, ['medtop:20009999'])
    assert.equal(resolved.categoryId, 6)
    assert.deepEqual(resolved.categoryIds, [1087, 204, 49, 6])
    assert.equal(resolved.unknownTopics, 0)
  })

  it('when two children share an ancestor, then that ancestor keeps the higher score', () => {
    const next = buildCategoryFilingIndex(categories)
    addToCategoryFilingIndex(next, { id: 50, parentId: 6, medtopId: 'medtop:20000349' })
    const scores = new Map<string, number | null>([
      ['medtop:20000350', 0.2],
      ['medtop:20000349', 0.9],
    ])
    const resolved = resolveArticleCategories(next, ['medtop:20000350', 'medtop:20000349'], scores)
    assert.equal(resolved.filedCategories.find((row) => row.categoryId === 6)?.score, 0.9)
    assert.equal(resolved.filedCategories.find((row) => row.categoryId === 204)?.score, 0.2)
  })

  it('when a category parent is missing from the loaded set, then the index build fails', () => {
    const broken: FilingCategory[] = [
      { id: 6, parentId: null, medtopId: 'medtop:04000000' },
      { id: 18, parentId: null, medtopId: null },
      { id: 204, parentId: 49, medtopId: 'medtop:20000350' },
    ]
    assert.throws(() => buildCategoryFilingIndex(broken), /category 204 is missing parent 49/)
  })
})
