// Input sanitization for API requests
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
];

export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export interface SanitizationResult {
  clean: boolean;
  threats: string[];
  sanitized: string;
}

export function analyzeInput(input: string): SanitizationResult {
  const threats: string[] = [];

  if (detectSQLInjection(input)) threats.push("sql_injection");
  if (detectXSS(input)) threats.push("xss");

  return {
    clean: threats.length === 0,
    threats,
    sanitized: sanitizeInput(input),
  };
}

// Validate and sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string") {
      const analysis = analyzeInput(value);
      if (!analysis.clean) {
        (result as Record<string, unknown>)[key] = analysis.sanitized;
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  return result;
}
