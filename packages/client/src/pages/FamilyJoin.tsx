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

    setSubmitting(true);

    try {
      await joinWithCode(code, name.trim(), phone.trim());
      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Invalid or expired join code');
      } else {
        setError('Failed to join. Please try again.');
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
