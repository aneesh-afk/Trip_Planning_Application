import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCommunityPosts } from '../hooks/useCommunityPosts';
import { useTrips } from '../hooks/useTrips';
import CommunityHeader from '../components/community/CommunityHeader';
import RelevantToYourTripRail from '../components/community/RelevantToYourTripRail';
import QuickAskComposer from '../components/community/QuickAskComposer';
import PostCard from '../components/community/PostCard';

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data Hooks
  const { posts, loading, error, fetchPosts, createPost, createComment, toggleUpvote } = useCommunityPosts();
  const { trips: userTrips } = useTrips(); // For "Relevant to your trip"

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts({
      searchQuery,
      postType: postTypeFilter,
      sortBy
    });
  }, [fetchPosts, searchQuery, postTypeFilter, sortBy]);

  const handleUpvote = async (postId, currentUpvotes) => {
    if (!user) return navigate('/login');
    try {
      await toggleUpvote(postId, currentUpvotes);
      // Optimistic refetch or local state update would be better, but refetching for simplicity
      fetchPosts({ searchQuery, postType: postTypeFilter, sortBy });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswer = async (postId, content) => {
    if (!user) return navigate('/login');
    await createComment({
      post_id: postId,
      user_id: user.id,
      content
    });
    fetchPosts({ searchQuery, postType: postTypeFilter, sortBy });
  };

  const handleCreatePost = async (postData) => {
    await createPost(postData);
    fetchPosts({ searchQuery, postType: postTypeFilter, sortBy });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top App Bar - Simple version for Community */}
      <header className="h-[64px] bg-surface border-b border-border px-[24px] flex items-center justify-between z-20">
        <div className="flex items-center gap-[12px] cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-[32px] h-[32px] rounded-full bg-route/10 flex items-center justify-center">
            <span className="font-['Fraunces'] font-bold text-route text-[16px]">G</span>
          </div>
          <div className="font-['Fraunces'] font-semibold text-[20px] text-ink">
            GlobeTrotter Community
          </div>
        </div>
        <div className="flex items-center gap-[16px]">
           <button onClick={() => navigate('/dashboard')} className="text-[13px] font-medium text-muted hover:text-ink">Back to Dashboard</button>
        </div>
      </header>

      {/* Unified Search & Filters */}
      <CommunityHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        postTypeFilter={postTypeFilter}
        setPostTypeFilter={setPostTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Main Feed Container */}
      <main className="flex-1 w-full max-w-[800px] mx-auto p-[24px]">
        
        {/* Relevant Rail (Only shows if user has upcoming trips and there are matching posts) */}
        {user && !searchQuery && !postTypeFilter && (
          <RelevantToYourTripRail posts={posts} userTrips={userTrips} />
        )}

        {/* Quick Ask Composer */}
        <QuickAskComposer onCreatePost={handleCreatePost} />

        {/* Post Feed */}
        <div className="flex flex-col">
          {loading ? (
            <div className="flex justify-center py-[40px] text-muted font-['IBM_Plex_Mono']">
              Loading posts...
            </div>
          ) : error ? (
            <div className="p-[16px] bg-danger/10 text-danger border border-danger/20 rounded-[12px]">
              Error loading community feed: {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[60px] text-center bg-surface border border-border rounded-[16px]">
              <div className="w-[64px] h-[64px] bg-bg rounded-full flex items-center justify-center text-[24px] mb-[16px]">
                🏜️
              </div>
              <h3 className="font-['Fraunces'] text-[20px] font-semibold text-ink mb-[8px]">No posts found</h3>
              <p className="text-[14px] text-muted max-w-[300px]">
                {searchQuery 
                  ? "We couldn't find anything matching your search. Try adjusting your filters or ask the community directly!"
                  : "Be the first to ask a question or share a travel tip!"}
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onUpvote={handleUpvote}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
