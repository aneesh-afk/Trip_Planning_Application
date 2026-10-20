import React, { useState } from 'react';

export default function ProfileHeader({ user, totalTrips, countriesVisited }) {
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Dummy data for visual completion
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : '2024';
  const bio = "Wandering the world one coffee shop at a time.";
  
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'G';
  
  return (
    <div className="bg-surface border border-border rounded-[16px] p-[24px] lg:p-[32px] flex flex-col md:flex-row items-center gap-[24px] md:gap-[32px] mb-[40px] shadow-sm">
      {/* Avatar Container with Map-pin trail concept */}
      <div className="relative shrink-0">
        <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-route/10 border-[4px] border-surface shadow-[0_0_0_2px_#E3D5CA] flex items-center justify-center overflow-hidden z-10 relative">
           <span className="font-['Fraunces'] font-bold text-[40px] md:text-[48px] text-route">{initial}</span>
        </div>
        {/* Decorative map pins (simulated trail) */}
        <div className="absolute -top-[5px] -right-[5px] w-[24px] h-[24px] bg-bg rounded-full flex items-center justify-center border border-border shadow-sm z-20">📍</div>
        <div className="absolute bottom-[10px] -left-[10px] w-[20px] h-[20px] bg-bg rounded-full flex items-center justify-center border border-border shadow-sm z-20 text-[10px]">✈️</div>
      </div>
      
      {/* User Info */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="font-['Fraunces'] text-[28px] md:text-[32px] font-semibold text-ink leading-tight mb-[4px]">
          {user?.email?.split('@')[0] || 'Traveler'}
        </h1>
        <p className="text-[15px] text-muted mb-[16px] max-w-[400px] mx-auto md:mx-0">
          {bio}
        </p>
        
        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-[16px] font-['IBM_Plex_Mono'] text-[12px] text-muted">
           <div className="flex items-center gap-[6px]">
             <span className="font-bold text-ink text-[14px]">{totalTrips}</span> trips
           </div>
           <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
           <div className="flex items-center gap-[6px]">
             <span className="font-bold text-ink text-[14px]">{countriesVisited}</span> countries visited
           </div>
           <span className="w-[4px] h-[4px] rounded-full bg-border"></span>
           <div>Member since {memberSince}</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="shrink-0 mt-[16px] md:mt-0">
        <button 
          onClick={() => setShowEditModal(true)}
          className="px-[20px] py-[10px] rounded-[12px] bg-bg border border-border font-medium text-[14px] text-ink hover:border-route transition-colors shadow-sm"
        >
          Edit Profile
        </button>
      </div>

      {/* Edit Modal Stub */}
      {showEditModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-[20px]">
          <div className="bg-surface border border-border rounded-[16px] w-full max-w-[400px] p-[24px] shadow-2xl">
            <div className="flex justify-between items-center mb-[24px]">
               <h3 className="font-['Fraunces'] text-[22px] font-semibold text-ink">Edit Profile</h3>
               <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-ink">
                 <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px] stroke-currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>
            
            <div className="space-y-[16px]">
              <div>
                <label className="block text-[12px] font-medium text-muted uppercase tracking-[0.5px] mb-[6px]">Display Name</label>
                <input type="text" defaultValue={user?.email?.split('@')[0]} className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted uppercase tracking-[0.5px] mb-[6px]">Bio</label>
                <textarea rows="3" defaultValue={bio} className="w-full bg-bg border border-border rounded-[8px] px-[12px] py-[10px] text-[14px] text-ink focus:border-route outline-none transition-colors resize-none"></textarea>
              </div>
            </div>
            
            <div className="mt-[32px] flex justify-end gap-[12px]">
              <button onClick={() => setShowEditModal(false)} className="px-[16px] py-[10px] rounded-[8px] font-medium text-[14px] text-muted hover:text-ink">Cancel</button>
              <button onClick={() => setShowEditModal(false)} className="px-[16px] py-[10px] rounded-[8px] font-medium text-[14px] bg-route text-white hover:opacity-90 shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
