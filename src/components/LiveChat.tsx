'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { FiSend, FiMessageCircle } from 'react-icons/fi';

interface LiveChatProps {
  auctionId: string;
}

const initialMessages: ChatMessage[] = [
  { id: 'c1', auctionId: '1', userId: 'u1', userName: 'AutoHaus Premium', userRole: 'dealer', message: 'Willkommen zur Auktion! Bei Fragen zum Fahrzeug stehe ich zur Verfügung.', timestamp: new Date(Date.now() - 3600000) },
  { id: 'c2', auctionId: '1', userId: 'u3', userName: 'MaxM.', userRole: 'buyer', message: 'Wurde der Zahnriemen schon gewechselt?', timestamp: new Date(Date.now() - 2400000) },
  { id: 'c3', auctionId: '1', userId: 'u1', userName: 'AutoHaus Premium', userRole: 'dealer', message: 'Ja, der Zahnriemen wurde bei 20.000 km gewechselt. Rechnung liegt vor.', timestamp: new Date(Date.now() - 2000000) },
  { id: 'c4', auctionId: '1', userId: 'u5', userName: 'ThomasK.', userRole: 'buyer', message: 'Gibt es bekannte Mängel?', timestamp: new Date(Date.now() - 1200000) },
  { id: 'c5', auctionId: '1', userId: 'u1', userName: 'AutoHaus Premium', userRole: 'dealer', message: 'Keine bekannten Mängel. Fahrzeug wurde kürzlich bei Porsche inspiziert.', timestamp: new Date(Date.now() - 600000) },
  { id: 'c6', auctionId: '1', userId: 'u7', userName: 'StefanW.', userRole: 'buyer', message: 'Traumauto! 🔥', timestamp: new Date(Date.now() - 300000) },
];

const simulatedMessages = [
  { userName: 'AnnaL.', message: 'Kann man das Fahrzeug vor Ort besichtigen?' },
  { userName: 'ChrisP.', message: 'Wie sieht der Unterboden aus?' },
  { userName: 'MaxM.', message: 'Wird immer spannender hier! 💪' },
  { userName: 'ThomasK.', message: 'Was für ein Preis... überlege noch' },
  { userName: 'StefanW.', message: 'Gibt es Garantie nach dem Kauf?' },
];

export default function LiveChat({ auctionId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const sim = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
        const newMsg: ChatMessage = {
          id: `c${Date.now()}`,
          auctionId,
          userId: `u${Math.random()}`,
          userName: sim.userName,
          userRole: 'buyer',
          message: sim.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMsg]);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [auctionId]);

  function handleSend() {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: `c${Date.now()}`,
      auctionId,
      userId: 'currentUser',
      userName: 'Du',
      userRole: 'buyer',
      message: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-card-border">
        <FiMessageCircle className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Live Chat</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          {messages.length} Nachrichten
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.userName === 'Du' ? 'justify-end' : ''}`}>
            {msg.userName !== 'Du' && (
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0 mt-0.5">
                {msg.userName.charAt(0)}
              </div>
            )}
            <div className={`max-w-[75%] ${
              msg.userName === 'Du'
                ? 'bg-accent/20 border border-accent/30'
                : 'bg-input-bg border border-card-border'
            } rounded-lg px-3 py-2`}>
              {msg.userName !== 'Du' && (
                <p className="text-xs font-semibold text-accent mb-0.5">{msg.userName}</p>
              )}
              <p className="text-sm text-foreground">{msg.message}</p>
              <p className="text-[10px] text-muted mt-1">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-card-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nachricht schreiben..."
            className="flex-1 bg-input-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSend}
            className="bg-accent hover:bg-accent-hover text-black p-2 rounded-lg transition-colors"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
