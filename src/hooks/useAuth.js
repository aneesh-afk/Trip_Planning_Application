import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const getStoredUser = () => {
    try {
      const demo = localStorage.getItem("gt_demo_session");
      if (demo) return JSON.parse(demo);
    } catch {}
    return null;
  };

  const [session, setSession] = useState(() => {
    const u = getStoredUser();
    return u ? { user: u } : null;
  });
  const [loading, setLoading] = useState(() => !getStoredUser());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        setSession(currentSession);
      } else {
        const u = getStoredUser();
        setSession(u ? { user: u } : null);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (currentSession) {
          setSession(currentSession);
        } else {
          try {
            const demo = localStorage.getItem("gt_demo_session");
            setSession(demo ? { user: JSON.parse(demo) } : null);
          } catch {
            setSession(null);
          }
        }
      }
    );

    const handleStorage = () => {
      try {
        const demo = localStorage.getItem("gt_demo_session");
        if (demo) setSession({ user: JSON.parse(demo) });
      } catch {}
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
