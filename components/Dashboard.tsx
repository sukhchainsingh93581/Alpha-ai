
import React, { useEffect, useState } from 'react';
import { User, PromoBanner, UserNotification, ChatProject } from '../types';
import { FIREBASE_CONFIG } from '../constants';

interface DashboardProps {
  user: User | null;
  onStartChat: (tool: string) => void;
  projects: ChatProject[];
  onLoadProject: (proj: ChatProject) => void;
  onDeleteProject: (projectId: string) => void;
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartChat, projects, onLoadProject, onDeleteProject, onNavigate }) => {
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [statModal, setStatModal] = useState<'time' | 'status' | null>(null);
  
  useEffect(() => {
    fetch(`${FIREBASE_CONFIG.databaseURL}/promo_banner.json`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.enabled) setBanner(data); })
      .catch(() => { /* Silent network catch */ });
  }, []);

  const isPremium = !!user?.premium;

  const workspaceTools = [
    { name: 'Prompt Generator', subtitle: 'Logic Architect', icon: 'fa-keyboard', gradient: 'from-[#00ff9d] to-[#00f2ff]', proOnly: false },
    { name: 'HTML Generator', subtitle: 'Full Stack AI', icon: 'fa-code', gradient: 'from-[var(--accent)] to-[#7700ff]', proOnly: false },
    { name: 'Custom Pro AI', subtitle: 'Behavior Lab', icon: 'fa-user-gear', gradient: 'from-[#00f2ff] to-[#bf00ff]', proOnly: true },
    { name: 'Pro AI Developer', subtitle: '2X Smart Logic', icon: 'fa-laptop-code', gradient: 'from-[#ff006e] to-[#7700ff]', proOnly: true }
  ];

  const goToPremium = () => {
    setStatModal(null);
    if (onNavigate) onNavigate('premium');
  };

  return (
    <div className="p-6 pb-24 relative min-h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black mb-1 uppercase tracking-tighter">Welcome Dev!</h1>
          <p className="text-secondary text-sm font-medium">Build modern logic with Studio AI</p>
        </div>
      </div>

      {statModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#070312]/95 backdrop-blur-xl animate-in fade-in" onClick={() => setStatModal(null)}></div>
          <div className="relative w-full max-w-[320px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${statModal === 'time' ? 'bg-[#00f2ff11] text-[#00f2ff]' : 'bg-[#bf00ff11] text-[#bf00ff]'}`}>
              <i className={`fas ${statModal === 'time' ? 'fa-clock' : 'fa-crown'} text-2xl`}></i>
            </div>
            
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2">
              {statModal === 'time' ? 'Quota Insight' : 'System Status'}
            </h2>
            
            <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-widest leading-relaxed mb-8">
              {statModal === 'time' ? (
                <>
                  AI Balance: <span className="text-[var(--text-primary)] font-black">{isPremium ? 'Infinite' : `${user?.remaining_ai_seconds || 0}s`}</span>
                  <br/><br/>
                  <p className="text-[var(--accent)] font-black">Upgrade your plan for unlimited time</p>
                </>
              ) : (
                <>
                  Rank: <span className="text-[var(--text-primary)] font-black">{user?.premium ? user.premium_plan : 'Free Developer'}</span>
                  <br/><br/>
                  <p className="text-[var(--accent)] font-black">Upgrade to Premium</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <button onClick={goToPremium} className="w-full py-4 bg-[var(--accent)] text-black rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-[var(--accent)]/30 active:scale-95 transition-all">
                {statModal === 'time' ? 'Unlock Infinite Time' : 'Go Pro Now'}
              </button>
              <button onClick={() => setStatModal(null)} className="w-full py-4 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] rounded-2xl text-[10px] font-black uppercase active:scale-95 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div onClick={() => setShowProjectsModal(true)} className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border)] text-center cursor-pointer active:scale-95 transition-all hover:border-[var(--accent)] group shadow-xl">
          <div className="text-2xl font-black group-hover:text-[var(--accent)] transition-colors">{projects.length}</div>
          <div className="text-[9px] text-secondary mt-1 uppercase font-black tracking-widest">Projects</div>
        </div>
        <div onClick={() => setStatModal('time')} className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border)] text-center shadow-xl border-t-2 border-t-[var(--accent)]/30 cursor-pointer active:scale-95 transition-all hover:border-[var(--accent)] group">
          <div className="text-2xl font-black group-hover:text-[var(--accent)] transition-colors">{isPremium ? '∞' : Math.floor((user?.remaining_ai_seconds || 0)/60)}</div>
          <div className="text-[9px] text-secondary mt-1 uppercase font-black tracking-widest group-hover:text-[var(--accent)]">{isPremium ? 'Unlimited' : '10m Limit'}</div>
        </div>
        <div onClick={() => setStatModal('status')} className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border)] text-center shadow-xl cursor-pointer active:scale-95 transition-all hover:border-[var(--accent)] group">
          <div className={`text-2xl font-black transition-colors ${user?.premium ? 'text-[#ff006e] group-hover:text-[var(--accent)]' : 'text-gray-500 group-hover:text-[var(--accent)]'}`}>
            {user?.premium ? 'PRO' : 'FREE'}
          </div>
          <div className="text-[9px] text-secondary mt-1 uppercase font-black tracking-widest group-hover:text-[var(--accent)]">Status</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[var(--accent)] text-xs font-black uppercase tracking-[0.2em]">Launch AI Workspace</h3>
        <div className="h-[1px] flex-1 bg-[var(--border)] ml-4 opacity-50"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {workspaceTools.map((tool) => {
          const isLocked = tool.proOnly && !isPremium;
          return (
            <div key={tool.name} onClick={() => isLocked ? alert("Upgrade to Premium to unlock this Agent!") : onStartChat(tool.name)} 
              className={`bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all shadow-xl hover:border-[var(--accent)] relative overflow-hidden ${isLocked ? 'opacity-60 grayscale' : ''}`}>
              {isLocked && <div className="absolute top-3 right-3 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-white/10"><i className="fas fa-lock text-[8px] text-white"></i></div>}
              {tool.proOnly && <div className="absolute top-0 left-0 bg-gradient-to-r from-[#bf00ff] to-transparent text-white text-[7px] font-black px-3 py-1 uppercase tracking-tighter">PRO</div>}
              <div className={`w-14 h-14 rounded-[1.2rem] bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/20`}>
                <i className={`fas ${tool.icon} text-2xl text-white`}></i>
              </div>
              <h4 className="font-bold text-[11px] mb-1 uppercase tracking-tight truncate w-full px-1 text-[var(--text-primary)]">{tool.name}</h4>
              <p className="text-[7px] text-secondary uppercase font-black tracking-widest opacity-60">{tool.subtitle}</p>
            </div>
          );
        })}
      </div>
      
      {showProjectsModal && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#070312]/95 backdrop-blur-2xl p-6 animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-start mb-8">
             <div className="flex-1">
               <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)]">My Archive</h2>
               <p className="text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">{projects.length} Saved Segments</p>
             </div>
             <button onClick={() => setShowProjectsModal(false)} className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-primary)] shadow-2xl active:scale-90"><i className="fas fa-times"></i></button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-12">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-20">
                  <i className="fas fa-folder-open text-5xl mb-4"></i>
                  <p className="text-xs font-black uppercase tracking-widest text-center">No projects saved yet</p>
                </div>
              ) : (
                projects.map(proj => (
                  <div key={proj.id} onClick={() => { onLoadProject(proj); setShowProjectsModal(false); }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5 flex justify-between items-center transition-all shadow-xl active:scale-[0.98] hover:border-[var(--accent)]/50 group">
                    <div className="flex-1 truncate pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[7px] bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded-lg font-black uppercase border border-[var(--accent)]/20 tracking-widest">{proj.toolName}</span>
                      </div>
                      <h4 className="font-black text-sm truncate text-[var(--text-primary)] uppercase tracking-tight">{proj.name}</h4>
                      <p className="text-[8px] text-secondary font-bold uppercase mt-1 opacity-50">{new Date(proj.lastUpdated).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          onDeleteProject(proj.id); 
                        }}
                        className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-90 border border-red-500/20 shadow-lg"
                      >
                        <i className="fas fa-trash-alt text-base"></i>
                      </button>
                      <div className="w-10 h-10 bg-[var(--accent)] text-black rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-play text-xs"></i></div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
