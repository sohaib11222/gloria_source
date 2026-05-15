import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../api/auth";
import { Button } from "../components/ui/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import logoImage from "../assets/logo.jpg";

export default function VerifyEmailPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [otp, setOtp] = useState(["", "", "", ""]);
	const [isLoading, setIsLoading] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);
	const [isResending, setIsResending] = useState(false);
	const lastSubmittedOtp = useRef<string>("");
	const inputRefs = [
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
	];

	// Get email from location state (passed from registration/login) or localStorage after a refresh.
	const email =
		location.state?.email || localStorage.getItem("pendingEmail") || "";

	useEffect(() => {
		// Redirect to register if no email is provided
		if (!email) {
			toast.error("Please register or sign in first");
			navigate("/register");
		} else {
			localStorage.setItem("pendingEmail", email);
			// Focus on first input
			inputRefs[0].current?.focus();
		}
	}, [email, navigate]);

	useEffect(() => {
		if (resendTimer <= 0) return;
		const timer = window.setTimeout(
			() => setResendTimer((seconds) => Math.max(0, seconds - 1)),
			1000,
		);
		return () => window.clearTimeout(timer);
	}, [resendTimer]);

	const handleOtpChange = (index: number, value: string) => {
		// Only allow numbers
		if (value && !/^\d$/.test(value)) {
			return;
		}

		const newOtp = [...otp];
		newOtp[index] = value;

		setOtp(newOtp);

		// Auto-focus next input
		if (value && index < 3) {
			inputRefs[index + 1].current?.focus();
		}
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		// Handle backspace
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputRefs[index - 1].current?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").trim();

		// Only process if it's a 4-digit number
		if (/^\d{4}$/.test(pastedData)) {
			const digits = pastedData.split("");
			setOtp(digits);
			// Focus on last input
			inputRefs[3].current?.focus();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const otpValue = otp.join("");

		if (otpValue.length !== 4) {
			toast.error("Please enter all 4 digits");
			return;
		}

		// Prevent multiple submissions
		if (isLoading) {
			return;
		}

		// Prevent submitting the same OTP twice
		if (lastSubmittedOtp.current === otpValue) {
			return;
		}

		setIsLoading(true);
		lastSubmittedOtp.current = otpValue;

		try {
			const response = await authApi.verifyEmail({
				email,
				otp: otpValue,
			});

			// Store tokens and user data
			localStorage.setItem("token", response.access);
			localStorage.setItem("refreshToken", response.refresh);
			localStorage.setItem("user", JSON.stringify(response.user));
			localStorage.removeItem("pendingEmail");

			toast.success(response.message || "Email verified successfully!");

			// Check approval status before navigating
			if (response.user?.company?.approvalStatus !== "APPROVED") {
				// Account is pending approval, will be handled by ProtectedRoute
				navigate("/source");
			} else {
				// Account is approved, navigate to dashboard
				navigate("/source");
			}
		} catch (error: any) {
			console.error("Verification failed:", error);
			toast.error(
				error.response?.data?.message ||
					"Verification failed. Please check your OTP.",
			);
			// Clear OTP on error
			setOtp(["", "", "", ""]);
			lastSubmittedOtp.current = ""; // Reset last submitted OTP on error
			inputRefs[0].current?.focus();
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!email) {
			toast.error(
				"Email address is missing. Please register or sign in again.",
			);
			return;
		}
		if (resendTimer > 0 || isResending) return;

		setIsResending(true);
		try {
			const response = await authApi.resendOTP(email);
			setResendTimer(60);
			if (response.emailSent === false) {
				toast.error(
					response.message ||
						"OTP was generated but could not be emailed. Please check mail configuration.",
				);
			} else {
				toast.success(response.message || "OTP resent to your email");
			}
		} catch (error: any) {
			toast.error(
				error.response?.data?.message ||
					error.message ||
					"Failed to resend OTP",
			);
		} finally {
			setIsResending(false);
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
						Verify Your Email
					</h2>
					<p className="text-sm text-gray-600 mb-3">
						We've sent a 4-digit verification code to
					</p>
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded border border-gray-200">
						<Mail className="w-4 h-4 text-gray-600" />
						<p className="text-sm font-medium text-gray-900">{email}</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold text-gray-900">
							Enter Verification Code
						</CardTitle>
						<p className="text-sm text-gray-600 mt-1">
							Please check your email and enter the code below
						</p>
					</CardHeader>
					<CardContent className="pt-6 pb-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="flex justify-center gap-3 sm:gap-4">
								{otp.map((digit, index) => (
									<input
										key={index}
										ref={inputRefs[index]}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleOtpChange(index, e.target.value)}
										onKeyDown={(e) => handleKeyDown(index, e)}
										onPaste={index === 0 ? handlePaste : undefined}
										className={`
                      w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-medium 
                      border-2 rounded transition-colors
                      ${
												digit
													? "border-slate-600 bg-slate-50 text-slate-900"
													: "border-gray-300 bg-white text-gray-900"
											}
                      focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
										disabled={isLoading}
									/>
								))}
							</div>

							{otp.join("").length === 4 && (
								<div className="flex items-center justify-center gap-2 text-green-700">
									<CheckCircle className="w-5 h-5" />
									<p className="text-sm font-medium">Code entered</p>
								</div>
							)}

							<Button
								type="submit"
								loading={isLoading}
								className="w-full"
								disabled={otp.join("").length !== 4}
							>
								{isLoading ? "Verifying..." : "Verify Email"}
							</Button>

							<div className="pt-4 border-t border-gray-200">
								<div className="text-center space-y-3">
									<p className="text-sm text-gray-600">
										Didn't receive the code?{" "}
										<button
											type="button"
											onClick={handleResend}
											disabled={resendTimer > 0 || isResending}
											className={`font-medium transition-colors underline inline-flex items-center gap-1 ${
												resendTimer > 0 || isResending
													? "text-gray-400 cursor-not-allowed"
													: "text-slate-700 hover:text-slate-900"
											}`}
										>
											<RefreshCw
												className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
											/>
											{isResending
												? "Sending..."
												: resendTimer > 0
													? `Resend code in ${resendTimer}s`
													: "Resend Code"}
										</button>
									</p>

									<button
										type="button"
										onClick={() => navigate("/register")}
										className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
									>
										<ArrowLeft className="w-4 h-4" />
										Back to Registration
									</button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>

				<div className="text-center">
					<p className="text-xs text-gray-500">Gloria Connect</p>
				</div>
			</div>
		</div>
	);
}
