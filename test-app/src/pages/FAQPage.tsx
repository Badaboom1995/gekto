import { useState } from 'react';
import { Link } from 'react-router-dom';
import './FAQPage.css';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'General',
    question: 'What is RetroPC?',
    answer: 'RetroPC is the premier destination for vintage computer collectors and enthusiasts. We specialize in sourcing, restoring, and selling authentic vintage computers from the golden era of personal computing, including classics like the Commodore 64, Apple II, IBM PC, and many more.'
  },
  {
    category: 'General',
    question: 'Are all your computers authentic and original?',
    answer: 'Yes! Every machine in our collection is verified for authenticity with complete provenance documentation. We never sell reproductions or replicas without clearly labeling them as such. Each computer comes with a certificate of authenticity.'
  },
  {
    category: 'General',
    question: 'Do you offer any warranty on vintage computers?',
    answer: 'We offer a 90-day warranty on all restored computers. This covers any defects in our restoration work. Given the age of these machines, we cannot guarantee against wear-related issues, but our expert technicians thoroughly test each unit before shipping.'
  },
  {
    category: 'Ordering',
    question: 'How do I place an order?',
    answer: 'Simply browse our collection, add items to your cart, and proceed to checkout. You can pay using major credit cards, PayPal, or bank transfer for larger purchases. Once your order is confirmed, we\'ll prepare your vintage computer for safe shipping.'
  },
  {
    category: 'Ordering',
    question: 'Can I reserve a computer before purchasing?',
    answer: 'Yes, we offer a 48-hour reservation on any item with a 10% non-refundable deposit. This ensures the computer is held for you while you finalize your decision. Contact us directly for reservation requests on rare or high-value items.'
  },
  {
    category: 'Ordering',
    question: 'Do you accept trade-ins?',
    answer: 'Absolutely! We welcome trade-ins of vintage computers and related equipment. Contact us with details and photos of your items, and we\'ll provide a fair trade-in value that can be applied toward your purchase.'
  },
  {
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to over 50 countries worldwide. International shipping rates are calculated at checkout based on your location and the size/weight of your order. All international shipments include tracking and insurance.'
  },
  {
    category: 'Shipping',
    question: 'How are vintage computers packaged for shipping?',
    answer: 'We use custom packaging designed specifically for vintage electronics. Each computer is carefully wrapped in anti-static materials, surrounded by high-density foam, and placed in double-walled boxes. We also include silica gel packets to prevent moisture damage during transit.'
  },
  {
    category: 'Shipping',
    question: 'How long does shipping take?',
    answer: 'Domestic orders typically arrive within 5-7 business days. International shipping varies by destination but usually takes 10-21 business days. Express shipping options are available at checkout for faster delivery.'
  },
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for items in their original condition. Returned items must include all original accessories, documentation, and packaging. Refunds are processed within 5-7 business days after we receive and inspect the returned item.'
  },
  {
    category: 'Returns',
    question: 'What if my computer arrives damaged?',
    answer: 'In the rare event of shipping damage, please document the damage with photos immediately upon receipt and contact us within 48 hours. All shipments are insured, and we\'ll work with you to arrange a replacement or full refund.'
  },
  {
    category: 'Technical',
    question: 'Do restored computers come with power supplies?',
    answer: 'Yes, all restored computers include a working, tested power supply appropriate for your region. We use original power supplies when possible, or high-quality replacements that meet original specifications.'
  },
  {
    category: 'Technical',
    question: 'Can I get help setting up my vintage computer?',
    answer: 'We provide detailed setup guides with every purchase and offer free email support for setup questions. For more complex needs, we offer paid remote consultation sessions with our vintage computing experts.'
  },
  {
    category: 'Technical',
    question: 'Do you sell replacement parts and accessories?',
    answer: 'Yes, we maintain an inventory of replacement parts, cables, peripherals, and accessories for most popular vintage systems. Check our accessories section or contact us for specific part availability.'
  }
];

const categories = ['All', 'General', 'Ordering', 'Shipping', 'Returns', 'Technical'];

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs = selectedCategory === 'All'
    ? faqData
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <section className="faq-hero">
        <div className="faq-hero-overlay">
          <h1 className="faq-hero-title">FAQ</h1>
        </div>
        <div className="faq-hero-content">
          <h2 className="faq-hero-heading">
            Frequently Asked <span className="highlight">Questions</span>
          </h2>
          <p className="faq-hero-subtitle">
            Find answers to common questions about our vintage computers, ordering process, shipping, and more.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="faq-categories">
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category);
                setOpenIndex(null);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ List */}
      <section className="faq-list-section">
        <div className="faq-list">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="faq-category-tag">{faq.category}</span>
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {openIndex === index ? (
                      <path d="M5 12h14" />
                    ) : (
                      <>
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </>
                    )}
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="faq-cta">
        <h2>Still have questions?</h2>
        <p>Can't find the answer you're looking for? Our team is here to help.</p>
        <div className="faq-cta-actions">
          <Link to="/contacts" className="btn btn-primary">
            Contact Us
          </Link>
          <Link to="/shop" className="btn btn-outline">
            Peppeeeee
          </Link>
        </div>
      </section>
    </div>
  );
}

export default FAQPage;
