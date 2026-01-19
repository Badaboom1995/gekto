import { useState } from 'react';
import './ShippingPage.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface ShippingRegion {
  region: string;
  standardTime: string;
  standardCost: string;
  expressTime: string;
  expressCost: string;
}

const shippingRegions: ShippingRegion[] = [
  {
    region: 'Continental US',
    standardTime: '5-7 business days',
    standardCost: '$9.99',
    expressTime: '2-3 business days',
    expressCost: '$24.99',
  },
  {
    region: 'Alaska & Hawaii',
    standardTime: '7-10 business days',
    standardCost: '$19.99',
    expressTime: '3-5 business days',
    expressCost: '$39.99',
  },
  {
    region: 'Canada',
    standardTime: '10-14 business days',
    standardCost: '$29.99',
    expressTime: '5-7 business days',
    expressCost: '$49.99',
  },
  {
    region: 'Europe',
    standardTime: '14-21 business days',
    standardCost: '$49.99',
    expressTime: '7-10 business days',
    expressCost: '$79.99',
  },
  {
    region: 'Asia & Pacific',
    standardTime: '14-28 business days',
    standardCost: '$59.99',
    expressTime: '10-14 business days',
    expressCost: '$99.99',
  },
  {
    region: 'Rest of World',
    standardTime: '21-35 business days',
    standardCost: '$69.99',
    expressTime: '14-21 business days',
    expressCost: '$119.99',
  },
];

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: 'How long does shipping take?',
    answer: 'Shipping times vary by location and shipping method. Continental US orders typically arrive within 5-7 business days for standard shipping or 2-3 business days for express. International orders may take 2-5 weeks depending on the destination.',
  },
  {
    id: 2,
    question: 'Do you ship internationally?',
    answer: 'Yes! We ship to most countries worldwide. International shipping rates and delivery times vary by destination. Please note that customers are responsible for any customs duties or import taxes that may apply.',
  },
  {
    id: 3,
    question: 'How can I track my order?',
    answer: 'Once your order ships, you will receive an email with a tracking number and a link to track your package. You can also view tracking information in your account under "Order History".',
  },
  {
    id: 4,
    question: 'What carriers do you use?',
    answer: 'We primarily ship via UPS, FedEx, and USPS for domestic orders. International shipments are handled by DHL, UPS International, or local postal services depending on the destination.',
  },
  {
    id: 5,
    question: 'Can I change my shipping address after placing an order?',
    answer: 'If your order has not yet shipped, please contact us immediately at support@retropc.com and we will do our best to update the shipping address. Once an order has shipped, address changes cannot be made.',
  },
  {
    id: 6,
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free standard shipping on orders over $200 within the Continental US. Subscribe to our newsletter to stay updated on special free shipping promotions.',
  },
  {
    id: 7,
    question: 'What happens if my package is lost or damaged?',
    answer: 'All packages are insured. If your package is lost or arrives damaged, please contact us within 48 hours of delivery (or expected delivery for lost packages) with photos of any damage. We will work with the carrier to file a claim and arrange a replacement or refund.',
  },
  {
    id: 8,
    question: 'Do you ship to P.O. Boxes?',
    answer: 'We can ship smaller items to P.O. Boxes via USPS. However, larger vintage computers and monitors must be shipped to a physical address due to carrier restrictions.',
  },
];

