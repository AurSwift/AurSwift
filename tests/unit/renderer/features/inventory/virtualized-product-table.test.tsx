import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { VirtualizedProductTable } from '../../../../../packages/renderer/src/features/inventory/components/product/virtualized-product-table'
import type { Category } from '../../../../../packages/renderer/src/features/inventory/hooks/use-product-data'
import type { Product } from '../../../../../packages/renderer/src/types/domain'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  })),
}))

describe('VirtualizedProductTable', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Category 1',
      description: '',
      businessId: 'business-1',
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
  ]

  const showFields = {
    name: true,
    category: true,
    price: true,
    stock: true,
    sku: true,
    status: true,
  }

  const handlers = {
    onEditProduct: vi.fn(),
    onDeleteProduct: vi.fn(),
    onAdjustStock: vi.fn(),
  }

  function generateProducts(count: number): Product[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `prod-${i}`,
      name: `Product ${i}`,
      description: `Description for product ${i}`,
      businessId: 'business-1',
      categoryId: 'cat-1',
      basePrice: 10 + i * 0.5,
      costPrice: 5 + i * 0.25,
      stockLevel: 100 - i,
      minStockLevel: 10,
      isActive: true,
      sku: `SKU-${i}`,
      barcode: null,
      image: null,
      usesScale: false,
      salesUnit: 'UNIT',
      vatCategoryId: null,
      pricePerKg: null,
      batchTracking: false,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }))
  }

  it('renders table headers for configured columns', () => {
    render(
      <VirtualizedProductTable
        products={[]}
        categories={mockCategories}
        showFields={showFields}
        {...handlers}
      />
    )

    expect(screen.getByText('Image')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Stock')).toBeInTheDocument()
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('mounts successfully with a large product dataset', () => {
    const products = generateProducts(10000)
    const { container } = render(
      <VirtualizedProductTable
        products={products}
        categories={mockCategories}
        showFields={showFields}
        {...handlers}
      />
    )

    expect(container.firstChild).toBeTruthy()
  })

  it('can mount and unmount repeatedly without throwing', () => {
    const products100 = generateProducts(100)
    const products10000 = generateProducts(10000)

    const { unmount: unmount1 } = render(
      <VirtualizedProductTable
        products={products100}
        categories={mockCategories}
        showFields={showFields}
        {...handlers}
      />
    )
    unmount1()

    const { container, unmount: unmount2 } = render(
      <VirtualizedProductTable
        products={products10000}
        categories={mockCategories}
        showFields={showFields}
        {...handlers}
      />
    )

    expect(container.firstChild).toBeTruthy()
    unmount2()
  })
})
