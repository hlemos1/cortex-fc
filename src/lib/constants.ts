// Performance & Timing
export const DEBOUNCE_SEARCH_MS = 400
export const DEBOUNCE_AUTOSAVE_MS = 2000
export const POLLING_INTERVAL_MS = 3000
export const TOAST_DURATION_SUCCESS_MS = 3000
export const TOAST_DURATION_ERROR_MS = 5000
export const ANIMATION_DURATION_MS = 200
export const PRESENCE_HEARTBEAT_MS = 30000
export const PRESENCE_FETCH_MS = 15000

// Limits
export const MAX_FILE_UPLOAD_MB = 10
export const MAX_BATCH_SIZE = 50
export const MAX_API_RATE_PER_MIN = 100
export const MAX_AI_RATE_PER_MIN = 10
export const MAX_AUTH_RATE_PER_MIN = 5
export const MAX_EXPORT_ANALYSES = 500
export const MAX_SEARCH_RESULTS = 50

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Cache TTL (seconds)
export const CACHE_TTL_API = 86400       // 24 hours
export const CACHE_TTL_IMAGES = 2592000  // 30 days
export const CACHE_TTL_FONTS = 31536000  // 1 year
export const CACHE_TTL_STATIC = 604800   // 7 days
export const CACHE_TTL_AGENT = 3600      // 1 hour

// Feature Thresholds
export const CONFIDENCE_HIGH = 0.8
export const CONFIDENCE_MEDIUM = 0.6
export const COST_ALERT_THRESHOLD_WARNING = 0.8
export const COST_ALERT_THRESHOLD_CRITICAL = 1.0

// UI
export const SIDEBAR_WIDTH = 256
export const BOTTOM_NAV_HEIGHT = 64
export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024
