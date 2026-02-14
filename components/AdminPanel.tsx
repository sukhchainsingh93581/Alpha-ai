import React, { useEffect, useState } from 'react';
import { FIREBASE_CONFIG, DEFAULT_DARK_THEME } from '../constants';
import { User, PremiumRequest, AppSettings, UserTheme } from '../types';

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'premium' | 'settings' | 'keys'>('keys');
  const [users, setUsers] = useState<User[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [aiKeys, setAiKeys] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, reqsRes, settingsRes, keysRes] = await Promise.all([
        fetch(`${FIREBASE_CONFIG.databaseURL}/users.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/app_settings.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/ai_api_keys.json`)
      ]);

      const usersData = await usersRes.json();
      const reqsData = await reqsRes.json();
      const settingsData = await settingsRes.json();
      const keysData = await keysRes.json();

      if (usersData) {
        setUsers(Object.keys(usersData).map(uid => ({ ...usersData[uid], uid })));
      }
      if (reqsData) {
        setPremiumRequests(Object.keys(reqsData).map(id => ({ ...reqsData[id], id })));
      }
      if (settingsData) {
        setAppSettings(settingsData);
      }
      if (keysData && Array.isArray(keysData)) {
        setAiKeys(keysData.join('\n'));
      }
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    setSyncing(true);
    try {
      const keysArray = aiKeys.split('\n').map(k => k.trim()).filter(k => k.length > 5);
      await fetch(`${FIREBASE_CONFIG.databaseURL}/ai_api_keys.json`, {
        method: 'PUT',
        body: JSON.stringify(keysArray)
      });
      alert("AI Key Pool updated successfully! The app will sync these keys shortly.");
      // Force immediate update in local environment for admin
      const globalObj = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
      if (keysArray.length > 0) {
        globalObj.process.env.API_KEY = keysArray[0];
      }
    } catch (e) {
      alert("Failed to sync keys.");
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveRequest = async (req: PremiumRequest) => {
    const confirm = window.confirm(`Approve premium for ${req.user_email}?`);
    if (!confirm) return;

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + req.duration_days);

      await Promise.all([
        fetch(`${FIREBASE_CONFIG.databaseURL}/users/${req.user_uid}.json`, {
          method: 'PATCH',
          body: JSON.stringify({
            premium: true,
            premium_plan: req.plan_name,
            premium_start_date: new Date().toISOString(),
            premium_expiry_date: expiryDate.toISOString()
          })
        }),
        fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests/${req.id}.json`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' })
        })
      ]);
      fetchData();
    } catch (e) {
      alert("Approval failed.");
    }
  };

  const handleToggleMaintenance = async () => {
    if (!appSettings) return;
    const newVal = !appSettings.maintenanceMode;
    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/app_settings/maintenanceMode.json`, {
        method: 'PUT',
        body: JSON.stringify(newVal)
      });
      setAppSettings({ ...appSettings, maintenanceMode: newVal });
    } catch (e) { }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#070312] text-[#00f2ff] font-black uppercase tracking-widest">Loading Admin Database...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#070312] text-white">
      <header className="px-6 py-8 border-b border-white/5 bg-[#0a0a1a] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Admin <span className="text-[#00f2ff]">Control</span></h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">System Version 2.1.0_PRO</p>
        </div>
        <button onClick={onExit} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <nav className="flex bg-[#0a0a1a] p-2 border-b border-white/5 overflow-x-auto custom-scrollbar">
        {[
          { id: 'keys', label: 'AI Keys', icon: 'fa-key' },
          { id: 'premium', label: 'Requests', icon: 'fa-crown' },
          { id: 'users', label: 'Database', icon: 'fa-users' },
          { id: 'settings', label: 'Settings', icon: 'fa-sliders-h' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#00f2ff] text-black shadow-lg shadow-[#00f2ff]/20' : 'text-gray-500 hover:text-white'}`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-10">
        {activeTab === 'keys' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl flex items-center justify-center border border-[#00f2ff]/20">
                  <i className="fas fa-microchip text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">AI Key Pool Management</h3>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inject Gemini API Keys for Global Chat</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4 ml-2">API Keys (One per line)</label>
                <textarea 
                  value={aiKeys}
                  onChange={(e) => setAiKeys(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full h-64 bg-[#070312] border border-white/10 rounded-3xl p-6 text-sm font-mono text-[#00f2ff] outline-none focus:border-[#00f2ff] custom-scrollbar resize-none"
                />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleSaveKeys}
                  disabled={syncing}
                  className="w-full py-5 bg-[#00f2ff] text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {syncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                  {syncing ? "Syncing with Cloud..." : "Sync Key Pool"}
                </button>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 leading-relaxed text-center uppercase tracking-tighter">
                    Admin can paste multiple keys here. The app will randomly select one to avoid rate limits. Make sure keys are valid Gemini API keys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'premium' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {premiumRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-20 opacity-20 flex flex-col items-center">
                <i className="fas fa-crown text-5xl mb-4"></i>
                <p className="text-xs font-black uppercase tracking-widest">No pending upgrades</p>
              </div>
            ) : (
              premiumRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="bg-[#151525] border border-white/5 rounded-3xl p-6 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 truncate">
                      <h4 className="font-black text-[var(--accent)] uppercase text-[10px] tracking-widest mb-1">{req.plan_name} Request</h4>
                      <p className="font-black text-sm truncate">{req.user_email}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">TXID: {req.transaction_id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#00ff9d]">₹{req.price}</div>
                      <div className="text-[8px] font-black uppercase text-gray-500">{req.duration_days} Days</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button onClick={() => handleApproveRequest(req)} className="flex-1 py-4 bg-[#00ff9d] text-black rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all shadow-lg">Approve</button>
                    <button onClick={async () => {
                      if(confirm("Reject?")) await fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests/${req.id}.json`, { method: 'DELETE' });
                      fetchData();
                    }} className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {users.map(u => (
              <div key={u.uid} className="bg-[#151525] border border-white/5 rounded-3xl p-6 flex justify-between items-center shadow-xl">
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-sm truncate uppercase tracking-tighter">{u.username}</h4>
                    {u.premium && <i className="fas fa-crown text-[#ff00c8] text-[10px]"></i>}
                  </div>
                  <p className="text-[9px] font-bold text-gray-500 truncate">{u.email}</p>
                  <p className="text-[7px] font-black text-gray-600 uppercase mt-1 tracking-widest">Time: {Math.floor(u.remaining_ai_seconds/60)}m left</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => {
                    const time = prompt("Enter new time in seconds:", u.remaining_ai_seconds.toString());
                    if(time) fetch(`${FIREBASE_CONFIG.databaseURL}/users/${u.uid}/remaining_ai_seconds.json`, { method: 'PUT', body: time }).then(fetchData);
                  }} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xs text-blue-400 border border-white/10 active:scale-90"><i className="fas fa-clock"></i></button>
                  <button onClick={() => {
                    if(confirm("Delete user?")) fetch(`${FIREBASE_CONFIG.databaseURL}/users/${u.uid}.json`, { method: 'DELETE' }).then(fetchData);
                  }} className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-xs text-red-500 border border-red-500/20 active:scale-90"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#151525] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Global Controller</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-[#070312] border border-white/5 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Maintenance Mode</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">Offline for all users</p>
                  </div>
                  <button 
                    onClick={handleToggleMaintenance}
                    className={`w-14 h-8 rounded-full relative transition-all ${appSettings?.maintenanceMode ? 'bg-[#ff0055]' : 'bg-[#00ff9d]'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${appSettings?.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">App Branding</p>
                  <input 
                    placeholder="App Name" 
                    value={appSettings?.appName || ''}
                    onChange={(e) => setAppSettings(appSettings ? {...appSettings, appName: e.target.value} : null)}
                    className="w-full bg-[#070312] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-[#00f2ff]"
                  />
                  <input 
                    placeholder="Logo URL" 
                    value={appSettings?.appLogo || ''}
                    onChange={(e) => setAppSettings(appSettings ? {...appSettings, appLogo: e.target.value} : null)}
                    className="w-full bg-[#070312] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-[#00f2ff]"
                  />
                  <button onClick={async () => {
                    await fetch(`${FIREBASE_CONFIG.databaseURL}/app_settings.json`, { method: 'PATCH', body: JSON.stringify(appSettings) });
                    alert("Settings Saved");
                  }} className="w-full py-4 bg-[#00f2ff] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg shadow-[#00f2ff]/20 active:scale-95 transition-all">Update Branding</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;