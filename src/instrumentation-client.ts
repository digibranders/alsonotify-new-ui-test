import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.replayIntegration({
      // Replay previously captured the raw DOM on every error, so password
      // reset and invoice forms were recorded verbatim. Mask by default.
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enableLogs: true,
  replaysSessionSampleRate: 0.05,
  // Was 1.0 — every single error produced a full session recording.
  replaysOnErrorSampleRate: 0.1,
  // Was true: sent user email, IP and headers with every event.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
