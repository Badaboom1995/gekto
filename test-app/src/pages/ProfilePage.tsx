import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfilePage.css'

// Stack Auth integration - Reference: /docs/sdk/types/user
// useUser() returns CurrentUser with properties: id, displayName, primaryEmail,
// primaryEmailVerified, profileImageUrl, signedUpAt, hasPassword, clientMetadata
// user.update() can update: displayName, clientMetadata, profileImageUrl

// Mock user data - Replace with useUser() from Stack Auth when integrated
// Stack Auth docs: /docs/sdk/hooks/use-user
const mockUser = {
  id: 'user_123',
  displayName: 'John Collector',
  primaryEmail: 'john@classicpc.com',
  primaryEmailVerified: true,
  profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro',
  signedUpAt: new Date('2024-01-15'),
  hasPassword: true,
  clientMetadata: {
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Vintage computer enthusiast and collector since 1985.',
  },
}

// Mock order history
const mockOrders = [
  {
    id: 'ORD-001',
    date: '2024-12-15',
    status: 'Delivered',
    total: 449.00,
    items: [
      { name: 'Apple II', quantity: 1, price: 449.00, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Apple_II_typical_configuration_1977.png/1200px-Apple_II_typical_configuration_1977.png' }
    ]
  },
  {
    id: 'ORD-002',
    date: '2024-11-28',
    status: 'Delivered',
    total: 648.00,
    items: [
      { name: 'Commodore 64', quantity: 1, price: 299.00, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg' },
      { name: 'Amiga 500', quantity: 1, price: 349.00, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Amiga500_system.jpg/1200px-Amiga500_system.jpg' }
    ]
  },
  {
    id: 'ORD-003',
    date: '2024-10-05',
    status: 'Delivered',
    total: 799.00,
    items: [
      { name: 'Macintosh 128K', quantity: 1, price: 799.00, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Macintosh_128k_transparency.png/800px-Macintosh_128k_transparency.png' }
    ]
  },
]

// Mock preferences
const defaultPreferences = {
  emailNotifications: true,
  orderUpdates: true,
  newsletter: true,
  promotions: false,
  newArrivals: true,
  currency: 'USD',
  language: 'English',
}

type TabType = 'profile' | 'orders' | 'settings' | 'preferences'

function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // User state - Replace with useUser() from Stack Auth
  // Stack Auth: const user = useUser({ or: 'redirect' })
  const [user, setUser] = useState(mockUser)
  const [isAuthenticated] = useState(true) // Replace with actual auth check

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: user.displayName || '',
    phone: user.clientMetadata.phone || '',
    location: user.clientMetadata.location || '',
    bio: user.clientMetadata.bio || '',
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  // Preferences state
  const [preferences, setPreferences] = useState(defaultPreferences)

  // Authentication check - Replace with Stack Auth useUser({ or: 'redirect' })
  if (!isAuthenticated) {
    // Stack Auth would automatically redirect, but for now:
    navigate('/login')
    return null
  }

  // Handle profile update - Uses Stack Auth user.update()
  // Reference: /docs/sdk/types/user - CurrentUser.update()
  const handleSaveProfile = async () => {
    try {
      // Stack Auth integration:
      // await user.update({
      //   displayName: editForm.displayName,
      //   clientMetadata: {
      //     ...user.clientMetadata,
      //     phone: editForm.phone,
      //     location: editForm.location,
      //     bio: editForm.bio,
      //   },
      // })

      // Mock update for now
      setUser({
        ...user,
        displayName: editForm.displayName,
        clientMetadata: {
          ...user.clientMetadata,
          phone: editForm.phone,
          location: editForm.location,
          bio: editForm.bio,
        },
      })
      setIsEditingProfile(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // Handle password change - Uses Stack Auth user.updatePassword()
  // Reference: /docs/sdk/types/user - CurrentUser.updatePassword()
  const handlePasswordChange = async () => {
    setPasswordError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    try {
      // Stack Auth integration:
      // const error = await user.updatePassword({
      //   oldPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword,
      // })
      // if (error) {
      //   setPasswordError(error.message)
      //   return
      // }

      // Mock success
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('Password updated successfully!')
    } catch (error) {
      console.error('Failed to update password:', error)
      setPasswordError('Failed to update password')
    }
  }

  // Handle sign out - Uses Stack Auth user.signOut()
  // Reference: /docs/sdk/types/user - CurrentUser.signOut()
  const handleSignOut = async () => {
    try {
      // Stack Auth integration:
      // await user.signOut()
      navigate('/')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  // Handle account deletion - Uses Stack Auth user.delete()
  // Reference: /docs/sdk/types/user - CurrentUser.delete()
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Stack Auth integration:
        // await user.delete()
        navigate('/')
      } catch (error) {
        console.error('Failed to delete account:', error)
      }
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/>
          <line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-overlay">
          <h1 className="profile-hero-title">My Account</h1>
        </div>
      </div>

      <div className="profile-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            <div className="profile-avatar-large">
              <img src={user.profileImageUrl || ''} alt={user.displayName || 'User'} />
            </div>
            <h3 className="profile-user-name">{user.displayName}</h3>
            <p className="profile-user-email">{user.primaryEmail}</p>
            {user.primaryEmailVerified && (
              <span className="profile-verified-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified
              </span>
            )}
          </div>

          <nav className="profile-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <button className="profile-signout-btn" onClick={handleSignOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                {!isEditingProfile && (
                  <button className="btn btn-outline" onClick={() => setIsEditingProfile(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="profile-edit-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="City, State"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-info-grid">
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Display Name</span>
                      <span className="info-value">{user.displayName}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user.primaryEmail}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{user.clientMetadata.phone || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Location</span>
                      <span className="info-value">{user.clientMetadata.location || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="info-card full-width">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Bio</span>
                      <span className="info-value">{user.clientMetadata.bio || 'No bio added yet'}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">
                        {user.signedUpAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Order History</h2>
                <span className="order-count">{mockOrders.length} orders</span>
              </div>

              <div className="orders-list">
                {mockOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <span className="order-id">{order.id}</span>
                        <span className="order-date">{order.date}</span>
                      </div>
                      <div className="order-status-wrapper">
                        <span className={`order-status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item">
                          <div className="order-item-image">
                            <img src={item.image} alt={item.name} />
                          </div>
                          <div className="order-item-details">
                            <span className="order-item-name">{item.name}</span>
                            <span className="order-item-qty">Qty: {item.quantity}</span>
                          </div>
                          <span className="order-item-price">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <span className="order-total-label">Total</span>
                      <span className="order-total">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Account Settings</h2>
              </div>

              {/* Password Change */}
              <div className="settings-card">
                <h3>Change Password</h3>
                <p className="settings-description">
                  Update your password to keep your account secure.
                </p>
                <div className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordError && <p className="form-error">{passwordError}</p>}
                  <button className="btn btn-primary" onClick={handlePasswordChange}>
                    Update Password
                  </button>
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="settings-card">
                <h3>Connected Accounts</h3>
                <p className="settings-description">
                  Manage your connected social accounts for easy sign-in.
                </p>
                <div className="connected-accounts">
                  <div className="account-row">
                    <div className="account-info">
                      <span className="account-icon google">G</span>
                      <span>Google</span>
                    </div>
                    <button className="btn btn-outline btn-sm">Connect</button>
                  </div>
                  <div className="account-row">
                    <div className="account-info">
                      <span className="account-icon github">GH</span>
                      <span>GitHub</span>
                    </div>
                    <button className="btn btn-outline btn-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="settings-card danger">
                <h3>Danger Zone</h3>
                <p className="settings-description">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Preferences</h2>
              </div>

              {/* Notification Preferences */}
              <div className="settings-card">
                <h3>Email Notifications</h3>
                <p className="settings-description">
                  Choose what emails you'd like to receive.
                </p>
                <div className="preferences-list">
                  <label className="preference-item">
                    <div className="preference-info">
                      <span className="preference-title">Order Updates</span>
                      <span className="preference-desc">Get notified about your order status</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={preferences.orderUpdates}
                      onChange={(e) => setPreferences({ ...preferences, orderUpdates: e.target.checked })}
                    />
                  </label>
                  <label className="preference-item">
                    <div className="preference-info">
                      <span className="preference-title">Newsletter</span>
                      <span className="preference-desc">Weekly updates on new products and news</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={preferences.newsletter}
                      onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                    />
                  </label>
                  <label className="preference-item">
                    <div className="preference-info">
                      <span className="preference-title">Promotions</span>
                      <span className="preference-desc">Exclusive deals and discount offers</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={preferences.promotions}
                      onChange={(e) => setPreferences({ ...preferences, promotions: e.target.checked })}
                    />
                  </label>
                  <label className="preference-item">
                    <div className="preference-info">
                      <span className="preference-title">New Arrivals</span>
                      <span className="preference-desc">Be first to know about new vintage computers</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={preferences.newArrivals}
                      onChange={(e) => setPreferences({ ...preferences, newArrivals: e.target.checked })}
                    />
                  </label>
                </div>
              </div>

              {/* Regional Preferences */}
              <div className="settings-card">
                <h3>Regional Settings</h3>
                <p className="settings-description">
                  Customize your regional preferences.
                </p>
                <div className="regional-settings">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (&euro;)</option>
                      <option value="GBP">GBP (&pound;)</option>
                      <option value="JPY">JPY (&yen;)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Espa&ntilde;ol</option>
                      <option value="French">Fran&ccedil;ais</option>
                      <option value="German">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
