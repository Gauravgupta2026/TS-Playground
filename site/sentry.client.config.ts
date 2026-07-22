import * as Sentry from "@sentry/astro";

// Error tracking only, per the earlier PostHog-vs-Sentry split: Sentry owns
// errors/performance, PostHog owns product analytics. Session replay and
// the feedback widget are left off to keep this scoped and the JS bundle
// small — add Sentry.replayIntegration()/feedbackIntegration() here later
// if that's ever wanted.
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
