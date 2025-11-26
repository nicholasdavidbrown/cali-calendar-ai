import { format } from "date-fns";
import { Card, Badge, Button } from "flowbite-react";
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
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{event.title}</h3>
        <Badge color={event.source === "manual" ? "warning" : "gray"} size="sm" className="whitespace-nowrap">
          {event.source}
        </Badge>
      </div>

      <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
        {event.isAllDay ? (
          <span>All Day • {format(new Date(event.startTime), "MMM d, yyyy")}</span>
        ) : (
          <span>{formatTime(event.startTime)}</span>
        )}
      </div>

      {event.location && (
        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
          📍 {event.location}
        </div>
      )}

      {event.description && (
        <p className="text-gray-700 dark:text-gray-300 text-sm my-3 leading-relaxed">
          {event.description}
        </p>
      )}

      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button color="light" size="sm" onClick={() => onEdit(event)} className="flex-1">
            Edit
          </Button>
          <Button color="failure" size="sm" onClick={() => onDelete(event.id)} className="flex-1">
            Delete
          </Button>
        </div>
      )}
    </Card>
  );
};

export default EventCard;
