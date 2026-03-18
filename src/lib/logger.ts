type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  requestId?: string
  userId?: string
  orgId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const CURRENT_LEVEL =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug")

// Sensitive field names to redact
const SENSITIVE_FIELDS = new Set([
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "api_key",
  "apikey",
  "apiKey",
  "creditCard",
  "ssn",
  "access_token",
  "refresh_token",
])

function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]"
  if (obj === null || obj === undefined) return obj
  if (typeof obj === "string")
    return obj.length > 1000 ? obj.slice(0, 1000) + "...[truncated]" : obj
  if (typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => redactSensitive(item, depth + 1))
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]"
    } else {
      result[key] = redactSensitive(value, depth + 1)
    }
  }
  return result
}

function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...((redactSensitive(context) as object) ?? {}),
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    }
  }

  return JSON.stringify(entry)
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL]
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (shouldLog("debug")) console.debug(formatLog("debug", message, context))
  },
  info(message: string, context?: LogContext) {
    if (shouldLog("info")) console.info(formatLog("info", message, context))
  },
  warn(message: string, context?: LogContext) {
    if (shouldLog("warn")) console.warn(formatLog("warn", message, context))
  },
  error(message: string, context?: LogContext, error?: Error) {
    if (shouldLog("error"))
      console.error(formatLog("error", message, context, error))
  },
}

// Helper to create a child logger with pre-filled context
export function createRequestLogger(
  requestId: string,
  extra?: Partial<LogContext>
) {
  const baseContext: LogContext = { requestId, ...extra }
  return {
    debug: (msg: string, ctx?: LogContext) =>
      logger.debug(msg, { ...baseContext, ...ctx }),
    info: (msg: string, ctx?: LogContext) =>
      logger.info(msg, { ...baseContext, ...ctx }),
    warn: (msg: string, ctx?: LogContext) =>
      logger.warn(msg, { ...baseContext, ...ctx }),
    error: (msg: string, ctx?: LogContext, err?: Error) =>
      logger.error(msg, { ...baseContext, ...ctx }, err),
  }
}
