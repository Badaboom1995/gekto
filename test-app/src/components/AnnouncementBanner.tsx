import { useState, useEffect } from 'react'

const STORAGE_KEY = 'announcement-banner-dismissed'

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const isDismissed = localStorage.getItem(STORAGE_KEY)
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!isVisible) return null

  return (
    <div className="announcement-banner">
      <p className="announcement-text">
        Free shipping on orders over $99 — Limited time offer!
      </p>
      <button
        className="announcement-close"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  )
}
