import { useState } from 'react';
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  Users,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePlans,
  useSubscription,
  useCreateCheckout,
  useCancelSubscription,
} from '@/features/billing/use-subscription';
import { normalizeAxiosError } from '@/lib/api';
import type { Plan } from '@/types/billing';

export default function BillingPage() {
  const { data: subscription } = useSubscription();
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const checkoutMutation = useCreateCheckout();
  const cancelMutation = useCancelSubscription();

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

  const currentPlan = subscription?.plan;
  const isTrial = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'cancelled' || subscription?.cancelAtPeriodEnd;

  // Calculate days remaining in period/trial
  const daysRemaining = (() => {
    if (!subscription?.currentPeriodEnd) return null;
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  const handleSubscribe = async (plan: Plan) => {
    try {
      setSelectedPlanForCheckout(plan);
      const res = await checkoutMutation.mutateAsync({ planId: plan.id });
      if (res.checkoutUrl) {
        toast.info('Redirecting to payment gateway...');
        window.location.href = res.checkoutUrl;
      } else {
        toast.success(`Selected plan: ${plan.name}. Follow payment instructions.`);
      }
    } catch (err: unknown) {
      const parsed = normalizeAxiosError(err);
      setErrorModal({
        title: 'Checkout Gateway Notice',
        message:
          parsed.message ||
          'Payment gateway is in test mode or awaiting Razorpay plan mapping. Contact platform admin to configure production credentials.',
      });
    }
  };

  const handleConfirmCancel = async () => {
    try {
      const res = await cancelMutation.mutateAsync();
      toast.success(res.message || 'Subscription cancelled successfully');
      setCancelDialogOpen(false);
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to cancel subscription');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
            {currentPlan && (
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                {currentPlan.name} Tier
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your subscription tier, resource quotas, and billing settings.
          </p>
        </div>

        {subscription && (
          <div className="flex items-center gap-2">
            {!isCanceled && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Subscription Status Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Plan
              </span>
              {isTrial && (
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                  Free Trial
                </Badge>
              )}
              {isActive && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Active
                </Badge>
              )}
              {isPastDue && (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Payment Past Due
                </Badge>
              )}
              {isCanceled && (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                  Cancels at Period End
                </Badge>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {currentPlan ? currentPlan.name : 'Free / Trial Plan'}
              </h2>
              {currentPlan && (
                <span className="text-xl font-medium text-muted-foreground">
                  ₹{((currentPlan.priceCents || 0) / 100).toLocaleString('en-IN')}{' '}
                  <span className="text-sm">/ {currentPlan.billingPeriod}</span>
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {isTrial && daysRemaining !== null && (
                <>
                  <Clock className="mr-1 inline-block h-3.5 w-3.5 text-purple-500" />
                  Your full-access trial expires in{' '}
                  <span className="font-semibold text-foreground">{daysRemaining} days</span>.
                  Upgrade now to retain uninterrupted sending.
                </>
              )}
              {isActive && subscription?.currentPeriodEnd && (
                <>
                  Next billing renewal on{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </span>
                  .
                </>
              )}
              {isCanceled && subscription?.currentPeriodEnd && (
                <>
                  Access remains active until{' '}
                  <span className="font-semibold text-destructive">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </span>
                  .
                </>
              )}
              {!subscription && (
                <>No active paid subscription found. Select a plan below to get started.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#plans-section"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Zap className="h-4 w-4" />
              {currentPlan ? 'Upgrade / Change Tier' : 'Choose a Plan'}
            </a>
          </div>
        </div>
      </div>

      {/* Resource Quotas & Usage Meter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Plan Resource Limits</h3>
          <span className="text-xs text-muted-foreground">
            Quota refreshed every billing cycle
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Contacts Limit */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Contacts Capacity</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {currentPlan?.planLimit?.maxContacts
                ? currentPlan.planLimit.maxContacts.toLocaleString()
                : 'Unlimited'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Audience storage limit</span>
            </div>
          </div>

          {/* Monthly Emails */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Emails</span>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {currentPlan?.planLimit?.maxEmailsMonth
                ? currentPlan.planLimit.maxEmailsMonth.toLocaleString()
                : 'Unlimited'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Outbound sends per month</span>
            </div>
          </div>

          {/* Daily Sends Limit */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Daily Speed Cap</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {currentPlan?.planLimit?.maxEmailsDay
                ? currentPlan.planLimit.maxEmailsDay.toLocaleString()
                : 'Unlimited'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Max emails per calendar day</span>
            </div>
          </div>

          {/* Automations & Features */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Automations & AI</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {currentPlan?.planLimit?.maxAutomations ?? '50'}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Active Workflows</span>
              {currentPlan?.planLimit?.aiEnabled ? (
                <Badge variant="outline" className="h-4 px-1 text-[10px] text-primary">
                  AI Active
                </Badge>
              ) : (
                <span className="text-muted-foreground/60">• AI Locked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans Section */}
      <div id="plans-section" className="space-y-6 pt-4">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Choose the right plan for your growth
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All plans include high deliverability, campaign analytics, visual automation builder, and responsive forms.
          </p>
        </div>

        {plansLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading available tiers...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const isPopular = plan.code.toLowerCase() === 'pro';
              const limits = plan.planLimit;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${
                    isPopular
                      ? 'border-primary bg-gradient-to-b from-primary/5 via-card to-card shadow-lg ring-1 ring-primary'
                      : 'border-border bg-card shadow-sm hover:border-border/80'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {plan.code === 'starter' && 'Perfect for early stage newsletters and growing creators.'}
                          {plan.code === 'pro' && 'Advanced workflows, AI generation, and scaling teams.'}
                          {plan.code === 'business' && 'Enterprise deliverability, dedicated IP, and high volume.'}
                        </p>
                      </div>
                      {plan.code === 'business' && (
                        <Crown className="h-5 w-5 text-amber-500" />
                      )}
                    </div>

                    <div className="border-b border-border/60 pb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight">
                          ₹{((plan.priceCents || 0) / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          / {plan.billingPeriod}
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2.5 text-xs">
                      <div className="font-semibold uppercase tracking-wider text-muted-foreground">
                        Included Limits & Capabilities:
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{limits?.maxContacts?.toLocaleString() ?? 'Unlimited'}</strong> Contacts
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{limits?.maxEmailsMonth?.toLocaleString() ?? 'Unlimited'}</strong> Emails / month
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{limits?.maxEmailsDay?.toLocaleString() ?? 'Unlimited'}</strong> Max sends / day
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{limits?.maxAutomations ?? 'Unlimited'}</strong> Active Automations
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{limits?.maxUsers ?? 'Unlimited'}</strong> Team Members
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {limits?.aiEnabled ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 text-center text-muted-foreground/40 font-bold">•</span>
                        )}
                        <span className={limits?.aiEnabled ? 'font-medium' : 'text-muted-foreground'}>
                          {limits?.aiEnabled ? 'AI Email Copywriting & Subject Assistant' : 'AI features locked'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {limits?.dedicatedIp ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 text-center text-muted-foreground/40 font-bold">•</span>
                        )}
                        <span className={limits?.dedicatedIp ? 'font-medium' : 'text-muted-foreground'}>
                          {limits?.dedicatedIp ? 'Dedicated Warm IP Address' : 'Shared high-reputation IP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full cursor-default border-primary/40 bg-primary/5 text-primary"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        variant={isPopular ? 'default' : 'outline'}
                        className="w-full"
                        disabled={checkoutMutation.isPending}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {checkoutMutation.isPending && selectedPlanForCheckout?.id === plan.id ? (
                          'Processing...'
                        ) : (
                          <>
                            Upgrade to {plan.name}
                            <ArrowUpRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Security Notice */}
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Secure Payment Processing</p>
            <p className="mt-0.5">
              Subscriptions are billed securely in Indian Rupees (INR) via Razorpay with 256-bit SSL encryption.
              You can cancel or upgrade your plan anytime without lock-in contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
              {isTrial
                ? ' Cancelling a trial will end your access immediately.'
                : ' You will retain access until the end of your current billing period, after which renewal will stop.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep My Plan
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={handleConfirmCancel}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error / Notice Modal */}
      <Dialog open={!!errorModal} onOpenChange={() => setErrorModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {errorModal?.title}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-sm text-foreground">
              <p>{errorModal?.message}</p>
              <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                <strong>Developer Note:</strong> Razorpay webhook and checkout require setting{' '}
                <code className="text-foreground">platform_settings.key = 'razorpay.plan_map'</code> in the database to map your internal plan UUIDs to live Razorpay Plan IDs.
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="default" onClick={() => setErrorModal(null)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
