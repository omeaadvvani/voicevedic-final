import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  pin_hash: string;
  calendar_tradition: string;
  preferred_language: string;
  selected_rituals: string[];
  notification_time: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[useAuth] Fetching initial session...');
        
        // Add timeout to prevent hanging (increased from 8s to 20s for better reliability)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Authentication timeout')), 20000);
        });
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
        setSession(session);
        setUser(session?.user ?? null);
        console.log('[useAuth] Session:', session);
        
        if (session?.user) {
          console.log('[useAuth] Fetching user profile for user:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[useAuth] No user in session.');
        }
      } catch (error) {
        console.error('[useAuth] Error getting initial session:', error);
        // Don't show timeout errors to users as they're usually temporary
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn('[useAuth] Authentication timeout - this is usually temporary');
          setError(null); // Don't show timeout errors to user
        } else {
          setError(error instanceof Error ? error.message : 'Authentication failed');
        }
        // Set loading to false even on error to prevent infinite loading
        setLoading(false);
      } finally {
        setLoading(false);
        console.log('[useAuth] Initial session fetch complete. Loading:', false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session);
        setLoading(true);
        setError(null);
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('[useAuth] Fetching user profile for user:', session.user.id);
            await fetchUserProfile(session.user.id);
          } else {
            setUserProfile(null);
            console.log('[useAuth] No user in session after auth change.');
          }
        } catch (error) {
          console.error('[useAuth] Error handling auth state change:', error);
          setError(error instanceof Error ? error.message : 'Authentication state change failed');
        } finally {
          setLoading(false);
          console.log('[useAuth] Auth state change complete. Loading:', false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching user profile from Supabase for user:', userId);
      
      // Add timeout to profile fetch (increased from 5s to 15s for better reliability)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000);
      });
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as { data: UserProfile | null; error: unknown };

      if (error) {
        console.error('[useAuth] Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
      console.log('[useAuth] User profile data:', data);
    } catch (error) {
      console.error('[useAuth] Error fetching user profile:', error);
      // Don't set error here as profile fetch failure shouldn't block auth
    }
  };

  const signUp = async (email: string, pin: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create auth user with email and PIN as password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pin,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (authError) throw authError;

      // Note: We don't create user_profiles here anymore
      // The preferences will be saved separately after sign-up

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Sign up failed');
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pin: string) => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with email and PIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pin
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        // Don't throw error - still proceed with local cleanup
      }
      
      // Clear local state regardless of Supabase response
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Even if there's an error, clear local state for UX
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchUserProfile(user.id);
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchUserProfile
  };
};