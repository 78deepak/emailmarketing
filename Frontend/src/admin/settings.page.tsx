import { useState, useEffect } from 'react';
import {
  CreditCard,
  Shield,
  Save,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useAdminSettings,
  useUpdateAdminSetting,
  useAdminPlans,
} from '@/features/admin/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeAxiosError } from '@/lib/api';

export default function PlatformSettingsPage() {
  const { data: settings, refetch } = useAdminSettings();
  const { data: plans } = useAdminPlans();
  const updateSetting = useUpdateAdminSetting();

  // Razorpay Plan Map state: { [planId]: string }
  const [razorpayPlanMap, setRazorpayPlanMap] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState(false);

  // Security & platform policy state
  const [trialDays, setTrialDays] = useState('14');
  const [bounceThreshold, setBounceThreshold] = useState('5.0');
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Initialize from backend settings
  useEffect(() => {
    if (!settings) return;

    const rzSetting = settings.find((s) => s.key === 'razorpay.plan_map');
    if (rzSetting?.value && typeof rzSetting.value === 'object') {
      setRazorpayPlanMap(rzSetting.value);
    }

    const policySetting = settings.find((s) => s.key === 'platform.policies');
    if (policySetting?.value) {
      if (policySetting.value.trialDays) setTrialDays(String(policySetting.value.trialDays));
      if (policySetting.value.bounceThreshold) setBounceThreshold(String(policySetting.value.bounceThreshold));
    }
  }, [settings]);

  const handleSaveRazorpayMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMap(true);
    try {
      await updateSetting.mutateAsync({
        key: 'razorpay.plan_map',
        value: razorpayPlanMap,
      });
      toast.success('Razorpay plan mapping updated successfully');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to update Razorpay mapping');
    } finally {
      setSavingMap(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      await updateSetting.mutateAsync({
        key: 'platform.policies',
        value: {
          trialDays: parseInt(trialDays, 10) || 14,
          bounceThreshold: parseFloat(bounceThreshold) || 5.0,
        },
      });
      toast.success('Platform security policies saved');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to save policies');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Settings & Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure payment gateway mapping, tenant lifecycle policies, and global system parameters.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reload Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Razorpay Subscription Mapping Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Razorpay Plan Mapping</h3>
              <p className="text-xs text-muted-foreground">
                Map database Plan IDs to corresponding Razorpay Plan IDs (<code className="text-xs">plan_xxx</code>)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRazorpayMap} className="space-y-4">
            {plans?.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                No subscription plans found. Create plans first in the Plans tab.
              </p>
            ) : (
              <div className="space-y-3">
                {plans?.map((plan) => (
                  <div key={plan.id} className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{plan.name}</span>
                      <span className="font-mono text-muted-foreground text-[11px]">{plan.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="plan_xxxxxxxxxxxxxx"
                        className="font-mono text-xs h-8"
                        value={razorpayPlanMap[plan.id] || ''}
                        onChange={(e) =>
                          setRazorpayPlanMap({
                            ...razorpayPlanMap,
                            [plan.id]: e.target.value.trim(),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={savingMap || !plans?.length} className="gap-2">
                <Save className="h-4 w-4" />
                {savingMap ? 'Saving Mapping...' : 'Save Razorpay Map'}
              </Button>
            </div>
          </form>
        </div>

        {/* Global Policies & Safety Thresholds Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Tenant Lifecycle Policies</h3>
              <p className="text-xs text-muted-foreground">
                Control signup trial length and deliverability compliance thresholds.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trial-days" className="text-xs font-semibold">
                Default Workspace Trial (Days)
              </Label>
              <Input
                id="trial-days"
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Duration of full-access evaluation period assigned upon customer registration.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bounce-threshold" className="text-xs font-semibold">
                Bounce Alert Threshold (%)
              </Label>
              <Input
                id="bounce-threshold"
                type="number"
                step="0.1"
                min="1.0"
                max="20.0"
                value={bounceThreshold}
                onChange={(e) => setBounceThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Organizations exceeding this bounce rate trigger automated deliverability warnings.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={savingPolicy} className="gap-2">
                <Save className="h-4 w-4" />
                {savingPolicy ? 'Saving Policies...' : 'Update Policies'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Root Platform Environment Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Root Super-Admin Privileges</h3>
            <p className="text-xs text-muted-foreground">
              Direct access to system configuration and tenant partition boundaries.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <span className="text-muted-foreground block mb-1">Super-Admin Auth</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              JWT PlatformAdminGuard Active
            </span>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <span className="text-muted-foreground block mb-1">Global Scope</span>
            <span className="font-semibold text-foreground">
              Unrestricted Tenant RLS Bypass
            </span>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <span className="text-muted-foreground block mb-1">Audit Trail</span>
            <span className="font-semibold text-foreground">
              All Changes Stored in Settings Table
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
