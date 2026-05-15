import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RegisterSchema, RegisterForm } from "../lib/validators";
import { authApi } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import toast from "react-hot-toast";
import logoImage from "../assets/logo.jpg";
import api from "../lib/api";

export default function RegisterPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [referralSlug, setReferralSlug] = useState<string | null>(null);
	const [referralLabel, setReferralLabel] = useState<string | null>(null);
	const [registrationPhotoDataUrl, setRegistrationPhotoDataUrl] = useState<
		string | null
	>(null);
	const [registrationPhotoName, setRegistrationPhotoName] = useState<
		string | null
	>(null);
	const registrationPhotoInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const raw = searchParams.get("ref") || searchParams.get("referral");
		const trimmed = raw?.trim();
		if (trimmed) setReferralSlug(trimmed);
	}, [searchParams]);

	useEffect(() => {
		if (!referralSlug) return;
		const ac = new AbortController();
		(async () => {
			try {
				const { data } = await api.get<{
					ok?: boolean;
					label?: string | null;
					restrictToType?: "AGENT" | "SOURCE" | null;
				}>(`/auth/referral/${encodeURIComponent(referralSlug)}`, {
					signal: ac.signal,
				});
				if (data.restrictToType === "AGENT") {
					toast.error("This referral link is for Agent accounts only.");
					setReferralSlug(null);
					setReferralLabel(null);
					return;
				}
				setReferralLabel(data.label ?? null);
			} catch {
				if (!ac.signal.aborted) {
					toast.error(
						"Referral code was not recognized; continuing without it.",
					);
					setReferralSlug(null);
					setReferralLabel(null);
				}
			}
		})();
		return () => ac.abort();
	}, [referralSlug]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterForm>({
		resolver: zodResolver(RegisterSchema),
		defaultValues: {
			type: "SOURCE",
			companyName: "",
			email: "",
			password: "",
			registrationBranchName: "",
			companyAddress: "",
			companyWebsiteUrl: "",
		},
	});

	const onSubmit = async (data: RegisterForm) => {
		setIsLoading(true);
		try {
			console.log("📝 Starting registration for:", data.email);
			const response = await authApi.register({
				...data,
				...(referralSlug ? { referralSlug } : {}),
				...(registrationPhotoDataUrl ? { registrationPhotoDataUrl } : {}),
			});
			console.log("✅ Registration response:", response);

			// Check if response is valid
			if (
				!response ||
				(typeof response === "object" && Object.keys(response).length === 0)
			) {
				console.error("❌ Empty registration response");
				toast.error(
					"Registration completed but no response received. Please check your email or try logging in.",
				);
				return;
			}

			localStorage.setItem("pendingEmail", data.email);
			toast.success(
				response.message ||
					"Registration successful! Please check your email for the verification code. After verification, your account will be pending admin approval.",
			);

			// Navigate to OTP verification page with email
			navigate("/verify-email", { state: { email: data.email } });
		} catch (error: any) {
			console.error("❌ Registration error:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response,
				responseData: error.response?.data,
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

			// Check if this is a true network error (no response at all)
			if (
				error.isNetworkError ||
				(!error.response && error.message?.includes("Network"))
			) {
				toast.error(
					"Network error. Please check your internet connection and try again.",
				);
				return;
			}

			// Extract error message - prioritize API message over HTTP status text
			// Check multiple possible locations for the error message
			let errorMessage = "Registration failed. Please try again.";

			// Priority order: response.data.message > response.message > details.message > message (if not HTTP status)
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.message) {
				errorMessage = error.response.message;
			} else if (error.details?.message) {
				errorMessage = error.details.message;
			} else if (
				error.message &&
				!error.message.startsWith("HTTP ") &&
				!error.message.includes("Network")
			) {
				// Only use error.message if it's not the generic HTTP status message or Network error
				errorMessage = error.message;
			} else if (
				error.response?.data &&
				typeof error.response.data === "object"
			) {
				// Try to extract message from response.data object directly
				const responseData = error.response.data;
				if (responseData.message) {
					errorMessage = responseData.message;
				} else if (
					responseData.error &&
					typeof responseData.error === "string"
				) {
					errorMessage = responseData.error;
				}
			}

			// Filter out generic messages
			if (
				errorMessage === "Network Error" ||
				errorMessage === "Network error" ||
				errorMessage.includes("Network")
			) {
				errorMessage =
					"Unable to connect to server. Please check your internet connection and try again.";
			}

			// Only show toast, don't set error state (removed error UI)
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<div className="flex items-center justify-center mb-4">
						<img
							src={logoImage}
							alt="Gloria Connect"
							className="h-16 w-auto object-contain"
						/>
					</div>
					<h2 className="text-2xl font-semibold text-gray-900 mb-2">
						Create Source Account
					</h2>
					<p className="text-sm text-gray-600">Join as a car rental supplier</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold text-gray-900">
							Get started
						</CardTitle>
						<p className="text-sm text-gray-600 mt-1">
							Enter your details to create an account
						</p>
					</CardHeader>
					<CardContent className="pt-6 pb-6">
						{referralSlug && (
							<div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
								Referral code{" "}
								<span className="font-mono font-semibold">{referralSlug}</span>
								{referralLabel ? ` — ${referralLabel}` : ""} will be attached
								when you create this account.
							</div>
						)}
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							<div>
								<Input
									label="Company Name"
									placeholder="Your company name"
									{...register("companyName")}
									error={errors.companyName?.message}
								/>
							</div>

							<input type="hidden" {...register("type")} value="SOURCE" />

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5">
									Registration photo{" "}
									<span className="text-gray-500 font-normal">(optional)</span>
								</label>
								<input
									ref={registrationPhotoInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) {
											setRegistrationPhotoDataUrl(null);
											setRegistrationPhotoName(null);
											return;
										}
										const maxBytes = 2 * 1024 * 1024;
										if (file.size > maxBytes) {
											toast.error("Image must be 2 MB or smaller.");
											e.target.value = "";
											setRegistrationPhotoDataUrl(null);
											setRegistrationPhotoName(null);
											return;
										}
										const reader = new FileReader();
										reader.onerror = () => {
											toast.error(
												"Could not read this image. Try another file.",
											);
											e.target.value = "";
											setRegistrationPhotoDataUrl(null);
											setRegistrationPhotoName(null);
										};
										reader.onload = () => {
											const result = reader.result;
											if (typeof result === "string") {
												setRegistrationPhotoDataUrl(result);
												setRegistrationPhotoName(file.name);
											}
										};
										reader.readAsDataURL(file);
									}}
								/>
								<p className="text-xs text-gray-500 mt-1">
									JPEG, PNG, or WebP. Shown to admins when reviewing your
									application.
								</p>
								{registrationPhotoDataUrl && (
									<div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
										<div className="flex items-start justify-between gap-3">
											<p
												className="text-xs text-gray-700 min-w-0 flex-1 truncate"
												title={registrationPhotoName ?? undefined}
											>
												{registrationPhotoName
													? `Selected: ${registrationPhotoName}`
													: "Preview"}
											</p>
											<button
												type="button"
												onClick={() => {
													setRegistrationPhotoDataUrl(null);
													setRegistrationPhotoName(null);
													if (registrationPhotoInputRef.current) {
														registrationPhotoInputRef.current.value = "";
													}
												}}
												className="shrink-0 text-xs font-medium text-slate-700 hover:text-slate-900 underline"
											>
												Remove
											</button>
										</div>
										<div className="mt-3 flex justify-center rounded-md border border-gray-200 bg-white p-2">
											<img
												src={registrationPhotoDataUrl}
												alt={
													registrationPhotoName
														? `Preview of ${registrationPhotoName}`
														: "Registration photo preview"
												}
												className="max-h-56 max-w-full object-contain"
											/>
										</div>
									</div>
								)}
							</div>

							<div>
								<Input
									label="Primary branch name"
									placeholder="e.g. Main depot — City Centre"
									{...register("registrationBranchName")}
									error={errors.registrationBranchName?.message}
									helperText="The main branch or office name you operate from (shown to admins during review)."
								/>
							</div>

							<div>
								<Input
									label="Company address"
									placeholder="Street, city, postal code, country"
									{...register("companyAddress")}
									error={errors.companyAddress?.message}
								/>
							</div>

							<div>
								<Input
									label="Company website"
									type="url"
									placeholder="https://www.example.com"
									{...register("companyWebsiteUrl")}
									error={errors.companyWebsiteUrl?.message}
									helperText="Public URL of your rental company (include https://)."
								/>
							</div>

							<div>
								<Input
									label="Email"
									type="email"
									placeholder="company@example.com"
									{...register("email")}
									error={errors.email?.message}
								/>
							</div>

							<div>
								<Input
									label="Password"
									type="password"
									placeholder="Create a secure password"
									{...register("password")}
									error={errors.password?.message}
								/>
							</div>

							<Button type="submit" loading={isLoading} className="w-full mt-4">
								{isLoading ? "Creating account..." : "Create Account"}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<p className="text-sm text-gray-600">
								Already have an account?{" "}
								<button
									onClick={() => navigate("/login")}
									className="font-medium text-slate-700 hover:text-slate-900 transition-colors underline"
								>
									Sign in
								</button>
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="text-center">
					<p className="text-xs text-gray-500">Gloria Connect</p>
				</div>
			</div>
		</div>
	);
}
