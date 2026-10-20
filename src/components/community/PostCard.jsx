import React, { useState } from 'react';
import AnswerThread from './AnswerThread';
import { useAuth } from '../../hooks/useAuth';

export default function PostCard({ post, onUpvote, onAnswer }) {
  const { user } = useAuth();
  const [showThread, setShowThread] = useState(false);

  // Distinct styles based on post type
  const styles = {
    question: { border: 'border-l-[4px] border-horizon', icon: '❓', bg: 'bg-horizon/5', text: 'text-horizon' },
    recap: { border: 'border-l-[4px] border-route', icon: '📝', bg: 'bg-route/5', text: 'text-route' },
    tip: { border: 'border-l-[4px] border-success', icon: '💡', bg: 'bg-success/5', text: 'text-success' },
  };

  const style = styles[post.post_type] || styles.recap;

  return (
    <div className={`bg-surface border border-border rounded-[12px] p-[20px] shadow-sm mb-[16px] ${style.border}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div className="flex items-center gap-[12px]">
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} alt="" className="w-[40px] h-[40px] rounded-full object-cover" />
          ) : (
            <div className="w-[40px] h-[40px] rounded-full bg-muted/20 flex items-center justify-center font-bold text-muted text-[14px]">
              {(post.author?.display_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-[8px]">
              <span className="font-['Fraunces'] font-semibold text-[16px] text-ink">{post.author?.display_name || 'Anonymous'}</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[4px] ${style.bg} ${style.text}`}>
                {style.icon} {post.post_type}
              </span>
            </div>
            <div className="flex items-center gap-[6px] text-[12px] text-muted font-['IBM_Plex_Mono']">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              {/* Trust Signal (Mocked logic for demo) */}
              <span className="w-[3px] h-[3px] bg-muted rounded-full"></span>
              <span className="text-success font-medium flex items-center gap-[4px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[12px] h-[12px]"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Visited {post.city?.name || 'recently'}
              </span>
            </div>
          </div>
        </div>
        
        <button className="text-muted hover:text-ink p-[4px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>

      {/* Content */}
      <div className="mb-[16px]">
        <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[8px] leading-snug">
          {post.title}
        </h3>
        <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Context Tags (Destination / Activity) */}
      <div className="flex flex-wrap items-center gap-[8px] mb-[16px]">
        {post.city && (
          <span className="px-[10px] py-[4px] bg-bg border border-border rounded-full text-[13px] text-ink flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[14px] h-[14px] text-route"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {post.city.name}
          </span>
        )}
        {post.activity && (
          <div className="flex items-center gap-[8px]">
            <span className="px-[10px] py-[4px] bg-bg border border-border rounded-full text-[13px] text-ink flex items-center gap-[4px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[14px] h-[14px] text-horizon"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 9.36l-7.1 7.1a1 1 0 01-1.41-1.41l7.1-7.1a6 6 0 019.36-7.94l-3.77 3.77a1 1 0 000 1.41z"/></svg>
              {post.activity.name}
            </span>
            {user && (
              <button className="px-[8px] py-[4px] bg-horizon text-white rounded-full text-[12px] font-medium flex items-center gap-[4px] hover:bg-horizon/90 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[12px] h-[12px]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Trip
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-[16px] border-t border-border pt-[12px]">
        <button 
          onClick={() => onUpvote(post.id, post.upvotes)}
          className="flex items-center gap-[6px] text-muted hover:text-route transition-colors text-[13px] font-medium"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
          {post.upvotes || 0} Helpful
        </button>

        {post.post_type === 'question' && (
          <button 
            onClick={() => setShowThread(!showThread)}
            className="flex items-center gap-[6px] text-muted hover:text-horizon transition-colors text-[13px] font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px]"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            {post.comments?.length || 0} Answers
          </button>
        )}
      </div>

      {/* Answer Thread (Collapsible) */}
      {showThread && post.post_type === 'question' && (
        <div className="mt-[16px] pt-[16px] border-t border-border">
          <AnswerThread postId={post.id} comments={post.comments || []} onAnswer={onAnswer} />
        </div>
      )}
    </div>
  );
}
