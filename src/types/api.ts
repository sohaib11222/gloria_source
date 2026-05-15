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
	type: "SOURCE" | "AGENT" | "ADMIN";
	status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
}

export interface SourceHealth {
	id?: string;
	sourceId: string;
	healthy: boolean;
	status?:
		| "NO_DATA"
		| "HEALTHY"
		| "DEGRADED"
		| "UNHEALTHY"
		| "WARNING"
		| "EXCLUDED";
	slowRate: number;
	fastRate?: number;
	healthRate?: number;
	sampleCount: number;
	slowCount?: number;
	backoffLevel: number;
	strikeCount: number;
	strikesForBackoff?: number;
	slowThresholdMs?: number;
	backoffScheduleMinutes?: number[];
	monitorEnabled?: boolean;
	isExcluded?: boolean;
	excludedUntil: string | null;
	updatedAt: string | null;
	lastStrikeAt?: string | null;
	lastResetAt?: string | null;
	lastResetBy?: string | null;
	nextBackoffMinutes?: number | null;
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
