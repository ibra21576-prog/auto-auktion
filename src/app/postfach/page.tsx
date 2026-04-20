'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiInbox, FiLoader, FiLock, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { onMyConversations } from '@/lib/firestore';
import { Conversation } from '@/types';

export default function PostfachPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirect=/postfach');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = onMyConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiInbox className="w-6 h-6 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold">Postfach</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <FiLoader className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-card-bg border border-card-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-input-bg flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="w-7 h-7 text-muted" />
          </div>
          <p className="text-lg font-semibold mb-1">Keine Nachrichten</p>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Du hast noch keine Nachrichten. Kontaktiere einen Händler auf einer Auktionsseite, um eine Unterhaltung zu starten.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const otherId = c.participantIds.find((id) => id !== user.uid) || '';
            const otherName = c.participantNames?.[otherId] || 'Unbekannt';
            const hasUnread = c.unreadFor?.includes(user.uid);
            return (
              <li key={c.id}>
                <Link
                  href={`/postfach/${c.id}`}
                  className={`block bg-card-bg border rounded-xl p-4 transition-colors hover:border-accent/50 ${
                    hasUnread ? 'border-accent/40' : 'border-card-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold text-sm truncate ${hasUnread ? 'text-accent' : 'text-foreground'}`}>
                          {otherName}
                        </p>
                        {hasUnread && <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
                      </div>
                      {c.auctionTitle && (
                        <p className="text-xs text-muted mb-1">Re: {c.auctionTitle}</p>
                      )}
                      <p className="text-sm text-muted truncate">
                        {c.lastSenderId === user.uid ? 'Du: ' : ''}
                        {c.lastMessage || 'Noch keine Nachrichten'}
                      </p>
                    </div>
                    <span className="text-xs text-muted flex-shrink-0">
                      {c.lastMessageAt?.toLocaleDateString?.('de-DE', { day: '2-digit', month: 'short' }) || ''}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
