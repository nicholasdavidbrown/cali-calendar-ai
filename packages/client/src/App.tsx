import { useState, useEffect } from 'react'
import './App.css'
import { fetchUsers, fetchUserStats, deleteUser, User, UserStats } from './api/userService'
import { checkAuthStatus, loginWithMicrosoft, logout, AuthUser } from './api/authService'
import logo from './assets/logo2_t.png'
import Settings from './pages/Settings'
import Events from './pages/Events'

type ViewMode = 'dashboard' | 'settings' | 'calendar'

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  // Check authentication status
  const checkAuth = async () => {
    setAuthLoading(true)
    try {
      const authData = await checkAuthStatus()
      setCurrentUser(authData?.user || null)
    } catch (err) {
      console.error('Failed to check auth status:', err)
      setCurrentUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch users from MongoDB
  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchUsers()
      setUsers(response.data)
    } catch (err) {
      setError('Failed to fetch users from database')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user statistics
  const loadStats = async () => {
    try {
      const response = await fetchUserStats()
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      setCurrentUser(null)
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userEmail}"?\n\nThis will permanently remove the user from MongoDB and Azure Storage.\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteUser(userId)
      console.log(`✅ User ${userEmail} deleted successfully`)

      // Reload users and stats
      await loadUsers()
      await loadStats()
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user. Please try again.')
    }
  }

  // Load data on component mount
  useEffect(() => {
    checkAuth()
    loadUsers()
    loadStats()

    // Check for auth success/error in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      console.log('✅ Authentication successful!')
      // Remove the query param
      window.history.replaceState({}, '', window.location.pathname)
      // Reload data after successful auth
      setTimeout(() => {
        checkAuth()
        loadUsers()
        loadStats()
      }, 500)
    } else if (params.get('error') === 'auth_failed') {
      console.error('❌ Authentication failed')
      setError('Authentication failed. Please try again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <div className="app-container">
      <header>
        <div className="header-logo">
          <img src={logo} alt="Cali Logo" className="logo" />
        </div>
        <p className="tagline">Your day wrapped up</p>

        {/* Authentication Section */}
        <div className="auth-section">
          {authLoading ? (
            <div className="auth-loading">Checking authentication...</div>
          ) : currentUser ? (
            <div className="user-info">
              <div className="user-details">
                <span className="user-icon">👤</span>
                <div>
                  <div className="user-email">{currentUser.email}</div>
                  <div className="user-status">Signed in</div>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="sign-in-prompt">
              <p>Sign in with your Microsoft account to create your user profile</p>
              <button onClick={loginWithMicrosoft} className="sign-in-button">
                <svg className="microsoft-icon" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h11v11H0z" fill="#f25022"/>
                  <path d="M12 0h11v11H12z" fill="#00a4ef"/>
                  <path d="M0 12h11v11H0z" fill="#7fba00"/>
                  <path d="M12 12h11v11H12z" fill="#ffb900"/>
                </svg>
                Sign in with Microsoft
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs (only show when authenticated) */}
      {currentUser && (
        <div className="navigation-tabs">
          <button
            className={`nav-tab ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </button>
          <button
            className={`nav-tab ${viewMode === 'settings' ? 'active' : ''}`}
            onClick={() => setViewMode('settings')}
          >
            Settings
          </button>
          {currentUser.isAdmin && (
            <button
              className={`nav-tab ${viewMode === 'dashboard' ? 'active' : ''}`}
              onClick={() => setViewMode('dashboard')}
            >
              Users
            </button>
          )}
        </div>
      )}

      {/* Conditional View Rendering */}
      {viewMode === 'settings' && currentUser ? (
        <Settings />
      ) : viewMode === 'calendar' && currentUser ? (
        <Events />
      ) : viewMode === 'dashboard' && currentUser?.isAdmin ? (
        <>
          {/* Statistics Section */}
          {stats && (
        <div className="stats-section">
          <h2>Database Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.inactiveUsers}</div>
              <div className="stat-label">Inactive Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className="users-section">
        <div className="section-header">
          <h2>Users in Database</h2>
          <button onClick={loadUsers} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading">Loading users...</div>}

        {!loading && users.length === 0 && (
          <div className="empty-state">
            <p>No users found in database</p>
            <p className="empty-hint">
              Sign in with Microsoft OAuth to create your first user
            </p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Timezone</th>
                  <th>SMS Time</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>{user.phone || 'Not set'}</td>
                    <td>{user.timezone}</td>
                    <td>{user.smsTime}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteUser(user._id, user.email)}
                        title="Delete user"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewMode === 'dashboard' && currentUser?.isAdmin && (
        <footer>
          <p>
            Backend API: <code>GET /api/v1/users</code>
          </p>
          <p>
            Database: MongoDB at <code>mongodb://mongodb:27017/calendar-sms</code>
          </p>
        </footer>
      )}
        </>
      ) : null}
    </div>
  )
}

export default App
