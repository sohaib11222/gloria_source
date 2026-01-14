// Type definitions for API responses and common data structures

export interface User {
  id: string;
  email: string;
  role: string;
  company: Company;
}

export interface Company {
  id: string;
  companyName: string;
  type: 'SOURCE' | 'AGENT' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
}

export interface SourceHealth {
  id: string;
  sourceId: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  lastCheckedAt: string;
  responseTimeMs: number;
  strikeCount: number;
  lastStrikeAt: string | null;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}

export interface VerificationResult {
  passed: boolean;
  timestamp: string;
  checks: {
    health: boolean;
    locations: boolean;
    availability: boolean;
    bookings: boolean;
  };
  errors?: string[];
  details?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

