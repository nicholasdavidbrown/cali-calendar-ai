import { useState, useEffect } from "react";
import { calendarAPI } from "../services/api";
import EventCard from "../components/EventCard";
import EventForm from "../components/EventForm";
import Layout from "../components/Layout";
import type { CalendarEvent, CreateEventData } from "../types";
import {
  format,
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<"today" | "week" | "all">("today");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [events, filter]);

  const loadEvents = async () => {
    try {
      const data = await calendarAPI.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();

    switch (filter) {
      case "today":
        const todayStart = startOfToday();
        const todayEnd = endOfToday();
        setFilteredEvents(
          events.filter((e) => {
            const eventDate = new Date(e.startTime);
            return eventDate >= todayStart && eventDate <= todayEnd;
          })
        );
        break;
      case "week":
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        setFilteredEvents(
          events.filter((e) => {
            const eventDate = new Date(e.startTime);
            return eventDate >= weekStart && eventDate <= weekEnd;
          })
        );
        break;
      case "all":
        setFilteredEvents(events);
        break;
    }
  };

  const handleCreateEvent = async (data: CreateEventData) => {
    await calendarAPI.createEvent(data);
    await loadEvents();
    setShowForm(false);
  };

  const handleUpdateEvent = async (data: CreateEventData) => {
    if (editingEvent) {
      await calendarAPI.updateEvent(editingEvent.id, data);
      await loadEvents();
      setShowForm(false);
      setEditingEvent(undefined);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await calendarAPI.deleteEvent(id);
      await loadEvents();
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(undefined);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="calendar-page">
        <div className="calendar-header">
          <h1>Your Calendar</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Event
          </button>
        </div>

        <div className="calendar-filters">
          <button
            className={filter === "today" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter("today")}
          >
            Today
          </button>
          <button
            className={filter === "week" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter("week")}
          >
            This Week
          </button>
          <button
            className={filter === "all" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter("all")}
          >
            All Events
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <p>
                No events scheduled for{" "}
                {filter === "today"
                  ? "today"
                  : filter === "week"
                  ? "this week"
                  : "now"}
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create your first event
              </button>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDeleteEvent}
              />
            ))
          )}
        </div>

        {showForm && (
          <EventForm
            event={editingEvent}
            onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={handleCloseForm}
          />
        )}
      </div>
    </Layout>
  );
};

export default Calendar;
