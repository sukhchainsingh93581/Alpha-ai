import React, { useEffect, useState } from 'react';
import { FIREBASE_CONFIG, DEFAULT_DARK_THEME } from '../constants';
import { User, PremiumRequest, AppSettings, UserTheme, AIAgent, UserSuggestion, PromoBanner, PremiumPlan } from '../types';

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
      else setUsers([]);
      
      if (data[1]) setPremiumRequests(Object.keys(data[1]).map(id => ({ ...data[1][id], id })));
      if (data[2]) setAppSettings(data[2]);
      if (data[3]) setAppTheme(data[3]);
      if (data[4]) setAiKeys(Array.isArray(data[4]) ? data[4].join('\n') : '');
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

  const handleEditUser = async (u: User) => {
    const newName = prompt("Edit Username:", u.username);
    if (newName === null) return;

    const currentPremiumStatus = !!u.premium;
    const wantToToggle = confirm(`Current Rank: ${currentPremiumStatus ? 'PREMIUM' : 'FREE'}\n\nDo you want to ${currentPremiumStatus ? 'REMOVE' : 'GRANT'} Premium access?`);
    
    let patchData: any = { username: newName };

    if (wantToToggle) {
      if (!currentPremiumStatus) {
        // GRANTING PREMIUM
        const planName = prompt("Enter Plan Name (e.g., Studio Elite):", "Studio Elite");
        const days = prompt("Duration in Days (e.g., 30):", "30");
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + Number(days || 30));
        
        patchData.premium = true;
        patchData.premium_plan = planName || "Studio Elite";
        patchData.premium_expiry_date = expiry.toISOString();
        patchData.premium_start_date = new Date().toISOString();
      } else {
        // REMOVING PREMIUM
        patchData.premium = false;
        patchData.premium_plan = null;
        patchData.premium_expiry_date = null;
        patchData.premium_start_date = null;
      }
    }

    try {
      const response = await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${u.uid}.json`, {
        method: 'PATCH',
        body: JSON.stringify(patchData)
      });
      if (response.ok) {
        alert("User updated successfully!");
        fetchData();
      } else {
        alert("Failed to update user.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Network Error during update.");
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`⚠️ WARNING: Are you sure you want to delete ${u.username} (${u.email}) permanently? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${u.uid}.json`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("User deleted from database.");
        fetchData();
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Network Error during deletion.");
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'users', label: 'Users Management', icon: 'fa-users-cog' },
    { id: 'analysis', label: 'Users Analysis', icon: 'fa-magnifying-glass-chart' },
    { id: 'theme', label: 'Theme Customization', icon: 'fa-palette' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' },
    { id: 'requests', label: 'Premium Requests', icon: 'fa-file-invoice-dollar' },
    { id: 'plans', label: 'Premium Management', icon: 'fa-gem' },
    { id: 'keys', label: 'AI API Keys', icon: 'fa-key' },
    { id: 'agents', label: 'Create AI Agent', icon: 'fa-robot' },
    { id: 'banner', label: 'Promotion Banner', icon: 'fa-image' },
    { id: 'suggestions', label: 'User Suggestions', icon: 'fa-comments' },
    { id: 'maintenance', label: 'Maintenance Mode', icon: 'fa-toggle-on' }
  ];

  const getActivityData = () => {
    const last15Days = Array.from({length: 15}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();
    
    return last15Days.map(day => ({
      day: day.split(' ')[1] + ' ' + day.split(' ')[2],
      count: users.filter(u => u.created_at && new Date(u.created_at).toDateString() === day).length
    }));
  };

  const activeUsers3Days = users.filter(u => u.last_login && (Date.now() - new Date(u.last_login).getTime()) < 3*24*60*60*1000).length;
  const inactiveUsers15Days = users.filter(u => u.last_login && (Date.now() - new Date(u.last_login).getTime()) > 15*24*60*60*1000).length;

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070312] text-[#00f2ff] font-black uppercase tracking-[0.5em] text-[10px]">
      <div className="w-12 h-12 border-4 border-[#00f2ff]/20 border-t-[#00f2ff] rounded-full animate-spin mb-6"></div>
      Loading Master Console...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#070312] text-white overflow-hidden font-sans">
      {/* Sidebar Menu Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[280px] h-full bg-[#0a0a1a] border-r border-white/5 flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-500 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-xl bg-[#00f2ff] text-black flex items-center justify-center font-black text-sm">A</div>
                 <h2 className="text-sm font-black uppercase tracking-tighter">Menu</h2>
               </div>
               <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 p-2"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="space-y-1 mb-10">
              {sidebarItems.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-[#00f2ff] text-black shadow-lg shadow-[#00f2ff]/20' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
            
            <button onClick={onExit} className="mt-auto w-full p-5 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/10">Logoff Studio</button>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <header className="px-6 py-5 border-b border-white/5 bg-[#0a0a1a] flex justify-between items-center shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00f2ff] active:scale-90 transition-all">
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Master <span className="text-[#00f2ff]">Control</span></h1>
            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Admin Level Access</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-[#00ff9d] bg-[#00ff9d]/10 px-4 py-2 rounded-full border border-[#00ff9d]/20 uppercase">System Online</div>
      </header>

      {/* Main Feature Content */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-16">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Users" value={users.length} icon="fa-users" color="text-[#00f2ff]" />
              <StatCard label="Premium Reqs" value={premiumRequests.filter(r => r.status === 'pending').length} icon="fa-crown" color="text-yellow-500" />
            </div>
            <div className="bg-[#151525] border border-white/5 rounded-3xl p-5 shadow-xl">
               <div className="flex justify-between items-center mb-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active AI API Key Pool</p>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               </div>
               <p className="text-[10px] font-mono text-[#00f2ff] truncate bg-black/20 p-3 rounded-xl border border-white/5">{aiKeys.split('\n')[0] || "No keys available"}</p>
            </div>

            <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-400">15-Day User Activity</h3>
              <div className="flex items-end justify-between h-40 gap-1 px-1">
                {getActivityData().map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-[#00f2ff]/30 rounded-t-md transition-all relative" style={{ height: `${(d.count / (Math.max(...getActivityData().map(x => x.count)) || 1)) * 100}%` }}>
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100">{d.count}</div>
                    </div>
                    <span className="text-[6px] font-black text-gray-600 uppercase mt-2 -rotate-45">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3 animate-in slide-in-from-bottom">
            <div className="px-2 mb-2 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active Accounts ({users.length})</span>
            </div>
            {users.length === 0 ? (
                <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase">No Users Found</div>
            ) : (
                users.map(u => (
                <div key={u.uid} className="bg-[#151525] border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-lg hover:border-[#00f2ff]/20 transition-all">
                    <div className="truncate pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-xs uppercase truncate">{u.username}</h4>
                        {u.premium && <span className="text-[7px] bg-[#ff00c8]/10 text-[#ff00c8] px-1.5 py-0.5 rounded border border-[#ff00c8]/20 font-black">PRO</span>}
                    </div>
                    <p className="text-[8px] text-gray-500 uppercase font-mono truncate">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                    <button 
                        onClick={() => handleEditUser(u)} 
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xs text-[#00f2ff] active:scale-90 shadow-lg hover:bg-white/10 transition-all"
                        title="Edit User & Premium"
                    >
                        <i className="fas fa-user-edit"></i>
                    </button>
                    
                    <button 
                        onClick={() => handleDeleteUser(u)} 
                        className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-xs text-red-500 active:scale-90 shadow-lg hover:bg-red-500/20 transition-all"
                        title="Delete User"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="grid grid-cols-2 gap-3">
               <StatCard label="3D Active" value={activeUsers3Days} icon="fa-bolt" color="text-green-400" />
               <StatCard label="15D Inactive" value={inactiveUsers15Days} icon="fa-moon" color="text-red-400" />
             </div>
             <div className="bg-[#151525] border border-white/5 rounded-3xl p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">Most Active Users (Usage Time)</h3>
                {users.sort((a, b) => (b.total_usage_time || 0) - (a.total_usage_time || 0)).slice(0, 10).map((u, i) => (
                  <div key={u.uid} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                     <span className="text-[10px] font-black uppercase text-gray-400">{i+1}. {u.username}</span>
                     <span className="text-[9px] font-black text-[#00f2ff]">{Math.floor((u.total_usage_time || 0) / 60)}m Used</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="bg-[#151525] border border-white/5 rounded-3xl p-6 space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-white/5 pb-4">Global UI Control (App + Admin)</h3>
             <div className="grid grid-cols-2 gap-6">
                {Object.keys(DEFAULT_DARK_THEME).map(key => (
                  <div key={key} className="space-y-2">
                     <p className="text-[8px] font-black uppercase text-gray-500">{key}</p>
                     <div className="flex gap-2">
                        <input type="color" value={(appTheme as any)[key]} onChange={e => setAppTheme({...appTheme, [key]: e.target.value})} className="h-10 w-12 rounded-xl bg-transparent border-none cursor-pointer" />
                        <input value={(appTheme as any)[key]} onChange={e => setAppTheme({...appTheme, [key]: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl text-[9px] p-2 font-mono uppercase outline-none focus:border-[#00f2ff]" />
                     </div>
                  </div>
                ))}
             </div>
             <button onClick={() => handleUpdate('app_theme', appTheme)} className="w-full py-5 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all">Apply Global Theme Engine</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
             <InputField label="App Name" value={appSettings?.appName || ''} onChange={v => setAppSettings({...appSettings!, appName: v})} />
             <InputField label="App Logo URL" value={appSettings?.appLogo || ''} onChange={v => setAppSettings({...appSettings!, appLogo: v})} />
             <InputField label="Merchant UPI ID" value={appSettings?.upiId || ''} onChange={v => setAppSettings({...appSettings!, upiId: v})} />
             <InputField label="QR Code URL (PhonePe/UPI)" value={appSettings?.qrCodeUrl || ''} onChange={v => setAppSettings({...appSettings!, qrCodeUrl: v})} />
             <button onClick={() => handleUpdate('app_settings', appSettings)} className="w-full py-5 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl mt-4">Save Global Parameters</button>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
             {premiumRequests.filter(r => r.status === 'pending').length === 0 ? (
               <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase">No Pending Subscriptions</div>
             ) : (
               premiumRequests.filter(r => r.status === 'pending').map(req => (
                 <div key={req.id} className="bg-[#151525] border border-white/5 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <p className="text-[10px] font-black text-[#00f2ff] uppercase mb-1">{req.plan_name}</p>
                         <h4 className="font-black text-sm uppercase">{req.user_email}</h4>
                         <p className="text-[8px] font-mono text-gray-500 mt-2 uppercase tracking-widest">TXID: {req.transaction_id}</p>
                       </div>
                       <div className="text-right text-sm font-black text-[#00ff9d]">₹{req.price}</div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={async () => {
                         const expiry = new Date(); expiry.setDate(expiry.getDate() + req.duration_days);
                         await Promise.all([
                           fetch(`${FIREBASE_CONFIG.databaseURL}/users/${req.user_uid}.json`, { method: 'PATCH', body: JSON.stringify({ premium: true, premium_plan: req.plan_name, premium_expiry_date: expiry.toISOString() }) }),
                           fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests/${req.id}.json`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) })
                         ]); fetchData();
                       }} className="flex-1 py-4 bg-[#00ff9d] text-black rounded-xl text-[10px] font-black uppercase active:scale-95 shadow-lg">Approve</button>
                       <button onClick={() => handleUpdate(`premium_requests/${req.id}/status`, 'rejected')} className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-4">
             <button onClick={() => {
               const name = prompt("Plan Name:");
               if(name) {
                 const price = prompt("Price (INR):");
                 const days = prompt("Duration (Days):");
                 handleUpdate(`premium_plans/${Date.now()}`, { plan_name: name, price: Number(price), duration_days: Number(days), benefits: ["Unlimited AI", "No Ads"], active: true });
               }
             }} className="w-full py-5 bg-white/5 border border-dashed border-white/20 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">+ Create New Plan</button>
             {premiumPlans.map(plan => (
               <div key={plan.id} className="bg-[#151525] border border-white/5 rounded-3xl p-6 flex justify-between items-center shadow-lg">
                  <div>
                    <h4 className="font-black text-xs uppercase">{plan.plan_name}</h4>
                    <p className="text-[10px] font-black text-[#00ff9d] uppercase mt-1">₹{plan.price} • {plan.duration_days} Days</p>
                  </div>
                  <button onClick={() => { if(confirm("Delete Plan?")) fetch(`${FIREBASE_CONFIG.databaseURL}/premium_plans/${plan.id}.json`, { method: 'DELETE' }).then(fetchData); }} className="w-11 h-11 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center text-sm border border-red-500/10"><i className="fas fa-trash"></i></button>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] text-2xl shadow-xl"><i className="fas fa-microchip"></i></div>
                <div>
                   <h3 className="text-lg font-black uppercase tracking-tighter">AI API Key Management</h3>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Paste keys line-by-line below</p>
                </div>
             </div>
             <textarea 
               value={aiKeys} onChange={e => setAiKeys(e.target.value)} 
               placeholder="AIzaSy...&#10;AIzaSy...&#10;AIzaSy..."
               className="w-full h-80 bg-[#070312] border border-white/10 rounded-3xl p-6 text-[11px] font-mono text-[#00f2ff] outline-none focus:border-[#00f2ff] custom-scrollbar shadow-inner"
             />
             <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex items-center gap-4">
                <i className="fas fa-exclamation-triangle text-orange-500"></i>
                <p className="text-[9px] font-bold uppercase tracking-tight text-white/70">Invalid keys will cause the "API key not valid" error. Please ensure you use official Gemini API Keys from Google AI Studio.</p>
             </div>
             <button onClick={() => handleUpdate('ai_api_keys', aiKeys.split('\n').map(k => k.trim()).filter(k => k.length > 5))} className="w-full py-5 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl active:scale-95">Sync AI Key Pool</button>
          </div>
        )}

        {activeTab === 'maintenance' && (
           <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20"></div>
              <div className="w-20 h-20 bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 border border-red-500/20"><i className="fas fa-power-off text-3xl text-red-500"></i></div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Master Maintenance Switch</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-[200px]">Enabling this will block all standard users and show the technical maintenance screen.</p>
              <button onClick={() => handleUpdate('app_settings/maintenanceMode', !appSettings?.maintenanceMode)} className={`w-32 h-16 rounded-full relative transition-all shadow-2xl ${appSettings?.maintenanceMode ? 'bg-red-500' : 'bg-gray-800'}`}>
                 <div className={`absolute top-2 w-12 h-12 bg-white rounded-full transition-all shadow-xl ${appSettings?.maintenanceMode ? 'right-2' : 'left-2'}`}></div>
              </button>
              <p className="mt-8 text-[11px] font-black uppercase tracking-widest">{appSettings?.maintenanceMode ? <span className="text-red-500">SYSTEM: OFFLINE</span> : <span className="text-[#00ff9d]">SYSTEM: OPERATIONAL</span>}</p>
           </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e30; border-radius: 10px; }
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
  <div className="bg-[#151525] border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col items-center text-center group active:scale-95 transition-all">
    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5 ${color} shadow-lg group-hover:bg-white/10`}><i className={`fas ${icon} text-xl`}></i></div>
    <div className="text-3xl font-black tracking-tighter uppercase">{value}</div>
    <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest mt-1.5 opacity-60">{label}</div>
  </div>
);

const InputField = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none focus:border-[#00f2ff] shadow-inner font-medium" placeholder={label} />
  </div>
);

export default AdminPanel;