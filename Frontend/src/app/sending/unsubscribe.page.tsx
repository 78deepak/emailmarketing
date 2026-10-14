import { useParams, Link } from 'react-router-dom';
import { AlertCircle, Loader2, MailX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useConsumeUnsubscribe } from '@/features/forms/use-forms';

export default function UnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useConsumeUnsubscribe(token);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-md p-8 text-center space-y-6">
        {isLoading ? (
          <div className="py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <h2 className="text-base font-semibold text-foreground">
              Processing unsubscribe request...
            </h2>
            <p className="text-xs text-muted-foreground">
              Updating your email communication preferences.
            </p>
          </div>
        ) : isError ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Invalid Unsubscribe Link</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This unsubscribe token may have expired, or is invalid. If you continue to receive unwanted emails, please reach out to our support team.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Back to Homepage</Link>
            </Button>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <MailX className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">You are unsubscribed</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data?.message ||
                  'Your email has been successfully removed from this mailing list. You will not receive any further marketing updates.'}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Did you unsubscribe by mistake? Contact the sender directly to re-subscribe to updates.
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link to="/">Back to Homepage</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
