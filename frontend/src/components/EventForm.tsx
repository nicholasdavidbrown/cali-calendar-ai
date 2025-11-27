import { useState } from "react";
import { Label, TextInput, Textarea, Checkbox, Button, Alert, Card } from "flowbite-react";
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
      className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <Card
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {event ? "Edit Event" : "Create Event"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-2">
              <Label htmlFor="title">Title</Label>
            </div>
            <TextInput
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              color="gray"
            />
          </div>

          <div>
            <div className="mb-2">
              <Label htmlFor="description">Description</Label>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              color="gray"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label htmlFor="startTime">Start Time</Label>
              </div>
              <TextInput
                id="startTime"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                required
                color="gray"
              />
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="endTime">End Time</Label>
              </div>
              <TextInput
                id="endTime"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleChange}
                required
                color="gray"
              />
            </div>
          </div>

          <div>
            <div className="mb-2">
              <Label htmlFor="location">Location</Label>
            </div>
            <TextInput
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="Optional"
              color="gray"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isAllDay"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={handleChange}
              color="warning"
            />
            <Label htmlFor="isAllDay" className="cursor-pointer">
              All day event
            </Label>
          </div>

          {error && (
            <Alert color="failure">
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button color="gray" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 enabled:hover:from-orange-600 enabled:hover:to-amber-600"
            >
              {loading ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EventForm;
