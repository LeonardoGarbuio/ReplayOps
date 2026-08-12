export const DEFAULT_SENSITIVE_KEYS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "api_key",
  "apikey",
  "creditcard",
];

export function sanitize(
  data: any,
  sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS
): any {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, sensitiveKeys));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = sensitiveKeys.some((sk) =>
      key.toLowerCase().includes(sk)
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