function ShippingPage() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="shipping-page">
      {/* Hero Section */}
      <section className="shipping-hero">
        <div className="shipping-hero-overlay">
          <h1 className="shipping-hero-title">Shipping</h1>
        </div>
        <div className="shipping-hero-content">
          <h2 className="shipping-hero-heading">
            Shipping <span className="highlight">Information</span>
          </h2>
          <p className="shipping-hero-subtitle">
            Learn about our shipping policies, delivery times, and how to track your vintage computer orders.
          </p>
        </div>
      </section>

      {/* Shipping Policies Section */}
      <section className="shipping-section">
        <div className="shipping-container">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h2>Shipping Policies</h2>
          </div>
          <div className="policy-cards">
            <div className="policy-card">
              <h3>Processing Time</h3>
              <p>Orders are processed within 1-2 business days. During peak seasons or sales events, processing may take up to 3 business days. You will receive a confirmation email once your order ships.</p>
            </div>
            <div className="policy-card">
              <h3>Packaging</h3>
              <p>All vintage computers are carefully packaged with anti-static materials, custom foam inserts, and double-boxed to ensure safe delivery. We take extra care with delicate CRT monitors and rare collectibles.</p>
            </div>
            <div className="policy-card">
              <h3>Insurance</h3>
              <p>Every shipment is fully insured against loss or damage during transit. For high-value items over $500, signature confirmation is required upon delivery.</p>
            </div>
            <div className="policy-card">
              <h3>Business Days</h3>
              <p>Business days are Monday through Friday, excluding federal holidays. Orders placed on weekends or holidays will be processed on the next business day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Times & Costs Section */}
      <section className="shipping-section alt-bg">
        <div className="shipping-container">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <h2>Delivery Times & Costs</h2>
          </div>
          <p className="section-description">
            Shipping costs are calculated based on destination and package weight. Free standard shipping on orders over $200 (Continental US only).
          </p>
          <div className="shipping-table-wrapper">
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Standard Shipping</th>
                  <th>Express Shipping</th>
                </tr>
              </thead>
              <tbody>
                {shippingRegions.map((region, index) => (
                  <tr key={index}>
                    <td className="region-name">{region.region}</td>
                    <td>
                      <div className="shipping-option">
                        <span className="shipping-time">{region.standardTime}</span>
                        <span className="shipping-cost">{region.standardCost}</span>
                      </div>
                    </td>
                    <td>
                      <div className="shipping-option">
                        <span className="shipping-time">{region.expressTime}</span>
                        <span className="shipping-cost">{region.expressCost}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            * Delivery times are estimates and may vary due to customs processing, weather, or carrier delays.
          </p>
        </div>
      </section>

      {/* Shipping Methods Section */}
      <section className="shipping-section">
        <div className="shipping-container">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h2>Shipping Methods</h2>
          </div>
          <div className="methods-grid">
            <div className="method-card">
              <div className="method-icon standard">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h3>Standard Shipping</h3>
              <p>Our most economical option. Perfect for non-urgent orders. Includes full tracking and insurance coverage.</p>
              <ul className="method-features">
                <li>Full tracking included</li>
                <li>Insurance coverage</li>
                <li>Signature on delivery (for orders over $500)</li>
              </ul>
            </div>
            <div className="method-card featured">
              <div className="method-badge">Most Popular</div>
              <div className="method-icon express">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3>Express Shipping</h3>
              <p>Get your vintage tech faster with our expedited service. Ideal for collectors who can't wait.</p>
              <ul className="method-features">
                <li>Priority handling</li>
                <li>Real-time tracking updates</li>
                <li>Guaranteed delivery window</li>
                <li>Premium packaging</li>
              </ul>
            </div>
            <div className="method-card">
              <div className="method-icon freight">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h3>Freight Shipping</h3>
              <p>For large items like mainframes, arcade cabinets, and bulk orders. Contact us for a custom quote.</p>
              <ul className="method-features">
                <li>White glove delivery available</li>
                <li>Inside delivery options</li>
                <li>Custom crating</li>
                <li>Scheduled delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="shipping-section alt-bg">
        <div className="shipping-container">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2>Tracking Your Order</h2>
          </div>
          <div className="tracking-content">
            <div className="tracking-info">
              <p>
                Stay updated on your order's journey from our warehouse to your doorstep. Here's how to track your package:
              </p>
              <div className="tracking-steps">
                <div className="tracking-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Order Confirmation</h4>
                    <p>Receive your order confirmation email with order details.</p>
                  </div>
                </div>
                <div className="tracking-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Shipping Notification</h4>
                    <p>Get a shipping confirmation email with your tracking number.</p>
                  </div>
                </div>
                <div className="tracking-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Track Online</h4>
                    <p>Click the tracking link or enter your tracking number on the carrier's website.</p>
                  </div>
                </div>
                <div className="tracking-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Delivery</h4>
                    <p>Receive your vintage computer and enjoy!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="tracking-box">
              <h3>Track Your Package</h3>
              <p>Enter your tracking number to get the latest status.</p>
              <div className="tracking-form">
                <input
                  type="text"
                  placeholder="Enter tracking number"
                  className="tracking-input"
                />
                <button className="btn btn-primary">Track</button>
              </div>
              <div className="carrier-links">
                <span>Or track directly with:</span>
                <div className="carrier-buttons">
                  <a href="https://www.ups.com/track" target="_blank" rel="noopener noreferrer" className="carrier-link">UPS</a>
                  <a href="https://www.fedex.com/en-us/tracking.html" target="_blank" rel="noopener noreferrer" className="carrier-link">FedEx</a>
                  <a href="https://tools.usps.com/go/TrackConfirmAction_input" target="_blank" rel="noopener noreferrer" className="carrier-link">USPS</a>
                  <a href="https://www.dhl.com/en/express/tracking.html" target="_blank" rel="noopener noreferrer" className="carrier-link">DHL</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="shipping-section">
        <div className="shipping-container">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className={`faq-item ${openFaqId === item.id ? 'open' : ''}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(item.id)}
                  aria-expanded={openFaqId === item.id}
                >
                  <span>{item.question}</span>
                  <svg
                    className="faq-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="shipping-cta">
        <h2>Still Have Questions?</h2>
        <p>Our support team is here to help with any shipping inquiries.</p>
        <div className="cta-buttons">
          <a href="mailto:support@retropc.com" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Support
          </a>
          <a href="/contact" className="btn btn-outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}

export default ShippingPage;
