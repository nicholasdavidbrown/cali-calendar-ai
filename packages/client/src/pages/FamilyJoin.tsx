import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateJoinCode, joinWithCode } from '../api/familyService';
import './FamilyJoin.css';

function FamilyJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Optional event creation fields
  const [createEvent, setCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDuration, setEventDuration] = useState('60');

  useEffect(() => {
    if (code) {
      validateCode();
    } else {
      setError('No join code provided');
      setLoading(false);
    }
  }, [code]);

  const validateCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await validateJoinCode(code);
      setValid(result.valid);
      setUserEmail(result.userEmail);
    } catch (err: any) {
      setError('Invalid or expired join code');
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone)) {
      return false;
    }
    const digitsOnly = phone.replace(/[^\d+]/g, '');
    return digitsOnly.length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (e.g., +61468047323 or +1234567890)');
      return;
    }

    // Validate event fields if creating an event
    if (createEvent) {
      if (!eventTitle.trim()) {
        setError('Please enter an event title');
        return;
      }
      if (!eventDate) {
        setError('Please select an event date');
        return;
      }
      if (!eventTime) {
        setError('Please select an event time');
        return;
      }
    }

    setSubmitting(true);

    try {
      const result = await joinWithCode(
        code,
        name.trim(),
        phone.trim(),
        createEvent ? {
          eventTitle: eventTitle.trim(),
          eventDate,
          eventTime,
          eventDuration: parseInt(eventDuration),
        } : undefined
      );

      setSuccess(true);
      setEventCreated(result.eventCreated || false);
      setEventError(result.eventError || null);

      // Redirect after 5 seconds (more time to read event status)
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Invalid or expired join code');
      } else if (err.response?.data?.field === 'phone') {
        setError(err.response?.data?.error || 'Invalid phone number format');
      } else {
        setError(err.response?.data?.error || 'Failed to join. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="join-container">
        <div className="loading">Validating join code...</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="join-container">
        <div className="join-card error-card">
          <div className="error-icon">❌</div>
          <h1>Invalid Join Code</h1>
          <p>{error || 'This join code is invalid or has expired.'}</p>
          <p className="help-text">Please request a new invitation from your family member.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="join-container">
        <div className="join-card success-card">
          <div className="success-icon">✅</div>
          <h1>Welcome to the Family!</h1>
          <p>You've successfully joined {userEmail}'s calendar notifications.</p>
          <p className="success-details">
            You'll receive daily SMS messages with upcoming calendar events at {phone}.
          </p>
          {createEvent && (
            <>
              {eventCreated ? (
                <div className="event-success">
                  <span className="event-icon">📅</span>
                  <p>Calendar event created successfully!</p>
                </div>
              ) : eventError ? (
                <div className="event-warning">
                  <span className="event-icon">⚠️</span>
                  <p><strong>Note:</strong> {eventError}</p>
                </div>
              ) : null}
            </>
          )}
          <p className="redirect-note">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="join-header">
          <h1>Join Family Calendar</h1>
          <p>You've been invited by {userEmail} to receive daily calendar notifications</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890 or +61468047323"
              className="form-input"
              disabled={submitting}
              required
            />
            <p className="input-hint">Include country code (e.g., +1 for US, +61 for Australia)</p>
          </div>

          <div className="optional-event-section">
            <div className="section-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={createEvent}
                  onChange={(e) => setCreateEvent(e.target.checked)}
                  disabled={submitting}
                />
                <span>Create a calendar event for {userEmail.split('@')[0]}</span>
              </label>
              <p className="section-hint">Optionally add an event to their calendar</p>
            </div>

            {createEvent && (
              <div className="event-fields">
                <div className="form-group">
                  <label htmlFor="eventTitle">Event Title</label>
                  <input
                    type="text"
                    id="eventTitle"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g., Dinner with family"
                    className="form-input"
                    disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventDate">Date</label>
                    <input
                      type="date"
                      id="eventDate"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="form-input"
                      disabled={submitting}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventTime">Time</label>
                    <input
                      type="time"
                      id="eventTime"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="eventDuration">Duration (minutes)</label>
                  <select
                    id="eventDuration"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    className="form-input"
                    disabled={submitting}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Joining...' : 'Join Family Calendar'}
          </button>

          <div className="info-box">
            <h3>What happens next?</h3>
            <ul>
              <li>You'll receive daily SMS notifications with upcoming events</li>
              <li>Messages are personalized with your name</li>
              <li>The account owner can manage your notification status</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FamilyJoin;
