'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiMenu, FiX, FiZap, FiPlus, FiUser, FiLogOut, FiGrid, FiShield, FiInbox } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { onMyConversations } from '@/lib/firestore';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const unsub = onMyConversations(user.uid, (data) => {
      setUnreadCount(data.filter(c => c.unreadFor?.includes(user.uid)).length);
    });
    return () => unsub();
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-card-bg/80 backdrop-blur-xl border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FiZap className="w-7 h-7 text-accent group-hover:text-accent-light transition-colors" />
            <span className="text-xl font-bold tracking-tight">
              Auto<span className="text-accent">Bid</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
              Live Auktionen
            </Link>

            {user ? (
              <>
                {/* Dealer / Admin Links */}
                {(user.role === 'dealer' || user.role === 'admin') && (
                  <Link
                    href="/dashboard/haendler"
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <FiGrid className="w-3.5 h-3.5" />
                    Meine Auktionen
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <FiShield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/postfach"
                  className="relative flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
                  title="Postfach"
                >
                  <FiInbox className="w-4 h-4" />
                  Postfach
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/erstellen"
                  className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  Auto einstellen
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-card-border">
                  <Link href="/konto" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user.displayName}</span>
                    {user.role === 'dealer' && (
                      <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">Händler</span>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-[10px] bg-danger/20 text-danger px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-muted hover:text-danger transition-colors"
                    title="Abmelden"
                  >
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground border border-card-border hover:border-muted px-4 py-2 rounded-lg transition-all"
                >
                  <FiUser className="w-4 h-4" />
                  Anmelden
                </Link>
                <Link
                  href="/registrieren"
                  className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-muted hover:text-foreground"
          >
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <Link href="/" className="block px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
              Live Auktionen
            </Link>
            {user ? (
              <>
                {(user.role === 'dealer' || user.role === 'admin') && (
                  <Link href="/dashboard/haendler" className="block px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                    Meine Auktionen
                  </Link>
                )}
                <Link href="/erstellen" className="block px-3 py-2 text-sm text-accent font-semibold rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                  + Auto einstellen
                </Link>
                {user.role === 'admin' && (
                  <Link href="/dashboard/admin" className="block px-3 py-2 text-sm text-danger hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/postfach" className="flex items-center justify-between px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                  <span>Postfach</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/konto" className="block px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                  Mein Konto
                </Link>
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-danger rounded-lg hover:bg-input-bg">
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                  Anmelden
                </Link>
                <Link href="/registrieren" className="block px-3 py-2 text-sm text-accent font-semibold rounded-lg hover:bg-input-bg" onClick={() => setMenuOpen(false)}>
                  Registrieren
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
