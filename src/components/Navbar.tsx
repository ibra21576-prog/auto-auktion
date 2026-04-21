'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiMenu, FiX, FiPlus, FiUser, FiLogOut, FiGrid, FiShield, FiInbox, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { onMyConversations } from '@/lib/firestore';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const unsub = onMyConversations(user.uid, (data) => {
      setUnreadCount(data.filter(c => c.unreadFor?.includes(user.uid)).length);
    });
    return () => unsub();
  }, [user]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-card-bg border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-tight">AB</span>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              Auto<span className="text-accent">Bid</span>
            </span>
          </Link>

          {/* Desktop centre nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Auktionen</NavLink>
            {user && (user.role === 'dealer' || user.role === 'admin') && (
              <NavLink href="/dashboard/haendler">
                <FiGrid className="w-3.5 h-3.5" /> Meine Auktionen
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink href="/dashboard/admin">
                <FiShield className="w-3.5 h-3.5" /> Admin
              </NavLink>
            )}
            {user && (
              <NavLink href="/postfach">
                <FiInbox className="w-3.5 h-3.5" />
                Postfach
                {unreadCount > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/erstellen"
                  className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  Auto einstellen
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                    className="flex items-center gap-2 pl-3 border-l border-card-border text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                      {(user.displayName || user.email).charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[90px] truncate text-foreground">{user.displayName || user.email}</span>
                    <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card-bg border border-card-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-card-border">
                        <p className="text-xs font-semibold truncate">{user.displayName}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                        <span className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
                          user.role === 'admin'  ? 'bg-danger/20 text-danger' :
                          user.role === 'dealer' ? 'bg-accent/20 text-accent' :
                          'bg-input-bg text-muted'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'dealer' ? 'Händler' : 'Käufer'}
                        </span>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <DropdownItem href="/konto"><FiUser className="w-3.5 h-3.5" /> Mein Konto</DropdownItem>
                        <DropdownItem href="/postfach">
                          <FiInbox className="w-3.5 h-3.5" /> Postfach
                          {unreadCount > 0 && <span className="ml-auto min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center px-1">{unreadCount}</span>}
                        </DropdownItem>
                        <button
                          onClick={() => signOut()}
                          className="w-full flex items-center gap-2 text-sm text-muted hover:text-danger px-3 py-2 rounded-lg hover:bg-input-bg transition-colors"
                        >
                          <FiLogOut className="w-3.5 h-3.5" /> Abmelden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted hover:text-foreground px-4 py-2 rounded-lg border border-card-border hover:border-accent/40 transition-all flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5" /> Anmelden
                </Link>
                <Link href="/registrieren" className="text-sm bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                  Registrieren
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-muted hover:text-foreground p-1">
            {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-card-border py-3 space-y-0.5">
            <MobileLink href="/" onClick={() => setMenuOpen(false)}>Auktionen</MobileLink>
            {user ? (
              <>
                {(user.role === 'dealer' || user.role === 'admin') && (
                  <MobileLink href="/dashboard/haendler" onClick={() => setMenuOpen(false)}>Meine Auktionen</MobileLink>
                )}
                {user.role === 'admin' && (
                  <MobileLink href="/dashboard/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</MobileLink>
                )}
                <MobileLink href="/postfach" onClick={() => setMenuOpen(false)}>
                  Postfach {unreadCount > 0 && <span className="ml-1 bg-accent text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
                </MobileLink>
                <MobileLink href="/konto" onClick={() => setMenuOpen(false)}>Mein Konto</MobileLink>
                <MobileLink href="/erstellen" onClick={() => setMenuOpen(false)} accent>+ Auto einstellen</MobileLink>
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-danger hover:bg-input-bg rounded-lg transition-colors">
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Anmelden</MobileLink>
                <MobileLink href="/registrieren" onClick={() => setMenuOpen(false)} accent>Registrieren</MobileLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground hover:bg-input-bg px-3 py-2 rounded-lg transition-colors">
      {children}
    </Link>
  );
}

function DropdownItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-input-bg transition-colors w-full">
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children, accent }: { href: string; onClick: () => void; children: React.ReactNode; accent?: boolean }) {
  return (
    <Link href={href} onClick={onClick} className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${accent ? 'text-accent font-semibold hover:bg-input-bg' : 'text-muted hover:text-foreground hover:bg-input-bg'}`}>
      {children}
    </Link>
  );
}
