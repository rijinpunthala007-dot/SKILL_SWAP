import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getSocket } from '../lib/socket';
import type { Message } from '../types';

interface UseSocketChatOptions {
  conversationId: string;
  onMessageReceived: (message: Message) => void;
  onTyping: (userId: string) => void;
  onStopTyping: (userId: string) => void;
  onMessagesRead: (userId: string) => void;
  lastSeenMessageId?: string;
  onBackfill?: (messages: Message[]) => void;
}

export function useSocketChat({
  conversationId,
  onMessageReceived,
  onTyping,
  onStopTyping,
  onMessagesRead,
  lastSeenMessageId,
  onBackfill,
}: UseSocketChatOptions) {
  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    // Join conversation room
    socket.emit('join_conversation', { conversationId });

    // Request backfill if we have a last seen ID (reconnect case)
    if (lastSeenMessageId) {
      socket.emit('request_backfill', { conversationId, lastSeenMessageId });
    }

    socket.on('receive_message', onMessageReceived);
    socket.on('typing', ({ userId }: { userId: string }) => onTyping(userId));
    socket.on('stop_typing', ({ userId }: { userId: string }) => onStopTyping(userId));
    socket.on('messages_read', ({ userId }: { userId: string }) => onMessagesRead(userId));
    socket.on('backfill_messages', ({ messages }: { messages: Message[] }) => {
      if (onBackfill) onBackfill(messages);
    });
    socket.on('message_error', ({ message: errMsg }: { message: string }) => {
      toast.error(errMsg ?? 'Message failed to send');
    });
    socket.on('connect_error', (err) => {
      toast.error(`Socket Error: ${err.message}`);
    });

    return () => {
      socket.off('receive_message', onMessageReceived);
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('messages_read');
      socket.off('backfill_messages');
      socket.off('message_error');
    };
  }, [conversationId, lastSeenMessageId, onMessageReceived, onTyping, onStopTyping, onMessagesRead, onBackfill, socket]);

  const sendTyping = useCallback(() => {
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId });
    }

    // Debounce — stop typing signal sent 1.5s after last keystroke
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId });
    }, 1500);
  }, [conversationId, socket]);

  const sendMessage = useCallback(
    (content: string, tempId: string) => {
      if (!socket) return;
      socket.emit('send_message', { conversationId, content, tempId });
    },
    [conversationId, socket]
  );

  const markRead = useCallback(() => {
    if (!socket) return;
    socket.emit('mark_read', { conversationId });
  }, [conversationId, socket]);

  return { sendMessage, sendTyping, markRead };
}

export function usePresence(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }: { userId: string }) => {
      if (userIds.includes(userId)) {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      }
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    return () => {
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
    };
  }, [userIds.join(','), socket]);

  return { onlineUsers };
}
