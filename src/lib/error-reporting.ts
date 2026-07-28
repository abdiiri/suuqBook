type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Logs an error that reached the app's error boundary. Kept as a single
 * function so a real error-tracking service (Sentry, etc.) can be dropped
 * in here later without touching call sites.
 */
export function reportAppError(
  error: unknown,
  context: Record<string, unknown> = {},
  _options: ErrorReportOptions = {},
) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[SuuqBook] Unhandled error:", message, {
    route: window.location.pathname,
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
