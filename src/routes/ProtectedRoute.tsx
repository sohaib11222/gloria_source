import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PageLoader } from "../components/ui/Loader";
import { PendingApproval } from "../components/PendingApproval";
import {
	clearSourceAuth,
	expiredSignInNotice,
	isAuthTokenExpired,
} from "../lib/authSession";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const location = useLocation();
	const token = localStorage.getItem("token");
	const [isChecking, setIsChecking] = useState(true);
	const [isApproved, setIsApproved] = useState(false);
	const [shouldLogin, setShouldLogin] = useState(false);

	useEffect(() => {
		const checkApprovalStatus = () => {
			const currentToken = localStorage.getItem("token");
			if (!currentToken) {
				setShouldLogin(true);
				setIsChecking(false);
				return;
			}

			if (isAuthTokenExpired(currentToken)) {
				clearSourceAuth(expiredSignInNotice());
				setShouldLogin(true);
				setIsChecking(false);
				return;
			}

			try {
				const userStr = localStorage.getItem("user");
				if (!userStr) {
					clearSourceAuth("Please sign in again to continue.");
					setShouldLogin(true);
					setIsChecking(false);
					return;
				}

				const user = JSON.parse(userStr);
				const approvalStatus = user?.company?.approvalStatus;
				const status = user?.company?.status;

				// Check if approved and active
				if (approvalStatus === "APPROVED" && status === "ACTIVE") {
					setIsApproved(true);
				} else {
					setIsApproved(false);
				}
			} catch (error) {
				console.error("Error checking approval status:", error);
				clearSourceAuth("Please sign in again to continue.");
				setShouldLogin(true);
			} finally {
				setIsChecking(false);
			}
		};

		checkApprovalStatus();
		const timer = window.setInterval(checkApprovalStatus, 30000);
		return () => window.clearInterval(timer);
	}, [token, location.pathname, location.search]);

	if (isChecking) {
		return <PageLoader />;
	}

	if (shouldLogin || !token) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (!isApproved) {
		return <PendingApproval />;
	}

	return <>{children}</>;
};
