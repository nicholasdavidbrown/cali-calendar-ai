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
    <div className="bg-bg-card-light dark:bg-bg-card-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 transition-all hover:border-primary-orange hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-3">
        <h3 className="text-lg sm:text-xl font-semibold text-text-dark dark:text-text-light pr-2">{event.title}</h3>
        <span
          className={`text-xs px-2.5 py-1 sm:px-3 rounded-md uppercase font-semibold whitespace-nowrap flex-shrink-0 self-start ${
            event.source === "manual"
              ? "bg-primary-orange/15 text-primary-orange"
              : "bg-white/10 text-text-muted-light dark:text-text-muted-dark"
          }`}
        >
          {event.source}
        </span>
      </div>

      <div className="text-text-muted-light dark:text-text-muted-dark text-xs sm:text-sm mb-2">
        {event.isAllDay ? (
          <span>All Day • {format(new Date(event.startTime), "MMM d, yyyy")}</span>
        ) : (
          <span>{formatTime(event.startTime)}</span>
        )}
      </div>

      {event.location && (
        <div className="text-text-muted-light dark:text-text-muted-dark text-xs sm:text-sm mb-2">
          📍 {event.location}
        </div>
      )}

      {event.description && (
        <p className="text-text-dark dark:text-text-light text-sm sm:text-base my-3 sm:my-4 leading-relaxed">
          {event.description}
        </p>
      )}

      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={() => onEdit(event)}
            className="px-4 py-2 text-sm sm:text-base bg-bg-card-light dark:bg-bg-card-dark text-text-dark dark:text-text-light rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-hover-light dark:hover:bg-bg-hover-dark transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="px-4 py-2 text-sm sm:text-base bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;
