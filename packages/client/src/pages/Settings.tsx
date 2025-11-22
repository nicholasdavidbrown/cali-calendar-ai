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
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateUserPreferences({ messageStyle: selectedStyle });
      setSuccessMessage('Message style updated successfully!');
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
        <h1>Message Style Settings</h1>
        <p>Choose how Claude AI crafts your daily SMS messages</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="settings-content">
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

        <div className="settings-actions">
          <button
            onClick={handleSave}
            disabled={saving || selectedStyle === profile?.messageStyle}
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
