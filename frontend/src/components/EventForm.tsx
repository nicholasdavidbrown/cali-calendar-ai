import { useState } from "react";
import type { CalendarEvent, CreateEventData } from "../types";

interface EventFormProps {
  event?: CalendarEvent;
  onSave: (data: CreateEventData) => Promise<void>;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: event?.title || "",
    description: event?.description || "",
    startTime: event?.startTime.slice(0, 16) || "", // datetime-local format
    endTime: event?.endTime.slice(0, 16) || "",
    location: event?.location || "",
    isAllDay: event?.isAllDay || false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate times
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      await onSave({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
    } catch (err: any) {
      setError(err.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-8 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-bg-card-light dark:bg-bg-card-dark rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-2xl font-semibold text-text-dark dark:text-text-light">
            {event ? "Edit Event" : "Create Event"}
          </h2>
          <button
            onClick={onCancel}
            className="text-text-muted-light dark:text-text-muted-dark hover:text-text-dark dark:hover:text-text-light text-4xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="startTime" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                Start Time *
              </label>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                End Time *
              </label>
              <input
                id="endTime"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="location" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer text-text-dark dark:text-text-light">
              <input
                name="isAllDay"
                type="checkbox"
                checked={formData.isAllDay}
                onChange={handleChange}
                className="w-4 h-4 accent-primary-orange"
              />
              All day event
            </label>
          </div>

          {error && (
            <div className="bg-error/10 border-l-4 border-error px-4 py-3 rounded-md text-error mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-hover-light dark:hover:bg-bg-hover-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-yellow text-white rounded-lg font-semibold shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
