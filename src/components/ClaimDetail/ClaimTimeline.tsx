import { TimelineEvent } from '../../types';
import clsx from 'clsx';
import { CheckCircle2, XCircle, FileQuestion, AlertTriangle, MessageSquare, Send, Archive } from 'lucide-react';

interface ClaimTimelineProps {
  events: TimelineEvent[];
}

const eventConfig: Record<TimelineEvent['type'], { icon: React.ReactNode; color: string; bg: string }> = {
  submitted:        { icon: <Send className="w-4 h-4" />,          color: 'text-blue-600',   bg: 'bg-blue-100' },
  update:           { icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600',   bg: 'bg-gray-100' },
  carrier_response: { icon: <FileQuestion className="w-4 h-4" />,  color: 'text-purple-600', bg: 'bg-purple-100' },
  document_request: { icon: <FileQuestion className="w-4 h-4" />,  color: 'text-orange-600', bg: 'bg-orange-100' },
  approved:         { icon: <CheckCircle2 className="w-4 h-4" />,  color: 'text-green-600',  bg: 'bg-green-100' },
  rejected:         { icon: <XCircle className="w-4 h-4" />,       color: 'text-red-600',    bg: 'bg-red-100' },
  note:             { icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-500',   bg: 'bg-gray-100' },
  escalated:        { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600',    bg: 'bg-red-100' },
  closed:           { icon: <Archive className="w-4 h-4" />,       color: 'text-gray-500',   bg: 'bg-gray-100' },
};

export default function ClaimTimeline({ events }: ClaimTimelineProps) {
  const sorted = [...events].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, idx) => {
        const cfg = eventConfig[event.type] ?? eventConfig.update;
        return (
          <div key={event.id} className="flex gap-4">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10', cfg.bg, cfg.color)}>
                {cfg.icon}
              </div>
              {idx < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-100 mt-1 mb-1 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-maersk-navy">{event.title}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {new Date(event.date).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
              {event.user && (
                <p className="text-xs text-gray-400 mt-1">— {event.user}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
