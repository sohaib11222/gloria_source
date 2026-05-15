import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../lib/apiConfig";
import { SdkDownloadButton } from "./SdkDownloadButton";
import "./docs.css";

type SectionId =
	| "overview"
	| "choose-path"
	| "download-install"
	| "portal-rest"
	| "bundle-architecture"
	| "laravel"
	| "grpc-wrapper"
	| "payloads"
	| "testing"
	| "errors"
	| "production";

type Props = { role?: "agent" | "source" | "admin" };

const sections: Array<{ id: SectionId; label: string }> = [
	{ id: "overview", label: "SDK overview" },
	{ id: "choose-path", label: "Choose a path" },
	{ id: "download-install", label: "Download & install" },
	{ id: "portal-rest", label: "Source REST flow" },
	{ id: "bundle-architecture", label: "Bundle architecture" },
	{ id: "laravel", label: "Laravel adapter" },
	{ id: "grpc-wrapper", label: "gRPC wrapper" },
	{ id: "payloads", label: "Payload mapping" },
	{ id: "testing", label: "Testing workflow" },
	{ id: "errors", label: "Errors" },
	{ id: "production", label: "Production checklist" },
];

const CodeBlock: React.FC<{ title?: string; children: string }> = ({
	title,
	children,
}) => (
	<div className="source-doc-code-card">
		{title && <div className="source-doc-code-title">{title}</div>}
		<pre className="source-doc-code">
			<code>{children}</code>
		</pre>
	</div>
);

const SdkCard: React.FC<{
	badge: string;
	title: string;
	children: React.ReactNode;
}> = ({ badge, title, children }) => (
	<div className="source-doc-panel source-sdk-card">
		<span className="source-doc-pill">{badge}</span>
		<h3>{title}</h3>
		{children}
	</div>
);

