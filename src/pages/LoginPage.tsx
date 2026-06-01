import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../api/auth";
import { LoginForm, LoginSchema } from "../lib/validators";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import toast from "react-hot-toast";
import { CAR_RENTAL_PORTAL, PORTAL_LOGO_SRC } from "../lib/portalBranding";
import {
	clearSourceAuth,
	consumeAuthSessionMessage,
	expiredSignInNotice,
	isAuthTokenExpired,
} from "../lib/authSession";

export default function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [isLoading, setIsLoading] = useState(false);

	// Check if user is already logged in on mount
	useEffect(() => {
		const notice = consumeAuthSessionMessage();
		if (notice) {
			toast.error(notice);
		}

		const token = localStorage.getItem("token");
		const userData = localStorage.getItem("user");

		if (token && isAuthTokenExpired(token)) {
			clearSourceAuth();
			if (!notice) toast.error(expiredSignInNotice());
			return;
		}

		if (token && userData) {
			try {
				const user = JSON.parse(userData);
				if (user.company?.type === "SOURCE") {
					// User is already logged in, redirect to source page
					navigate("/source", { replace: true });
				}
			} catch (e) {
				// Invalid user data, clear it
				clearSourceAuth();
				toast.error("Please sign in again to continue.");
			}
		}
	}, [navigate, location.state]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		resolver: zodResolver(LoginSchema),
	});

	const onSubmit = async (data: LoginForm) => {
		setIsLoading(true);

		try {
			// Check if user is already authenticated
			const existingToken = localStorage.getItem("token");
			const existingUser = localStorage.getItem("user");

			if (existingToken && isAuthTokenExpired(existingToken)) {
				clearSourceAuth();
			} else if (existingToken && existingUser) {
				// Check if existing user is a source
				const userData = JSON.parse(existingUser);
				if (userData.company.type === "SOURCE") {
					console.log("Using existing authentication");
					navigate("/source");
					return;
				} else {
					// Clear invalid data if not a source
					localStorage.removeItem("token");
					localStorage.removeItem("refreshToken");
					localStorage.removeItem("user");
					toast.error("Access denied. Only Source accounts are allowed.");
					return;
				}
			}

			// Make authentication API call
			console.log("Login attempt:", data.email);
			const response = await authApi.login(data);
			console.log("Login response:", response);
			console.log("Response type:", typeof response);
			console.log(
				"Response keys:",
				response ? Object.keys(response) : "null/undefined",
			);

			// Check if response is valid
			if (!response) {
				toast.error("No response received from server. Please try again.");
				return;
			}

			if (!response.access || !response.refresh || !response.user) {
				console.error("Invalid response structure:", response);
				toast.error("Invalid response from server. Please try again.");
				return;
			}

			// Store the authentication tokens and user data
			localStorage.setItem("token", response.access);
			localStorage.setItem("refreshToken", response.refresh);
			localStorage.setItem("user", JSON.stringify(response.user));

			// Check if user type is SOURCE
			if (response.user.company.type === "SOURCE") {
				// Check approval status
				if (response.user.company.approvalStatus !== "APPROVED") {
					// Clear stored data if not approved
					localStorage.removeItem("token");
					localStorage.removeItem("refreshToken");
					localStorage.removeItem("user");

					if (response.user.company.approvalStatus === "PENDING") {
						toast.error(
							"Your account is pending admin approval. Please wait for approval.",
						);
					} else if (response.user.company.approvalStatus === "REJECTED") {
						toast.error(
							"Your account has been rejected. Please contact support.",
						);
					} else {
						toast.error(
							"Your account is not approved. Please contact support.",
						);
					}
					return;
				}

				// Check if account is active
				if (response.user.company.status !== "ACTIVE") {
					localStorage.removeItem("token");
					localStorage.removeItem("refreshToken");
					localStorage.removeItem("user");
					toast.error("Your account is not active. Please contact support.");
					return;
				}

				toast.success("Login successful!");
				navigate("/source");
			} else {
				// Clear stored data if not a source
				localStorage.removeItem("token");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("user");
				toast.error("Access denied. Only Source accounts are allowed.");
			}
		} catch (error: any) {
			console.error("Login failed:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response,
				responseData: error.response?.data,
				status: error.response?.status,
				statusText: error.response?.statusText,
				isNetworkError: error.isNetworkError,
				code: error.code,
			});

			// Check if this is a CORS error
			if (error.isCorsError || error.code === "CORS_ERROR") {
				toast.error(
					"CORS error: Unable to connect to server. Please check your network connection and ensure the server CORS configuration is correct.",
				);
				return;
			}

			// Check if this is a true network/connection error (no response received)
			// But first check if we actually got a response with an error status
			if (error.response) {
				// We have a response, so it's not a network error - process it normally below
				console.log(
					"✅ Got response from server, processing error:",
					error.response.status,
				);
			} else if (
				error.isNetworkError ||
				error.isConnectionError ||
				(!error.response &&
					(error.code === "ERR_NETWORK" ||
						error.message?.includes("Network") ||
						error.message?.includes("Failed to fetch")))
			) {
				// True network error - no response received
				console.error("❌ True network error - no response received:", {
					message: error.message,
					code: error.code,
					isNetworkError: error.isNetworkError,
					isConnectionError: error.isConnectionError,
				});
				toast.error(
					"Network error. Please check your internet connection and ensure the server is running. If the problem persists, check the browser console for more details.",
				);
				return;
			}

			// Extract error code and message from various possible locations
			// ALWAYS prioritize response.data over error.message (which might be generic)
			let errorCode =
				error.response?.data?.error ||
				error.response?.error ||
				error.code ||
				null;

			// Priority order:
			// 1. response.data.message (backend message)
			// 2. response.data.error (backend error code as message)
			// 3. response.message (axios response message)
			// 4. Generic fallback based on status code
			// 5. error.message (last resort, but filter out generic messages)
			let errorMessage: string;

			if (error.response?.data?.message) {
				// Always use backend message if available
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				// Use error code as message if no message field
				errorMessage = error.response.data.error;
			} else if (error.response?.status === 401) {
				errorMessage =
					"Invalid credentials. Please check your email and password.";
			} else if (error.response?.status === 403) {
				errorMessage = "Access denied. Please contact support.";
			} else if (error.response?.status) {
				// We have a response but no message - use a generic message based on status
				errorMessage = `Request failed with status ${error.response.status}. Please try again.`;
			} else {
				// No response at all - this shouldn't happen if we got past the network error check
				errorMessage = "Login failed. Please check your credentials.";
			}

			// Final check: if errorMessage is still a generic message, try one more time to get backend message
			const genericMessages = [
				"Network Error",
				"Network error",
				"Error",
				"Request failed",
				"Unauthorized",
				"Forbidden",
			];
			if (
				genericMessages.some(
					(msg) => errorMessage === msg || errorMessage.includes(msg),
				)
			) {
				// Try to extract from response one more time
				if (error.response?.data) {
					const data = error.response.data;
					if (typeof data === "object") {
						errorMessage = data.message || data.error || errorMessage;
					} else if (typeof data === "string") {
						errorMessage = data;
					}
				}
			}

			console.log("Final error message to display:", errorMessage);

			if (errorCode === "EMAIL_NOT_VERIFIED") {
				const pendingEmail = error.response?.data?.email || data.email;
				localStorage.setItem("pendingEmail", pendingEmail);
				toast.error("Please verify your email address to continue.");
				navigate("/verify-email", {
					state: { email: pendingEmail, fromLogin: true },
				});
				return;
			}

			// Always show the proper error message from the backend
			if (errorCode === "NOT_APPROVED") {
				toast.error(errorMessage);
			} else if (errorCode === "ACCOUNT_NOT_ACTIVE") {
				toast.error(errorMessage);
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
				<div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
					<div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.30),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.28),transparent_30%)]" />
						<div className="relative">
							<div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
								<img
									src={PORTAL_LOGO_SRC}
									alt={CAR_RENTAL_PORTAL.logoAlt}
									className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1 ring-1 ring-white/20"
								/>
								<div>
									<p className="text-sm font-semibold">
										{CAR_RENTAL_PORTAL.productName}
									</p>
									<p className="text-xs text-slate-300">
										{CAR_RENTAL_PORTAL.shortName}
									</p>
								</div>
							</div>
						</div>
						<div className="relative space-y-5">
							<p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
								Welcome back
							</p>
							<h1 className="max-w-sm text-4xl font-bold tracking-tight text-white">
								Manage bookings, pricing, branches, and agreements from one place.
							</h1>
							<div className="grid gap-3 pt-2 text-sm text-slate-200">
								<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
									Real-time reservation and cancellation visibility.
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
									Fast access to integrations and health checks.
								</div>
							</div>
						</div>
						<p className="relative text-xs text-slate-400">
							Secure access for approved car rental company accounts only.
						</p>
					</div>

					<div className="flex items-center justify-center p-6 sm:p-10">
						<div className="w-full max-w-md space-y-7">
							<div className="text-center lg:text-left">
								<div className="mb-5 flex items-center justify-center lg:hidden">
									<img
										src={PORTAL_LOGO_SRC}
										alt={CAR_RENTAL_PORTAL.logoAlt}
										className="h-16 w-auto max-w-[200px] rounded-2xl object-contain shadow-sm"
									/>
								</div>
								<h2 className="text-3xl font-bold tracking-tight text-slate-950">
									Sign in to your dashboard
								</h2>
								<p className="mt-2 text-sm text-slate-600">
									Use your approved car rental company account to continue.
								</p>
							</div>

							<Card className="rounded-3xl border-slate-200/80 bg-white shadow-xl shadow-slate-200/70">
								<CardHeader className="border-b-0 bg-transparent px-7 pb-0 pt-7">
									<CardTitle className="text-xl font-bold text-slate-950">
										Welcome back
									</CardTitle>
									<p className="mt-1 text-sm text-slate-500">
										Enter your credentials to continue
									</p>
								</CardHeader>
								<CardContent className="px-7 pb-7 pt-6">
									<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
										<div>
											<Input
												label="Email Address"
												type="email"
												autoComplete="email"
												placeholder="source@example.com"
												error={errors.email?.message}
												className="h-11 rounded-xl border-slate-200 bg-slate-50/70 focus:bg-white"
												{...register("email")}
											/>
										</div>

										<div>
											<div className="mb-2 flex items-center justify-between">
												<label className="block text-sm font-medium text-slate-700">
													Password
												</label>
												<button
													type="button"
													onClick={() => navigate("/forgot-password")}
													className="rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
												>
													Forgot password?
												</button>
											</div>
											<Input
												type="password"
												autoComplete="current-password"
												placeholder="Enter your password"
												error={errors.password?.message}
												className="h-11 rounded-xl border-slate-200 bg-slate-50/70 focus:bg-white"
												{...register("password")}
											/>
										</div>

										<Button
											type="submit"
											loading={isLoading}
											className="h-12 w-full rounded-xl bg-slate-950 text-base font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800"
										>
											{isLoading ? "Signing in..." : "Sign In"}
										</Button>
									</form>

									<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
										<p className="text-sm text-slate-600">
											Don't have an account?{" "}
											<button
												onClick={() => navigate("/register")}
												className="font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950"
											>
												Register your company
											</button>
										</p>
									</div>
								</CardContent>
							</Card>

							<p className="text-center text-xs text-slate-500">
								{CAR_RENTAL_PORTAL.footer}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
