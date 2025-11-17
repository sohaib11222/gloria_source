export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SOURCES: '/sources',
  AGENTS: '/agents',
  AGREEMENTS: '/agreements',
  LOCATIONS: '/locations',
  AVAILABILITY_TEST: '/availability-test',
  BOOKINGS_TEST: '/bookings-test',
  VERIFICATION: '/verification',
  HEALTH: '/health',
  METRICS: '/metrics',
  LOGS: '/logs',
  SETTINGS: '/settings',
} as const

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SOURCE: 'SOURCE',
  AGENT: 'AGENT',
} as const

export const COMPANY_TYPES = {
  SOURCE: 'SOURCE',
  AGENT: 'AGENT',
} as const

export const AGREEMENT_STATUSES = {
  DRAFT: 'DRAFT',
  OFFERED: 'OFFERED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
} as const

export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const

export const VEHICLE_CLASSES = [
  'ECONOMY',
  'COMPACT',
  'INTERMEDIATE',
  'STANDARD',
  'FULL_SIZE',
  'PREMIUM',
  'LUXURY',
  'MINIVAN',
  'SUV',
  'CONVERTIBLE',
] as const

export const NAVIGATION_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: ROUTES.SOURCES, label: 'Sources', icon: 'Server' },
  { path: ROUTES.AGENTS, label: 'Agents', icon: 'Users' },
  { path: ROUTES.AGREEMENTS, label: 'Agreements', icon: 'FileText' },
  { path: ROUTES.LOCATIONS, label: 'Locations', icon: 'MapPin' },
  { path: ROUTES.AVAILABILITY_TEST, label: 'Availability Test', icon: 'Search' },
  { path: ROUTES.BOOKINGS_TEST, label: 'Bookings Test', icon: 'Calendar' },
  { path: ROUTES.VERIFICATION, label: 'Verification', icon: 'CheckCircle' },
  { path: ROUTES.HEALTH, label: 'Health', icon: 'Heart' },
  { path: ROUTES.METRICS, label: 'Metrics', icon: 'BarChart3' },
  { path: ROUTES.LOGS, label: 'Logs', icon: 'FileText' },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: 'Settings' },
] as const

export const POLL_INTERVALS = {
  FAST: 1000,
  NORMAL: 2000,
  SLOW: 5000,
} as const

export const METRICS_REFRESH_INTERVALS = {
  FAST: 5000,
  NORMAL: 10000,
  SLOW: 30000,
} as const
