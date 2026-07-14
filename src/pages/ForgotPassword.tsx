import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IOSButton } from '@/components/ui/ios-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Film, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background flex flex-col px-8 py-12">
      <div className="flex flex-col items-center mb-12 pt-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Film className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        <p className="text-muted-foreground mt-2 text-center">
          {sent
            ? "Check your inbox for the reset link."
            : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {!sent && (
        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <IOSButton type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
          </IOSButton>
        </form>
      )}

      <div className="text-center mt-8">
        <Link to="/login" className="text-primary font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
