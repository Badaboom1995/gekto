import { useState } from 'react'
import { Link } from 'react-router-dom'
import './BasketPage.css'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  inStock: boolean
  maxQuantity: number
}

// Mock cart data - in a real app this would come from context/state management
const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'IBM PC 5150',
    price: 2499.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&h=200&fit=crop',
    inStock: true,
    maxQuantity: 5
  },
  {
    id: 2,
    name: 'Commodore 64',
    price: 899.99,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
    inStock: true,
    maxQuantity: 10
  },
  {
    id: 3,
    name: 'Apple Macintosh 128K',
    price: 3499.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop',
    inStock: true,
    maxQuantity: 3
  }
]

function BasketPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)
  const [removingItemId, setRemovingItemId] = useState<number | null>(null)

  const updateQuantity = (id: number, newQuantity: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.maxQuantity, newQuantity)) }
          : item
      )
    )
  }

  const removeItem = (id: number) => {
    setRemovingItemId(id)
    setTimeout(() => {
      setCartItems(items => items.filter(item => item.id !== id))
      setRemovingItemId(null)
    }, 300)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 500 ? 0 : 29.99
  const taxRate = 0.08
  const tax = subtotal * taxRate
  const total = subtotal + shipping + tax
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (cartItems.length === 0) {
    return (
      <div className="basket-page">
        <div className="basket-container">
          <div className="empty-basket">
            <div className="empty-basket-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h2 className="empty-basket-title">Your basket is empty</h2>
            <p className="empty-basket-text">Looks like you haven't added any items to your basket yet.</p>
            <Link to="/shop" className="btn btn-primary btn-large">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="basket-page">
      <div className="basket-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/shop">Shop</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Shopping Basket</span>
        </nav>

        {/* Page Header */}
        <div className="basket-header">
          <h1 className="basket-title">Shopping Basket</h1>
          <p className="basket-subtitle">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your basket</p>
        </div>

        {/* Main Content */}
        <div className="basket-layout">
          {/* Cart Items */}
          <div className="basket-items-section">
            <div className="basket-table-wrapper">
              <table className="basket-table">
                <thead>
                  <tr>
                    <th className="th-product">Product</th>
                    <th className="th-price">Price</th>
                    <th className="th-quantity">Quantity</th>
                    <th className="th-subtotal">Subtotal</th>
                    <th className="th-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr
                      key={item.id}
                      className={`basket-item-row ${removingItemId === item.id ? 'removing' : ''}`}
                    >
                      <td className="td-product">
                        <div className="product-cell">
                          <div className="product-image">
                            <img src={item.image} alt={item.name} />
                          </div>
                          <div className="product-info">
                            <Link to={`/product/${item.id}`} className="product-name">
                              {item.name}
                            </Link>
                            <span className={`stock-badge ${item.inStock ? 'in-stock' : 'out-of-stock'}`}>
                              <span className="stock-dot"></span>
                              {item.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="td-price">
                        <span className="item-price">{formatPrice(item.price)}</span>
                      </td>
                      <td className="td-quantity">
                        <div className="quantity-selector">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="td-subtotal">
                        <span className="item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                      </td>
                      <td className="td-actions">
                        <button
                          className="remove-btn"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from basket`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cart Items */}
            <div className="basket-items-mobile">
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className={`basket-item-card ${removingItemId === item.id ? 'removing' : ''}`}
                >
                  <div className="item-card-header">
                    <div className="product-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="item-card-info">
                      <Link to={`/product/${item.id}`} className="product-name">
                        {item.name}
                      </Link>
                      <span className={`stock-badge ${item.inStock ? 'in-stock' : 'out-of-stock'}`}>
                        <span className="stock-dot"></span>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span className="item-price">{formatPrice(item.price)}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from basket`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div className="item-card-footer">
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="basket-continue">
              <Link to="/shop" className="btn btn-outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="basket-summary-section">
            <div className="basket-summary">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="summary-value">{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    Shipping
                    {shipping === 0 && <span className="free-shipping-badge">FREE</span>}
                  </span>
                  <span className="summary-value">
                    {shipping === 0 ? formatPrice(0) : formatPrice(shipping)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Estimated Tax</span>
                  <span className="summary-value">{formatPrice(tax)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="free-shipping-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>Add {formatPrice(500 - subtotal)} more for free shipping!</span>
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">Total</span>
                <span className="total-value">{formatPrice(total)}</span>
              </div>

              <button className="btn btn-primary btn-checkout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Proceed to Checkout
              </button>

              <div className="payment-methods">
                <span className="payment-label">We accept</span>
                <div className="payment-icons">
                  <span className="payment-icon">Visa</span>
                  <span className="payment-icon">MC</span>
                  <span className="payment-icon">Amex</span>
                  <span className="payment-icon">PayPal</span>
                </div>
              </div>

              <div className="security-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="promo-code-section">
              <h3 className="promo-title">Have a promo code?</h3>
              <div className="promo-input-group">
                <input
                  type="text"
                  className="promo-input"
                  placeholder="Enter code"
                  aria-label="Promo code"
                />
                <button className="btn btn-outline promo-btn">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BasketPage
