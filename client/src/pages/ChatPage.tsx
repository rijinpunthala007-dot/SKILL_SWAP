import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Video, VideoOff } from 'lucide-react';
import { conversationsApi } from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { useSocketChat } from '../hooks/useSocketChat';
import { MessageSkeleton } from '../components/ui/Skeletons';
import { format } from 'date-fns';
import type { Message } from '../types';
import clsx from 'clsx';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showVideoCall, setShowVideoCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | undefined>(undefined);

  // Jitsi Video Call embed logic
  useEffect(() => {
    if (showVideoCall && conversationId && user) {
      // @ts-ignore
      const domain = 'meet.jit.si';
      const options = {
        roomName: `SkillSwap-${conversationId}`,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#jitsi-container'),
        userInfo: {
          displayName: user.name,
          email: user.email,
        },
        interfaceConfigOverwrite: {
          TILE_VIEW_MAX_COLUMNS: 2,
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
        },
      };
      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(domain, options);

      return () => {
        api.dispose();
      };
    }
  }, [showVideoCall, conversationId, user]);

  // Load initial messages
  const { data: convData, isLoading: loadingConv } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationsApi.getMessages(conversationId!, { limit: 50 }),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (convData?.data?.data) {
      const msgs = convData.data.data;
      setMessages(msgs);
      if (msgs.length > 0) {
        lastSeenRef.current = msgs[msgs.length - 1]._id;
      }
    }
  }, [convData]);

  // Scroll to bottom on initial load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onMessageReceived = useCallback((msg: Message) => {
    setMessages((prev) => {
      // Reconcile optimistic message with server-confirmed message
      const existingIndex = prev.findIndex((m) => m.tempId && m.tempId === msg.tempId);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...msg, pending: false };
        return updated;
      }
      // New message from other user
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    lastSeenRef.current = msg._id;
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }, [qc]);

  const onTyping = useCallback((userId: string) => {
    if (userId !== user?.id) {
      setTypingUsers((prev) => new Set([...prev, userId]));
    }
  }, [user?.id]);

  const onStopTyping = useCallback((userId: string) => {
    setTypingUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const onMessagesRead = useCallback((_userId: string) => {
    setMessages((prev) =>
      prev.map((m) => ({ ...m, readBy: [...new Set([...m.readBy, _userId])] }))
    );
  }, []);

  const onBackfill = useCallback((backfillMessages: Message[]) => {
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m._id));
      const newMsgs = backfillMessages.filter((m) => !existingIds.has(m._id));
      return [...prev, ...newMsgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  const { sendMessage, sendTyping, markRead } = useSocketChat({
    conversationId: conversationId!,
    onMessageReceived,
    onTyping,
    onStopTyping,
    onMessagesRead,
    lastSeenMessageId: lastSeenRef.current,
    onBackfill,
  });

  // Mark as read when page is visible
  useEffect(() => {
    markRead();
  }, [messages.length, markRead]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      _id: tempId,
      conversationId: conversationId!,
      sender: { _id: user!.id, name: user!.name, avatar: user?.avatar },
      content,
      readBy: [user!.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempId,
      pending: true,
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');

    // Send via socket
    sendMessage(content, tempId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    sendTyping();
  };

  // Get other participant info
  const { data: convDetailsData } = useQuery({
    queryKey: ['conversationDetails', conversationId],
    queryFn: () => conversationsApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });
  const otherParticipant = convDetailsData?.data?.data?.participants?.find(
    (p) => String(p._id) !== String(user?.id)
  );

  if (loadingConv) {
    return (
      <div className="flex flex-col h-full">
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-card/50 backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <Link to="/chats" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt={otherParticipant.name} className="w-9 h-9 avatar" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold text-sm">
              {otherParticipant?.name?.[0]}
            </div>
          )}

          <div>
            <p className="font-semibold text-white text-sm">{otherParticipant?.name ?? 'Conversation'}</p>
            {typingUsers.size > 0 ? (
              <p className="text-xs text-brand-400 flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                typing...
              </p>
            ) : (
              <p className="text-xs text-white/30">Active now</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowVideoCall(!showVideoCall)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            showVideoCall
              ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
              : 'bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/30'
          )}
        >
          {showVideoCall ? (
            <>
              <VideoOff className="w-4 h-4" /> End Video
            </>
          ) : (
            <>
              <Video className="w-4 h-4" /> Start Video
            </>
          )}
        </button>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Jitsi Video Container */}
        {showVideoCall && (
          <div className="w-[60%] border-r border-surface-border bg-black/40 flex items-center justify-center relative">
            <div id="jitsi-container" className="w-full h-full" />
          </div>
        )}

        {/* Text Chat History & Input */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            id="chat-messages"
          >
            {messages.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <p className="text-sm">No messages yet — say hello! 👋</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = String(msg.sender._id) === String(user?.id);
              const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender._id !== msg.sender._id);

              return (
                <div
                  key={msg._id}
                  className={clsx(
                    'flex gap-2 items-end animate-fade-in',
                    isMine ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  {!isMine && (
                    <div className="w-7 h-7 flex-shrink-0 mb-1">
                      {showAvatar && (
                        msg.sender.avatar ? (
                          <img src={msg.sender.avatar} alt={msg.sender.name} className="w-7 h-7 avatar" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-xs font-bold">
                            {msg.sender.name[0]}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={clsx(
                      'max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMine
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-surface-elevated border border-surface-border text-white rounded-bl-sm',
                      msg.pending && 'opacity-60'
                    )}
                  >
                    {msg.content}
                    <div className={clsx('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
                      <span className="text-[10px] opacity-50">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </span>
                      {msg.pending && <span className="text-[10px] opacity-40">sending...</span>}
                      {msg.failed && <span className="text-[10px] text-red-400">failed</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-surface-border bg-surface-card/50 backdrop-blur-lg">
            <div className="flex items-end gap-3">
              <textarea
                id="chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="input resize-none flex-1 py-2.5 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                id="chat-send"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="btn-primary flex-shrink-0 aspect-square p-2.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
