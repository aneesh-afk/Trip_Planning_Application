import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCommunityPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('community_posts').select(`
        *,
        author:users!user_id (id, display_name, avatar_url),
        city:cities (id, name, country, image_url),
        activity:activities (id, name, category),
        comments:community_comments (
          id, content, upvotes, created_at, is_accepted_answer,
          author:users!user_id (id, display_name, avatar_url)
        )
      `);

      if (filters.postType) {
        query = query.eq('post_type', filters.postType);
      }
      if (filters.cityId) {
        query = query.eq('destination_city_id', filters.cityId);
      }
      if (filters.activityCategory) {
        // Since activity is a relation, Supabase PostgREST might require an inner join to filter by it easily.
        // For hackathon simplicity, we might fetch all and filter in JS if the DB doesn't support deep filtering without views.
      }

      // Default sort
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      // Local JS filters for things that are harder in raw PostgREST without views
      let result = data || [];
      
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(p => 
          p.title?.toLowerCase().includes(q) || 
          p.content?.toLowerCase().includes(q) ||
          p.city?.name?.toLowerCase().includes(q) ||
          p.activity?.name?.toLowerCase().includes(q)
        );
      }

      if (filters.activityCategory) {
        result = result.filter(p => p.activity?.category === filters.activityCategory);
      }

      // Sort By Helpfulness (upvotes)
      if (filters.sortBy === 'helpful') {
        result.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      }

      setPosts(result);
    } catch (err) {
      console.error("Error fetching community posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = async (postData) => {
    const { data, error: err } = await supabase.from('community_posts').insert([postData]).select();
    if (err) throw err;
    return data[0];
  };

  const createComment = async (commentData) => {
    const { data, error: err } = await supabase.from('community_comments').insert([commentData]).select();
    if (err) throw err;
    return data[0];
  };

  const toggleUpvote = async (postId, currentUpvotes) => {
    const { error: err } = await supabase
      .from('community_posts')
      .update({ upvotes: currentUpvotes + 1 })
      .eq('id', postId);
    if (err) throw err;
  };

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    createComment,
    toggleUpvote
  };
}
