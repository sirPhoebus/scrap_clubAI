import React from 'react';
import { ChatMessage } from '../types';
import { User, Calendar, Clock } from 'lucide-react';

interface MessageCardProps {
  message: ChatMessage;
  searchQuery?: string;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, searchQuery }) => {
  // Simple highlight logic
  const highlightText = (text: string, query?: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/30 text-yellow-200 font-medium px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Determine avatar color based on author name length (stable pseudo-random)
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
      'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
      'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initial = message.author.charAt(0).toUpperCase();
  const colorClass = getAvatarColor(message.author);

  // Parse date/time for display if possible, else use raw string
  // Assuming the raw string might contain both date and time e.g. "12/05/23, 10:30:15"
  const dateTimeParts = message.date.split(',');
  const dateDisplay = dateTimeParts[0];
  const timeDisplay = dateTimeParts.length > 1 ? dateTimeParts[1] : '';

  return (
    <div className="group relative flex gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 shadow-sm backdrop-blur-sm">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-3 mb-1.5">
          <h3 className="text-base md:text-lg font-bold text-slate-100 truncate">
            {message.author}
          </h3>
          <div className="flex items-center gap-3 text-xs md:text-sm text-slate-400 font-mono">
             <div className="flex items-center gap-1">
               <Calendar size={12} className="opacity-70" />
               <span>{dateDisplay}</span>
             </div>
             {timeDisplay && (
               <div className="flex items-center gap-1">
                 <Clock size={12} className="opacity-70" />
                 <span>{timeDisplay}</span>
               </div>
             )}
          </div>
        </div>

        {/* Content */}
        <div className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {highlightText(message.content, searchQuery)}
        </div>
      </div>
    </div>
  );
};
