
import React, { useEffect, useState, useMemo } from 'react';
import { FIREBASE_CONFIG, DEFAULT_DARK_THEME } from '../constants';
import { PremiumRequest, PremiumPlan, User, AIAgent, AppSettings, PromoBanner, UserTheme, UserNotification, UserSuggestion } from '../types';

interface AdminPanelProps {
  onExit: () => void;
}

type Tab = 'dashboard' | 'users' | 'analysis' | 'themes' | 'settings' | 'premium_req' | 'premium_mgmt' | 'ai_keys' | 'ai_agents' | 'banners' | 'suggestions' | 'maintenance';

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'AI Studio', appLogo: '', upiId: '', qrCodeUrl: '', maintenanceMode: false
  });
  const [theme, setTheme] = useState<UserTheme>(DEFAULT_DARK_THEME);
  const [banner, setBanner] = useState<PromoBanner>({ imageUrl: '', linkUrl: '', enabled: false });
  const [aiKeys, setAiKeys] = useState<string[]>([]);
  const [rawKeyInput, setRawKeyInput] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);

  // Notification / Badge States
  const [seenCounts, setSeenCounts] = useState<{ [key: string]: number }>({
    users: parseInt(localStorage.getItem('admin_seen_users') || '0'),
    premium_req: parseInt(localStorage.getItem('admin_seen_reqs') || '0')
  });

  // Form States for new items
  const [newPlan, setNewPlan] = useState<Partial<PremiumPlan>>({
    plan_name: '', price: 0, duration_days: 30, benefits: [], active: true, isPro: false
  });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await Promise.all([
        fetch(`${FIREBASE_CONFIG.databaseURL}/users.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/premium_plans.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/ai_agents.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/app_settings.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/app_theme.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/promo_banner.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/ai_api_keys.json`),
        fetch(`${FIREBASE_CONFIG.databaseURL}/suggestions.json`)
      ]);
      
      const [u, r, p, a, s, t, b, k, sug] = await Promise.all(res.map(r => r.ok ? r.json() : null));
      
      if (u) setUsers(Object.keys(u).map(k => ({ ...u[k], uid: k })));
      else setUsers([]);
      
      if (r) setRequests(Object.keys(r).map(k => ({ ...r[k], id: k })).reverse());
      else setRequests([]);
      
      if (p) setPlans(Object.keys(p).map(k => ({ ...p[k], id: k })));
      else setPlans([]);
      
      if (a) setAgents(Object.keys(a).map(k => ({ ...a[k], id: k })));
      else setAgents([]);
      
      if (s) setSettings(s);
      if (t) setTheme(t);
      if (b) setBanner(b);
      if (k && Array.isArray(k)) {
        setAiKeys(k);
        setRawKeyInput(k.join('\n'));
      }
      if (sug) setSuggestions(Object.keys(sug).map(k => ({ ...sug[k], id: k })).reverse());
      else setSuggestions([]);
    } catch (e) { 
      if (!silent) console.error("Admin Fetch Error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Update seen counts when visiting tabs
  useEffect(() => {
    if (activeTab === 'users') {
      const count = users.length;
      setSeenCounts(prev => ({ ...prev, users: count }));
      localStorage.setItem('admin_seen_users', count.toString());
    }
    if (activeTab === 'premium_req') {
      const count = requests.filter(r => r.status === 'pending').length;
      setSeenCounts(prev => ({ ...prev, premium_req: count }));
      localStorage.setItem('admin_seen_reqs', count.toString());
    }
  }, [activeTab, users.length, requests.length]);

  const saveSetting = async (path: string, data: any) => {
    try {
      const res = await fetch(`${FIREBASE_CONFIG.databaseURL}/${path}.json`, {
        method: 'PUT', body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Saved successfully!");
      fetchData(true);
    } catch (e) {
      alert("Network error: Save failed.");
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<User>) => {
    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${uid}.json`, {
        method: 'PATCH', body: JSON.stringify(updates)
      });
      fetchData(true);
      alert("User updated!");
    } catch (e) { alert("Update failed"); }
  };

  const handleSendNotification = async (uid: string, msg?: string) => {
    const messageToSend = msg || notifMessage;
    if (!messageToSend.trim()) return alert("Enter message");
    const newNotif: Omit<UserNotification, 'id'> = {
      message: messageToSend, timestamp: new Date().toISOString(), read: false, type: 'system'
    };
    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${uid}/notifications.json`, {
        method: 'POST', body: JSON.stringify(newNotif)
      });
      setNotifMessage('');
      alert("Notification sent!");
    } catch (e) { alert("Failed to send"); }
  };

  const deleteItem = async (path: string) => {
    if (!confirm("Are you sure? This record will be permanently deleted.")) return;
    
    // Optimistic local update
    if (path.startsWith('premium_requests/')) {
        const id = path.split('/')[1];
        setRequests(prev => prev.filter(r => r.id !== id));
    } else if (path.startsWith('users/')) {
        const uid = path.split('/')[1];
        setUsers(prev => prev.filter(u => u.uid !== uid));
    }

    try {
      const response = await fetch(`${FIREBASE_CONFIG.databaseURL}/${path}.json`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Delete failed");
      fetchData(true);
    } catch (e) { 
      alert("Delete operation failed. Check your connection."); 
      fetchData(true); 
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.plan_name || !newPlan.price) return alert("Fill all fields");
    try {
      const data = { ...newPlan, created_at: new Date().toISOString() };
      await fetch(`${FIREBASE_CONFIG.databaseURL}/premium_plans.json`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setNewPlan({ plan_name: '', price: 0, duration_days: 30, benefits: [], active: true, isPro: false });
      alert("Plan Created!");
      fetchData(true);
    } catch (e) { alert("Failed to create plan"); }
  };

  const growthData = useMemo(() => {
    const days = 15;
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toDateString();
      const count = users.filter(u => u.created_at && new Date(u.created_at).toDateString() === dateStr).length;
      result.push({ date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), count });
    }
    return result;
  }, [users]);

  const analysis = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return {
      active3d: users.filter(u => u.last_login && (now - new Date(u.last_login).getTime()) < (3 * dayMs)),
      inactive15d: users.filter(u => u.last_login && (now - new Date(u.last_login).getTime()) > (15 * dayMs)),
      topDevs: [...users].sort((a, b) => (b.total_usage_time || 0) - (a.total_usage_time || 0)).slice(0, 10)
    };
  }, [users]);

  const handleApproveRequest = async (req: PremiumRequest) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + req.duration_days);
    
    setRequests(prev => prev.filter(r => r.id !== req.id));

    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${req.user_uid}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ premium: true, premium_plan: req.plan_name, premium_expiry_date: expiry.toISOString() })
      });
      await fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests/${req.id}/status.json`, { method: 'PUT', body: JSON.stringify('approved') });
      alert("Verification Success! User is now Premium.");
      fetchData(true);
    } catch (e) { 
      alert("Verification failed."); 
      fetchData(true);
    }
  };

  const handleCreateAgent = async () => {
    const name = prompt("Agent Name (e.g., Code Architect):");
    if (!name) return;
    const instruction = prompt("AI Agent System Instruction:");
    const apiKey = prompt("Dedicated API Key (Optional):");
    const newAgent: Omit<AIAgent, 'id'> = {
      name, instruction: instruction || '', apiKey, icon: 'fa-robot', status: 'active', category: 'Custom'
    };
    await fetch(`${FIREBASE_CONFIG.databaseURL}/ai_agents.json`, { method: 'POST', body: JSON.stringify(newAgent) });
    fetchData(true);
  };

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-[#00ff9d]"><i className="fas fa-spinner fa-spin text-4xl"></i></div>;

    switch (activeTab) {
      case 'dashboard':
        const maxCount = Math.max(...growthData.map(d => d.count), 1);
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" val={users.length} color="text-white" />
              <StatCard label="AI Pool Keys" val={aiKeys.length} color="text-[#00f2ff]" />
              <StatCard label="Pending Req" val={requests.filter(r => r.status === 'pending').length} color="text-yellow-500" />
              <StatCard label="Active PRO" val={users.filter(u => u.premium).length} color="text-[#ff006e]" />
            </div>

            <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e] shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ff9d] mb-8">User Growth Chart (Last 15 Days)</h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {growthData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-10 bg-black/80 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-[#2a2a3e]">
                      {d.count} Users
                    </div>
                    <div className="w-full bg-gradient-to-t from-[#00ff9d11] to-[#00ff9d] rounded-t-lg transition-all duration-700" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: '4px' }}></div>
                    <span className="text-[7px] font-black uppercase mt-3 opacity-40 rotate-45 sm:rotate-0">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase mb-4">Users Registry</h3>
            <div className="grid grid-cols-1 gap-3">
              {users.map(u => (
                <div key={u.uid} className="bg-[#1a1a2e] p-5 rounded-2xl border border-[#2a2a3e] flex justify-between items-center group hover:border-[#00ff9d] transition-all">
                  <div className="flex items-center gap-4 truncate">
                    <div className="w-12 h-12 bg-[#151520] rounded-2xl flex items-center justify-center font-black text-[#00ff9d] border border-[#2a2a3e] overflow-hidden shrink-0">
                       {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.username?.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-black text-sm text-white flex items-center gap-2">
                        {u.username} {u.premium && <i className="fas fa-crown text-[#00f2ff] text-[8px]"></i>}
                      </div>
                      <div className="text-[10px] text-secondary opacity-50 truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditingUser(u)} className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 active:scale-90 transition-all"><i className="fas fa-edit text-xs"></i></button>
                    <button onClick={() => deleteItem(`users/${u.uid}`)} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/10 active:scale-90 transition-all"><i className="fas fa-trash text-xs"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-8">
            <SectionHeader title="User Usage Analytics" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <AnalysisBox title="Active Now (3 Days)" users={analysis.active3d} color="border-[#00ff9d]" />
               <AnalysisBox title="Idle (15 Days+)" users={analysis.inactive15d} color="border-red-500" />
               <AnalysisBox title="Elite Developers (Time)" users={analysis.topDevs} color="border-[#00f2ff]" isUsage />
            </div>
          </div>
        );

      case 'themes':
        return (
          <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e] shadow-2xl">
             <h3 className="text-xs font-black uppercase text-[#00ff9d] mb-8 tracking-widest">Global Style Engine (Cloud)</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {Object.keys(theme).map(k => (
                  <div key={k} className="space-y-2">
                    <label className="text-[8px] font-black uppercase opacity-40 ml-1 truncate block">{k}</label>
                    <div className="flex items-center gap-3 bg-[#151520] p-3 rounded-2xl border border-[#2a2a3e]">
                      <input type="color" value={theme[k as keyof UserTheme]} onChange={e => setTheme({...theme, [k]: e.target.value})} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer" />
                      <span className="text-[10px] font-mono opacity-50">{theme[k as keyof UserTheme]}</span>
                    </div>
                  </div>
                ))}
             </div>
             <button onClick={() => saveSetting('app_theme', theme)} className="w-full bg-[#00ff9d] text-black font-black py-5 rounded-2xl mt-10 uppercase text-xs shadow-xl shadow-[#00ff9d]/20">Broadcast Theme Sync</button>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e] shadow-2xl">
              <h3 className="text-xs font-black uppercase text-[#00f2ff] mb-8 tracking-widest">System Core Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Input label="App Identity Name" val={settings.appName} set={v => setSettings({...settings, appName: v})} />
                 <Input label="Logo Asset URL" val={settings.appLogo} set={v => setSettings({...settings, appLogo: v})} />
                 <Input label="Payment UPI ID" val={settings.upiId} set={v => setSettings({...settings, upiId: v})} />
                 <Input label="QR Code Image URL" val={settings.qrCodeUrl} set={v => setSettings({...settings, qrCodeUrl: v})} />
              </div>
              <button onClick={() => saveSetting('app_settings', settings)} className="w-full bg-[#00f2ff] text-black font-black py-5 rounded-2xl mt-10 uppercase text-xs shadow-xl">Update Global Config</button>
            </div>
          </div>
        );

      case 'ai_agents':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-black uppercase">Agent Architect</h3>
               <button onClick={handleCreateAgent} className="bg-[#00f2ff] text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#00f2ff]/20">Construct Agent</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {agents.map(agent => (
                 <div key={agent.id} className="bg-[#1a1a2e] p-6 rounded-3xl border border-[#2a2a3e] relative group">
                    <h4 className="font-black text-white uppercase mb-1">{agent.name}</h4>
                    <p className="text-[9px] text-secondary opacity-60 mb-4 line-clamp-3 italic">"{agent.instruction}"</p>
                    <div className="flex gap-2">
                       <button onClick={() => deleteItem(`ai_agents/${agent.id}`)} className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase border border-red-500/20">Delete</button>
                       <button onClick={() => saveSetting(`ai_agents/${agent.id}/status`, agent.status === 'active' ? 'maintenance' : 'active')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border ${agent.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                          {agent.status}
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'ai_keys':
        return (
          <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e] space-y-6">
            <h3 className="font-black uppercase text-sm tracking-tighter">Gemini API Key Pool</h3>
            <textarea 
              value={rawKeyInput}
              onChange={(e) => setRawKeyInput(e.target.value)}
              className="w-full bg-[#151520] border border-[#2a2a3e] p-6 rounded-3xl text-sm h-64 outline-none focus:border-[#00f2ff] custom-scrollbar font-mono text-[#00f2ff]"
              placeholder="API_KEY_1&#10;API_KEY_2..."
            />
            <button onClick={() => saveSetting('ai_api_keys', rawKeyInput.split('\n').filter(k => k.trim()))} className="w-full bg-[#00f2ff] text-black font-black py-5 rounded-2xl uppercase text-xs shadow-xl">Sync Key Pool</button>
          </div>
        );

      case 'premium_req':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase mb-4">Premium Verifications</h3>
            {requests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="bg-[#1a1a2e] p-6 rounded-3xl border border-[#2a2a3e] shadow-lg animate-in fade-in slide-in-from-top duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs font-black text-[#00f2ff] uppercase tracking-widest mb-1">{req.plan_name}</div>
                    <div className="text-lg font-black text-white">₹{req.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white mb-1">{req.user_email}</div>
                    <div className="text-[8px] text-secondary uppercase font-black opacity-50">{new Date(req.request_time).toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-[#151520] p-4 rounded-2xl border border-[#2a2a3e]/30 mb-6">
                  <span className="text-[8px] uppercase font-black opacity-40 block mb-1">TXN ID:</span>
                  <code className="text-[11px] text-[#00ff9d] font-mono">{req.transaction_id}</code>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleApproveRequest(req)} className="flex-1 bg-[#00ff9d] text-black font-black py-4 rounded-xl text-[10px] uppercase shadow-lg">Verify Pay</button>
                  <button onClick={() => deleteItem(`premium_requests/${req.id}`)} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-xl text-[10px] uppercase active:scale-95 transition-all">Reject</button>
                </div>
              </div>
            ))}
            {requests.filter(r => r.status === 'pending').length === 0 && <div className="text-center py-20 text-secondary italic opacity-20">No pending verification.</div>}
          </div>
        );

      case 'premium_mgmt':
        return (
          <div className="space-y-8">
            <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e]">
              <h3 className="text-xs font-black uppercase text-[#ff00c8] mb-8">Create New Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Plan Name" val={newPlan.plan_name || ''} set={v => setNewPlan({...newPlan, plan_name: v})} />
                <Input label="Price (INR)" val={newPlan.price?.toString() || ''} set={v => setNewPlan({...newPlan, price: Number(v)})} />
                <Input label="Duration (Days)" val={newPlan.duration_days?.toString() || ''} set={v => setNewPlan({...newPlan, duration_days: Number(v)})} />
                <div className="flex items-center gap-4 mt-4">
                  <label className="text-[10px] font-black uppercase opacity-40">Is Pro?</label>
                  <input type="checkbox" checked={newPlan.isPro} onChange={e => setNewPlan({...newPlan, isPro: e.target.checked})} className="w-6 h-6" />
                </div>
              </div>
              <textarea 
                placeholder="Benefits (One per line)" 
                value={newPlan.benefits?.join('\n')}
                onChange={e => setNewPlan({...newPlan, benefits: e.target.value.split('\n')})}
                className="w-full bg-[#151520] border border-[#2a2a3e] p-4 rounded-2xl text-xs mt-6 h-32 outline-none focus:border-[#ff00c8]"
              />
              <button onClick={handleCreatePlan} className="w-full bg-[#ff00c8] text-white font-black py-4 rounded-2xl mt-6 uppercase text-xs">Deploy Plan</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-[#1a1a2e] p-5 rounded-2xl border border-[#2a2a3e] flex justify-between items-center">
                  <div>
                    <div className="font-black text-white">{plan.plan_name}</div>
                    <div className="text-[10px] text-secondary">₹{plan.price} - {plan.duration_days} Days</div>
                  </div>
                  <button onClick={() => deleteItem(`premium_plans/${plan.id}`)} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center"><i className="fas fa-trash"></i></button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'banners':
        return (
          <div className="bg-[#1a1a2e] p-8 rounded-[3rem] border border-[#2a2a3e]">
            <h3 className="text-xs font-black uppercase text-[#00ff9d] mb-8">Promo Billboard Config</h3>
            <div className="space-y-6">
               <Input label="Banner Image URL" val={banner.imageUrl} set={v => setBanner({...banner, imageUrl: v})} />
               <Input label="Click Link URL" val={banner.linkUrl} set={v => setBanner({...banner, linkUrl: v})} />
               <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black uppercase opacity-40">Enable Billboard?</label>
                  <input type="checkbox" checked={banner.enabled} onChange={e => setBanner({...banner, enabled: e.target.checked})} className="w-6 h-6" />
               </div>
               <button onClick={() => saveSetting('promo_banner', banner)} className="w-full bg-[#00ff9d] text-black font-black py-4 rounded-2xl uppercase text-xs">Save Banner Config</button>
            </div>
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase mb-4">User Feedback Log</h3>
            {suggestions.map(s => (
              <div key={s.id} className="bg-[#1a1a2e] p-6 rounded-3xl border border-[#2a2a3e]">
                <div className="flex justify-between items-start mb-4">
                   <div className="font-black text-[#00ff9d]">{s.username}</div>
                   <div className="text-[8px] opacity-40 uppercase font-black">{new Date(s.timestamp).toLocaleString()}</div>
                </div>
                <p className="text-xs text-secondary leading-relaxed mb-4">"{s.message}"</p>
                <button onClick={() => deleteItem(`suggestions/${s.id}`)} className="text-[9px] font-black uppercase text-red-500">Delete Feedback</button>
              </div>
            ))}
            {suggestions.length === 0 && <div className="text-center py-20 opacity-20 italic">No feedback received.</div>}
          </div>
        );

      case 'maintenance':
        return (
          <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
             <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all shadow-2xl mb-8 ${settings.maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                <i className={`fas ${settings.maintenanceMode ? 'fa-lock' : 'fa-lock-open'} text-5xl`}></i>
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">System Interlock</h3>
             <p className="text-[10px] text-secondary font-black uppercase mb-10 tracking-widest">Global Status: {settings.maintenanceMode ? 'MAINTENANCE ON' : 'ONLINE'}</p>
             <button onClick={() => saveSetting('app_settings/maintenanceMode', !settings.maintenanceMode)} className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl ${settings.maintenanceMode ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                {settings.maintenanceMode ? 'Activate Live Mode' : 'Deactivate Live (Locked)'}
             </button>
          </div>
        );

      default:
        return <div className="text-center py-40 opacity-20 italic">Module loading...</div>;
    }
  };

  const getUnreadCount = (id: string) => {
    if (id === 'users') {
      const diff = users.length - seenCounts.users;
      return diff > 0 ? diff : 0;
    }
    if (id === 'premium_req') {
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      const diff = pendingCount - seenCounts.premium_req;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'users', label: 'Identity Pool', icon: 'fa-users' },
    { id: 'analysis', label: 'User Analysis', icon: 'fa-microscope' },
    { id: 'themes', label: 'Global Theme', icon: 'fa-palette' },
    { id: 'settings', label: 'App Settings', icon: 'fa-cogs' },
    { id: 'premium_req', label: 'Verification Queue', icon: 'fa-check-double' },
    { id: 'premium_mgmt', label: 'Plan Studio', icon: 'fa-crown' },
    { id: 'ai_keys', label: 'Key Pool', icon: 'fa-key' },
    { id: 'ai_agents', label: 'AI Architect', icon: 'fa-brain' },
    { id: 'banners', label: 'Ad Billboards', icon: 'fa-ad' },
    { id: 'suggestions', label: 'Feedback', icon: 'fa-comment-alt' },
    { id: 'maintenance', label: 'Emergency Lock', icon: 'fa-tools' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#070312] text-white overflow-hidden font-sans">
      {editingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setEditingUser(null)}></div>
          <div className="relative w-full max-lg bg-[#151520] border border-[#2a2a3e] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Control User: {editingUser.username}</h2>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleUpdateUser(editingUser.uid, { premium: true, premium_plan: 'PRO Plan' })} className="py-4 bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff22] rounded-2xl text-[10px] font-black uppercase">Grant Premium</button>
                  <button onClick={() => handleUpdateUser(editingUser.uid, { premium: false, premium_plan: '' })} className="py-4 bg-red-500/10 text-red-500 border border-red-500/22 rounded-2xl text-[10px] font-black uppercase">Revoke Access</button>
               </div>
               <textarea placeholder="Direct push alert message..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-3xl p-6 text-sm outline-none focus:border-[#00ff9d] h-32" />
               <button onClick={() => handleSendNotification(editingUser.uid)} className="w-full bg-[#00ff9d] text-black font-black py-5 rounded-2xl uppercase text-[10px] shadow-xl">Send Direct Broadcast</button>
               <button onClick={() => setEditingUser(null)} className="w-full text-[9px] font-black uppercase opacity-30 mt-4 tracking-widest">Cancel Protocol</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Menu on Left */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-[#151520] border-r border-[#2a2a3e] z-[150] transition-transform duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[20px_0_100px_rgba(0,0,0,0.8)]`}>
        <div className="p-10 border-b border-[#2a2a3e]/30 flex items-center justify-between bg-[#1a1a2e]">
          <div className="font-black text-2xl tracking-tighter">STUDIO <span className="text-[#00ff9d]">PRO</span></div>
          <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 bg-[#2a2a3e] rounded-xl flex items-center justify-center text-secondary active:scale-90"><i className="fas fa-times"></i></button>
        </div>
        <div className="overflow-y-auto h-full pb-60 custom-scrollbar">
          {menuItems.map(item => {
            const unread = getUnreadCount(item.id);
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as Tab); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center justify-between px-10 py-5 transition-all border-l-4 ${activeTab === item.id ? 'border-[#00ff9d] bg-[#00ff9d]/5 text-[#00ff9d]' : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-6">
                  <i className={`fas ${item.icon} w-6 text-base`}></i>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </div>
                {unread > 0 && (
                  <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-600/30">
                    {unread}
                  </div>
                )}
              </button>
            );
          })}
          <div className="p-10 mt-6 border-t border-[#2a2a3e]/20">
             <button onClick={onExit} className="w-full flex items-center gap-6 py-5 text-red-500 group active:scale-95 transition-all">
               <i className="fas fa-power-off w-6 group-hover:scale-125 transition-transform"></i>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Terminal</span>
             </button>
          </div>
        </div>
      </div>

      <header className="p-6 bg-[#151520] border-b border-[#2a2a3e] flex items-center justify-between sticky top-0 z-[100] shadow-2xl">
        <div className="flex items-center gap-4">
           <div className="font-black text-lg tracking-tighter">STUDIO <span className="text-[#00ff9d]">ADMIN</span></div>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 bg-[#1a1a2e] border border-[#2a2a3e] text-[#00ff9d] rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all">
          <i className="fas fa-bars"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

/* Dashboard Stat Component */
const StatCard: React.FC<{ label: string, val: any, color: string }> = ({ label, val, color }) => (
  <div className="bg-[#1a1a2e] p-6 rounded-[2rem] border border-[#2a2a3e] text-center shadow-xl">
    <div className="text-[8px] font-black uppercase tracking-widest text-secondary opacity-50 mb-1">{label}</div>
    <div className={`text-2xl font-black ${color}`}>{val}</div>
  </div>
);

/* Analysis Helper */
const AnalysisBox: React.FC<{ title: string, users: User[], color: string, isUsage?: boolean }> = ({ title, users, color, isUsage }) => (
  <div className={`bg-[#1a1a2e] p-6 rounded-[2.5rem] border ${color} shadow-2xl`}>
     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50">{title} ({users.length})</h4>
     <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {users.slice(0, 10).map(u => (
          <div key={u.uid} className="flex justify-between items-center bg-[#151520] p-3 rounded-xl border border-[#2a2a3e]/50">
             <span className="text-[10px] font-bold truncate pr-2">{u.username}</span>
             <span className="text-[8px] font-black uppercase opacity-40">{isUsage ? `${Math.floor((u.total_usage_time || 0)/60)}m` : u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</span>
          </div>
        ))}
        {users.length === 0 && <p className="text-[10px] italic opacity-20">Zero records.</p>}
     </div>
  </div>
);

/* Form Helpers */
const Input: React.FC<{ label: string, val: string, set: (v: string) => void }> = ({ label, val, set }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black uppercase opacity-40 ml-4">{label}</label>
    <input value={val} onChange={e => set(e.target.value)} className="w-full bg-[#151520] border border-[#2a2a3e] p-5 rounded-2xl outline-none focus:border-[#00f2ff] transition-all text-xs" />
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-4 mb-4">
    <h3 className="text-xl font-black uppercase tracking-tighter">{title}</h3>
    <div className="h-[1px] flex-1 bg-[#2a2a3e]"></div>
  </div>
);

export default AdminPanel;
