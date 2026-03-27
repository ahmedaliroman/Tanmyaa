import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  credits: number;
  plan: string;
  paypal_subscription_id?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  total_credits_used?: number;
  referral_code?: string;
  invited_by?: string;
  branding_logo?: string;
  branding_colors?: string;
  branding_template?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deductCredits: (amount: number, description?: string, fileUrl?: string, type?: string) => Promise<boolean>;
  addCredits: (amount: number, planName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const fetchingRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    if (fetchingRef.current === userId && profile) return;
    fetchingRef.current = userId;
    
    setAuthError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        if (error) {
            console.error('Error fetching profile:', error);
            setAuthError(`Failed to fetch profile: ${error.message}. Ensure the "profiles" table exists.`);
        }
        
        // Check for referral code
        const referralCode = localStorage.getItem('referral_code');
        let invitedBy = null;
        
        if (referralCode) {
            const { data: inviter } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode)
                .maybeSingle();
            
            if (inviter) {
                invitedBy = inviter.id;
            }
        }

        // Generate unique referral code
        const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // If profile doesn't exist, create one with 100 credits
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert([
            { 
              id: userId, 
              email: email, 
              credits: 100, 
              plan: 'Free', 
              invited_by: invitedBy,
              referral_code: newReferralCode
            }
          ], { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          setAuthError(`Failed to create profile: ${createError.message}. Ensure the "profiles" table exists and RLS is configured.`);
          // Retry fetch if insert failed (might be race condition or trigger)
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (retryData) {
             setProfile(retryData);
          }
        } else {
          setProfile(newProfile);
          if (referralCode) localStorage.removeItem('referral_code');
        }
      } else {
        // If user exists but has no referral code, generate one
        if (!data.referral_code) {
          const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update({ referral_code: newReferralCode })
            .eq('id', userId)
            .select()
            .single();
          
          if (!updateError && updatedData) {
            data.referral_code = updatedData.referral_code;
          }
        }

        // ONE-TIME FIX: If a user has a Pro/Business plan but 0 credits and hasn't used any, they encountered the NaN bug.
        if (data.plan === 'Pro' && (data.credits === 0 || data.credits == null) && (data.total_credits_used === 0 || data.total_credits_used == null)) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: 600 })
                .eq('id', userId);
            
            if (!updateError) {
                data.credits = 600;
            }
        } else if (data.plan === 'Business' && (data.credits === 0 || data.credits == null) && (data.total_credits_used === 0 || data.total_credits_used == null)) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: 3000 })
                .eq('id', userId);
            
            if (!updateError) {
                data.credits = 3000;
            }
        }
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

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
  }, [fetchProfile]);

  const deductCredits = async (amount: number, description?: string, fileUrl?: string, type?: string): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.credits < amount) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ amount, description, fileUrl, type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deducting credits via API:', errorData);
        return false;
      }

      const result = await response.json();
      
      // Optimistic update
      setProfile(prev => prev ? { 
        ...prev, 
        credits: result.remainingCredits,
        total_credits_used: (prev.total_credits_used || 0) + amount
      } : null);
      return true;
    } catch (error) {
      console.error('Unexpected error deducting credits:', error);
      return false;
    }
  };

  const addCredits = async (amount: number, planName?: string): Promise<void> => {
    if (!user || !profile) {
      throw new Error('You must be signed in to add credits.');
    }

    const currentCredits = Number(profile.credits) || 0;
    const updates: { credits: number; plan?: string } = { 
      credits: currentCredits + amount 
    };
    
    if (planName) {
      updates.plan = planName;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error adding credits:', error);
      throw error;
    } else {
        // Optimistic update
        setProfile(prev => prev ? { 
          ...prev, 
          credits: (Number(prev.credits) || 0) + amount,
          plan: planName || prev.plan
        } : null);
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

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      loading, 
      authError, 
      signInWithGoogle, 
      signOut, 
      refreshProfile, 
      deductCredits, 
      addCredits,
      resetPassword,
      updatePassword
    }}>
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
