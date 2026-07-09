import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Video, VideoOff, Paperclip, File as FileIcon, Loader2 } from 'lucide-react';
import { conversationsApi, uploadsApi } from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { useSocketChat } from '../hooks/useSocketChat';
import { MessageSkeleton } from '../components/ui/Skeletons';
import { format } from 'date-fns';
import type { Message } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const sendChatMessage = (content: string, attachment?: any) => {
    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      _id: tempId,
      conversationId: conversationId!,
      sender: { _id: (user as any)._id || user!.id, name: user!.name, avatar: user?.avatar },
      content,
      attachment,
      readBy: [(user as any)._id || user!.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempId,
      pending: true,
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);
    sendMessage(content, tempId, attachment);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content && !isUploading) return;
    setInputValue('');
    sendChatMessage(content);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadsApi.uploadAttachment(file);
      if (res.data.success) {
        sendChatMessage('', res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
  const otherParticipant = convDetailsData?.data?.data?.participants?.find((p) => {
    const pId = p._id || (p as any).id;
    const myId = user?.id || (user as any)?._id;
    return String(pId) !== String(myId);
  });

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
              const senderId = msg.sender._id || (msg.sender as any).id;
              const myId = user?.id || (user as any)?._id;
              const isMine = String(senderId) === String(myId);
              const showAvatar = !isMine && (i === 0 || (messages[i - 1]?.sender._id || (messages[i - 1]?.sender as any)?.id) !== senderId);

              return (
                <div
                  key={msg._id}
                  className={clsx(
                    'w-full flex gap-2 items-end animate-fade-in',
                    isMine ? 'justify-end' : 'justify-start'
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
                        ? 'bg-brand-600 text-white rounded-bl-sm'
                        : 'bg-surface-elevated border border-surface-border text-white rounded-br-sm',
                      msg.pending && 'opacity-60'
                    )}
                  >
                    {msg.attachment && (
                      <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        {msg.attachment.type === 'image' ? (
                          <img src={msg.attachment.url} alt={msg.attachment.name} className="w-full h-auto object-cover max-h-64" />
                        ) : (
                          <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
                            <div className="w-10 h-10 rounded bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.attachment.name}</p>
                              <p className="text-xs text-white/50 truncate">
                                {(msg.attachment.size / 1024 / 1024).toFixed(2)} MB • {msg.attachment.type.toUpperCase()}
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content}
                    <div className={clsx('flex items-center gap-1 mt-1', isMine ? 'justify-start' : 'justify-end')}>
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-secondary flex-shrink-0 aspect-square p-2.5 bg-surface-elevated hover:bg-surface-elevated/80 border-surface-border text-white/70 hover:text-white"
                title="Attach file (max 5MB)"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
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
                disabled={(!inputValue.trim() && !isUploading) || isUploading}
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
