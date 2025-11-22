import { useState, useEffect } from 'react';
import { getUserProfile, updateUserPreferences, UserProfile } from '../api/userService';
import './Settings.css';

type MessageStyle = 'professional' | 'witty' | 'sarcastic' | 'mission';

interface MessageStyleOption {
  value: MessageStyle;
  label: string;
  description: string;
  example: string;
}

const messageStyleOptions: MessageStyleOption[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polite and business-appropriate tone',
    example: 'Good morning! You have 3 meetings scheduled today starting at 9:00 AM.',
  },
  {
    value: 'witty',
    label: 'Witty',
    description: 'Fun and engaging with clever wordplay',
    example: 'Rise and shine! Your calendar is calling - time to make today legendary! 🌟',
  },
  {
    value: 'sarcastic',
    label: 'Sarcastic',
    description: 'Playful and humorous with dry wit',
    example: 'Oh great, another thrilling day of back-to-back meetings awaits you. Lucky you! 😏',
  },
  {
    value: 'mission',
    label: 'Mission Briefing',
    description: 'Motivational mission-style format',
    example: 'Mission Briefing: 3 objectives await. First deployment: 0900 hours. Prepare for success!',
  },
];

function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('professional');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
      setSelectedStyle(data.messageStyle || 'professional');
      setPhoneNumber(data.phone || '');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }

    // Basic phone validation - must start with + and contain only digits, spaces, hyphens, and parentheses
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid phone number (e.g., +61468047323 or +1234567890)');
      return false;
    }

    // Remove all non-digit characters except leading +
    const digitsOnly = phone.replace(/[^\d+]/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
      return false;
    }

    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (phoneError) {
      setPhoneError(null); // Clear error when user types
    }
  };

  const handleSave = async () => {
    // Validate phone number if it has changed
    const phoneChanged = phoneNumber !== profile?.phone;
    if (phoneChanged && !validatePhoneNumber(phoneNumber)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updates: any = { messageStyle: selectedStyle };
      if (phoneChanged) {
        updates.phone = phoneNumber;
      }

      await updateUserPreferences(updates);
      setSuccessMessage('Settings updated successfully!');
      await loadProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    selectedStyle !== profile?.messageStyle ||
    phoneNumber !== (profile?.phone || '');

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your preferences and notification settings</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="settings-content">
        {/* Phone Number Section */}
        <div className="settings-section">
          <h2>📱 Mobile Number</h2>
          <p className="section-description">
            Add your mobile number to receive daily SMS messages with your calendar summary
          </p>
          <div className="phone-input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+1234567890 or +61468047323"
              className={`phone-input ${phoneError ? 'error' : ''}`}
            />
            {phoneError && <div className="input-error">{phoneError}</div>}
            <p className="input-hint">
              Include country code (e.g., +1 for US, +61 for Australia)
            </p>
          </div>
        </div>

        {/* Message Style Section */}
        <div className="settings-section">
          <h2>💬 Message Style</h2>
          <p className="section-description">
            Choose how Claude AI crafts your daily SMS messages
          </p>
        <div className="message-styles">
          {messageStyleOptions.map((option) => (
            <div
              key={option.value}
              className={`style-card ${selectedStyle === option.value ? 'selected' : ''}`}
              onClick={() => setSelectedStyle(option.value)}
            >
              <div className="style-header">
                <input
                  type="radio"
                  name="messageStyle"
                  value={option.value}
                  checked={selectedStyle === option.value}
                  onChange={() => setSelectedStyle(option.value)}
                />
                <h3>{option.label}</h3>
              </div>
              <p className="style-description">{option.description}</p>
              <div className="style-example">
                <strong>Example:</strong>
                <p>{option.example}</p>
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="settings-actions">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="save-button"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        <div className="current-settings">
          <h3>Current Settings</h3>
          <div className="settings-info">
            <p>
              <strong>Email:</strong> {profile?.email}
            </p>
            <p>
              <strong>Phone:</strong> {profile?.phone || 'Not set'}
            </p>
            <p>
              <strong>Timezone:</strong> {profile?.timezone}
            </p>
            <p>
              <strong>SMS Time:</strong> {profile?.smsTime}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status ${profile?.isActive ? 'active' : 'inactive'}`}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
