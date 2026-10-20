import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function QuickAskComposer({ onCreatePost }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('question');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="bg-surface border border-border rounded-[12px] p-[20px] shadow-sm mb-[24px] text-center">
        <p className="text-[14px] text-muted">Log in to ask questions and share tips with the community.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreatePost({
        user_id: user.id,
        post_type: postType,
        title,
        content
        // Note: For hackathon simplicity, we aren't linking city/activity dropdowns in the quick composer yet,
        // but those could easily be added here later.
      });
      setTitle('');
      setContent('');
      setIsExpanded(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[12px] shadow-sm mb-[24px] overflow-hidden transition-all duration-300">
      {!isExpanded ? (
        <div 
          onClick={() => setIsExpanded(true)}
          className="p-[16px] flex items-center gap-[12px] cursor-text group"
        >
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-[32px] h-[32px] rounded-full bg-horizon/20 flex items-center justify-center font-bold text-horizon text-[14px] shrink-0">
              {(user.user_metadata?.display_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[15px] text-muted group-hover:text-ink transition-colors">
            Ask something about your upcoming trip, or share a tip...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-[20px] flex flex-col gap-[16px]">
          <div className="flex items-center gap-[12px] mb-[8px]">
            <span className="text-[13px] font-medium text-muted">Post Type:</span>
            <div className="flex bg-bg rounded-[8px] p-[4px] border border-border">
              {['question', 'recap', 'tip'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`px-[12px] py-[6px] rounded-[6px] text-[12px] font-bold uppercase tracking-wider transition-colors ${
                    postType === type 
                      ? type === 'question' ? 'bg-horizon text-white' : type === 'recap' ? 'bg-route text-white' : 'bg-success text-white'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {type === 'question' ? '❓ Question' : type === 'recap' ? '📝 Recap' : '💡 Tip'}
                </button>
              ))}
            </div>
          </div>

          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={postType === 'question' ? "What do you want to ask?" : "Give your post a title..."}
            className="w-full bg-transparent border-b border-border pb-[8px] text-[20px] font-['Fraunces'] font-semibold text-ink focus:outline-none focus:border-horizon placeholder:text-muted/50"
            autoFocus
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add details, context, or your experience..."
            className="w-full bg-bg border border-border rounded-[8px] p-[12px] text-[14px] text-ink focus:outline-none focus:border-horizon resize-none min-h-[100px]"
          />

          <div className="flex justify-end gap-[12px] pt-[8px] border-t border-border">
            <button 
              type="button"
              onClick={() => { setIsExpanded(false); setTitle(''); setContent(''); }}
              className="px-[16px] py-[8px] rounded-[6px] text-[13px] font-medium text-ink hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-[20px] py-[8px] bg-horizon text-white rounded-[6px] text-[13px] font-medium hover:bg-horizon/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post to Community'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
