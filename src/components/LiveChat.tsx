'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { onChatMessages, sendChatMessage } from '@/lib/firestore';
import { FiSend, FiMessageCircle, FiLock } from 'react-icons/fi';
import Link from 'next/link';

interface LiveChatProps {
  auctionId: string;
}

export default function LiveChat({ auctionId }: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onChatMessages(auctionId, (data) => {
      setMessages(data);
    });
    return () => unsubscribe();
  }, [auctionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !user || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await sendChatMessage(auctionId, {
        auctionId,
        userId: user.uid,
        userName: user.displayName || user.email,
        userRole: user.role,
        message: text,
        timestamp: new Date(),
      });
    } catch {
      // Restore input if sending failed
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: Date | { toDate?: () => Date } | string) {
    const date = ts && typeof ts === 'object' && 'toDate' in ts && ts.toDate
      ? ts.toDate()
      : new Date(ts as Date | string);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-card-border">
        <FiMessageCircle className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Live Chat</span>
        <span className="ml-auto text-xs text-muted">{messages.length} Nachrichten</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted text-center">Noch keine Nachrichten. Starte die Unterhaltung!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = user && msg.userId === user.uid;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : ''}`}>
              {!isMe && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                  msg.userRole === 'dealer' ? 'bg-accent text-black' : 'bg-accent/20 text-accent'
                }`}>
                  {msg.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`max-w-[75%] ${
                isMe
                  ? 'bg-accent/20 border border-accent/30'
                  : 'bg-input-bg border border-card-border'
              } rounded-lg px-3 py-2`}>
                {!isMe && (
                  <p className={`text-xs font-semibold mb-0.5 ${msg.userRole === 'dealer' ? 'text-accent' : 'text-foreground'}`}>
                    {msg.userName}
                    {msg.userRole === 'dealer' && (
                      <span className="ml-1.5 text-[10px] bg-accent/20 text-accent px-1 py-0.5 rounded-full font-normal">Händler</span>
                    )}
                  </p>
                )}
                <p className="text-sm text-foreground">{msg.message}</p>
                <p className="text-[10px] text-muted mt-1">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-card-border">
        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
              placeholder="Nachricht schreiben..."
              disabled={sending}
              className="flex-1 bg-input-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-accent hover:bg-accent-hover text-black p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted">
            <FiLock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <Link href="/login" className="text-accent hover:underline">Anmelden</Link>
              {' '}um am Chat teilzunehmen
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
