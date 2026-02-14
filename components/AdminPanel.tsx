import React, { useEffect, useState } from 'react';
import { FIREBASE_CONFIG, DEFAULT_DARK_THEME } from '../constants';
import { User, PremiumRequest, AppSettings, UserTheme, AIAgent, UserSuggestion, PromoBanner, PremiumPlan } from '../types';

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [appTheme, setAppTheme] = useState<UserTheme>(DEFAULT_DARK_THEME);
  const [aiKeys, setAiKeys] = useState<string>('');
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [promoBanner, setPromoBanner] = useState<PromoBanner | null>(null);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const paths = [
        'users.json', 'premium_requests.json', 'app_settings.json', 
        'app_theme.json', 'ai_api_keys.json', 'ai_agents.json', 
        'promo_banner.json', 'user_suggestions.json', 'premium_plans.json'
      ];
      const responses = await Promise.all(paths.map(p => fetch(`${FIREBASE_CONFIG.databaseURL}/${p}`)));
      const data = await Promise.all(responses.map(r => r.json()));

      if (data[0]) setUsers(Object.keys(data[0]).map(uid => ({ ...data[0][uid], uid })));
      if (data[1]) setPremiumRequests(Object.keys(data[1]).map(id => ({ ...data[1][id], id })));
      if (data[2]) setAppSettings(data[2]);
      if (data[3]) setAppTheme(data[3]);
      if (data[4]) setAiKeys(data[4].join('\n'));
      if (data[5]) setAiAgents(Object.keys(data[5]).map(id => ({ ...data[5][id], id })));
      if (data[6]) setPromoBanner(data[6]);
      if (data[7]) setSuggestions(Object.keys(data[7]).map(id => ({ ...data[7][id], id })));
      if (data[8]) setPremiumPlans(Object.keys(data[8]).map(id => ({ ...data[8][id], id })));
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (path: string, payload: any) => {
    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/${path}.json`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      fetchData();
    } catch (e) { alert("Sync Failed"); }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'users', label: 'Users Management', icon: 'fa-users-gear' },
    { id: 'analysis', label: 'Users Analysis', icon: 'fa-magnifying-glass-chart' },
    { id: 'theme', label: 'Theme Customization', icon: 'fa-palette' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
    { id: 'requests', label: 'Premium Requests', icon: 'fa-crown' },
    { id: 'plans', label: 'Premium Management', icon: 'fa-gem' },
    { id: 'keys', label: 'AI API Keys', icon: 'fa-key' },
    { id: 'agents', label: 'Create AI Agent', icon: 'fa-robot' },
    { id: 'banner', label: 'Promotion Banner', icon: 'fa-image' },
    { id: 'suggestions', label: 'User Suggestions', icon: 'fa-message' },
    { id: 'maintenance', label: 'Maintenance Mode', icon: 'fa-screwdriver-wrench' }
  ];

  const getActivityData = () => {
    const last15Days = Array.from({length: 15}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();
    
    return last15Days.map(day => ({
      day: day.split(' ')[1] + ' ' + day.split(' ')[2],
      count: users.filter(u => new Date(u.created_at).toDateString() === day).length
    }));
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070312] text-[#00f2ff] font-black uppercase tracking-[0.5em] text-[10px]">
      <div className="w-12 h-12 border-4 border-[#00f2ff]/20 border-t-[#00f2ff] rounded-full animate-spin mb-6"></div>
      Syncing Studio Engine...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#070312] text-white overflow-hidden font-sans">
      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[280px] h-full bg-[#0a0a1a] border-r border-white/5 flex flex-col p-6 animate-in slide-in-from-left duration-300 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10 shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-[#00f2ff] text-black flex items-center justify-center font-black text-xs">A</div>
                 <h2 className="text-sm font-black uppercase tracking-tighter">Console</h2>
               </div>
               <button onClick={() => setIsSidebarOpen(false)}><i className="fas fa-times text-gray-500"></i></button>
            </div>
            <div className="space-y-1.5 mb-10">
              {sidebarItems.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-[#00f2ff] text-black shadow-lg shadow-[#00f2ff]/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onExit} className="mt-auto w-full p-5 bg-red-500/10 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-red-500/10 shrink-0">Logoff Console</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-5 border-b border-white/5 bg-[#0a0a1a] flex justify-between items-center shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00f2ff]"><i className="fas fa-bars"></i></button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Master <span className="text-[#00f2ff]">Control</span></h1>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Studio Core v4.1</p>
          </div>
        </div>
        <button onClick={onExit} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 active:scale-90 transition-all"><i className="fas fa-times"></i></button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Users" value={users.length} icon="fa-users" color="text-[#00f2ff]" />
              <StatCard label="Premium Reqs" value={premiumRequests.filter(r => r.status === 'pending').length} icon="fa-crown" color="text-yellow-500" />
              <div className="col-span-2 bg-[#151525] border border-white/5 rounded-3xl p-5 shadow-xl">
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Active AI Hub</p>
                 <p className="text-xs font-mono text-[#00f2ff] truncate">{aiKeys.split('\n')[0] || "No Key Active"}</p>
              </div>
            </div>

            <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-400">15-Day User Growth</h3>
              <div className="flex items-end justify-between h-40 gap-1.5 px-2">
                {getActivityData().map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-[#00f2ff]/20 rounded-t-md group-hover:bg-[#00f2ff]/40 transition-all relative" style={{ height: `${(d.count / (Math.max(...getActivityData().map(x => x.count)) || 1)) * 100}%` }}>
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100">{d.count}</div>
                    </div>
                    <span className="text-[6px] font-black text-gray-600 uppercase mt-2 -rotate-45 origin-center">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.uid} className="bg-[#151525] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <div className="truncate pr-4">
                  <h4 className="font-bold text-xs truncate">{u.username}</h4>
                  <p className="text-[8px] text-gray-500 uppercase truncate font-mono">{u.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => {
                    const name = prompt("New Username:", u.username);
                    if(name) handleUpdate(`users/${u.uid}/username`, name);
                  }} className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center text-[10px] border border-blue-400/10"><i className="fas fa-edit"></i></button>
                  <button onClick={() => {
                    if(confirm("DELETE USER PERMANENTLY?")) fetch(`${FIREBASE_CONFIG.databaseURL}/users/${u.uid}.json`, { method: 'DELETE' }).then(fetchData);
                  }} className="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center text-[10px] border border-red-500/10"><i className="fas fa-trash-alt"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <AnalysisGroup title="Last 3 Days Active" users={users.filter(u => (Date.now() - new Date(u.last_login).getTime()) < 3*24*60*60*1000)} />
            <AnalysisGroup title="Last 15 Days Inactive" users={users.filter(u => (Date.now() - new Date(u.last_login).getTime()) > 15*24*60*60*1000)} />
            <div className="bg-[#151525] border border-white/5 rounded-3xl p-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Top 5 Power Users</h3>
               {users.sort((a, b) => (b.total_usage_time || 0) - (a.total_usage_time || 0)).slice(0, 5).map((u, i) => (
                 <div key={u.uid} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-[10px] font-bold truncate">{i+1}. {u.username}</span>
                    <span className="text-[9px] font-black text-[#00f2ff]">{Math.floor((u.total_usage_time || 0) / 60)}m Usage</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="space-y-4">
             <div className="bg-[#151525] border border-white/5 rounded-3xl p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">Global UI Control</h3>
                <div className="grid grid-cols-2 gap-4">
                   {Object.keys(DEFAULT_DARK_THEME).map(key => (
                     <div key={key} className="space-y-1">
                        <p className="text-[7px] font-black uppercase text-gray-500">{key}</p>
                        <div className="flex gap-2">
                           <input type="color" value={(appTheme as any)[key]} onChange={e => setAppTheme({...appTheme, [key]: e.target.value})} className="h-8 w-12 rounded-lg bg-transparent border-none cursor-pointer" />
                           <input value={(appTheme as any)[key]} onChange={e => setAppTheme({...appTheme, [key]: e.target.value})} className="flex-1 bg-black/30 border border-white/5 rounded-lg text-[8px] p-2 font-mono uppercase" />
                        </div>
                     </div>
                   ))}
                </div>
                <button onClick={() => handleUpdate('app_theme', appTheme)} className="w-full mt-6 py-4 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg">Save Global Theme</button>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-4">
              <div className="bg-[#151525] border border-white/5 rounded-3xl p-6 space-y-4">
                 <InputField label="App Name" value={appSettings?.appName || ''} onChange={v => setAppSettings({...appSettings!, appName: v})} />
                 <InputField label="App Logo URL" value={appSettings?.appLogo || ''} onChange={v => setAppSettings({...appSettings!, appLogo: v})} />
                 <InputField label="UPI ID" value={appSettings?.upiId || ''} onChange={v => setAppSettings({...appSettings!, upiId: v})} />
                 <InputField label="QR Code URL" value={appSettings?.qrCodeUrl || ''} onChange={v => setAppSettings({...appSettings!, qrCodeUrl: v})} />
                 <button onClick={() => handleUpdate('app_settings', appSettings)} className="w-full py-4 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg mt-4">Update Branding</button>
              </div>
           </div>
        )}

        {activeTab === 'requests' && (
           <div className="space-y-3">
              {premiumRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="bg-[#151525] border border-white/5 rounded-2xl p-4">
                   <div className="flex justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-xs">{req.user_email}</h4>
                        <p className="text-[8px] font-black text-yellow-500 uppercase">{req.plan_name} - ₹{req.price}</p>
                        <p className="text-[8px] font-mono text-gray-500 mt-1">TX: {req.transaction_id}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={async () => {
                        const expiry = new Date(); expiry.setDate(expiry.getDate() + req.duration_days);
                        await Promise.all([
                          fetch(`${FIREBASE_CONFIG.databaseURL}/users/${req.user_uid}.json`, { method: 'PATCH', body: JSON.stringify({ premium: true, premium_plan: req.plan_name, premium_expiry_date: expiry.toISOString() }) }),
                          fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests/${req.id}.json`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) })
                        ]); fetchData();
                      }} className="flex-1 py-3 bg-[#00ff9d] text-black rounded-xl text-[9px] font-black uppercase">Approve</button>
                      <button onClick={() => handleUpdate(`premium_requests/${req.id}/status`, 'rejected')} className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase">Cancel</button>
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'keys' && (
          <div className="bg-[#151525] border border-white/5 rounded-3xl p-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">API Key Rotation Pool</h3>
             <textarea 
               value={aiKeys} onChange={e => setAiKeys(e.target.value)} 
               placeholder="Paste keys here (one per line)..."
               className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-[#00f2ff] outline-none mb-4"
             />
             <button onClick={() => handleUpdate('ai_api_keys', aiKeys.split('\n').map(k => k.trim()).filter(k => k.length > 5))} className="w-full py-4 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg">Update Key Pool</button>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-4">
             <button onClick={() => {
               const name = prompt("Agent Name:");
               if(name) {
                 const instr = prompt("Strict Instructions:");
                 handleUpdate(`ai_agents/${Date.now()}`, { name, instruction: instr, status: 'active' });
               }
             }} className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[9px] font-black uppercase tracking-widest mb-4">+ Create New Agent</button>
             {aiAgents.map(agent => (
               <div key={agent.id} className="bg-[#151525] border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                     <h4 className="font-bold text-xs">{agent.name}</h4>
                     <button onClick={() => handleUpdate(`ai_agents/${agent.id}/status`, agent.status === 'active' ? 'maintenance' : 'active')} className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase ${agent.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-400'}`}>
                       {agent.status}
                     </button>
                  </div>
                  <p className="text-[9px] text-gray-500 line-clamp-2">{agent.instruction}</p>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button onClick={() => { const instr = prompt("New Instruction:", agent.instruction); if(instr) handleUpdate(`ai_agents/${agent.id}/instruction`, instr); }} className="flex-1 py-2 bg-white/5 rounded-lg text-[8px] font-black uppercase">Edit Instr</button>
                    <button onClick={() => { if(confirm("Delete Agent?")) fetch(`${FIREBASE_CONFIG.databaseURL}/ai_agents/${agent.id}.json`, { method: 'DELETE' }).then(fetchData); }} className="px-4 py-2 text-red-500"><i className="fas fa-trash"></i></button>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'maintenance' && (
           <div className="bg-[#151525] border border-white/5 rounded-3xl p-10 flex flex-col items-center text-center">
              <i className="fas fa-power-off text-4xl mb-6 text-red-500"></i>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">System Overload Switch</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-8">This will put the entire app behind a maintenance screen for all users.</p>
              <button onClick={() => handleUpdate('app_settings/maintenanceMode', !appSettings?.maintenanceMode)} className={`w-32 h-14 rounded-full relative transition-all ${appSettings?.maintenanceMode ? 'bg-red-500' : 'bg-[#00ff9d]'}`}>
                 <div className={`absolute top-1 w-12 h-12 bg-white rounded-full transition-all ${appSettings?.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
              </button>
              <p className="mt-6 text-[10px] font-black uppercase">{appSettings?.maintenanceMode ? 'STATUS: OFFLINE' : 'STATUS: ONLINE'}</p>
           </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
             {suggestions.map(s => (
               <div key={s.id} className="bg-[#151525] border border-white/5 rounded-2xl p-4">
                  <p className="text-[8px] font-black text-[#00f2ff] uppercase mb-1">{s.username}</p>
                  <p className="text-xs font-medium mb-4">{s.message}</p>
                  {!s.replied ? (
                    <button onClick={() => {
                      const reply = prompt("Enter Reply:");
                      if(reply) {
                        const notifId = Date.now().toString();
                        Promise.all([
                          handleUpdate(`user_suggestions/${s.id}/replied`, true),
                          fetch(`${FIREBASE_CONFIG.databaseURL}/users/${s.user_uid}/notifications/${notifId}.json`, { method: 'PUT', body: JSON.stringify({ message: `Reply: ${reply}`, timestamp: new Date().toISOString(), read: false, type: 'system' }) })
                        ]).then(fetchData);
                      }
                    }} className="w-full py-3 bg-[#00f2ff] text-black font-black rounded-xl text-[9px] uppercase">Send Reply Notification</button>
                  ) : <span className="text-[8px] font-black text-gray-600 uppercase">Replied ✓</span>}
               </div>
             ))}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-4">
            <button onClick={() => {
               const name = prompt("Plan Name:");
               if(name) {
                 const price = prompt("Price (INR):");
                 const days = prompt("Duration (Days):");
                 handleUpdate(`premium_plans/${Date.now()}`, { plan_name: name, price: Number(price), duration_days: Number(days), benefits: ["Pro Access"], active: true });
               }
            }} className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[9px] font-black uppercase tracking-widest mb-4">+ Add New Plan</button>
            {premiumPlans.map(plan => (
              <div key={plan.id} className="bg-[#151525] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                 <div>
                   <h4 className="font-bold text-xs">{plan.plan_name}</h4>
                   <p className="text-[9px] font-black text-[#00ff9d]">₹{plan.price} / {plan.duration_days} Days</p>
                 </div>
                 <button onClick={() => { if(confirm("Delete Plan?")) fetch(`${FIREBASE_CONFIG.databaseURL}/premium_plans/${plan.id}.json`, { method: 'DELETE' }).then(fetchData); }} className="text-red-500"><i className="fas fa-trash"></i></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'banner' && (
          <div className="bg-[#151525] border border-white/5 rounded-3xl p-6 space-y-4">
             <InputField label="Banner Image URL" value={promoBanner?.imageUrl || ''} onChange={v => setPromoBanner({...promoBanner!, imageUrl: v})} />
             <InputField label="Link URL" value={promoBanner?.linkUrl || ''} onChange={v => setPromoBanner({...promoBanner!, linkUrl: v})} />
             <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                <span className="text-[10px] font-black uppercase">Enable Banner</span>
                <button onClick={() => setPromoBanner({...promoBanner!, enabled: !promoBanner?.enabled})} className={`w-12 h-6 rounded-full relative ${promoBanner?.enabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                   <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${promoBanner?.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
             </div>
             <button onClick={() => handleUpdate('promo_banner', promoBanner)} className="w-full py-4 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg">Update Promotion</button>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #321d5c; border-radius: 10px; }
        .animate-in { animation: animateIn 0.3s ease-out; }
        @keyframes animateIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-[#151525] border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col items-center text-center">
    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${color}`}><i className={`fas ${icon} text-lg`}></i></div>
    <div className="text-2xl font-black tracking-tighter">{value}</div>
    <div className="text-[7px] font-black uppercase text-gray-500 tracking-widest mt-1">{label}</div>
  </div>
);

const AnalysisGroup = ({ title, users }: any) => (
  <div className="bg-[#151525] border border-white/5 rounded-3xl p-6">
    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex justify-between">
      <span>{title}</span>
      <span className="text-[#00f2ff]">{users.length}</span>
    </h3>
    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
      {users.length === 0 ? <p className="text-[8px] opacity-30 text-center py-4">NO DATA FOUND</p> : 
       users.map((u: any) => <div key={u.uid} className="text-[9px] font-bold text-gray-400 py-1 border-b border-white/5 truncate">{u.username} ({new Date(u.last_login).toLocaleDateString()})</div>)}
    </div>
  </div>
);

const InputField = ({ label, value, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-[8px] font-black uppercase text-gray-500 ml-1">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#00f2ff]" placeholder={label} />
  </div>
);

export default AdminPanel;