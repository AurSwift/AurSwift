import { describe, expect, it } from 'vitest'

import type { Category } from '../../../../../packages/renderer/src/features/inventory/hooks/use-product-data'
import { buildCategoryTree } from '../../../../../packages/renderer/src/features/inventory/utils'

describe('buildCategoryTree', () => {
  function generateCategories(count: number): Category[] {
    const categories: Category[] = []
    const now = new Date().toISOString()
    const rootCount = Math.floor(count * 0.3)
    const rootIds: string[] = []

    for (let i = 0; i < rootCount; i++) {
      const id = `root-${i}`
      rootIds.push(id)
      categories.push({
        id,
        name: `Root Category ${i}`,
        description: `Description ${i}`,
        businessId: 'test-business',
        parentId: null,
        sortOrder: i,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: now,
        updatedAt: null,
      })
    }

    for (let i = 0; i < count - rootCount; i++) {
      categories.push({
        id: `child-${i}`,
        name: `Child Category ${i}`,
        description: `Child Description ${i}`,
        businessId: 'test-business',
        parentId: rootIds[i % rootIds.length],
        sortOrder: i,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: now,
        updatedAt: null,
      })
    }

    return categories
  }

  it('builds a nested tree structure from flat categories', () => {
    const categories = generateCategories(10)
    const tree = buildCategoryTree(categories)

    expect(tree.length).toBeGreaterThan(0)
    tree.forEach(root => {
      expect(root.parentId).toBeNull()
    })

    const totalChildren = tree.reduce((sum, root) => sum + root.children.length, 0)
    expect(totalChildren).toBeGreaterThan(0)
  })

  it('returns an empty array when input is empty', () => {
    expect(buildCategoryTree([])).toEqual([])
  })

  it('keeps root-only categories as root nodes', () => {
    const categories: Category[] = [
      {
        id: '1',
        name: 'Category 1',
        description: '',
        businessId: 'test',
        parentId: null,
        sortOrder: 0,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
      {
        id: '2',
        name: 'Category 2',
        description: '',
        businessId: 'test',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ]

    const tree = buildCategoryTree(categories)
    expect(tree).toHaveLength(2)
    expect(tree[0].children).toHaveLength(0)
    expect(tree[1].children).toHaveLength(0)
  })

  it('sorts categories by sortOrder at each level', () => {
    const categories: Category[] = [
      {
        id: '1',
        name: 'Category B',
        description: '',
        businessId: 'test',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
      {
        id: '2',
        name: 'Category A',
        description: '',
        businessId: 'test',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ]

    const tree = buildCategoryTree(categories)
    expect(tree[0].name).toBe('Category A')
    expect(tree[1].name).toBe('Category B')
  })

  it('promotes orphan categories to root level', () => {
    const categories: Category[] = [
      {
        id: 'child-1',
        name: 'Orphaned Child',
        description: '',
        businessId: 'test',
        parentId: 'non-existent-parent',
        sortOrder: 0,
        isActive: true,
        vatCategoryId: null,
        vatOverridePercent: null,
        color: null,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ]

    const tree = buildCategoryTree(categories)
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('child-1')
  })
})
