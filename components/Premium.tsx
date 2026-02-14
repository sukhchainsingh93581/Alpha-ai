
import React, { useEffect, useState } from 'react';
import { FIREBASE_CONFIG } from '../constants';
import { User, PremiumRequest, PremiumPlan } from '../types';

interface PremiumProps {
  user: User | null;
}

const SPECIFIC_QR_URL = "https://i.supaimg.com/1432f5fd-4d60-4493-9cd2-01074a0fcd40.jpg";

const DEFAULT_PLANS: PremiumPlan[] = [
  // --- CHEAP PLANS (₹10 to ₹100 | Range: 3-10 Days) ---
  { id: 'c1', plan_name: 'Micro AI Pulse', price: 10, duration_days: 3, benefits: ['Instant Q&A Access', 'No Ad Disruptions', 'Standard Server Speed'], active: true, isPro: false, created_at: '' },
  { id: 'c2', plan_name: 'Dev Trial Pack', price: 30, duration_days: 5, benefits: ['Smart Code Snippets', 'Cloud Buffer Sync', 'Basic Agent Unlocked'], active: true, isPro: false, created_at: '' },
  { id: 'c3', plan_name: 'Weekly Logic Pro', price: 50, duration_days: 7, benefits: ['Full Agent Suite', 'Firebase Sync Lite', '7-Day Pro Badge'], active: true, isPro: false, created_at: '' },
  { id: 'c4', plan_name: 'Mini Master', price: 80, duration_days: 9, benefits: ['Priority Prompting', 'UI Design Toolkit', 'Extended Context AI'], active: true, isPro: false, created_at: '' },
  { id: 'c5', plan_name: 'Starter Architect', price: 100, duration_days: 10, benefits: ['2X Faster Responses', 'Asset Library Access', 'Complete Pro Unlocked'], active: true, isPro: false, created_at: '' },

  // --- STANDARD PLANS (₹150 to ₹500 | Range: 30-150 Days) ---
  { id: 's1', plan_name: 'Monthly Studio', price: 150, duration_days: 30, benefits: ['Official Dev License', 'Advanced Reasoning', 'No Daily Limits'], active: true, isPro: true, created_at: '' },
  { id: 's2', plan_name: 'Logic Creator', price: 250, duration_days: 60, benefits: ['Private Project Vault', 'Game Logic Engine', 'VIP Support Access'], active: true, isPro: true, created_at: '' },
  { id: 's3', plan_name: 'Quarterly Titan', price: 350, duration_days: 90, benefits: ['Full Stack Architect', 'Zero Latency Mode', 'Exclusive UI Assets'], active: true, isPro: true, created_at: '' },
  { id: 's4', plan_name: 'Pro Developer', price: 450, duration_days: 120, benefits: ['Custom Model Tuning', 'Bulk File Analysis', 'Legacy Data Access'], active: true, isPro: true, created_at: '' },
  { id: 's5', plan_name: 'Elite Architect', price: 499, duration_days: 150, benefits: ['Founder Tier Tools', 'Early Beta Testing', '5-Month Infinity Key'], active: true, isPro: true, created_at: '' },

  // --- ULTRA PREMIUM PLANS (₹500 to ₹1500 | Range: 199-365 Days) ---
  { id: 'u1', plan_name: 'Legendary Pro', price: 599, duration_days: 199, benefits: ['Deep Logic Thinker', 'Ultimate Assets Unlocked', 'Gold Partner Badge'], active: true, isPro: true, created_at: '' },
  { id: 'u2', plan_name: 'Infinity Dev', price: 699, duration_days: 220, benefits: ['Real-time Collaboration', 'High-Load AI Access', 'Global Server Priority'], active: true, isPro: true, created_at: '' },
  { id: 'u3', plan_name: 'Master Builder', price: 799, duration_days: 250, benefits: ['Enterprise Security', 'Custom API Integration', '24/7 Dedicated Agent'], active: true, isPro: true, created_at: '' },
  { id: 'u4', plan_name: 'Studio Founder', price: 899, duration_days: 280, benefits: ['Full Ownership Rights', 'Asset Export Studio', 'Platinum UI Access'], active: true, isPro: true, created_at: '' },
  { id: 'u5', plan_name: 'God Tier AI', price: 999, duration_days: 310, benefits: ['The Infinite Brain', 'Multi-Language Expert', 'Zero Wait Time'], active: true, isPro: true, created_at: '' },
  { id: 'u6', plan_name: 'Titanium Core', price: 1199, duration_days: 330, benefits: ['Maximum AI Tokens', 'Universal Logic Hub', 'Ultimate Dev Tools'], active: true, isPro: true, created_at: '' },
  { id: 'u7', plan_name: 'Visionary Creator', price: 1399, duration_days: 350, benefits: ['Architect Certificate', 'Private Beta Studio', 'Custom Branding'], active: true, isPro: true, created_at: '' },
  { id: 'u8', plan_name: 'Yearly Infinite', price: 1499, duration_days: 365, benefits: ['Full 1 Year Freedom', 'All Past & Future Tools', 'The Ultimate Legacy'], active: true, isPro: true, created_at: '' },
];

