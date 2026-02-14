
import React, { useEffect, useRef } from 'react';
import { User } from '../types';

interface AdBannerProps {
  user?: User | null;
}

const AdBanner: React.FC<AdBannerProps> = ({ user }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const scriptsInjected = useRef(false);

  // Safety: If user is premium, render absolutely nothing
  if (user?.premium) {
    return null;
  }

  useEffect(() => {
    // Double check inside useEffect just in case of race conditions
    if (user?.premium) return;

    if (bannerRef.current && !scriptsInjected.current) {
      // Clear previous content if any
      bannerRef.current.innerHTML = '';
      
      // 1. Original 728x90 Banner Ad Integration
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : '2f1c0e84be141656c8ee986596066a27',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/2f1c0e84be141656c8ee986596066a27/invoke.js';
      invokeScript.async = true;

      // Append banner scripts to local container ref
      bannerRef.current.appendChild(configScript);
      bannerRef.current.appendChild(invokeScript);

      scriptsInjected.current = true;
    }
  }, [user]);

  return (
    <div className="w-full overflow-hidden flex flex-col items-center py-4 bg-[var(--bg-primary)] border-y border-dashed border-[var(--border)]/20">
      <p className="text-[8px] font-black uppercase text-gray-500 tracking-[0.3em] mb-2">Sponsored Developer Content</p>
      <div className="ad-container-wrapper flex justify-center w-full">
        {/* Responsive scaling to fit the standard 728px width into mobile layouts */}
        <div 
          ref={bannerRef} 
          className="ad-scaling-container origin-center transform scale-[0.45] sm:scale-[0.6] md:scale-100"
          style={{ width: '728px', height: '90px' }}
        >
          {/* Adsterra iframe will be injected here */}
        </div>
      </div>
      <p className="text-[7px] text-gray-600 mt-1 uppercase font-bold tracking-widest">Upgrade to PRO to disable advertisements</p>
    </div>
  );
};

export default AdBanner;
