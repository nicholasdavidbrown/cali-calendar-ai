import { useState, useEffect } from "react";
import { Button, Alert, Spinner, ButtonGroup } from "flowbite-react";
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
          <Spinner size="xl" color="warning" />
          <p className="text-gray-700 dark:text-gray-300">Loading events...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your Calendar</h1>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 enabled:hover:from-orange-600 enabled:hover:to-amber-600"
          >
            + Add Event
          </Button>
        </div>

        <ButtonGroup className="mb-6">
          <Button
            color={filter === "today" ? "warning" : "gray"}
            onClick={() => setFilter("today")}
          >
            Today
          </Button>
          <Button
            color={filter === "week" ? "warning" : "gray"}
            onClick={() => setFilter("week")}
          >
            This Week
          </Button>
          <Button
            color={filter === "all" ? "warning" : "gray"}
            onClick={() => setFilter("all")}
          >
            All Events
          </Button>
        </ButtonGroup>

        {error && (
          <Alert color="failure" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-600 dark:text-gray-400">
              <p className="mb-6 text-lg">
                No events scheduled for{" "}
                {filter === "today"
                  ? "today"
                  : filter === "week"
                  ? "this week"
                  : "now"}
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 enabled:hover:from-orange-600 enabled:hover:to-amber-600"
              >
                Create your first event
              </Button>
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