const FieldTable: React.FC<{
	rows: Array<[string, string, string]>;
	columns?: [string, string, string];
}> = ({ rows, columns = ["Item", "Where", "Purpose"] }) => (
	<div className="source-doc-table-wrap">
		<table className="source-doc-table">
			<thead>
				<tr>
					{columns.map((column) => (
						<th key={column}>{column}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row) => (
					<tr key={row.join("-")}>
						<td>
							<code>{row[0]}</code>
						</td>
						<td>{row[1]}</td>
						<td>{row[2]}</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

const SdkGuide: React.FC<Props> = ({ role = "source" }) => {
	const [activeSection, setActiveSection] = useState<SectionId>("overview");
	const [companyId, setCompanyId] = useState("YOUR_COMPANY_ID");
	const [companyType, setCompanyType] = useState("SOURCE");
	const [downloadingProto, setDownloadingProto] = useState(false);

	useEffect(() => {
		const userData = localStorage.getItem("user");
		if (!userData) return;
		try {
			const user = JSON.parse(userData);
			if (user?.company?.id) setCompanyId(user.company.id);
			if (user?.company?.type) setCompanyType(user.company.type);
		} catch (error) {
			console.error("Failed to parse user data:", error);
		}
	}, []);

	useEffect(() => {
		const applyHash = () => {
			const hash = (window.location.hash.replace("#", "") ||
				"overview") as SectionId;
			if (sections.some((section) => section.id === hash)) {
				setActiveSection(hash);
				document
					.getElementById(hash)
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		};

		applyHash();

		const handleScroll = () => {
			for (let i = sections.length - 1; i >= 0; i -= 1) {
				const element = document.getElementById(sections[i].id);
				if (!element) continue;
				if (element.getBoundingClientRect().top <= 140) {
					setActiveSection(sections[i].id);
					break;
				}
			}
		};

		window.addEventListener("hashchange", applyHash);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("hashchange", applyHash);
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const roleMessage = useMemo(() => {
		if (role === "agent")
			return "Agent/broker apps use php-agent / CarHireClient. This Source page focuses on the supplier bundle.";
		if (role === "admin")
			return "Admins can use this page to understand what suppliers must deploy and test before approval.";
		return "Source suppliers use this page to connect their fleet/OTA systems to Gloria and operate through the Source Portal.";
	}, [role]);

	const navigateTo = (id: SectionId) => {
		setActiveSection(id);
		window.history.replaceState(null, "", `#${id}`);
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const handleDownloadProto = async () => {
		setDownloadingProto(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${API_BASE_URL}/docs/proto/source_provider.proto`,
				{
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				},
			);
			if (!response.ok) throw new Error("Failed to download proto file");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "source_provider.proto";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			toast.success("Proto file downloaded");
		} catch (error: any) {
			toast.error(error?.message || "Failed to download proto file");
		} finally {
			setDownloadingProto(false);
		}
	};

	return (
		<div className="source-doc-shell source-sdk-shell">
			<aside className="source-doc-sidebar">
				<div className="source-doc-sidebar-title">SDK guide</div>
				<div className="source-sdk-mini-download">
					<strong>Source PHP bundle</strong>
					<span>OTA adapter + Laravel + optional gRPC bridge</span>
					<SdkDownloadButton
						sdkType="php"
						downloadSlug="php-source"
						zipFilename="gloria-php-source-supplier.zip"
						label="Download bundle"
						variant="small"
					/>
				</div>
				<nav>
					{sections.map((section) => (
						<button
							key={section.id}
							type="button"
							className={activeSection === section.id ? "active" : ""}
							onClick={() => navigateTo(section.id)}
						>
							<span>{section.label}</span>
						</button>
					))}
				</nav>
			</aside>

			<article className="source-doc-content">
				<section id="overview" className="source-doc-hero source-sdk-hero">
					<div className="source-doc-eyebrow">Source SDK</div>
					<h1>Supplier integration bundle</h1>
					<p>
						The Source SDK page explains how your rental supplier stack connects
						to Gloria: the Source Portal REST flow, the downloadable PHP
						supplier bundle, the Laravel HTTP adapter, the optional Node gRPC
						wrapper, and the payloads used by Verification, Health, Locations,
						Pricing, Reservations, and Cancellations.
					</p>
					<div className="source-doc-hero-actions">
						<SdkDownloadButton
							sdkType="php"
							downloadSlug="php-source"
							zipFilename="gloria-php-source-supplier.zip"
							label="Download Source PHP bundle"
							variant="default"
						/>
						<button
							className="source-sdk-hero-btn"
							type="button"
							onClick={handleDownloadProto}
							disabled={downloadingProto}
						>
							{downloadingProto
								? "Downloading proto…"
								: "Download source_provider.proto"}
						</button>
					</div>
				</section>

				<section className="source-doc-section source-sdk-context">
					<div className="source-sdk-context-grid">
						<div>
							<span>Role</span>
							<strong>{companyType}</strong>
							<p>{roleMessage}</p>
						</div>
						<div>
							<span>Company ID</span>
							<strong>{companyId}</strong>
							<p>
								Use this as <code>source_id</code> where Source REST examples
								need your company identifier.
							</p>
						</div>
						<div>
							<span>Download slug</span>
							<strong>php-source</strong>
							<p>
								Maps to backend folder <code>sdks/gloria-source-supplier</code>.
							</p>
						</div>
					</div>
				</section>

				<section id="choose-path" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Start here</span>
						<h2>Choose the correct integration path</h2>
						<p>
							There are two supplier-facing surfaces. Most sources use both:
							REST to manage Gloria configuration and the supplier bundle to
							expose fleet/OTA functionality.
						</p>
					</div>
					<div className="source-doc-two-col">
						<SdkCard badge="Portal REST" title="Manage Gloria data">
							<p>
								Use authenticated REST calls when automating what the Source
								Portal already does.
							</p>
							<ul>
								<li>Login and keep JWT token secure.</li>
								<li>Configure endpoint URLs and adapter type.</li>
								<li>Create/import branches and coverage.</li>
								<li>Create agreements and offer them to agents.</li>
								<li>
									Read health, transactions, reservations, and verification
									results.
								</li>
							</ul>
						</SdkCard>
						<SdkCard badge="Supplier bundle" title="Expose your fleet system">
							<p>
								Use the downloaded Source PHP bundle when your supplier system
								speaks OTA/XML or needs a bridge.
							</p>
							<ul>
								<li>PHP adapter builds/parses OTA XML.</li>
								<li>Laravel routes expose normalized HTTP JSON.</li>
								<li>Node wrapper can expose gRPC to Gloria.</li>
								<li>
									Mappings stay aligned with Gloria availability and booking
									contracts.
								</li>
							</ul>
						</SdkCard>
					</div>
					<div className="source-api-note">
						Important: this is not the Agent PHP <code>CarHireClient</code>.
						Agents download <code>php-agent</code>; Sources download{" "}
						<code>php-source</code>.
					</div>
				</section>

				<section id="download-install" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Bundle</span>
						<h2>Download and install</h2>
						<p>
							The backend SDK router packages{" "}
							<code>sdks/gloria-source-supplier</code> as{" "}
							<code>gloria-php-source-supplier.zip</code>.
						</p>
					</div>
					<div className="source-sdk-install-grid">
						<SdkCard badge="1" title="Download from portal">
							<p>
								Requires a valid logged-in token because SDK ZIP downloads are
								protected.
							</p>
							<SdkDownloadButton
								sdkType="php"
								downloadSlug="php-source"
								zipFilename="gloria-php-source-supplier.zip"
								label="Download Source PHP bundle"
								variant="default"
							/>
						</SdkCard>
						<SdkCard badge="2" title="Install PHP adapter">
							<CodeBlock>{`unzip gloria-php-source-supplier.zip
cd gloria-source-supplier/php
composer install
composer test`}</CodeBlock>
						</SdkCard>
						<SdkCard badge="3" title="Install optional gRPC wrapper">
							<CodeBlock>{`cd ../node-wrapper
npm install
npm run build
npm start`}</CodeBlock>
						</SdkCard>
					</div>
					<FieldTable
						rows={[
							[
								"php/",
								"Bundle",
								"Composer package: OTA request builders, response normalizers, supplier exceptions, tests.",
							],
							[
								"laravel/",
								"Bundle",
								"Routes, controller, provider, config, and .env example for Laravel integration.",
							],
							[
								"node-wrapper/",
								"Bundle",
								"gRPC server that forwards Gloria calls to Laravel HTTP routes.",
							],
							[
								"proto/gloria_client_supplier.proto",
								"Bundle",
								"Supplier-side wrapper contract included with the SDK ZIP.",
							],
							[
								"source_provider.proto",
								"Docs API",
								"Gloria middleware SourceProviderService contract used by the main Source gRPC adapter.",
							],
						]}
					/>
				</section>

				<section id="portal-rest" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Source Portal automation</span>
						<h2>REST flow used by the Portal</h2>
						<p>
							Use this flow if your internal tools need to automate Source
							Portal setup. It follows the same order as dashboard onboarding.
						</p>
					</div>
					<CodeBlock title="PHP cURL flow: login, configure, import, agreement, health">
						{`<?php
$API_BASE = 'http://localhost:8080'; // use your Gloria backend origin

function jsonRequest($method, $path, $token = null, $body = null) {
    global $API_BASE;
    $ch = curl_init($API_BASE . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status >= 400) throw new RuntimeException($raw ?: 'HTTP ' . $status);
    return json_decode($raw, true);
}

$login = jsonRequest('POST', '/auth/login', null, [
    'email' => 'source@example.com',
    'password' => 'password123',
]);
$token = $login['access'];
$sourceId = $login['user']['company']['id'];

jsonRequest('PUT', '/endpoints/config', $token, [
    'httpEndpoint' => 'https://supplier.example/gloria',
    'grpcEndpoint' => 'supplier.example:51061',
    'adapterType' => 'grpc',
]);

jsonRequest('POST', '/sources/import-branches', $token);
jsonRequest('POST', '/sources/locations', $token, ['unlocode' => 'AEDXB']);
jsonRequest('POST', '/coverage/source/' . $sourceId . '/sync', $token);

$agreement = jsonRequest('POST', '/agreements', $token, [
    'agent_id' => 'agent_company_id',
    'source_id' => $sourceId,
    'agreement_ref' => 'AGR-2026-00042',
]);
jsonRequest('POST', '/agreements/' . $agreement['id'] . '/offer', $token);

$health = jsonRequest('GET', '/health/my-source', $token);
print_r($health);`}
					</CodeBlock>
					<div className="source-doc-three-col">
						<SdkCard badge="Settings" title="Profile first">
							<p>
								Complete company profile and wait for admin approval before live
								operations.
							</p>
						</SdkCard>
						<SdkCard badge="Locations" title="Branch schema">
							<p>
								Manual branch form is canonical; upload/import normalizes into
								the same fields.
							</p>
						</SdkCard>
						<SdkCard badge="Pricing" title="Endpoint tests">
							<p>
								Use Pricing and Verification tabs before exposing agents to
								offers.
							</p>
						</SdkCard>
					</div>
				</section>

				<section id="bundle-architecture" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Supplier-side stack</span>
						<h2>Bundle architecture</h2>
						<p>
							The bundle keeps XML inside your supplier side. Gloria talks
							protobuf/JSON to the wrapper; the PHP adapter handles OTA XML to
							your fleet endpoint.
						</p>
					</div>
					<div className="source-sdk-architecture">
						<div>
							<strong>Gloria middleware</strong>
							<span>Availability / booking / health calls</span>
						</div>
						<div>
							<strong>Node gRPC wrapper</strong>
							<span>
								<code>ClientSupplierService</code> or SourceProvider bridge
							</span>
						</div>
						<div>
							<strong>Laravel /glora routes</strong>
							<span>HTTP JSON facade for your app</span>
						</div>
						<div>
							<strong>PHP OTA adapter</strong>
							<span>Builds RQ XML and parses RS XML</span>
						</div>
						<div>
							<strong>Supplier fleet/PMS</strong>
							<span>Your inventory and reservation source of truth</span>
						</div>
					</div>
					<CodeBlock title="Bundle folder layout">
						{`gloria-source-supplier/
├── php/                # gloria/client-supplier-adapter composer package
├── laravel/            # controller, routes, provider, config, .env.example
├── node-wrapper/       # gRPC server -> Laravel HTTP bridge
├── proto/              # gloria_client_supplier.proto
├── docs/MAPPING.md     # field and error mapping notes
└── examples/           # wrapper caller example`}
					</CodeBlock>
				</section>

				<section id="laravel" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>HTTP adapter</span>
						<h2>Laravel integration</h2>
						<p>
							Copy the Laravel files into your app, wire the PHP adapter, and
							point it at the supplier OTA HTTP base.
						</p>
					</div>
					<div className="source-doc-two-col">
						<SdkCard badge="Files" title="Copy into Laravel">
							<ul>
								<li>
									<code>laravel/routes/glora.php</code>
								</li>
								<li>
									<code>laravel/config/glora.php</code>
								</li>
								<li>
									<code>GloraController.php</code>
								</li>
								<li>
									<code>GloraServiceProvider.php</code>
								</li>
							</ul>
						</SdkCard>
						<SdkCard badge="Env" title="Configure supplier base URL">
							<CodeBlock>{`GLORA_SUPPLIER_BASE_URL=https://fleet.example/ota
GLORA_HTTP_TIMEOUT=30
GLORA_LOG_CHANNEL=stack`}</CodeBlock>
						</SdkCard>
					</div>
					<CodeBlock title="Expected route shape">
						{`POST /glora/search          -> availability / pricing
POST /glora/book            -> create booking
POST /glora/cancel          -> cancel booking
GET  /glora/booking/{ref}   -> booking status
GET  /glora/branches        -> normalized branch list`}
					</CodeBlock>
				</section>

				<section id="grpc-wrapper" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Optional bridge</span>
						<h2>Node gRPC wrapper</h2>
						<p>
							Use the wrapper when Gloria should call your supplier stack via
							gRPC. It forwards calls to Laravel and returns normalized protobuf
							responses.
						</p>
					</div>
					<CodeBlock title="node-wrapper setup">
						{`cd gloria-source-supplier/node-wrapper
npm install
npm run build

# Windows PowerShell
$env:LARAVEL_HTTP_BASE="http://127.0.0.1:8000"
$env:GLORA_CLIENT_GRPC_PORT="50061"
npm start

# Configure Source Portal gRPC endpoint as:
# your-host.example:50061`}
					</CodeBlock>
					<FieldTable
						columns={["Method", "Laravel route", "Normalized result"]}
						rows={[
							[
								"GetBranches",
								"/glora/branches",
								"Branch rows: id, name, city.",
							],
							[
								"SearchCars",
								"/glora/search",
								"Cars/offers: id, name, price, currency.",
							],
							["BookCar", "/glora/book", "reservation_id and status."],
							[
								"CancelBooking",
								"/glora/cancel",
								"reservation_id and cancellation status.",
							],
							[
								"GetBooking",
								"/glora/booking/{ref}",
								"reservation_id and latest status.",
							],
						]}
					/>
				</section>

				<section id="payloads" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Mapping</span>
						<h2>Payloads and normalized shapes</h2>
						<p>
							These are the practical shapes to preserve when mapping supplier
							OTA XML into Gloria-compatible responses.
						</p>
					</div>
					<div className="source-doc-three-col">
						<SdkCard badge="Branch" title="Location row">
							<CodeBlock>{`{
  "id": "DXBA02",
  "name": "Dubai Airport",
  "city": "Dubai"
}`}</CodeBlock>
						</SdkCard>
						<SdkCard badge="Car" title="Availability row">
							<CodeBlock>{`{
  "id": "CCAR429481853010226",
  "name": "NISSAN VERSA",
  "price": 72.37,
  "currency": "USD"
}`}</CodeBlock>
						</SdkCard>
						<SdkCard badge="Booking" title="Reservation row">
							<CodeBlock>{`{
  "reservation_id": "ABC123",
  "status": "CONFIRMED"
}`}</CodeBlock>
						</SdkCard>
					</div>
					<FieldTable
						rows={[
							[
								"agreement_ref",
								"Gloria REST / gRPC",
								"Commercial agreement reference used for pricing and booking.",
							],
							[
								"supplier_offer_ref",
								"Availability → Booking",
								"Offer reference returned by supplier and passed into CreateBooking.",
							],
							[
								"supplier_booking_ref / reservation_id",
								"Booking",
								"Supplier booking reference for status, modify, and cancellation.",
							],
							[
								"pickup_iso / dropoff_iso",
								"Availability / booking",
								"ISO-8601 pickup and return timestamps.",
							],
							[
								"UN/LOCODE",
								"Locations",
								"Coverage code such as AEDXB or GBLON.",
							],
						]}
					/>
				</section>

				<section id="testing" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Verification</span>
						<h2>Recommended testing workflow</h2>
						<p>
							Use the same sequence the Source Portal uses so problems appear in
							the correct tab.
						</p>
					</div>
					<div className="source-sdk-test-steps">
						{[
							[
								"1",
								"Install locally",
								"Run PHP tests and start Laravel / Node wrapper if used.",
							],
							[
								"2",
								"Configure endpoints",
								"Set HTTP and/or gRPC endpoints in Source → Pricing or endpoint settings.",
							],
							[
								"3",
								"Import branches",
								"Use Location & Branches import and validate manual-style fields.",
							],
							[
								"4",
								"Test pricing",
								"Send Gloria XML/JSON or gRPC availability requests in Pricing/Verification.",
							],
							[
								"5",
								"Run verification",
								"Use Source → Verification for automated checks and history.",
							],
							[
								"6",
								"Watch health",
								"Confirm Health has no active strikes, backoff, or exclusion.",
							],
						].map(([number, title, body]) => (
							<div key={number}>
								<span>{number}</span>
								<strong>{title}</strong>
								<p>{body}</p>
							</div>
						))}
					</div>
					<CodeBlock title="Quick local smoke test">
						{`# PHP adapter
cd gloria-source-supplier/php
composer test

# Laravel route check
curl http://127.0.0.1:8000/glora/branches

# gRPC wrapper check from bundle example
cd ../
npx tsx examples/aggregator-call-client-wrapper.ts`}
					</CodeBlock>
				</section>

				<section id="errors" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Troubleshooting</span>
						<h2>Error handling</h2>
						<p>
							Keep errors explicit. Gloria Health treats failed and slow calls
							as unhealthy samples, so clear error mapping helps fast diagnosis.
						</p>
					</div>
					<FieldTable
						columns={["Code", "Layer", "Meaning"]}
						rows={[
							[
								"CONFIG_ERROR",
								"PHP adapter",
								"Missing supplier URL, credentials, or required adapter setting.",
							],
							[
								"SUPPLIER_TIMEOUT",
								"PHP adapter",
								"Supplier OTA endpoint timed out.",
							],
							[
								"SUPPLIER_HTTP",
								"PHP adapter",
								"Supplier returned non-2xx HTTP.",
							],
							[
								"SUPPLIER_FAULT",
								"PHP adapter",
								"OTA Errors element or fault string in body.",
							],
							[
								"PARSE_ERROR",
								"PHP adapter",
								"XML/JSON response could not be parsed.",
							],
							["EMPTY_RESPONSE", "PHP adapter", "No usable body returned."],
							[
								"INVALID_ARGUMENT",
								"gRPC",
								"Missing agreement_ref, dates, locations, or booking identifiers.",
							],
							[
								"UNAVAILABLE",
								"gRPC",
								"Temporary supplier outage; may contribute to health strikes.",
							],
						]}
					/>
					<CodeBlock title="REST error handling pattern">
						{`$raw = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($status >= 400) {
    $error = json_decode($raw, true) ?: [];
    error_log('Gloria error: ' . ($error['error'] ?? 'UNKNOWN'));
    error_log('Message: ' . ($error['message'] ?? $raw));
    throw new RuntimeException($error['message'] ?? 'Gloria request failed');
}`}
					</CodeBlock>
				</section>

				<section id="production" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Go live</span>
						<h2>Production checklist</h2>
					</div>
					<div className="source-doc-checklist">
						{[
							"Source account is email-verified, approved, and subscribed.",
							"Company profile, logo, website, address, and support contact are complete.",
							"Branch upload/import matches the manual branch form schema.",
							"Location coverage contains valid UN/LOCODEs.",
							"Pricing endpoint returns parsed vehicle offers with stable supplier_offer_ref values.",
							"Booking methods enforce idempotency and return supplier_booking_ref.",
							"Verification passes location, pricing, and gRPC checks.",
							"Health tab shows healthy rate and no current backoff/exclusion.",
						].map((item) => (
							<div key={item}>
								<span>✓</span>
								{item}
							</div>
						))}
					</div>
				</section>
			</article>
		</div>
	);
};

export default SdkGuide;
