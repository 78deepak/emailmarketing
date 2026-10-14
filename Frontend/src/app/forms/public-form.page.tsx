import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useForm, useSubmitPublicForm } from '@/features/forms/use-forms';
import { normalizeAxiosError } from '@/lib/api';

export default function PublicFormPage() {
  const { id } = useParams<{ id: string }>();

  const { data: form, isLoading, isError } = useForm(id);
  const submitMutation = useSubmitPublicForm();

  // Form values state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !email.trim()) return;

    setErrorMessage(null);

    try {
      await submitMutation.mutateAsync({
        formId: id,
        payload: {
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          data: Object.keys(customData).length > 0 ? customData : undefined,
        },
      });

      setIsSubmitted(true);

      // Check if redirect URL is set
      if (form?.settings?.redirectUrl) {
        setTimeout(() => {
          window.location.href = form.settings.redirectUrl!;
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(normalizeAxiosError(err).message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading form...</span>
        </div>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Form Not Found</h2>
          <p className="text-sm text-muted-foreground">
            This subscription form may have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{form.name}</h2>
          <p className="text-sm text-muted-foreground">
            This form is no longer accepting new submissions.
          </p>
        </div>
      </div>
    );
  }

  const fields = form.fields || [
    { id: 'f-email', name: 'email', label: 'Email Address', type: 'email', required: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Top Decorative accent line */}
        <div className="h-1.5 w-full bg-primary" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {form.settings?.title || form.name}
            </h1>
            {form.settings?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {form.settings.description}
              </p>
            )}
          </div>

          {/* Success Screen */}
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">You are subscribed!</h3>
                <p className="text-sm text-muted-foreground">
                  {form.settings?.successMessage ||
                    'Thank you for joining. Please check your email inbox for updates.'}
                </p>
              </div>
              {form.settings?.redirectUrl && (
                <p className="text-xs text-muted-foreground">
                  Redirecting you now...
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Dynamic Form Fields */}
              {fields.map((f) => {
                if (f.name === 'email') {
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id} className="text-xs font-semibold">
                        {f.label} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={f.id}
                        type="email"
                        required
                        placeholder={f.placeholder || 'you@example.com'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  );
                }

                if (f.name === 'firstName') {
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id} className="text-xs font-semibold">
                        {f.label} {f.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id={f.id}
                        type="text"
                        required={f.required}
                        placeholder={f.placeholder || 'Jane'}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  );
                }

                if (f.name === 'lastName') {
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id} className="text-xs font-semibold">
                        {f.label} {f.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id={f.id}
                        type="text"
                        required={f.required}
                        placeholder={f.placeholder || 'Doe'}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  );
                }

                return (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={f.id} className="text-xs font-semibold">
                      {f.label} {f.required && <span className="text-destructive">*</span>}
                    </Label>

                    {f.type === 'textarea' ? (
                      <textarea
                        id={f.id}
                        required={f.required}
                        placeholder={f.placeholder}
                        rows={3}
                        value={customData[f.name] || ''}
                        onChange={(e) =>
                          setCustomData({ ...customData, [f.name]: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : f.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground pt-1">
                        <input
                          type="checkbox"
                          required={f.required}
                          checked={customData[f.name] === 'true'}
                          onChange={(e) =>
                            setCustomData({
                              ...customData,
                              [f.name]: e.target.checked ? 'true' : 'false',
                            })
                          }
                          className="rounded"
                        />
                        <span>{f.placeholder || f.label}</span>
                      </label>
                    ) : (
                      <Input
                        id={f.id}
                        type={f.type}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={customData[f.name] || ''}
                        onChange={(e) =>
                          setCustomData({ ...customData, [f.name]: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    )}
                  </div>
                );
              })}

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full h-11 text-sm font-semibold gap-2 mt-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {form.settings?.buttonText || 'Subscribe Now'}
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="text-[11px] text-center text-muted-foreground">
            Protected by anti-spam security. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
