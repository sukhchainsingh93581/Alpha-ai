import React, { useState } from 'react';
import { User, AppSettings, UserTheme } from '../types';
import AdBanner from './AdBanner';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: User | null;
  onToggleTheme: () => void;
  appSettings: AppSettings | null;
  themeToApply: UserTheme;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activePage, onNavigate, onLogout, user, onToggleTheme, appSettings, themeToApply 
}) => {
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === "&9358197207&") {
      setIsAdminLoginOpen(false);
      setAdminPass('');
      onNavigate('admin');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'fa-home' },
    { id: 'tools', label: 'Tools', icon: 'fa-robot' },
    { id: 'premium', label: 'Premium', icon: 'fa-crown' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' }
  ];

  const studioStyle = {
    '--bg-primary': themeToApply.bgPrimary,
    '--bg-secondary': themeToApply.bgSecondary,
    '--bg-card': themeToApply.bgCard,
    '--border': themeToApply.borderColor,
    '--text-primary': themeToApply.textPrimary,
    '--text-secondary': themeToApply.textSecondary,
    '--accent': themeToApply.accentColor,
    '--button-bg': themeToApply.buttonBg,
    '--success': themeToApply.statusSuccess,
    '--danger': themeToApply.statusDanger,
    '--warning': themeToApply.statusWarning,
  } as React.CSSProperties;

  if (activePage === 'admin') return <>{children}</>;

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto bg-[var(--bg-primary)] border-x border-[var(--border)] shadow-2xl relative overflow-hidden"
      style={studioStyle}
    >
      {/* Admin Login Modal (Triggered by 3-line button) */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsAdminLoginOpen(false)}></div>
          <div className="relative w-full max-w-[320px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-shield text-2xl text-[var(--accent)]"></i>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Master Access</h2>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Enter Admin Password</p>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <input 
                autoFocus
                type="password"
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className={`w-full bg-[var(--bg-primary)] border ${loginError ? 'border-[var(--danger)] animate-shake' : 'border-[var(--border)]'} rounded-2xl p-4 text-center text-sm outline-none focus:border-[var(--accent)] transition-all tracking-widest`}
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAdminLoginOpen(false)} className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-[10px] font-black uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[var(--accent)] text-black rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[var(--accent)]/30">Unlock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-6 py-5 bg-[var(--bg-primary)] border-b border-[var(--border)] shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onToggleTheme} className="text-[var(--text-primary)] text-xl p-2 opacity-80 hover:scale-110 transition-all">
            <i className="fas fa-circle-half-stroke"></i>
          </button>
          
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden border border-[var(--border)]">
            {appSettings?.appLogo ? (
              <img src={appSettings.appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-purple-600" />
            )}
          </div>
          
          <h1 className="text-xl font-black bg-gradient-to-r from-[var(--accent)] to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">
            {appSettings?.appName || "AI Studio"}
          </h1>
        </div>
        
        {/* The 3-Line Button for Admin Access */}
        <button onClick={() => setIsAdminLoginOpen(true)} className="text-[var(--text-primary)] text-xl p-2 opacity-80 active:scale-90 transition-all">
          <i className="fas fa-bars"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar text-[var(--text-primary)]">
        {children}
        {!user?.premium && <AdBanner user={user} />}
      </main>

      <nav className="flex items-center justify-around bg-[var(--bg-primary)] border-t border-[var(--border)] h-[80px] shrink-0 px-2">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all rounded-xl ${activePage === item.id ? 'bg-[var(--bg-secondary)]' : ''}`}
          >
            <i className={`fas ${item.icon} text-2xl ${activePage === item.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}></i>
            <span className={`text-[9px] font-black uppercase tracking-widest ${activePage === item.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
};