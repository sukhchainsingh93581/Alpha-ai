
import React, { useRef, useState } from 'react';
import { User, UserTheme } from '../types';
import { FIREBASE_CONFIG, DEFAULT_DARK_THEME } from '../constants';

interface ProfileProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser, onLogout, onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePolicy, setActivePolicy] = useState<{ title: string, content: string } | null>(null);
  
  // Standardized access: Any active premium plan grants Pro features
  const isPremium = !!user?.premium;

  const handleAvatarClick = () => {
    if (isPremium) {
      fileInputRef.current?.click();
    } else {
      alert("Upgrade to Premium to customize your profile picture!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedUser = { ...user, avatar: base64 };
        setUser(updatedUser);
        await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${user.uid}/avatar.json`, {
          method: 'PUT',
          body: JSON.stringify(base64)
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeUpdate = async (key: keyof UserTheme, value: string) => {
    if (!user || !isPremium) return;
    
    const currentTheme = user.theme || DEFAULT_DARK_THEME;
    const newTheme = { ...currentTheme, [key]: value };
    
    const updatedUser = { ...user, theme: newTheme };
    setUser(updatedUser);

    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${user.uid}/theme/${key}.json`, {
        method: 'PUT',
        body: JSON.stringify(value)
      });
    } catch (e) {
      console.error("Failed to sync theme color:", e);
    }
  };

  const handleResetTheme = async () => {
    if (!user || !isPremium) return;
    if (!confirm("Are you sure you want to reset to Studio Default?")) return;

    setUser({ ...user, theme: DEFAULT_DARK_THEME });
    await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${user.uid}/theme.json`, {
      method: 'PUT',
      body: JSON.stringify(DEFAULT_DARK_THEME)
    });
  };

  const policies = {
    privacy: {
      title: "Privacy Policy",
      content: `AI STUDIO PRIVACY POLICY:
      
1. DATA PROTECTION: We use end-to-end encryption for all your source code.
2. AI LOGS: We save your prompts to improve your history but never share them with third parties.
3. COOKIES: We use minimal local storage to keep you logged in.
4. PERMISSIONS: Camera and Microphone are only used if your specific web app requires them.`
    },
    terms: {
      title: "Terms and Conditions",
      content: `DEVELOPER USAGE TERMS:
      
1. ACCOUNT: One developer per account. Multi-login is prohibited.
2. QUOTA: Free developers get 10 minutes of daily logic time.
3. FAIR USE: Do not use automated scripts to bypass our AI security.
4. TERMINATION: We reserve the right to ban users who violate community guidelines.`
    },
    fire: {
      title: "Fire Policy",
      content: `FIRE SAFETY & ACCOUNT SECURITY PROTOCOL:
      
1. OVERLOAD PROTECTION: Our servers detect high-stress prompts that could "burn" AI tokens unnecessarily.
2. ACCOUNT COOLING: If you reach your daily limit, the account enters a mandatory cooling period.
3. DATA WIPING: Any suspicious login activity triggers an immediate session kill to protect your data.`
    }
  };

  const handleContactAction = () => {
    if (isPremium) {
      const message = encodeURIComponent("I'm developer i need help with my account");
      window.open(`https://wa.me/919358197207?text=${message}`, '_blank');
    } else {
      if (onNavigate) onNavigate('premium');
    }
  };

  const currentTheme = user?.theme || DEFAULT_DARK_THEME;

  return (
    <div className="p-6 pb-24 text-[var(--text-primary)]">
      {activePolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0c0616]/95 backdrop-blur-xl" onClick={() => setActivePolicy(null)}></div>
          <div className="relative w-full max-w-[360px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-8 shadow-[0_0_50px_rgba(191,0,255,0.1)] animate-in zoom-in duration-300">
            <h3 className="text-xl font-black uppercase text-[var(--accent)] mb-4 tracking-tighter">{activePolicy.title}</h3>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar text-[var(--text-secondary)] text-[11px] font-semibold leading-relaxed whitespace-pre-wrap">
              {activePolicy.content}
            </div>
            <button onClick={() => setActivePolicy(null)} className="w-full mt-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase text-[var(--accent)] active:scale-95 transition-all">Close Protocol</button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1 uppercase tracking-tighter">Dev Studio Profile</h1>
        <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Identity Verification 1.0.4</p>
      </div>

      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[#0c0616] p-7 rounded-[3rem] border border-[var(--border)] flex items-center gap-6 mb-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div onClick={handleAvatarClick} className={`w-24 h-24 rounded-3xl border-4 border-[var(--bg-primary)] overflow-hidden flex items-center justify-center text-4xl font-bold cursor-pointer relative group shrink-0 ${!user?.avatar ? 'bg-gradient-to-br from-[var(--accent)] to-[#ff006e]' : ''}`}>
          {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.username?.charAt(0).toUpperCase()}
          {!isPremium && <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-lock text-[12px]"></i></div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        
        <div className="flex-1 truncate">
          <h2 className="text-2xl font-black tracking-tighter truncate mb-1">{user?.username || 'Anonymous Dev'}</h2>
          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase mb-4 opacity-70 truncate tracking-widest">{user?.email}</p>
          <div className={`inline-flex px-5 py-2 rounded-xl text-[9px] font-black uppercase border shadow-2xl ${isPremium ? 'bg-[#ff006e15] border-[#ff006e] text-[#ff006e]' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
             {isPremium ? user?.premium_plan : 'Standard Access'}
          </div>
        </div>
      </div>

      {/* STUDIO THEME ENGINE - UNLOCKED FOR ALL PAID PLANS */}
      <div className="mb-10 relative">
        <div className="flex items-center justify-between mb-4 ml-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-40">Studio Theme Engine</h3>
           {isPremium && <button onClick={handleResetTheme} className="text-[8px] font-black uppercase text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1 rounded-full active:scale-95 transition-all">Reset Default</button>}
        </div>
        
        <div className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden ${!isPremium ? 'opacity-50 grayscale' : ''}`}>
          {!isPremium && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center cursor-pointer" onClick={() => onNavigate?.('premium')}>
               <div className="w-12 h-12 bg-yellow-500 text-black rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/20">
                 <i className="fas fa-crown"></i>
               </div>
               <h4 className="font-black uppercase tracking-tighter text-sm mb-1 text-white">Theme Engine Locked</h4>
               <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Upgrade to Premium to customize Studio Colors</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Backgrounds Section */}
            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-1 mt-2">Backgrounds & Cards</div>
            <ColorControl label="Primary BG" color={currentTheme.bgPrimary} onChange={(val) => handleThemeUpdate('bgPrimary', val)} />
            <ColorControl label="Secondary BG" color={currentTheme.bgSecondary} onChange={(val) => handleThemeUpdate('bgSecondary', val)} />
            <ColorControl label="Card BG" color={currentTheme.bgCard} onChange={(val) => handleThemeUpdate('bgCard', val)} />
            <ColorControl label="Border Color" color={currentTheme.borderColor} onChange={(val) => handleThemeUpdate('borderColor', val)} />
            
            {/* Typography */}
            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-1 mt-4">Typography</div>
            <ColorControl label="Text Primary" color={currentTheme.textPrimary} onChange={(val) => handleThemeUpdate('textPrimary', val)} />
            <ColorControl label="Text Secondary" color={currentTheme.textSecondary} onChange={(val) => handleThemeUpdate('textSecondary', val)} />

            {/* Accents */}
            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-1 mt-4">Accents & Buttons</div>
            <ColorControl label="Accent Color" color={currentTheme.accentColor} onChange={(val) => handleThemeUpdate('accentColor', val)} />
            <ColorControl label="Button BG" color={currentTheme.buttonBg} onChange={(val) => handleThemeUpdate('buttonBg', val)} />

            {/* Status Colors */}
            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-1 mt-4">Status Colors</div>
            <ColorControl label="Success" color={currentTheme.statusSuccess} onChange={(val) => handleThemeUpdate('statusSuccess', val)} />
            <ColorControl label="Danger" color={currentTheme.statusDanger} onChange={(val) => handleThemeUpdate('statusDanger', val)} />
            <ColorControl label="Warning" color={currentTheme.statusWarning} onChange={(val) => handleThemeUpdate('statusWarning', val)} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[var(--text-secondary)] opacity-40 ml-4">Support & Legal</h3>
        <div className="space-y-4">
          <button 
            onClick={handleContactAction}
            className={`w-full flex items-center justify-between p-6 bg-gradient-to-r ${isPremium ? 'from-[#00f2ff15] to-transparent border-[#00f2ff33]' : 'from-[#ffbe0b15] to-transparent border-[#ffbe0b33]'} border rounded-[2rem] active:scale-[0.98] transition-all shadow-xl group`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${isPremium ? 'bg-[#00f2ff] text-black' : 'bg-[#ffbe0b] text-black'}`}>
                <i className={`fab fa-whatsapp ${isPremium ? 'text-2xl' : 'text-lg'}`}></i>
              </div>
              <div className="text-left">
                <span className={`text-[12px] font-black uppercase tracking-tighter block ${isPremium ? 'text-[#00f2ff]' : 'text-[#ffbe0b]'}`}>
                  {isPremium ? 'WhatsApp Support' : 'UPGRADE TO PREMIUM'}
                </span>
                <span className="text-[8px] text-[var(--text-secondary)] uppercase font-black tracking-widest opacity-60">
                   {isPremium ? 'Direct Developer Access' : 'Click to unlock help'}
                </span>
              </div>
            </div>
            {!isPremium ? (
              <div className="bg-yellow-500/20 text-yellow-500 text-[8px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-yellow-500/20">
                <i className="fas fa-crown text-[8px]"></i> PRO
              </div>
            ) : (
              <i className="fas fa-arrow-right text-[10px] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
            )}
          </button>

          <button onClick={() => setActivePolicy(policies.privacy)} className="w-full flex items-center justify-between p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] active:scale-[0.98] transition-all hover:border-[var(--accent)]/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center"><i className="fas fa-user-shield text-sm"></i></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Privacy Protocol</span>
            </div>
            <i className="fas fa-chevron-right text-[8px] opacity-20"></i>
          </button>

          <button onClick={() => setActivePolicy(policies.terms)} className="w-full flex items-center justify-between p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] active:scale-[0.98] transition-all hover:border-[var(--accent)]/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center"><i className="fas fa-file-contract text-sm"></i></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Terms & Terms</span>
            </div>
            <i className="fas fa-chevron-right text-[8px] opacity-20"></i>
          </button>

          <button onClick={() => setActivePolicy(policies.fire)} className="w-full flex items-center justify-between p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] active:scale-[0.98] transition-all hover:border-[var(--accent)]/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center"><i className="fas fa-fire-extinguisher text-sm"></i></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Fire Protocol</span>
            </div>
            <i className="fas fa-chevron-right text-[8px] opacity-20"></i>
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] p-6 mb-8">
         <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Cloud Usage</span>
            <span className="text-[10px] font-black uppercase text-[var(--accent)]">{isPremium ? 'Unlimited' : 'Limited'}</span>
         </div>
         <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div className={`h-full ${isPremium ? 'w-full bg-[var(--accent)]' : 'w-[40%] bg-orange-500'}`}></div>
         </div>
      </div>

      <button onClick={onLogout} className="w-full bg-red-500/10 border border-red-500/30 text-red-500 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] shadow-2xl mb-12">
        <i className="fas fa-power-off text-xs"></i> Logoff Developer
      </button>
    </div>
  );
};

/* Helper Component for Color Controls */
const ColorControl: React.FC<{ label: string, color: string, onChange: (val: string) => void }> = ({ label, color, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[7px] font-black uppercase tracking-[0.1em] text-[var(--text-secondary)] opacity-60 ml-1 truncate">{label}</div>
      <div className="relative group flex items-center">
        <input 
          type="color" 
          value={color} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full h-10 rounded-xl bg-transparent border-none cursor-pointer outline-none" 
        />
        <div 
          className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none group-hover:border-[var(--accent)] transition-all flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <span className="text-[7px] font-mono text-white mix-blend-difference opacity-50 uppercase">{color}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