const Premium: React.FC<PremiumProps> = ({ user }) => {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'cheap' | 'standard' | 'ultra'>('cheap');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${FIREBASE_CONFIG.databaseURL}/premium_plans.json`);
        const data = await res.json();
        if (data) {
          const loaded = Object.keys(data).map(k => ({ id: k, ...data[k] })).filter(p => p.active);
          setPlans(loaded.length >= 10 ? loaded : DEFAULT_PLANS);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      } catch (e) {
        setPlans(DEFAULT_PLANS);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) return alert("Please enter Transaction ID");
    if (!user || !selectedPlan) return;
    setSubmitting(true);
    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/premium_requests.json`, {
        method: 'POST',
        body: JSON.stringify({
          user_uid: user.uid, user_email: user.email, plan_id: selectedPlan.id,
          plan_name: selectedPlan.plan_name, duration_days: selectedPlan.duration_days,
          price: selectedPlan.price, isPro: selectedPlan.isPro, transaction_id: transactionId,
          status: 'pending', request_time: new Date().toISOString()
        })
      });
      setMessage({ type: 'success', text: "✅ Request sent! Verification takes 5-20 mins." });
      setSelectedPlan(null);
      setTransactionId('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setMessage({ type: 'error', text: "❌ Connection error." });
    }
    setSubmitting(false);
  };

  const getRemainingDays = () => {
    if (!user?.premium_expiry_date) return null;
    const expiry = new Date(user.premium_expiry_date).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getRemainingDays();
  const isPremium = !!user?.premium;

  const filteredPlans = plans.filter(p => {
    if (activeTab === 'cheap') return p.price <= 100;
    if (activeTab === 'standard') return p.price > 100 && p.price <= 500;
    if (activeTab === 'ultra') return p.price > 500;
    return true;
  });

  if (selectedPlan) {
    return (
      <div className="p-6 pb-24 animate-in fade-in slide-in-from-bottom duration-500">
        <button onClick={() => setSelectedPlan(null)} className="text-[var(--accent)] mb-6 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
          <i className="fas fa-arrow-left"></i> Back to Plans
        </button>
        <div className="bg-[var(--bg-card)] rounded-[3rem] p-8 border border-[var(--border)] text-center shadow-2xl relative">
          <h2 className="text-[var(--accent)] text-2xl font-black mb-1 uppercase tracking-tighter">{selectedPlan.plan_name}</h2>
          <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-8 opacity-40">Payment Checkout</p>
          
          {/* QR CODE CONTAINER - FIXED TO PERFECT SQUARE AS REQUESTED */}
          <div className="bg-white p-4 rounded-[2.5rem] w-full max-w-[220px] aspect-square mx-auto mb-8 shadow-2xl border-4 border-black/5 flex items-center justify-center overflow-hidden">
            <img 
              src={SPECIFIC_QR_URL} 
              alt="QR Code" 
              className="w-full h-full object-contain rounded-2xl" 
            />
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 mb-8 border border-[var(--border)] flex justify-between items-center text-left">
            <div>
              <p className="text-[8px] uppercase font-black opacity-40">Amount</p>
              <div className="text-3xl font-black text-white">₹{selectedPlan.price}</div>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-black opacity-40">Plan Time</p>
              <div className="text-xs font-black text-[var(--accent)] uppercase">{selectedPlan.duration_days} Days</div>
            </div>
          </div>

          <input 
            placeholder="Paste Transaction ID here..."
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-5 text-sm text-white outline-none focus:border-[var(--accent)] mb-6 font-mono text-center" 
          />

          <button disabled={submitting} onClick={handlePaymentSubmit} className="w-full bg-[var(--accent)] text-black font-black py-6 rounded-2xl active:scale-95 transition-all shadow-2xl uppercase text-[10px] tracking-[0.2em]">
            {submitting ? <i className="fas fa-spinner fa-spin"></i> : "Submit Transaction ID"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 animate-in fade-in duration-700">
      {/* USER STATUS HEADER */}
      <div className="mb-10">
        <h3 className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4 mb-4">Account Status</h3>
        <div className={`bg-[var(--bg-card)] border-2 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-500 ${isPremium ? 'border-[#ff00c8]/30 shadow-[#ff00c8]/5' : 'border-[var(--border)]'}`}>
           {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff00c8]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>}
           
           <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl border ${isPremium ? 'bg-gradient-to-br from-[#ff00c8] to-[#7700ff] border-[#ff00c8]/20 text-white' : 'bg-[#151520] border-[var(--border)] text-gray-600'}`}>
                <i className={`fas ${isPremium ? 'fa-crown' : 'fa-user-secret'}`}></i>
              </div>
              <div className="flex-1">
                 <h2 className="text-xl font-black tracking-tighter uppercase text-[var(--text-primary)]">
                   {isPremium ? user.premium_plan : 'Standard Access (Free)'}
                 </h2>
                 <div className="flex items-center gap-3 mt-1.5">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-[#ff00c8]' : 'text-gray-500'}`}>
                     {isPremium ? 'Premium Active' : 'Limited Access'}
                   </span>
                   {isPremium && <span className="w-1 h-1 rounded-full bg-gray-500 opacity-30"></span>}
                   {isPremium && <span className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-50">Verified Dev</span>}
                 </div>
              </div>
           </div>

           {isPremium && daysRemaining !== null ? (
             <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-[#151520] p-4 rounded-2xl border border-[var(--border)]/50">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Status</p>
                  <p className="text-xs font-black uppercase text-[#00ff9d]">Online</p>
                </div>
                <div className="bg-[#151520] p-4 rounded-2xl border border-[var(--border)]/50">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Time Remaining</p>
                  <p className="text-xs font-black uppercase text-[#ff00c8]">{daysRemaining} Days Left</p>
                </div>
             </div>
           ) : !isPremium && (
             <div className="mt-8 bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                <i className="fas fa-info-circle text-yellow-500 text-sm"></i>
                <p className="text-[10px] font-bold uppercase text-white/60 tracking-tight leading-relaxed">Upgrade to unlock all pro agents and infinite time.</p>
             </div>
           )}
        </div>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter shrink-0">Studio <span className="text-[var(--accent)]">Plans</span></h1>
        <div className="h-[1px] flex-1 bg-[var(--border)] opacity-30"></div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex bg-[var(--bg-secondary)] p-2 rounded-2xl border border-[var(--border)] mb-10">
        <button onClick={() => setActiveTab('cheap')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'cheap' ? 'bg-[var(--accent)] text-black shadow-lg' : 'text-gray-500'}`}>Cheap</button>
        <button onClick={() => setActiveTab('standard')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'standard' ? 'bg-[var(--accent)] text-black shadow-lg' : 'text-gray-500'}`}>Standard</button>
        <button onClick={() => setActiveTab('ultra')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ultra' ? 'bg-[var(--accent)] text-black shadow-lg' : 'text-gray-500'}`}>Ultra Pro</button>
      </div>

      {message && (
        <div className={`p-5 rounded-2xl mb-8 text-[10px] font-black uppercase text-center border animate-in slide-in-from-top ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 opacity-20"><i className="fas fa-spinner fa-spin text-3xl"></i></div>
        ) : (
          filteredPlans.map(plan => {
            const isUltra = activeTab === 'ultra';
            const isStandard = activeTab === 'standard';
            const accent = isUltra ? '#ff00c8' : isStandard ? '#00f2ff' : '#00ff9d';
            
            return (
              <div key={plan.id} className="bg-[var(--bg-card)] rounded-[2.5rem] p-7 border border-[var(--border)] relative overflow-hidden group hover:border-white/20 transition-all active:scale-[0.98]">
                {isUltra && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00c8] to-transparent animate-pulse"></div>}
                
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">{plan.plan_name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tighter" style={{ color: accent }}>₹{plan.price}</span>
                        <span className="text-[8px] font-bold text-secondary uppercase opacity-40">{plan.duration_days} Days Access</span>
                      </div>
                   </div>
                   <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center border border-[var(--border)] text-lg" style={{ color: accent }}>
                      <i className={`fas ${isUltra ? 'fa-crown' : isStandard ? 'fa-gem' : 'fa-bolt'}`}></i>
                   </div>
                </div>

                <div className="space-y-2.5 mb-8">
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{b}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 opacity-60 border-t border-white/5 pt-2 mt-2">
                      <i className="fas fa-check-circle text-[8px]" style={{ color: accent }}></i>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">Full Pro Access</span>
                  </div>
                </div>

                <button onClick={() => setSelectedPlan(plan)} className="w-full py-5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95" style={{ backgroundColor: accent, color: '#000' }}>
                   Unlock Now
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Premium;
