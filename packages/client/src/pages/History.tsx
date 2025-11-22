import { useState, useEffect } from 'react';
import { getSMSHistory, SmsHistoryEntry } from '../api/smsService';
import './History.css';

function History() {
  const [history, setHistory] = useState<SmsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSMSHistory(50);
      setHistory(response.history);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load SMS history');
      }
      console.error('Error loading SMS history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    }

    // Otherwise return full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPhoneNumber = (phone: string): string => {
    // Simple formatting for US numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">Loading SMS history...</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📨 SMS History</h1>
        <p>Messages sent to you and your family members</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          {error.includes('session') && (
            <button onClick={() => (window.location.href = '/auth/login')} className="retry-button">
              Sign In Again
            </button>
          )}
        </div>
      )}

      {!error && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No SMS messages yet</h3>
          <p>Your SMS history will appear here once you start sending messages</p>
        </div>
      )}

      {!error && history.length > 0 && (
        <div className="history-content">
          <div className="history-list">
            {history.map((entry) => (
              <div key={entry.id} className="history-card">
                <div className="history-card-header">
                  <div className="history-meta">
                    <span className="history-time">{formatDate(entry.sentAt)}</span>
                    <span className="history-divider">•</span>
                    <span className="history-recipient">
                      {entry.recipientName ? (
                        <>
                          {entry.recipientName} ({formatPhoneNumber(entry.recipientPhone)})
                        </>
                      ) : (
                        formatPhoneNumber(entry.recipientPhone)
                      )}
                    </span>
                  </div>
                  <div className="history-badges">
                    <span className="style-badge">{entry.messageStyle}</span>
                    <span className="event-badge">{entry.eventCount} events</span>
                  </div>
                </div>
                <div className="history-message">
                  {entry.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
