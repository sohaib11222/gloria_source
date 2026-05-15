export const AUTH_NOTICE_KEY = "gloria_source_auth_message";

export function expiredSignInNotice(): string {
	return "Your sign-in has expired. Please sign in again to continue.";
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(
			normalized.length + ((4 - (normalized.length % 4)) % 4),
			"=",
		);
		return JSON.parse(atob(padded));
	} catch {
		return null;
	}
}

export function isAuthTokenExpired(
	token: string | null | undefined,
	skewMs = 15_000,
): boolean {
	if (!token) return true;
	const payload = decodeJwtPayload(token);
	const exp = payload?.exp;
	if (typeof exp !== "number") return true;
	return exp * 1000 <= Date.now() + skewMs;
}

export function clearSourceAuth(message?: string): void {
	localStorage.removeItem("token");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("user");
	if (message) {
		sessionStorage.setItem(AUTH_NOTICE_KEY, message);
	}
}

export function consumeAuthSessionMessage(): string | null {
	const message = sessionStorage.getItem(AUTH_NOTICE_KEY);
	if (message) sessionStorage.removeItem(AUTH_NOTICE_KEY);
	return message;
}
