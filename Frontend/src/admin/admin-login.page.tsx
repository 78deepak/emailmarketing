import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { normalizeAxiosError } from '@/lib/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, adminLogin } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && user?.isPlatformAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await adminLogin({ email: email.trim(), password });
      toast.success('Authenticated as Platform Super-Admin');
      navigate('/admin', { replace: true });
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Invalid super-admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@platform.com');
    setPassword('Admin@123456');
    toast.info('Filled default super-admin credentials');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
          <p className="text-xs text-muted-foreground">
            Sign in with root super-admin credentials to manage platform tenants, subscriptions, and global telemetry.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Super-Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  className="pl-9"
                  placeholder="admin@platform.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-pass">Master Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-pass"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  Enter Admin Area
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-4 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={handleFillDemo}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fill Demo Super-Admin (admin@platform.com)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <Link to="/auth/login" className="hover:text-foreground underline">
            ← Return to Customer Workspace Login
          </Link>
        </div>
      </div>
    </div>
  );
}
