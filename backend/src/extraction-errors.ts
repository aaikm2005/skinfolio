export type ExtractionFailureCategory =
  | "quota"
  | "timeout"
  | "provider_configuration"
  | "temporary_api_failure"
  | "empty_response"
  | "invalid_json"
  | "invalid_model_response";

export class ProductExtractionFailure extends Error {
  constructor(
    readonly category: ExtractionFailureCategory,
    message: string,
    readonly providerStatus?: number,
  ) {
    super(message);
    this.name = "ProductExtractionFailure";
  }
}

function errorProperties(error: unknown): Record<string, unknown> {
  if (error && typeof error === "object") return error as Record<string, unknown>;
  return {};
}

function numericStatus(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  return undefined;
}

export function sanitizeDiagnosticMessage(error: unknown): string {
  const props = errorProperties(error);
  let message = error instanceof Error
    ? error.message
    : typeof error === "string" ? error : "Unknown Gemini provider error";
  const configuredKey = process.env.GEMINI_API_KEY;
  if (configuredKey) message = message.split(configuredKey).join("[redacted]");
  return message
    .replace(/AIza[\w-]{20,}/g, "[redacted]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(api[_-]?key|key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/https?:\/\/\S+/gi, "[URL redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 240) || (typeof props.name === "string" ? props.name : "Unknown Gemini provider error");
}

export function classifyGeminiFailure(error: unknown): ProductExtractionFailure {
  if (error instanceof ProductExtractionFailure) return error;
  const props = errorProperties(error);
  const message = sanitizeDiagnosticMessage(error);
  const rawStatus = props.status ?? props.statusCode ?? (error && typeof error === "object" ? errorProperties(props.response).status : undefined);
  const providerStatus = numericStatus(rawStatus);
  const code = typeof props.code === "string" ? props.code : "";
  const name = typeof props.name === "string" ? props.name : "";
  const hint = `${name} ${code} ${typeof props.status === "string" ? props.status : ""} ${message}`.toLowerCase();

  if (providerStatus === 429 || /quota|rate.?limit|resource_exhausted|too many requests/.test(hint)) {
    return new ProductExtractionFailure("quota", message, providerStatus);
  }
  if ([408, 504].includes(providerStatus ?? 0) || /timeout|timed out|deadline.?exceeded|etimedout|aborterror/.test(hint)) {
    return new ProductExtractionFailure("timeout", message, providerStatus);
  }
  if ([401, 403].includes(providerStatus ?? 0) || /invalid api key|api key not valid|unauthenticated|permission denied/.test(hint)) {
    return new ProductExtractionFailure("provider_configuration", message, providerStatus);
  }
  return new ProductExtractionFailure("temporary_api_failure", message, providerStatus);
}

export function extractionFailureResponse(failure: ProductExtractionFailure): { error: string; category: ExtractionFailureCategory } {
  const error = failure.category === "quota"
    ? "Gemini quota or rate limit reached. Wait a moment and try again, or check the Gemini API quota."
    : failure.category === "timeout"
      ? "Gemini took too long to respond. Try again in a moment."
      : failure.category === "provider_configuration"
        ? "Gemini rejected the API credentials or request access. Check the backend Gemini key and model permissions."
      : failure.category === "empty_response"
        ? "Gemini returned an empty response. Try a clearer photo."
        : failure.category === "invalid_json" || failure.category === "invalid_model_response"
          ? "Gemini returned a response Skinfolio could not read. Please retry or enter the product manually."
          : "Gemini is temporarily unavailable. Please try again shortly.";
  return { error, category: failure.category };
}
