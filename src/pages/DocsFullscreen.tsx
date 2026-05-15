import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import SdkGuide from "../components/docs/SdkGuide";
import SourcePortalGuide from "../components/docs/SourcePortalGuide";
import SourceApiReference from "../components/docs/SourceApiReference";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { Loader } from "../components/ui/Loader";
import "./DocsFullscreen.css";

type DocCodeSample = {
	lang: string;
	label: string;
	code: string;
};

type DocEndpoint = {
	id: string;
	name: string;
	description?: string;
	method: string;
	path: string;
	headers?: { name: string; required: boolean; description?: string }[];
	query?: {
		name: string;
		required: boolean;
		type?: string;
		description?: string;
	}[];
	body?: {
		name: string;
		required: boolean;
		type?: string;
		description?: string;
	}[];
	responses?: { status: number; description?: string; bodyExample?: any }[];
	codeSamples?: DocCodeSample[];
};

type DocCategory = {
	id: string;
	name: string;
	description?: string;
	endpoints: DocEndpoint[];
};

const METHOD_COLORS: Record<string, string> = {
	GET: "#10b981",
	POST: "#3b82f6",
	PUT: "#f97316",
	DELETE: "#ef4444",
	PATCH: "#a855f7",
	gRPC: "#0f766e",
};

type EndpointGuide = {
	eyebrow: string;
	summary: string;
	flow: string[];
	cards: { title: string; text: string }[];
	requestExample?: any;
	responseExample?: any;
	errorRows?: Array<[string, string, string]>;
	notes?: string[];
};

const sampleValueForField = (field: { name: string; type?: string }) => {
	const name = field.name.toLowerCase();
	if (name.includes("email")) return "source@example.com";
	if (name.includes("password")) return "••••••••";
	if (name === "otp" || name.includes("otp")) return "1234";
	if (name.includes("type")) return "SOURCE";
	if (name.includes("companyname")) return "Example Rental Supplier";
	if (name.includes("source_id") || name.includes("sourceid"))
		return "source_company_id";
	if (name.includes("agent_id") || name.includes("agentid"))
		return "agent_company_id";
	if (name.includes("agreement")) return "AGR-2026-00042";
	if (name.includes("unlocode")) return "AEDXB";
	if (field.type === "number") return 30;
	if (field.type === "boolean") return true;
	if (field.type === "array") return [];
	return `YOUR_${field.name.toUpperCase()}`;
};

const buildRequestExample = (endpoint: DocEndpoint) => {
	if (!endpoint.body?.length) return null;
	return endpoint.body.reduce<Record<string, any>>((acc, field) => {
		acc[field.name] = sampleValueForField(field);
		return acc;
	}, {});
};

