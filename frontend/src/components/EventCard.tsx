import { format } from "date-fns";
import type { CalendarEvent } from "../types";

interface EventCardProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
}) => {
  const canEdit = event.source === "manual";

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy • h:mm a");
  };

  return (
    <div className="event-card">
      <div className="event-header">
        <h3 className="event-title">{event.title}</h3>
        <span className={`event-source badge-${event.source}`}>
          {event.source}
        </span>
      </div>

      <div className="event-time">
        {event.isAllDay ? (
          <span>All Day • {format(new Date(event.startTime), "MMM d, yyyy")}</span>
        ) : (
          <span>{formatTime(event.startTime)}</span>
        )}
      </div>

      {event.location && (
        <div className="event-location">📍 {event.location}</div>
      )}

      {event.description && (
        <p className="event-description">{event.description}</p>
      )}

      {canEdit && (
        <div className="event-actions">
          <button onClick={() => onEdit(event)} className="btn-secondary btn-sm">
            Edit
          </button>
          <button onClick={() => onDelete(event.id)} className="btn-danger btn-sm">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;
