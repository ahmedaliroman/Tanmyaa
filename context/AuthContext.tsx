import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deductCredits: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        // If profile doesn't exist, create one with 100 credits
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            { id: userId, email: email, credits: 100 }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Retry fetch if insert failed (might be race condition or trigger)
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (retryData) {
             // If we found it now, ensure it has credits
             if (retryData.credits < 100) {
                 await supabase.from('profiles').update({ credits: 100 }).eq('id', userId);
                 retryData.credits = 100;
             }
             setProfile(retryData);
          }
        } else {
          setProfile(newProfile);
        }
      } else {
        // Ensure every user has at least 100 credits (Welcome Bonus / Free Tier)
        // This covers both new users who might have been created with 0, and existing users.
        if (data.credits < 100) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: 100 })
                .eq('id', userId);
            
            if (!updateError) {
                data.credits = 100;
            }
        }
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.credits < amount) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - amount })
      .eq('id', user.id);

    if (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, credits: prev.credits - amount } : null);
    return true;
  };

  const addCredits = async (amount: number): Promise<void> => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: profile.credits + amount })
      .eq('id', user.id);

    if (error) {
      console.error('Error adding credits:', error);
    } else {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, credits: prev.credits + amount } : null);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signInWithGoogle, signOut, refreshProfile, deductCredits, addCredits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
