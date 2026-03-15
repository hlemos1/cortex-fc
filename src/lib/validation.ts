/**
 * Input validation utilities for CORTEX FC
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 320;
}

export function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Password must be at least 8 chars with uppercase, lowercase, and number.
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Senha deve ter no minimo 8 caracteres" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos uma letra maiuscula" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos uma letra minuscula" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos um numero" };
  }
  return { valid: true };
}

export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && !Number.isNaN(value) && value >= min && value <= max;
}
