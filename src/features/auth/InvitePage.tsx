import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, validateInviteCode, claimInviteCode } from '../../lib/supabase';
import { useAuth } from './AuthProvider';
import { en } from '../../i18n/en';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { member } = useAuth();
  const code = searchParams.get('code');

  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as a member, redirect home
  useEffect(() => {
    if (member) {
      navigate('/', { replace: true });
    }
  }, [member, navigate]);

  // Validate the invite code on mount
  useEffect(() => {
    async function validateCode() {
      if (!code) {
        setError(en.inviteInvalid);
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await validateInviteCode(code);

        if (rpcError || !data || data.length === 0) {
          setError(en.inviteExpired);
          setLoading(false);
          return;
        }

        setMemberName(data[0].member_name);
        setLoading(false);
      } catch {
        setError(en.inviteError);
        setLoading(false);
      }
    }

    validateCode();
  }, [code]);

  const handleClaim = async () => {
    if (!code) return;
    setClaiming(true);
    setError(null);

    try {
      // Sign in anonymously to get a persistent session
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        setError(en.inviteError);
        setClaiming(false);
        return;
      }

      // Claim the invite
      const { error: claimError } = await claimInviteCode(code);

      if (claimError) {
        // Parse specific error messages from the RPC
        const msg = claimError.message;
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('already been used')) {
          setError(en.inviteExpired);
        } else if (msg.includes('2 devices')) {
          setError(en.inviteMaxDevices);
        } else if (msg.includes('already linked')) {
          setError(en.inviteAlreadyLinked);
        } else {
          setError(en.inviteError);
        }
        setClaiming(false);
        return;
      }

      // Request persistent storage (important for iOS)
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }

      // Navigate to home
      navigate('/', { replace: true });
    } catch {
      setError(en.inviteError);
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-lg text-[var(--text)]">{en.inviteLoading}</p>
      </div>
    );
  }

  if (error && !memberName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <Card>
          <p className="text-lg text-[var(--text)] mb-6">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')}>
            {en.navHome}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">
          {en.inviteWelcome.replace('{{name}}', memberName ?? '')}
        </h1>

        {error && (
          <p className="text-[var(--owe)] mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleClaim}
            disabled={claiming}
            aria-label={en.inviteYes}
          >
            {claiming ? 'Signing in...' : en.inviteYes}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setMemberName(null);
              setError(en.inviteNoHelp);
            }}
            aria-label={en.inviteNo}
          >
            {en.inviteNo}
          </Button>
        </div>
      </Card>
    </div>
  );
}
