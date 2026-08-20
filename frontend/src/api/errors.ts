import axios from "axios";

interface ApiErrorPayload {
  message?: unknown;
  violations?: unknown;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "The request could not be completed.",
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const payload: unknown = error.response?.data;
  if (typeof payload === "object" && payload !== null) {
    const apiError = payload as ApiErrorPayload;
    if (typeof apiError.message === "string" && apiError.message.length > 0) {
      return apiError.message;
    }

    if (Array.isArray(apiError.violations)) {
      const messages = apiError.violations
        .filter(
          (violation): violation is { message: string } =>
            typeof violation === "object" &&
            violation !== null &&
            "message" in violation &&
            typeof violation.message === "string",
        )
        .map((violation) => violation.message);
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  return error.message || fallback;
}