const getEndpointGuide = (endpoint: DocEndpoint): EndpointGuide => {
	if (endpoint.id === "auth-login") {
		return {
			eyebrow: "Authentication",
			summary:
				"Login is a public endpoint used by Source, Agent, and Admin apps. It validates credentials, email verification, approval status, and account status before issuing access and refresh tokens.",
			flow: [
				"Client posts email and password to /auth/login.",
				"Backend verifies the user and password hash.",
				"If the company email is not verified, backend returns EMAIL_NOT_VERIFIED and the portal redirects to /verify-email.",
				"If the company is not approved or not active, backend returns the relevant 403 response.",
				"On success, the portal stores access, refresh, and user in localStorage and opens the correct dashboard.",
			],
			cards: [
				{
					title: "Public endpoint",
					text: "Do not send Authorization header. This endpoint creates the authenticated session.",
				},
				{
					title: "Verification-aware",
					text: "Unverified users receive EMAIL_NOT_VERIFIED with email and PENDING_VERIFICATION status.",
				},
				{
					title: "Approval-aware",
					text: "Pending or rejected companies receive NOT_APPROVED and must not be treated as logged in.",
				},
			],
			requestExample: {
				email: "source@example.com",
				["pass" + "word"]: "••••••••",
			},
			responseExample: {
				token: "JWT_ACCESS_TOKEN",
				access: "JWT_ACCESS_TOKEN",
				refresh: "JWT_REFRESH_TOKEN",
				companyId: "cmi4xxhuf00001uqb3zadk8oo",
				user: {
					id: "user_123",
					email: "source@example.com",
					role: "SOURCE_USER",
					companyId: "cmi4xxhuf00001uqb3zadk8oo",
					company: {
						id: "cmi4xxhuf00001uqb3zadk8oo",
						companyName: "Example Rental Supplier",
						type: "SOURCE",
						status: "ACTIVE",
						approvalStatus: "APPROVED",
						companyWebsiteUrl: "https://supplier.example",
						registrationBranchName: "Dubai Airport Branch",
						companyAddress: "Dubai International Airport",
						registrationPhotoUrl:
							"/api/uploads/source-registration/example.jpg",
						adapterType: "grpc",
						grpcEndpoint: "supplier.example:51061",
						httpEndpoint: "https://supplier.example/gloria",
					},
				},
			},
			errorRows: [
				[
					"401 AUTH_ERROR",
					"Invalid credentials",
					"Show a generic invalid email/password error.",
				],
				[
					"403 EMAIL_NOT_VERIFIED",
					"Email verification pending",
					"Store pendingEmail and redirect to /verify-email.",
				],
				[
					"403 NOT_APPROVED",
					"Admin approval pending/rejected",
					"Show pending approval only for a valid unexpired session state.",
				],
				[
					"403 ACCOUNT_NOT_ACTIVE",
					"Company is not ACTIVE",
					"Ask the user to contact support.",
				],
				[
					"403 ADMIN_PORTAL_ONLY",
					"Admin app attempted non-admin login",
					"Use Agent or Source portal for non-admin accounts.",
				],
			],
			notes: [
				"Source and Agent login pages intentionally redirect EMAIL_NOT_VERIFIED users back to /verify-email.",
				"Expired/invalid access tokens are handled by protected API calls and redirect users back to /login with an expiry toast.",
			],
		};
	}

	if (endpoint.id === "auth-verify-email") {
		return {
			eyebrow: "Email verification",
			summary:
				"Verify Email completes registration by validating the 4-digit OTP sent to the user. On success it marks the company email as verified and issues access/refresh tokens.",
			flow: [
				"Registration stores pendingEmail in the portal and navigates to /verify-email.",
				"The user enters the 4-digit OTP from email.",
				"Backend calls EmailVerificationService.verifyOTP(email, otp).",
				"On success, backend returns message, access, refresh, and complete user/company data.",
				"The portal stores tokens and user, removes pendingEmail, then routes based on company approval/status.",
			],
			cards: [
				{
					title: "Public endpoint",
					text: "No bearer token is required because users verify before they have a session.",
				},
				{
					title: "4-digit OTP",
					text: "The backend expects an exact 4-character OTP string and rejects expired or mismatched values.",
				},
				{
					title: "Resend flow",
					text: "Use /auth/resend-otp from the Verify Email page, then enforce a 60-second frontend cooldown.",
				},
			],
			requestExample: { email: "source@example.com", otp: "1234" },
			responseExample: {
				message: "Email verified successfully!",
				access: "JWT_ACCESS_TOKEN",
				refresh: "JWT_REFRESH_TOKEN",
				user: {
					id: "user_123",
					email: "source@example.com",
					role: "SOURCE_USER",
					companyId: "cmi4xxhuf00001uqb3zadk8oo",
					company: {
						id: "cmi4xxhuf00001uqb3zadk8oo",
						companyName: "Example Rental Supplier",
						type: "SOURCE",
						status: "PENDING",
						approvalStatus: "PENDING",
					},
				},
			},
			errorRows: [
				[
					"400 INVALID_OTP",
					"Invalid or expired OTP code",
					"Let the user retry or request a new code.",
				],
				[
					"400 VALIDATION_ERROR",
					"Email or OTP shape is invalid",
					"Send a valid email and 4-digit OTP string.",
				],
				[
					"500 INTERNAL_ERROR",
					"User company not found",
					"Escalate to support/admin data review.",
				],
			],
			notes: [
				"The OTP is never returned in API responses. In development only, failed mail delivery may log the OTP to the server console.",
				"After verification, Source accounts may still be pending admin approval; this is separate from email verification.",
			],
		};
	}

	return {
		eyebrow: "Endpoint reference",
		summary:
			endpoint.description ||
			"Generated endpoint documentation from the Gloria backend docs registry.",
		flow: [
			"Review method and path.",
			"Send required headers, query parameters, and body fields.",
			"Handle success and error responses shown below.",
		],
		cards: [
			{ title: "Method", text: `${endpoint.method} ${endpoint.path}` },
			{
				title: "Authentication",
				text: endpoint.headers?.some(
					(h) => h.name.toLowerCase() === "authorization",
				)
					? "Requires Bearer token."
					: "No documented bearer token required.",
			},
			{
				title: "Use in portal",
				text: "This endpoint is part of the Gloria Connect Source/API workflow.",
			},
		],
		requestExample: buildRequestExample(endpoint),
		responseExample: endpoint.responses?.find(
			(r) => r.status >= 200 && r.status < 300,
		)?.bodyExample,
	};
};

