import React from 'react';

export default function RelevantToYourTripRail({ posts, userTrips }) {
  // Find the first upcoming trip
  const upcomingTrip = userTrips?.find(t => new Date(t.start_date) > new Date() && !t.is_past);
  
  if (!upcomingTrip) return null;

  // Assuming the trip has a destination or name we can loosely match. 
  // In a real app we'd match by city ID, but for the hackathon we'll loosely text match the trip name/destination against post content or city name.
  const tripKeyword = upcomingTrip.name.split(' ')[0] || '';
  
  const relevantPosts = posts.filter(p => {
    const pText = `${p.title} ${p.content} ${p.city?.name}`.toLowerCase();
    return pText.includes(tripKeyword.toLowerCase());
  }).slice(0, 5); // take up to 5

  if (relevantPosts.length === 0) return null;

  return (
    <div className="mb-[32px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-[12px]">
        <h3 className="font-['Fraunces'] text-[16px] font-semibold text-ink flex items-center gap-[8px]">
          <span className="text-[18px]">✨</span>
          Relevant to your upcoming trip to {tripKeyword}
        </h3>
      </div>
      
      <div className="flex gap-[16px] overflow-x-auto custom-scrollbar pb-[12px]">
        {relevantPosts.map(post => (
          <div key={post.id} className="min-w-[280px] max-w-[280px] bg-surface border border-border rounded-[12px] p-[16px] shadow-sm flex flex-col cursor-pointer hover:border-horizon transition-colors">
            <div className="flex items-center gap-[8px] mb-[8px]">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[4px] ${
                post.post_type === 'question' ? 'bg-horizon/10 text-horizon' : 
                post.post_type === 'recap' ? 'bg-route/10 text-route' : 'bg-success/10 text-success'
              }`}>
                {post.post_type}
              </span>
              <span className="text-[11px] text-muted font-['IBM_Plex_Mono']">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <h4 className="font-['Fraunces'] font-semibold text-[15px] text-ink line-clamp-2 mb-[4px] leading-snug">
              {post.title}
            </h4>
            <p className="text-[13px] text-muted line-clamp-2 mb-[12px]">
              {post.content}
            </p>
            <div className="mt-auto flex items-center gap-[8px]">
               {post.author?.avatar_url ? (
                <img src={post.author.avatar_url} alt="" className="w-[20px] h-[20px] rounded-full object-cover" />
              ) : (
                <div className="w-[20px] h-[20px] rounded-full bg-muted/20 flex items-center justify-center font-bold text-muted text-[10px]">
                  {(post.author?.display_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[12px] font-medium text-ink truncate">{post.author?.display_name || 'Anonymous'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
