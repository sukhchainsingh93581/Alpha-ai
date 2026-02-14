
import React, { useState } from 'react';
import { AppSettings, UserTheme } from '../types';

interface MaintenanceScreenProps {
  onAdminAccess: () => void;
  appSettings: AppSettings | null;
  theme: UserTheme;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onAdminAccess, appSettings, theme }) => {
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === "&9358197207&") {
      onAdminAccess();
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const maintenanceStyle = {
    '--bg-primary': theme.bgPrimary,
    '--bg-secondary': theme.bgSecondary,
    '--bg-card': theme.bgCard,
    '--border': theme.borderColor,
    '--text-primary': theme.textPrimary,
    '--text-secondary': theme.textSecondary,
    '--accent': theme.accentColor,
  } as React.CSSProperties;

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto bg-[var(--bg-primary)] items-center justify-center p-8 relative overflow-hidden"
      style={maintenanceStyle}
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-[100px] animate-pulse"></div>

      {/* Hidden Admin Menu */}
      <button 
        onClick={() => setIsAdminLoginOpen(true)}
        className="absolute top-6 right-6 text-[var(--text-secondary)] opacity-30 hover:opacity-100 transition-opacity p-2"
      >
        <i className="fas fa-bars text-xl"></i>
      </button>

      <div className="text-center z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-[var(--accent)] to-[#7700ff] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[var(--accent)]/20 animate-bounce [animation-duration:3s]">
          <i className="fas fa-tools text-4xl text-white"></i>
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">
          {appSettings?.appName || "AI Studio"} <br/>
          <span className="text-[var(--accent)]">is Offline</span>
        </h1>
        
        <div className="h-1 w-20 bg-[var(--accent)] mx-auto rounded-full mb-6 opacity-30"></div>
        
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest opacity-80">
          Hum abhi kuch naye features aur security updates add kar rahe hain. 
          <br/><br/>
          <span className="text-[10px] font-black">Wapas milte hain thodi der mein!</span>
        </p>
      </div>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsAdminLoginOpen(false)}></div>
          <div className="relative w-full max-w-[320px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--accent)]/20">
                <i className="fas fa-unlock-alt text-2xl text-[var(--accent)]"></i>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Admin Login</h2>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Bypass Maintenance</p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <input 
                autoFocus
                type="password"
                placeholder="Password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className={`w-full bg-[var(--bg-primary)] border ${loginError ? 'border-red-500 animate-shake' : 'border-[var(--border)]'} rounded-2xl p-4 text-center text-sm outline-none focus:border-[var(--accent)] transition-all`}
              />
              <button 
                type="submit"
                className="w-full py-4 bg-[var(--accent)] text-black rounded-2xl text-xs font-black uppercase shadow-lg shadow-[var(--accent)]/30 active:scale-95 transition-all"
              >
                Access Settings
              </button>
              <button 
                type="button"
                onClick={() => setIsAdminLoginOpen(false)}
                className="w-full text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest"
              >
                Go Back
              </button>
            </form>
          </div>
        </div>
      )}

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

export default MaintenanceScreen;