const EndpointDetail: React.FC<{
	endpoint: DocEndpoint;
	categories: DocCategory[];
	activeCode: string;
	setActiveCode: (lang: string) => void;
	onNavigateEndpoint: (endpoint: DocEndpoint) => void;
}> = ({
	endpoint,
	categories,
	activeCode,
	setActiveCode,
	onNavigateEndpoint,
}) => {
	const guide = getEndpointGuide(endpoint);
	const requestExample = guide.requestExample ?? buildRequestExample(endpoint);
	const successResponse =
		guide.responseExample ??
		endpoint.responses?.find((r) => r.status >= 200 && r.status < 300)
			?.bodyExample;
	const endpointEntries = categories.flatMap((category) =>
		(category.endpoints || []).map((entry) => ({ endpoint: entry, category })),
	);
	const currentIndex = endpointEntries.findIndex(
		(entry) => entry.endpoint.id === endpoint.id,
	);
	const currentEntry = currentIndex >= 0 ? endpointEntries[currentIndex] : null;
	const previousEntry =
		currentIndex > 0 ? endpointEntries[currentIndex - 1] : null;
	const nextEntry =
		currentIndex >= 0 && currentIndex < endpointEntries.length - 1
			? endpointEntries[currentIndex + 1]
			: null;
	const currentCategory = currentEntry?.category;
	const endpointPosition =
		currentIndex >= 0
			? `${currentIndex + 1} of ${endpointEntries.length}`
			: null;

	return (
		<div className="docs-endpoint-pro">
			<section className="docs-endpoint-hero-pro">
				<div className="docs-endpoint-breadcrumb">
					<span>API Reference</span>
					<span>/</span>
					<span>{currentCategory?.name || guide.eyebrow}</span>
					{endpointPosition && (
						<span className="docs-endpoint-position">{endpointPosition}</span>
					)}
				</div>
				<div className="docs-endpoint-eyebrow">{guide.eyebrow}</div>
				<h1>{endpoint.name}</h1>
				<p>{guide.summary}</p>
				<div className="docs-endpoint-meta-pro">
					<span
						className="docs-method-badge pro"
						style={{ background: METHOD_COLORS[endpoint.method] || "#6b7280" }}
					>
						{endpoint.method}
					</span>
					<code>{endpoint.path}</code>
				</div>
			</section>

			<section className="docs-endpoint-card-grid">
				{guide.cards.map((card) => (
					<div className="docs-endpoint-info-card" key={card.title}>
						<span>{card.title}</span>
						<p>{card.text}</p>
					</div>
				))}
			</section>

			<nav
				className="docs-endpoint-local-nav"
				aria-label="Endpoint page sections"
			>
				<a href="#flow">Flow</a>
				<a href="#request">Request</a>
				<a href="#responses">Responses</a>
				{endpoint.codeSamples?.length ? <a href="#examples">Examples</a> : null}
				{guide.notes?.length ? <a href="#notes">Notes</a> : null}
			</nav>

			<section id="flow" className="docs-endpoint-section-pro">
				<div className="docs-endpoint-section-heading">
					<span>Flow</span>
					<h2>How this endpoint is used</h2>
				</div>
				<div className="docs-endpoint-flow">
					{guide.flow.map((step, index) => (
						<div key={step}>
							<span>{index + 1}</span>
							<p>{step}</p>
						</div>
					))}
				</div>
			</section>

			<section
				id="request"
				className="docs-endpoint-section-pro docs-request-section-pro"
			>
				<div className="docs-endpoint-section-heading">
					<span>Request contract</span>
					<h2>Request</h2>
				</div>

				<div className="docs-request-summary-grid">
					<div>
						<span>Method</span>
						<strong>{endpoint.method}</strong>
					</div>
					<div>
						<span>Path</span>
						<strong>{endpoint.path}</strong>
					</div>
					<div>
						<span>Query fields</span>
						<strong>{endpoint.query?.length || 0}</strong>
					</div>
					<div>
						<span>Body fields</span>
						<strong>{endpoint.body?.length || 0}</strong>
					</div>
				</div>

				{endpoint.headers && endpoint.headers.length > 0 && (
					<div className="docs-param-group">
						<h3 className="docs-param-title">Headers</h3>
						<div className="docs-table-wrapper pro">
							<table className="docs-table">
								<thead>
									<tr>
										<th>Header</th>
										<th>Required</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									{endpoint.headers.map((h) => (
										<tr key={h.name}>
											<td>
												<code className="docs-code-inline">{h.name}</code>
											</td>
											<td>
												{h.required ? (
													<span className="docs-required">Required</span>
												) : (
													<span className="docs-optional">Optional</span>
												)}
											</td>
											<td>{h.description ?? "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{endpoint.query && endpoint.query.length > 0 && (
					<div className="docs-param-group">
						<h3 className="docs-param-title">Query parameters</h3>
						<div className="docs-table-wrapper pro">
							<table className="docs-table">
								<thead>
									<tr>
										<th>Parameter</th>
										<th>Required</th>
										<th>Type</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									{endpoint.query.map((q) => (
										<tr key={q.name}>
											<td>
												<code className="docs-code-inline">{q.name}</code>
											</td>
											<td>
												{q.required ? (
													<span className="docs-required">Required</span>
												) : (
													<span className="docs-optional">Optional</span>
												)}
											</td>
											<td>
												<span className="docs-type">{q.type ?? "string"}</span>
											</td>
											<td>{q.description ?? "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{endpoint.body && endpoint.body.length > 0 && (
					<div className="docs-param-group">
						<h3 className="docs-param-title">Request body</h3>
						<div className="docs-table-wrapper pro">
							<table className="docs-table">
								<thead>
									<tr>
										<th>Field</th>
										<th>Required</th>
										<th>Type</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									{endpoint.body.map((b) => (
										<tr key={b.name}>
											<td>
												<code className="docs-code-inline">{b.name}</code>
											</td>
											<td>
												{b.required ? (
													<span className="docs-required">Required</span>
												) : (
													<span className="docs-optional">Optional</span>
												)}
											</td>
											<td>
												<span className="docs-type">{b.type ?? "string"}</span>
											</td>
											<td>{b.description ?? "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{requestExample ? (
					<div className="docs-endpoint-code-pair">
						<div>
							<h3>JSON body example</h3>
							<pre className="docs-code-block pro">
								<code>{JSON.stringify(requestExample, null, 2)}</code>
							</pre>
						</div>
					</div>
				) : (
					<div className="docs-empty docs-empty-pro">
						<span>✓</span>
						<strong>No request body required</strong>
						<p>
							Send the method, path, and any documented query parameters only.
						</p>
					</div>
				)}
			</section>

			<section id="responses" className="docs-endpoint-section-pro">
				<div className="docs-endpoint-section-heading">
					<span>Response contract</span>
					<h2>Responses</h2>
				</div>
				{successResponse && (
					<div className="docs-response-card pro success-card">
						<div className="docs-response-header">
							<span className="docs-status-badge success">200</span>
							<span className="docs-response-description">
								Successful response
							</span>
						</div>
						<pre className="docs-code-block pro">
							<code>{JSON.stringify(successResponse, null, 2)}</code>
						</pre>
					</div>
				)}
				{endpoint.responses?.map((resp, idx) =>
					resp.status >= 200 && resp.status < 300 && successResponse ? null : (
						<div key={idx} className="docs-response-card pro">
							<div className="docs-response-header">
								<span
									className={`docs-status-badge ${resp.status >= 200 && resp.status < 300 ? "success" : resp.status >= 400 ? "error" : "warning"}`}
								>
									{resp.status}
								</span>
								<span className="docs-response-description">
									{resp.description || "Response"}
								</span>
							</div>
							{resp.bodyExample && (
								<pre className="docs-code-block pro">
									<code>{JSON.stringify(resp.bodyExample, null, 2)}</code>
								</pre>
							)}
						</div>
					),
				)}
				{guide.errorRows && guide.errorRows.length > 0 && (
					<div className="docs-table-wrapper pro docs-error-table">
						<table className="docs-table">
							<thead>
								<tr>
									<th>Error</th>
									<th>Meaning</th>
									<th>Recommended handling</th>
								</tr>
							</thead>
							<tbody>
								{guide.errorRows.map(([code, meaning, handling]) => (
									<tr key={code}>
										<td>
											<code className="docs-code-inline">{code}</code>
										</td>
										<td>{meaning}</td>
										<td>{handling}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{endpoint.codeSamples && endpoint.codeSamples.length > 0 && (
				<section id="examples" className="docs-endpoint-section-pro">
					<div className="docs-endpoint-section-heading">
						<span>Examples</span>
						<h2>Code samples</h2>
					</div>
					<div className="docs-code-tabs pro">
						{endpoint.codeSamples.map((cs) => (
							<button
								key={cs.lang}
								className={`docs-code-tab ${activeCode === cs.lang ? "active" : ""}`}
								onClick={() => setActiveCode(cs.lang)}
							>
								{cs.label}
							</button>
						))}
					</div>
					<pre className="docs-code-block pro">
						<code>
							{endpoint.codeSamples.find((cs) => cs.lang === activeCode)
								?.code ?? "# No sample available"}
						</code>
					</pre>
				</section>
			)}

			{guide.notes && guide.notes.length > 0 && (
				<section
					id="notes"
					className="docs-endpoint-section-pro docs-endpoint-notes"
				>
					<div className="docs-endpoint-section-heading">
						<span>Implementation notes</span>
						<h2>Portal behavior</h2>
					</div>
					<ul>
						{guide.notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
				</section>
			)}

			<section
				className="docs-endpoint-next-prev"
				aria-label="Endpoint navigation"
			>
				<button
					type="button"
					disabled={!previousEntry}
					onClick={() =>
						previousEntry && onNavigateEndpoint(previousEntry.endpoint)
					}
				>
					<span>Previous endpoint</span>
					<strong>
						{previousEntry ? previousEntry.endpoint.name : "Start of reference"}
					</strong>
				</button>
				<button
					type="button"
					disabled={!nextEntry}
					onClick={() => nextEntry && onNavigateEndpoint(nextEntry.endpoint)}
				>
					<span>Next endpoint</span>
					<strong>
						{nextEntry ? nextEntry.endpoint.name : "End of reference"}
					</strong>
				</button>
			</section>
		</div>
	);
};

const DocsFullscreen: React.FC = () => {
	const { endpointId, view } = useParams<{
		endpointId?: string;
		view?: string;
	}>();
	const navigate = useNavigate();
	const [categories, setCategories] = useState<DocCategory[]>([]);

	const isSdkPath = view === "sdk" || endpointId === "sdk";
	const isApiRefPath =
		view === "api-reference" || endpointId === "api-reference";
	const isGettingStartedPath =
		view === "getting-started" ||
		endpointId === "getting-started" ||
		(!view && !endpointId);

	// Safe setter that always ensures categories is an array
	const setCategoriesSafe = (data: any) => {
		if (Array.isArray(data)) {
			setCategories(data);
		} else if (data && typeof data === "object") {
			// Try to extract array from common response structures
			const arrayData = data.categories || data.items || data.data || [];
			setCategories(Array.isArray(arrayData) ? arrayData : []);
		} else {
			setCategories([]);
		}
	};
	const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(
		null,
	);
	const [activeCode, setActiveCode] = useState<string>("curl");
	// Align initial tab with URL (/docs-fullscreen/sdk → SDK Guide) before first fetch completes
	const [showSdkGuide, setShowSdkGuide] = useState<boolean>(isSdkPath);
	const [showApiReference, setShowApiReference] =
		useState<boolean>(isApiRefPath);
	const [showGettingStarted, setShowGettingStarted] = useState<boolean>(
		isGettingStartedPath && !isSdkPath && !isApiRefPath,
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<any>(null);

	const selectEndpoint = (endpoint: DocEndpoint) => {
		setSelectedEndpoint(endpoint);
		setActiveCode(endpoint.codeSamples?.[0]?.lang ?? "curl");
		setShowSdkGuide(false);
		setShowApiReference(false);
		setShowGettingStarted(false);
		navigate(`/docs-fullscreen/${endpoint.id}`, { replace: true });
	};

	useEffect(() => {
		setIsLoading(true);
		setError(null);
		api
			.get("/docs/source")
			.then((res) => {
				// Ensure we always set an array
				const data = res?.data;
				let categoriesData: DocCategory[] = [];

				if (Array.isArray(data)) {
					categoriesData = data;
				} else if (data && typeof data === "object") {
					categoriesData = Array.isArray(data.categories)
						? data.categories
						: Array.isArray(data.items)
							? data.items
							: Array.isArray(data.data)
								? data.data
								: [];
				}

				setCategoriesSafe(categoriesData);

				// Treat reserved path segments as views (so links like /docs-fullscreen/api-reference work)
				if (endpointId === "api-reference") {
					setShowApiReference(true);
					setShowGettingStarted(false);
					setShowSdkGuide(false);
					setSelectedEndpoint(null);
				} else if (endpointId === "getting-started") {
					setShowGettingStarted(true);
					setShowApiReference(false);
					setShowSdkGuide(false);
					setSelectedEndpoint(null);
				} else if (endpointId === "sdk") {
					setShowSdkGuide(true);
					setShowApiReference(false);
					setShowGettingStarted(false);
					setSelectedEndpoint(null);
				} else if (endpointId) {
					const endpoint = categoriesData
						?.flatMap((cat) => cat.endpoints || [])
						.find((ep) => ep.id === endpointId);
					if (endpoint) {
						setSelectedEndpoint(endpoint);
						setActiveCode(endpoint.codeSamples?.[0]?.lang ?? "curl");
						setShowGettingStarted(false);
						setShowSdkGuide(false);
					}
				} else if (!view && !endpointId) {
					// Default to Getting Started when no view or endpoint specified
					setShowGettingStarted(true);
					setShowSdkGuide(false);
					setSelectedEndpoint(null);
				}
				setIsLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load docs:", err);
				setError(err);
				setCategoriesSafe([]); // Ensure categories is always an array on error
				setIsLoading(false);
			});
	}, [endpointId, view]);

	return (
		<div className="docs-fullscreen">
			<header className="docs-header">
				<div className="docs-header-content">
					<h1 className="docs-logo">Gloria Connect Docs</h1>
					<nav className="docs-nav">
						<button
							className={`docs-nav-btn ${showGettingStarted ? "active" : ""}`}
							onClick={() => {
								setShowGettingStarted(true);
								setShowSdkGuide(false);
								setSelectedEndpoint(null);
								navigate("/docs-fullscreen/getting-started", { replace: true });
							}}
						>
							Source Guide
						</button>
						<button
							className={`docs-nav-btn ${showApiReference ? "active" : ""}`}
							onClick={() => {
								setShowApiReference(true);
								setShowSdkGuide(false);
								setShowGettingStarted(false);
								setSelectedEndpoint(null);
								navigate("/docs-fullscreen/api-reference", { replace: true });
							}}
						>
							API Reference
						</button>
						<button
							className={`docs-nav-btn ${showSdkGuide ? "active" : ""}`}
							onClick={() => {
								setShowSdkGuide(true);
								setShowApiReference(false);
								setShowGettingStarted(false);
								setSelectedEndpoint(null);
								navigate("/docs-fullscreen/sdk", { replace: true });
							}}
						>
							SDK Guide
						</button>
						<div className="docs-nav-dropdown">
							<button className="docs-nav-btn">API Reference ▼</button>
							<div className="docs-nav-menu">
								{(Array.isArray(categories) ? categories : []).map((cat) => (
									<div key={cat.id} className="docs-nav-category">
										<div className="docs-nav-category-title">{cat.name}</div>
										{(Array.isArray(cat?.endpoints) ? cat.endpoints : []).map(
											(ep) => (
												<button
													key={ep.id}
													className={`docs-nav-endpoint ${selectedEndpoint?.id === ep.id ? "active" : ""}`}
													onClick={() => selectEndpoint(ep)}
												>
													<span
														className="docs-nav-method"
														style={{
															background: METHOD_COLORS[ep.method] || "#6b7280",
														}}
													>
														{ep.method}
													</span>
													<span className="docs-nav-path">{ep.path}</span>
												</button>
											),
										)}
									</div>
								))}
							</div>
						</div>
					</nav>
				</div>
			</header>

			<main className="docs-fullscreen-main">
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<Loader />
					</div>
				) : error ? (
					<div className="flex items-center justify-center h-full p-8">
						<ErrorDisplay
							error={error}
							title="Failed to load API documentation"
						/>
					</div>
				) : showGettingStarted ? (
					<SourcePortalGuide />
				) : showApiReference ? (
					<SourceApiReference />
				) : showSdkGuide ? (
					<SdkGuide role="source" />
				) : selectedEndpoint ? (
					<EndpointDetail
						endpoint={selectedEndpoint}
						categories={categories}
						activeCode={activeCode}
						setActiveCode={setActiveCode}
						onNavigateEndpoint={selectEndpoint}
					/>
				) : (
					<div className="docs-empty-state">
						<p>Select an endpoint from the navigation to view documentation</p>
					</div>
				)}
			</main>
		</div>
	);
};

export default DocsFullscreen;
