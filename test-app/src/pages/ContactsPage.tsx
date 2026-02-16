import './ContactsPage.css';

function ContactsPage() {
  return (
    <div className="contacts-page">
      {/* Hero Section */}
      <section className="contacts-hero">
        <div className="contacts-hero-overlay">
          <h1 className="contacts-hero-title">Contact</h1>
        </div>
        <div className="contacts-hero-content">
          <h2 className="contacts-hero-heading">
            Get in <span className="highlight">Touch</span>
          </h2>
          <p className="contacts-hero-subtitle">
            Have questions about our vintage computers? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <section className="contacts-main">
        <div className="contacts-info">
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3>Visit Us</h3>
            <p>123 Retro Tech Lane</p>
            <p>San Francisco, CA 94102</p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h3>Call Us</h3>
            <p>+1 (555) 123-4567</p>
            <p>Mon - Fri, 9am - 6pm PST</p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3>Email Us</h3>
            <p>hello@retropc.com</p>
            <p>support@retropc.com</p>
          </div>
        </div>

        <div className="contacts-form-container">
          <h3 className="form-title">Send us a Message</h3>
          <form className="contacts-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" placeholder="John" />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select id="subject" name="subject">
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="sales">Sales Question</option>
                <option value="support">Technical Support</option>
                <option value="restoration">Restoration Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} placeholder="Tell us how we can help you..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary submit-btn">
              Send Message
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contacts-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Do you ship internationally?</h4>
            <p>Yes! We ship vintage computers worldwide with special packaging to ensure safe delivery.</p>
          </div>
          <div className="faq-item">
            <h4>What's your return policy?</h4>
            <p>We offer a 30-day return policy for items in their original condition. See our shipping page for details.</p>
          </div>
          <div className="faq-item">
            <h4>Do you offer restoration services?</h4>
            <p>Absolutely! Our expert technicians can restore and repair most vintage computers to working condition.</p>
          </div>
          <div className="faq-item">
            <h4>How can I sell my vintage computer?</h4>
            <p>Contact us with details about your machine and we'll provide a fair evaluation and offer.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactsPage;
