import { useState, useEffect } from "react";
import { calendarAPI } from "../services/api";
import EventCard from "../components/EventCard";
import EventForm from "../components/EventForm";
import Layout from "../components/Layout";
import type { CalendarEvent, CreateEventData } from "../types";
import {
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="border-4 border-primary-orange/10 border-t-primary-orange rounded-full w-12 h-12 animate-spin"></div>
          <p className="text-text-dark dark:text-text-light">Loading events...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-dark dark:text-text-light">Your Calendar</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-primary-orange to-primary-yellow text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            + Add Event
          </button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          <button
            className={`px-4 py-2 sm:px-5 text-sm sm:text-base rounded-lg border transition-all ${
              filter === "today"
                ? "bg-gradient-to-r from-primary-orange to-primary-yellow text-white border-transparent"
                : "bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light border-border-light dark:border-border-dark hover:border-primary-orange"
            }`}
            onClick={() => setFilter("today")}
          >
            Today
          </button>
          <button
            className={`px-4 py-2 sm:px-5 text-sm sm:text-base rounded-lg border transition-all ${
              filter === "week"
                ? "bg-gradient-to-r from-primary-orange to-primary-yellow text-white border-transparent"
                : "bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light border-border-light dark:border-border-dark hover:border-primary-orange"
            }`}
            onClick={() => setFilter("week")}
          >
            This Week
          </button>
          <button
            className={`px-4 py-2 sm:px-5 text-sm sm:text-base rounded-lg border transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-primary-orange to-primary-yellow text-white border-transparent"
                : "bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light border-border-light dark:border-border-dark hover:border-primary-orange"
            }`}
            onClick={() => setFilter("all")}
          >
            All Events
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border-l-4 border-error px-3 py-2.5 sm:px-4 sm:py-3 rounded-md text-error text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-text-muted-light dark:text-text-muted-dark">
              <p className="mb-6 text-base sm:text-lg">
                No events scheduled for{" "}
                {filter === "today"
                  ? "today"
                  : filter === "week"
                  ? "this week"
                  : "now"}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-primary-orange to-primary-yellow text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
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
