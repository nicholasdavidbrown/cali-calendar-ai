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
    <div className="bg-bg-card-light dark:bg-bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 transition-all hover:border-primary-orange hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-text-dark dark:text-text-light">{event.title}</h3>
        <span
          className={`text-xs px-3 py-1 rounded-md uppercase font-semibold ${
            event.source === "manual"
              ? "bg-primary-orange/15 text-primary-orange"
              : "bg-white/10 text-text-muted-light dark:text-text-muted-dark"
          }`}
        >
          {event.source}
        </span>
      </div>

      <div className="text-text-muted-light dark:text-text-muted-dark text-sm mb-2">
        {event.isAllDay ? (
          <span>All Day • {format(new Date(event.startTime), "MMM d, yyyy")}</span>
        ) : (
          <span>{formatTime(event.startTime)}</span>
        )}
      </div>

      {event.location && (
        <div className="text-text-muted-light dark:text-text-muted-dark text-sm mb-2">
          📍 {event.location}
        </div>
      )}

      {event.description && (
        <p className="text-text-dark dark:text-text-light my-4 leading-relaxed">
          {event.description}
        </p>
      )}

      {canEdit && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={() => onEdit(event)}
            className="px-4 py-2 bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-hover-light dark:hover:bg-bg-hover-dark transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;
