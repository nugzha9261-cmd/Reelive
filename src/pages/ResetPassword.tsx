import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IOSButton } from '@/components/ui/ios-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Film, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase auto-parses the recovery token from the URL hash and fires PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Could not update password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated', description: 'You are now signed in.' });
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background flex flex-col px-8 py-12">
      <div className="flex flex-col items-center mb-12 pt-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Film className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
        <p className="text-muted-foreground mt-2 text-center">
          {ready ? 'Choose a new password for your account.' : 'Validating your reset link…'}
        </p>
      </div>

      {ready && (
        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>

          <IOSButton type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}
          </IOSButton>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
