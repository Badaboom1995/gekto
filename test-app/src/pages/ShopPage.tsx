import { useState, useMemo, useCallback } from 'react'
import { ProductCard } from '../components/shop/ProductCard'
import { FiltersSidebar } from '../components/shop/FiltersSidebar'
import type { FiltersState, Category } from '../components/shop/FiltersSidebar'
import Pagination from '../components/shop/Pagination'
import { products, categories } from '../data/products'
import type { Product } from '../data/products'

const ITEMS_PER_PAGE_DEFAULT = 12
const MAX_PRICE = 5000

const categoryOptions: Category[] = categories.map(cat => ({
  id: cat.toLowerCase(),
  label: cat,
}))

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FiltersState>({
    categories: [],
    priceRange: { min: 0, max: MAX_PRICE },
    rating: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name'>('featured')

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (filters.categories.length > 0) {
      result = result.filter(product =>
        filters.categories.includes(product.category.toLowerCase())
      )
    }

    result = result.filter(product =>
      product.price >= filters.priceRange.min &&
      product.price <= filters.priceRange.max
    )

    if (filters.rating !== null) {
      result = result.filter(product => product.rating >= filters.rating!)
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'featured':
      default:
        result.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating
          return b.reviews - a.reviews
        })
        break
    }

    return result
  }, [searchQuery, filters, sortBy])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const handleFilterChange = useCallback((newFilters: FiltersState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }, [])

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }, [])

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product)
  }

  const handleBuyNow = (product: Product) => {
    console.log('Buy now:', product)
  }

  const categoriesWithCounts: Category[] = useMemo(() => {
    return categoryOptions.map(cat => ({
      ...cat,
      count: products.filter(p => p.category.toLowerCase() === cat.id).length,
    }))
  }, [])

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', paddingTop: 80, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Shop</h1>
          <p style={{ color: '#9ca3af' }}>
            Discover our collection of vintage computers and classic computing hardware
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <svg
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search computers, brands, or categories..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  width: '100%',
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  borderRadius: 8,
                  padding: '12px 16px 12px 44px',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#9ca3af', whiteSpace: 'nowrap' }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                backgroundColor: '#111',
                border: '1px solid #222',
                borderRadius: 8,
                padding: '12px 16px',
                color: 'white',
                fontSize: 14,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Main Content - Filters on left, Products on right */}
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Filters Sidebar - On the left */}
          <FiltersSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categoriesWithCounts}
            maxPrice={MAX_PRICE}
          />

          {/* Products Grid */}
          <div style={{ flex: 1 }}>
            {/* Results Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>
                Showing <span style={{ color: 'white', fontWeight: 500 }}>{paginatedProducts.length}</span> of{' '}
                <span style={{ color: 'white', fontWeight: 500 }}>{filteredProducts.length}</span> products
              </p>
            </div>

            {/* Products Grid - 3 per row */}
            {paginatedProducts.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}>
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onBuyNow={() => handleBuyNow(product)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 0',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  marginBottom: 16,
                  borderRadius: '50%',
                  backgroundColor: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg style={{ width: 32, height: 32, color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 8 }}>No products found</h3>
                <p style={{ color: '#9ca3af', maxWidth: 320 }}>
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}

            {/* Pagination */}
            <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #222' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={setCurrentPage}
                showItemsPerPage={false}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
