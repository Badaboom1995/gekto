import { Link } from 'react-router-dom'
import { Product } from '../App'
import './ComparisonTable.css'

interface ComparisonTableProps {
  products: Product[]
  onRemove: (productId: number) => void
  onAddToCart: (products: Product[]) => void
}

export function ComparisonTable({ products, onRemove, onAddToCart }: ComparisonTableProps) {
  if (products.length === 0) {
    return (
      <div className="comparison-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 11H7.82a2 2 0 0 0-1.82 1.18l-2.6 6.15A2 2 0 0 0 3.4 21h17.2a2 2 0 0 0 1.8-2.67l-2.6-6.15A2 2 0 0 0 16.18 12H15"/>
          <circle cx="6" cy="5" r="2"/>
          <path d="M12 7V5m6 0v2"/>
        </svg>
        <p>No products selected for comparison</p>
        <Link to="/shop" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="comparison-container">
      <div className="comparison-actions">
        <button className="btn btn-primary" onClick={() => onAddToCart(products)}>
          Add All to Cart
        </button>
        <span className="comparison-count">{products.length} of 5 products</span>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="comparison-label-col">Specifications</th>
              {products.map(product => (
                <th key={product.id} className="comparison-product-col">
                  <div className="product-header">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-category">{product.category}</p>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => onRemove(product.id)}
                      title="Remove from comparison"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="comparison-label">Price</td>
              {products.map(product => (
                <td key={product.id} className="comparison-value">
                  <span className="price">${product.price.toFixed(2)}</span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="comparison-label">Rating</td>
              {products.map(product => (
                <td key={product.id} className="comparison-value">
                  <div className="rating">
                    <span className="rating-stars">★</span>
                    <span className="rating-value">{product.rating}</span>
                    <span className="rating-count">({(product.reviews / 1000).toFixed(1)}k)</span>
                  </div>
                </td>
              ))}
            </tr>

            <tr>
              <td className="comparison-label">Stock Status</td>
              {products.map(product => (
                <td key={product.id} className="comparison-value">
                  <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                    {product.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="comparison-label">Actions</td>
              {products.map(product => (
                <td key={product.id} className="comparison-value">
                  <div className="action-buttons">
                    <button className="btn btn-outline btn-small">Add to Cart</button>
                    <Link to={`/product/${product.id}`} className="btn btn-primary btn-small">
                      View
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
