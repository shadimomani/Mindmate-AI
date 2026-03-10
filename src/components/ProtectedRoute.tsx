import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const recheckOnboarding = useCallback(() => {
    setCheckedUserId(null);
  }, []);

  // Expose recheck function globally so Onboarding can trigger it
  useEffect(() => {
    (window as any).__recheckOnboarding = recheckOnboarding;
    return () => { delete (window as any).__recheckOnboarding; };
  }, [recheckOnboarding]);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      setCheckedUserId(null);
      return;
    }
    if (checkedUserId === user.id) return;
    setCheckingOnboarding(true);
    supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setOnboarded(data?.onboarded ?? false);
        setCheckedUserId(user.id);
        setCheckingOnboarding(false);
      });
  }, [user, checkedUserId]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
