import { Avatar, AvatarFallback } from './ui/avatar';
import { Paperclip } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'mentor' | 'innovator';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; type: string }[];
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isMentor = message.sender === 'mentor';
  const initials = message.senderName.split(' ').map(n => n[0]).join('');

  return (
    <div className={`flex gap-3 ${isMentor ? 'flex-row' : 'flex-row-reverse'}`}>
      <Avatar className={isMentor ? 'bg-teal-600' : 'bg-orange-500'}>
        <AvatarFallback className="text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 max-w-[70%] ${isMentor ? '' : 'items-end'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-700">
            {message.senderName}
          </span>
          <span className="text-xs text-gray-500">{message.timestamp}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isMentor
              ? 'bg-teal-50 border border-teal-100'
              : 'bg-orange-50 border border-orange-100'
          }`}
        >
          <p className="text-gray-800">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                >
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{attachment.name}</span>
                  <span className="text-xs text-gray-500">({attachment.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
