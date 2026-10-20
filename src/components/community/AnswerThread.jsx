import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AnswerThread({ postId, comments, onAnswer }) {
  const { user } = useAuth();
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onAnswer(postId, newAnswer);
      setNewAnswer('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Existing Comments */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-[12px]">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-[12px] bg-bg rounded-[8px] p-[12px] border border-border/50">
              {comment.author?.avatar_url ? (
                <img src={comment.author.avatar_url} alt="" className="w-[24px] h-[24px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[24px] h-[24px] rounded-full bg-muted/20 flex items-center justify-center font-bold text-muted text-[10px] shrink-0">
                  {(comment.author?.display_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <span className="font-semibold text-[13px] text-ink">{comment.author?.display_name || 'Anonymous'}</span>
                  <span className="text-[11px] text-muted font-['IBM_Plex_Mono']">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {comment.is_accepted_answer && (
                    <span className="px-[6px] py-[2px] bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-[4px] ml-auto">
                      Accepted Answer
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted italic">No answers yet. Be the first to help out!</p>
      )}

      {/* Reply Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col items-end gap-[8px] mt-[8px]">
          <textarea 
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write a helpful answer..."
            className="w-full bg-bg border border-border rounded-[8px] p-[12px] text-[14px] text-ink focus:outline-none focus:border-horizon resize-none h-[80px]"
          />
          <button 
            type="submit"
            disabled={!newAnswer.trim() || isSubmitting}
            className="px-[16px] py-[8px] bg-horizon text-white rounded-[6px] text-[13px] font-medium hover:bg-horizon/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Answer'}
          </button>
        </form>
      ) : (
        <div className="text-[13px] text-muted bg-bg border border-border rounded-[8px] p-[12px] text-center mt-[8px]">
          Please log in to answer this question.
        </div>
      )}
    </div>
  );
}
