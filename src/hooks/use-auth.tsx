import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface SignUpData {
  companyName: string;
  fullName: string;
  industry: string;
  companySize: string;
}

export interface CompanyData {
  id: string;
  created_at: string;
  owner_id: string;
  name: string;
  industry: string;
  company_size: string;
  logo_url: string | null;
  integration_type: "API" | "Widget" | "Both";
  onboarding_completed: boolean;
  website: string | null;
  support_email: string | null;
  total_conversations: number;
  resolved_by_ai: number;
  open_tickets: number;
  avg_response_time: number;
  csat_score: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  company: CompanyData | null;
  onboardingCompleted: boolean;
  isLoadingCompany: boolean;
  fetchCompany: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    data: SignUpData,
  ) => Promise<{
    error: AuthError | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updateUserPassword: (password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
}


const checkPlaceholder = (): AuthError | null => {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const isPlaceholder =
    !url || !key || url.includes("your-project-id") || url.includes("placeholder-project");

  if (isPlaceholder) {
    return {
      name: "AuthError",
      message:
        "Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, then restart your development server.",
      status: 400,
    } as AuthError;
  }
  return null;
};

const formatError = (err: unknown): AuthError => {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Network error")
  ) {
    return {
      name: "AuthError",
      message:
        "Failed to connect to the authentication server. Please check your internet connection and ensure your Supabase configuration is correct.",
      status: 0,
    } as AuthError;
  }
  return err as AuthError;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const fetchCompany = async (forcedUser?: User | null) => {
    const activeUser = forcedUser !== undefined ? forcedUser : user;
    if (!activeUser) {
      setCompany(null);
      setOnboardingCompleted(false);
      setIsLoadingCompany(false);
      return;
    }
    setIsLoadingCompany(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", activeUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching company:", error);
        setCompany(null);
        setOnboardingCompleted(false);
      } else if (data) {
        setCompany(data as CompanyData);
        setOnboardingCompleted(data.onboarding_completed);
      } else {
        setCompany(null);
        setOnboardingCompleted(false);
      }
    } catch (err) {
      console.error("Error in fetchCompany:", err);
      setCompany(null);
      setOnboardingCompleted(false);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const fetchCompanyManual = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? user;
    await fetchCompany(currentUser);
  };

  useEffect(() => {
    // Check active sessions and set user/session state
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchCompany(currentUser);
        } else {
          setIsLoadingCompany(false);
        }
      } catch (err) {
        console.error("Error fetching initial session:", err);
        setIsLoadingCompany(false);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes (login, logout, token refresh, etc.)
    //
    // IMPORTANT: Supabase fires TOKEN_REFRESHED on every tab-focus because the
    // client refreshes the JWT in the background. We must NOT call fetchCompany
    // on those events or isLoadingCompany flips to true and the spinner shows
    // indefinitely. We only re-fetch company data when the user identity changes.
    let lastUserId: string | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      const currentUserId = currentUser?.id ?? null;

      setSession(session);
      setUser(currentUser);
      setIsLoading(false);

      if (currentUserId !== lastUserId) {
        lastUserId = currentUserId;
        if (currentUser) {
          await fetchCompany(currentUser);
        } else {
          setCompany(null);
          setOnboardingCompleted(false);
          setIsLoadingCompany(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: formatError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, data: SignUpData) => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError, data: null };

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          data: {
            company_name: data.companyName,
            full_name: data.fullName,
            industry: data.industry,
            company_size: data.companySize,
          },
        },
      });
      return { error, data: signUpData };
    } catch (err) {
      return { error: formatError(err), data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError };

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: formatError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError };

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      return { error };
    } catch (err) {
      return { error: formatError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async (password: string) => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError };

      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: formatError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const configError = checkPlaceholder();
      if (configError) return { error: configError };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      return { error };
    } catch (err) {
      return { error: formatError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        company,
        onboardingCompleted,
        isLoadingCompany,
        fetchCompany: fetchCompanyManual,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updateUserPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
