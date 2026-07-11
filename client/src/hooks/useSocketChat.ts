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
  onChallengeRequestReceived?: (data: any) => void;
  onChallengeDeclined?: (data: any) => void;
  onChallengeStart?: (data: any) => void;
  onChallengeQuestion?: (data: any) => void;
  onChallengeRoundResult?: (data: any) => void;
  onChallengeEnd?: (data: any) => void;
}

export function useSocketChat({
  conversationId,
  onMessageReceived,
  onTyping,
  onStopTyping,
  onMessagesRead,
  lastSeenMessageId,
  onBackfill,
  onChallengeRequestReceived,
  onChallengeDeclined,
  onChallengeStart,
  onChallengeQuestion,
  onChallengeRoundResult,
  onChallengeEnd,
}: UseSocketChatOptions) {
  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef = useRef(false);

  // Refs for all callbacks so socket listeners always call the latest version
  // without needing to re-register on every render (fixes stale closures).
  const cbRefs = useRef({
    onMessageReceived, onTyping, onStopTyping, onMessagesRead, onBackfill,
    onChallengeRequestReceived, onChallengeDeclined, onChallengeStart,
    onChallengeQuestion, onChallengeRoundResult, onChallengeEnd,
  });
  cbRefs.current = {
    onMessageReceived, onTyping, onStopTyping, onMessagesRead, onBackfill,
    onChallengeRequestReceived, onChallengeDeclined, onChallengeStart,
    onChallengeQuestion, onChallengeRoundResult, onChallengeEnd,
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_conversation', { conversationId });
    if (lastSeenMessageId) {
      socket.emit('request_backfill', { conversationId, lastSeenMessageId });
    }

    const handleMessage = (msg: Message) => cbRefs.current.onMessageReceived(msg);
    const handleTyping = ({ userId }: { userId: string }) => cbRefs.current.onTyping(userId);
    const handleStopTyping = ({ userId }: { userId: string }) => cbRefs.current.onStopTyping(userId);
    const handleMessagesRead = ({ userId }: { userId: string }) => cbRefs.current.onMessagesRead(userId);
    const handleBackfill = ({ messages }: { messages: Message[] }) => cbRefs.current.onBackfill?.(messages);
    const handleMessageError = ({ message: errMsg }: { message: string }) => toast.error(errMsg ?? 'Message failed to send');
    const handleConnectError = (err: Error) => toast.error(`Socket Error: ${err.message}`);
    const handleChallengeRequest = (data: any) => cbRefs.current.onChallengeRequestReceived?.(data);
    const handleChallengeDeclined = (data: any) => cbRefs.current.onChallengeDeclined?.(data);
    const handleChallengeStart = (data: any) => cbRefs.current.onChallengeStart?.(data);
    const handleChallengeQuestion = (data: any) => cbRefs.current.onChallengeQuestion?.(data);
    const handleChallengeRoundResult = (data: any) => cbRefs.current.onChallengeRoundResult?.(data);
    const handleChallengeEnd = (data: any) => cbRefs.current.onChallengeEnd?.(data);

    socket.on('receive_message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('backfill_messages', handleBackfill);
    socket.on('message_error', handleMessageError);
    socket.on('connect_error', handleConnectError);
    socket.on('challenge_request_received', handleChallengeRequest);
    socket.on('challenge_declined', handleChallengeDeclined);
    socket.on('challenge_start', handleChallengeStart);
    socket.on('challenge_question', handleChallengeQuestion);
    socket.on('challenge_round_result', handleChallengeRoundResult);
    socket.on('challenge_end', handleChallengeEnd);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('backfill_messages', handleBackfill);
      socket.off('message_error', handleMessageError);
      socket.off('connect_error', handleConnectError);
      socket.off('challenge_request_received', handleChallengeRequest);
      socket.off('challenge_declined', handleChallengeDeclined);
      socket.off('challenge_start', handleChallengeStart);
      socket.off('challenge_question', handleChallengeQuestion);
      socket.off('challenge_round_result', handleChallengeRoundResult);
      socket.off('challenge_end', handleChallengeEnd);
    };
  // Only re-register if socket instance or room changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastSeenMessageId, socket]);

  const sendTyping = useCallback(() => {
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId });
    }, 1500);
  }, [conversationId, socket]);

  const sendMessage = useCallback(
    (content: string, tempId: string, attachment?: any) => {
      if (!socket) return;
      socket.emit('send_message', { conversationId, content, tempId, attachment });
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
