
import React from 'react';
import { User } from '../types';

interface ToolsProps {
  onStartChat: (tool: string) => void;
  user: User | null;
}

const Tools: React.FC<ToolsProps> = ({ onStartChat, user }) => {
  const isPremium = !!user?.premium;

  const tools = [
    {
      id: 'prompt',
      name: 'Prompt Generator',
      category: 'Development',
      desc: 'Generate professional prompts for app & game development with structured workflow and refined logic.',
      icon: 'fa-keyboard',
      proOnly: false
    },
    {
      id: 'html',
      name: 'HTML Generator',
      category: 'Development',
      desc: 'Generate complete HTML5 apps with Firebase integration and modern UI.',
      icon: 'fa-code',
      proOnly: false
    },
    {
        id: 'custom',
        name: 'Custom Pro AI',
        category: 'Advanced',
        desc: 'Special premium agent where you can set custom instructions to strictly define behavior.',
        icon: 'fa-user-gear',
        proOnly: true
    },
    {
        id: 'pro_dev',
        name: 'Pro AI Developer',
        category: 'Advanced',
        desc: 'A premium-only agent that is 2X smarter and faster at writing complex code and logic than the standard version.',
        icon: 'fa-laptop-code',
        proOnly: true
    }
  ];

  return (
    <div className="p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">AI Suite</h1>
        <p className="text-secondary text-sm">Professional development workspace</p>
      </div>

      <div className="space-y-6">
        {tools.map((tool) => {
          const locked = tool.proOnly && !isPremium;
          return (
            <div key={tool.id} className={`bg-[#1a1a2e] rounded-[2rem] p-6 border transition-all relative overflow-hidden ${locked ? 'opacity-70 border-[#2a2a3e] grayscale' : 'border-[#2a2a3e] hover:border-[#00ff9d]'}`}>
              {tool.proOnly && (
                <div className="absolute top-0 right-0 bg-[#7700ff] text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase">PRO Agent</div>
              )}
              
              <div className="flex gap-4 mb-4 items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${tool.id === 'custom' ? 'bg-gradient-to-br from-[#00f2ff] to-[#bf00ff]' : tool.proOnly ? 'bg-gradient-to-br from-[#7700ff] to-[#ff00c8]' : 'bg-gradient-to-br from-[#00ff9d] to-[#7700ff]'}`}>
                  <i className={`fas ${tool.icon} text-xl text-white`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black leading-tight">{tool.name}</h3>
                  <span className="text-[9px] bg-[#151520] text-secondary px-2 py-0.5 rounded-full uppercase font-bold tracking-widest border border-[#2a2a3e]">
                    {tool.category}
                  </span>
                </div>
              </div>
              
              <p className="text-[#b0b0d0] text-xs leading-relaxed mb-6 px-1">
                {tool.desc}
              </p>

              <div className="flex justify-between items-center">
                <div className={`px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${locked ? 'bg-red-500/10 text-red-500 border-red-500/20' : tool.proOnly ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                    {locked ? 'Locked' : tool.proOnly ? 'Premium Unlocked' : 'Free Access'}
                </div>
                
                <button 
                  onClick={() => locked ? alert("Upgrade to Premium for this agent!") : onStartChat(tool.name)}
                  className={`py-3 px-8 rounded-xl text-xs font-black active:scale-95 transition-all shadow-lg ${locked ? 'bg-[#2a2a3e] text-gray-500' : tool.proOnly ? 'bg-[#7700ff] text-white' : 'bg-[#00ff9d] text-black'}`}
                >
                  {locked ? 'Upgrade Now' : 'Launch Agent'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tools;
