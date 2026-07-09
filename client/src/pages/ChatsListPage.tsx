import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { conversationsApi } from '../services/api.service';
import { ConversationSkeleton } from '../components/ui/Skeletons';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';

export function ChatsListPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getAll(),
    refetchInterval: 10000,
  });

  const conversations = data?.data?.data ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <p className="text-white/50 mt-1">Your active skill exchange conversations</p>
      </div>

      {isLoading ? (
        <ConversationSkeleton />
      ) : conversations.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <MessageSquare className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/40">No conversations yet</h3>
          <p className="text-white/25 text-sm mt-2">
            Accept a skill exchange request to start chatting
          </p>
          <Link to="/requests" className="btn-primary mt-4 inline-flex text-sm">
            View Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = conv.participants.find((p) => String(p._id) !== String(user?.id));
            return (
              <button
                key={conv._id}
                id={`conv-${conv._id}`}
                onClick={() => navigate(`/chats/${conv._id}`)}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-brand-500/40 transition-all duration-200 text-left group"
              >
                <div className="relative flex-shrink-0">
                  {other?.avatar ? (
                    <img src={other.avatar} alt={other.name} className="w-12 h-12 avatar" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold">
                      {other?.name?.[0]}
                    </div>
                  )}
                  {/* Online indicator placeholder */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{other?.name}</p>
                    {conv.lastMessageAt && (
                      <p className="text-xs text-white/30 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-white/40 truncate mt-0.5">
                    {conv.lastMessage ?? 'No messages yet'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
