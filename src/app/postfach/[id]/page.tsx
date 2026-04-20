'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiSend } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import {
  getConversation,
  markConversationRead,
  onConversationMessages,
  sendDirectMessage,
} from '@/lib/firestore';
import { Conversation, DirectMessage } from '@/types';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirect=/postfach');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !conversationId) return;
    let active = true;
    (async () => {
      const c = await getConversation(conversationId);
      if (!active) return;
      if (!c || !c.participantIds.includes(user.uid)) {
        router.replace('/postfach');
        return;
      }
      setConversation(c);
      setLoading(false);
      markConversationRead(conversationId, user.uid).catch(() => {});
    })();
    return () => { active = false; };
  }, [user, conversationId, router]);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = onConversationMessages(conversationId, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !conversation || !text.trim() || sending) return;
    const otherId = conversation.participantIds.find((id) => id !== user.uid) || '';
    setSending(true);
    setError('');
    const payload = text.trim();
    setText('');
    try {
      await sendDirectMessage({
        conversationId,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        text: payload,
        otherId,
      });
    } catch (err) {
      console.error(err);
      setError('Nachricht konnte nicht gesendet werden.');
      setText(payload);
    } finally {
      setSending(false);
    }
  }

  if (authLoading || loading || !user || !conversation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const otherId = conversation.participantIds.find((id) => id !== user.uid) || '';
  const otherName = conversation.participantNames?.[otherId] || 'Unbekannt';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-card-border">
        <Link href="/postfach" className="text-muted hover:text-foreground">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{otherName}</p>
          {conversation.auctionTitle && (
            <p className="text-xs text-muted truncate">
              Zu Auktion:{' '}
              {conversation.auctionId ? (
                <Link href={`/auktion/${conversation.auctionId}`} className="text-accent hover:underline">
                  {conversation.auctionTitle}
                </Link>
              ) : (
                conversation.auctionTitle
              )}
            </p>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pb-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted py-12">Schreibe die erste Nachricht.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.uid;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? 'bg-accent text-black rounded-br-sm'
                      : 'bg-card-bg border border-card-border rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-black/60' : 'text-muted'}`}>
                    {m.createdAt?.toLocaleTimeString?.('de-DE', { hour: '2-digit', minute: '2-digit' }) || ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-2">{error}</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-card-border">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben…"
          className="flex-1 bg-input-bg border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          {sending ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
