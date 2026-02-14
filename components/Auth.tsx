
import React, { useState } from 'react';
import { FIREBASE_CONFIG } from '../constants';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${FIREBASE_CONFIG.databaseURL}/users.json`);
      const usersData = await res.json() || {};

      if (isLogin) {
        let foundUser: User | null = null;
        for (const uid in usersData) {
          if (usersData[uid].email === formData.email && usersData[uid].password === formData.password) {
            foundUser = { ...usersData[uid], uid };
            break;
          }
        }

        if (foundUser) {
          await fetch(`${FIREBASE_CONFIG.databaseURL}/users/${foundUser.uid}/last_login.json`, {
            method: 'PUT', body: JSON.stringify(new Date().toISOString())
          });
          onAuthSuccess(foundUser);
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        for (const uid in usersData) {
          if (usersData[uid].email === formData.email) {
            setError('Email already exists');
            setLoading(false);
            return;
          }
        }

        const newUser: Omit<User, 'uid'> = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          premium: false,
          remaining_ai_seconds: 600,
          premium_expiry_date: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          total_usage_time: 0,
          app_version: "1.0.0"
        };

        const pushRes = await fetch(`${FIREBASE_CONFIG.databaseURL}/users.json`, {
          method: 'POST', body: JSON.stringify(newUser)
        });
        const pushData = await pushRes.json();
        onAuthSuccess({ ...newUser, uid: pushData.name });
      }
    } catch (err) {
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0a0a0f] p-8 justify-center">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-br from-[#00ff9d] to-[#7700ff] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-robot text-4xl text-white"></i>
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Dev <span className="text-[#00ff9d]">Studio</span></h1>
      </div>

      <div className="bg-[#151520] p-6 rounded-2xl border border-[#2a2a3e]">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg font-bold ${isLogin ? 'bg-[#00ff9d] text-black' : 'text-gray-500'}`}>LOGIN</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg font-bold ${!isLogin ? 'bg-[#00ff9d] text-black' : 'text-gray-500'}`}>SIGN UP</button>
        </div>

        {error && <div className="mb-4 text-red-500 text-xs text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Username" required className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm outline-none focus:border-[#00ff9d]"
              value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          )}
          <input type="email" placeholder="Email" required className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm outline-none focus:border-[#00ff9d]"
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input type="password" placeholder="Password" required className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm outline-none focus:border-[#00ff9d]"
            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          {!isLogin && (
            <input type="password" placeholder="Confirm Password" required className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm outline-none focus:border-[#00ff9d]"
              value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#00ff9d] text-black font-bold py-4 rounded-xl mt-4">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isLogin ? 'LOGIN' : 'SIGN UP')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
