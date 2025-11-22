import { useState, useEffect } from 'react';
import { fetchEvents24Hours, fetchEventsWeek, CalendarEvent } from '../api/eventsService';
import './Events.css';

type TimeRange = '24hours' | 'week';

function Events() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24hours');

  useEffect(() => {
    loadEvents();
  }, [timeRange]);

  const loadEvents = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response =
        timeRange === '24hours' ? await fetchEvents24Hours() : await fetchEventsWeek();
      setEvents(response.events);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load calendar events');
      }
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadEvents(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupEventsByDate = (): { [key: string]: CalendarEvent[] } => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const dateKey = new Date(event.start).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDate();
  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  if (loading) {
    return (
      <div className="events-container">
        <div className="loading">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="events-container">
      <div className="events-header">
        <h1>📅 Calendar Events</h1>
        <p>Your upcoming Outlook calendar events</p>
      </div>

      {/* Controls: Time Range Toggle + Refresh Button */}
      <div className="events-controls">
        <div className="time-range-toggle">
          <button
            className={`toggle-button ${timeRange === '24hours' ? 'active' : ''}`}
            onClick={() => setTimeRange('24hours')}
          >
            Next 24 Hours
          </button>
          <button
            className={`toggle-button ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Next 7 Days
          </button>
        </div>

        <button
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh events"
        >
          <svg
            className="refresh-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
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

      {!error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No events scheduled</h3>
          <p>
            You have no events in the {timeRange === '24hours' ? 'next 24 hours' : 'next 7 days'}
          </p>
        </div>
      )}

      {!error && events.length > 0 && (
        <div className="events-content">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="date-group">
              <div className="date-header">
                <h2>{formatDate(dateKey)}</h2>
                <span className="event-count">{groupedEvents[dateKey].length} events</span>
              </div>

              <div className="events-list">
                {groupedEvents[dateKey].map((event, index) => (
                  <div key={index} className="event-card">
                    <div className="event-time">
                      <div className="time-badge">{event.formattedTime}</div>
                      {event.isAllDay && <span className="all-day-badge">All Day</span>}
                    </div>
                    <div className="event-details">
                      <h3 className="event-title">{event.title}</h3>
                      {event.location && (
                        <div className="event-location">
                          <span className="location-icon">📍</span>
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;
