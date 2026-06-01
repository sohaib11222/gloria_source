import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
	agreementsApi,
	Agent,
	CreateAgreementRequest,
} from "../api/agreements";
import {
	endpointsApi,
	EndpointConfig,
	Location,
	SourceGrpcTestResponse,
	type ManualGloriaPricingPayload,
} from "../api/endpoints";
import { Button } from "../components/ui/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { SourceInformation } from "../components/SourceInformation";
import { EndpointConfiguration } from "../components/EndpointConfiguration";
import { GrpcConnectionTest } from "../components/GrpcConnectionTest";
import { AvailableLocations } from "../components/AvailableLocations";
import { PendingVerification } from "../components/PendingVerification";
import { GrpcTestRequired } from "../components/GrpcTestRequired";
import { CreateAgreementForm } from "../components/CreateAgreementForm";
import { AvailableAgents } from "../components/AvailableAgents";
import { BranchList } from "../components/BranchList";
import { PlanPicker } from "../components/PlanPicker";
import { BranchEditModal } from "../components/BranchEditModal";
import { SourceBookingsPanel } from "../components/SourceBookingsPanel";
import { LocationRequestForm } from "../components/LocationRequestForm";
import { LocationRequestList } from "../components/LocationRequestList";
import { AgreementDetailModal } from "../components/AgreementDetailModal";
import { MyAgreements } from "../components/MyAgreements";
import { DailyPricingCalendar } from "../components/DailyPricingCalendar";
import { GloriaXmlResponseBuilderModal } from "../components/GloriaXmlResponseBuilderModal";
import { ManualAvailabilityImportModal } from "../components/manualImport/ManualAvailabilityImportModal";
import {
	buildDefaultIncludedRows,
	missingRequiredIncludedCodes,
} from "../components/manualImport/manualImportGloriaTemplates";
import {
	buildGloriaTermsFromRows,
	createEmptyTermRow,
	type ManualImportTermRow,
} from "../components/manualImport/manualImportTerms";
import type { SourceFleet } from "../api/fleets";
import { SettingsPage, PROFILE_UPDATED_EVENT } from "./SettingsPage";
import { ErrorModal } from "../components/ErrorModal";
import { Sidebar } from "../components/layout/Sidebar";
import {
	SourcePanelTour,
	SOURCE_PANEL_TOUR_STORAGE_KEY,
} from "../components/SourcePanelTour";
import { Support } from "../components/Support";
import { SourceVerificationPlayground } from "../components/SourceVerificationPlayground";
import { SourceHealthPanel } from "../components/SourceHealthPanel";
import { Badge } from "../components/ui/Badge";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Branch, branchesApi } from "../api/branches";
import { uploadsPublicUrl } from "../lib/uploadsPublicUrl";
import {
	subscriptionApi,
	transactionsApi,
	SourceTransaction,
	BranchQuotaExceededPayload,
} from "../api/subscription";
import { verificationApi, VerificationResult } from "../api/verification";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { NotificationsDrawer } from "../components/NotificationsDrawer";
import { SourceHealth } from "../types/api";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { AcrissCodePicker } from "../components/AcrissCodePicker";
import { SearchableStringPicker } from "../components/SearchableStringPicker";
import { fetchNhtsaMakes, fetchNhtsaModelsForMake } from "../lib/nhtsaVehicles";
import { Loader } from "../components/ui/Loader";
import { formatDate } from "../lib/utils";
import {
	AlertCircle,
	XCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	FileText,
	Info,
	Receipt,
	RefreshCw,
	ExternalLink,
	Sparkles,
	Plus,
	Settings,
	MapPin,
	Layers,
	FileCode2,
} from "lucide-react";

// Location Import Result Display Component
const LocationImportResultDisplay: React.FC<{ result: any }> = ({ result }) => {
	const hasErrors = result.errors && result.errors.length > 0;
	const hasPartialSuccess =
		(result.imported || 0) > 0 || (result.updated || 0) > 0;
	const isCompleteSuccess = !hasErrors && hasPartialSuccess;
	const isFormatError =
		result.error === "INVALID_FORMAT" ||
		result.error === "INVALID_RESPONSE_FORMAT";
	const [showExample, setShowExample] = useState(isFormatError); // Show by default for format errors

	return (
		<div className="space-y-4">
			{/* Summary Card */}
			<Card
				className={`border-2 ${
					isCompleteSuccess
						? "border-green-200 bg-green-50"
						: hasPartialSuccess
							? "border-yellow-200 bg-yellow-50"
							: "border-red-200 bg-red-50"
				}`}
			>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{isCompleteSuccess ? (
								<CheckCircle2 className="w-5 h-5 text-green-600" />
							) : hasPartialSuccess ? (
								<AlertCircle className="w-5 h-5 text-yellow-600" />
							) : (
								<XCircle className="w-5 h-5 text-red-600" />
							)}
							<CardTitle
								className={`text-lg font-bold ${
									isCompleteSuccess
										? "text-green-900"
										: hasPartialSuccess
											? "text-yellow-900"
											: "text-red-900"
								}`}
							>
								Import Summary
							</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							{(result.imported || 0) > 0 && (
								<Badge variant="success" className="font-semibold">
									{result.imported} Imported
								</Badge>
							)}
							{(result.updated || 0) > 0 && (
								<Badge variant="info" className="font-semibold">
									{result.updated} Updated
								</Badge>
							)}
							{(result.skipped || 0) > 0 && (
								<Badge variant="warning" className="font-semibold">
									{result.skipped} Skipped
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p
						className={`text-sm font-medium mb-3 ${
							isCompleteSuccess
								? "text-green-800"
								: hasPartialSuccess
									? "text-yellow-800"
									: "text-red-800"
						}`}
					>
						{result.message || "Import completed"}
					</p>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="bg-white/70 rounded-lg p-3 border border-gray-200">
							<div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
								Total
							</div>
							<div className="text-lg font-bold text-gray-900">
								{result.total || 0}
							</div>
						</div>
						<div className="bg-white/70 rounded-lg p-3 border border-blue-200">
							<div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
								Imported
							</div>
							<div className="text-lg font-bold text-blue-900">
								{result.imported || 0}
							</div>
						</div>
						<div className="bg-white/70 rounded-lg p-3 border border-purple-200">
							<div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
								Updated
							</div>
							<div className="text-lg font-bold text-purple-900">
								{result.updated || 0}
							</div>
						</div>
						<div className="bg-white/70 rounded-lg p-3 border border-orange-200">
							<div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
								Skipped
							</div>
							<div className="text-lg font-bold text-orange-900">
								{result.skipped || 0}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Format Error Display */}
			{isFormatError && result.details && (
				<Card className="border-2 border-red-200">
					<CardHeader className="bg-red-50 border-b border-red-200">
						<div className="flex items-center gap-3">
							<XCircle className="w-5 h-5 text-red-600" />
							<CardTitle className="text-lg font-bold text-red-900">
								Format Error
							</CardTitle>
						</div>
						<p className="text-sm text-red-700 mt-2">
							The endpoint response format is not recognized. Your endpoint must
							return location data in one of the supported formats below.
						</p>
						<p className="text-xs text-red-600 mt-1 font-semibold">
							⚠️ Your endpoint must return an array of locations. The response
							should contain either:
						</p>
						<ul className="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside ml-2">
							<li>
								<code className="bg-red-100 px-1 rounded">
									{"{ Locations: [...] }"}
								</code>{" "}
								- JSON object with "Locations" key
							</li>
							<li>
								<code className="bg-red-100 px-1 rounded">
									{"{ items: [...] }"}
								</code>{" "}
								- JSON object with "items" key
							</li>
							<li>
								<code className="bg-red-100 px-1 rounded">
									[location1, location2, ...]
								</code>{" "}
								- Direct JSON array
							</li>
							<li>
								<code className="bg-red-100 px-1 rounded">
									{"<Locations><Location>...</Location></Locations>"}
								</code>{" "}
								- XML format
							</li>
							<li>
								<code className="bg-red-100 px-1 rounded">
									{"{ OTA_VehLocSearchRS: { VehMatchedLocs: [...] } }"}
								</code>{" "}
								- OTA format (same as branch import)
							</li>
							<li>
								<code className="bg-red-100 px-1 rounded">
									PHP var_dump with OTA_VehLocSearchRS
								</code>{" "}
								- PHP var_dump format
							</li>
						</ul>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="space-y-4">
							{/* Error Details */}
							<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm font-semibold text-red-900 mb-2">
									Error Details:
								</p>
								<p className="text-sm text-red-800">{result.message}</p>
								{result.details.receivedKeys &&
									result.details.receivedKeys.length > 0 && (
										<div className="mt-3">
											<p className="text-xs font-semibold text-red-800 mb-1">
												Received keys in response:
											</p>
											<div className="flex flex-wrap gap-2">
												{result.details.receivedKeys.map(
													(key: string, idx: number) => (
														<code
															key={idx}
															className="px-2 py-1 bg-red-100 text-red-900 rounded text-xs font-mono"
														>
															{key}
														</code>
													),
												)}
											</div>
										</div>
									)}
								{result.details.dataPreview && (
									<div className="mt-3">
										<p className="text-xs font-semibold text-red-800 mb-1">
											Response preview:
										</p>
										<pre className="text-xs bg-red-100 text-red-900 p-3 rounded overflow-x-auto max-h-40">
											{result.details.dataPreview}
										</pre>
									</div>
								)}
							</div>

							{/* Expected Formats */}
							<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<p className="text-sm font-semibold text-blue-900 mb-2">
									✅ Expected Formats:
								</p>
								{result.details.expectedFormats && (
									<ul className="text-xs text-blue-800 space-y-1 list-disc list-inside mb-3">
										{result.details.expectedFormats.map(
											(format: string, idx: number) => (
												<li key={idx}>{format}</li>
											),
										)}
									</ul>
								)}
								{result.details.help && (
									<p className="text-xs text-blue-700 italic">
										{result.details.help}
									</p>
								)}
							</div>

							{/* Example Format - Always visible for format errors, collapsible otherwise */}
							<div className="border border-gray-200 rounded-lg overflow-hidden">
								{!isFormatError && (
									<button
										onClick={() => setShowExample(!showExample)}
										className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
									>
										<div className="flex items-center gap-2">
											<FileText className="w-4 h-4 text-gray-600" />
											<span className="text-sm font-semibold text-gray-800">
												📋 Example Location Data Format
											</span>
										</div>
										{showExample ? (
											<ChevronUp className="w-4 h-4 text-gray-600" />
										) : (
											<ChevronDown className="w-4 h-4 text-gray-600" />
										)}
									</button>
								)}
								{isFormatError && (
									<div className="p-3 bg-yellow-50 border-b border-yellow-200">
										<div className="flex items-center gap-2">
											<FileText className="w-4 h-4 text-yellow-600" />
											<span className="text-sm font-semibold text-yellow-900">
												📋 Sample Location Data Format (How your data should
												look)
											</span>
										</div>
									</div>
								)}

								{(showExample || isFormatError) && (
									<div className="p-4 bg-white space-y-4 border-t border-gray-200">
										<div>
											<p className="text-xs text-gray-700 font-semibold mb-2">
												✅ JSON Format (Recommended):
											</p>
											<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
												{`{
  "Locations": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    },
    {
      "unlocode": "GBLON",
      "country": "GB",
      "place": "London",
      "iataCode": "LHR",
      "latitude": 51.5074,
      "longitude": -0.1278
    }
  ]
}

// OR alternative JSON format:
{
  "items": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    }
  ]
}

// OR simple array:
[
  {
    "unlocode": "GBMAN",
    "country": "GB",
    "place": "Manchester",
    "iataCode": "MAN",
    "latitude": 53.3656,
    "longitude": -2.2729
  }
]`}
											</pre>
										</div>

										<div>
											<p className="text-xs text-gray-700 font-semibold mb-2">
												✅ XML Format (Also Supported):
											</p>
											<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
												{`<?xml version="1.0" encoding="UTF-8"?>
<Locations>
  <Location>
    <unlocode>GBMAN</unlocode>
    <country>GB</country>
    <place>Manchester</place>
    <iataCode>MAN</iataCode>
    <latitude>53.3656</latitude>
    <longitude>-2.2729</longitude>
  </Location>
  <Location>
    <unlocode>GBLON</unlocode>
    <country>GB</country>
    <place>London</place>
    <iataCode>LHR</iataCode>
    <latitude>51.5074</latitude>
    <longitude>-0.1278</longitude>
  </Location>
</Locations>

// OR OTA_VehLocSearchRS format (same as branch import):
{
  "OTA_VehLocSearchRS": {
    "VehMatchedLocs": [
      {
        "VehMatchedLoc": {
          "LocationDetail": {
            "attr": {
              "Code": "DXBA02",
              "Name": "Dubai Airport",
              "Latitude": "25.228005",
              "Longitude": "55.364241"
            },
            "Address": {
              "CountryName": {
                "attr": {
                  "Code": "AE"
                }
              }
            },
            "NatoLocode": "AEDXB"  // Optional: explicit UN/LOCODE
          }
        }
      }
    ]
  }
}`}
											</pre>
										</div>

										<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
											<p className="text-xs text-blue-900 font-semibold mb-2">
												📝 Required Fields:
											</p>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
												<div className="space-y-1">
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															unlocode
														</code>{" "}
														(required) - UN/LOCODE identifier (e.g., "GBMAN")
													</div>
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															country
														</code>{" "}
														(optional) - 2-letter country code (e.g., "GB")
													</div>
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															place
														</code>{" "}
														(optional) - Location name (e.g., "Manchester")
													</div>
												</div>
												<div className="space-y-1">
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															iataCode
														</code>{" "}
														(optional) - IATA airport code (e.g., "MAN")
													</div>
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															latitude
														</code>{" "}
														(optional) - Decimal degrees
													</div>
													<div className="text-xs text-blue-800">
														<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
															longitude
														</code>{" "}
														(optional) - Decimal degrees
													</div>
												</div>
											</div>
											<p className="text-xs text-blue-700 mt-2 italic">
												Note: Only{" "}
												<code className="bg-blue-100 px-1 rounded">
													unlocode
												</code>{" "}
												is required. Other fields are optional but recommended.
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Validation Errors Table */}
			{hasErrors && !isFormatError && (
				<Card className="border-2 border-red-200">
					<CardHeader className="bg-red-50 border-b border-red-200">
						<div className="flex items-center gap-3">
							<XCircle className="w-5 h-5 text-red-600" />
							<CardTitle className="text-lg font-bold text-red-900">
								Validation Errors ({result.errors.length})
							</CardTitle>
						</div>
						<p className="text-sm text-red-700 mt-2">
							The following locations could not be imported due to validation
							errors. Please fix the issues and try again.
						</p>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
											Index
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
											UN/LOCODE
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
											Error
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{result.errors.map((error: any, idx: number) => (
										<tr key={idx} className="hover:bg-red-50">
											<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
												{error.index + 1}
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
													{error.unlocode || "N/A"}
												</code>
											</td>
											<td className="px-4 py-3 text-sm text-red-700">
												{error.error}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

// Availability Fetch Result Display (Pricing tab) — shows car cards with full OTA data
const PAGE_SIZE = 6;

/**
 * Resolves picture_url for <img src>.
 * Uploads are served at the API host under /uploads (not under /api). Prefixing /uploads with
 * the axios baseURL (.../api) breaks production (Cannot GET /api/uploads/...).
 */
function displayVehicleImageUrl(raw?: string | null): string {
	const u = String(raw ?? "").trim();
	if (!u) return "";
	if (/^data:/i.test(u)) return u;
	if (/^https?:/i.test(u)) {
		return u.replace(/(\/\/[^/]+)\/api(\/uploads\/)/i, "$1$2");
	}
	const path = u.startsWith("/") ? u : `/${u}`;
	if (path.startsWith("/uploads")) {
		const base = String(api.defaults.baseURL || "/api").replace(/\/$/, "");
		if (base.startsWith("http")) {
			const origin = base.replace(/\/api$/i, "") || base;
			return `${origin}${path}`;
		}
		return path;
	}
	const base = String(api.defaults.baseURL || "/api").replace(/\/$/, "");
	return `${base}${path}`;
}

/** Example GLORIA/TL International availability URL (Postman-style). */
const PRICING_SAMPLE_AV_ENDPOINT =
	"https://ota.tlinternationalgroup.com/gloria/av.php";

const MANUAL_MAKE_TO_MODELS: Record<string, string[]> = {
	SKODA: ["FABIA", "OCTAVIA", "SCALA", "KAMIQ", "KAROQ", "SUPERB"],
	TOYOTA: ["YARIS", "COROLLA", "RAV4", "AYGO", "CH-R"],
	VOLKSWAGEN: ["GOLF", "POLO", "PASSAT", "TIGUAN", "T-ROC"],
	FORD: ["FIESTA", "FOCUS", "KUGA", "PUMA"],
	BMW: ["1 SERIES", "3 SERIES", "X1", "X3"],
	MERCEDES: ["A CLASS", "C CLASS", "VITO", "SPRINTER"],
	NISSAN: ["MICRA", "JUKE", "QASHQAI"],
};

const MANUAL_MAKES = Object.keys(MANUAL_MAKE_TO_MODELS).sort();

function getFallbackModelsForMake(make: string): string[] {
	const t = make.trim();
	if (!t) return [];
	const u = t.toUpperCase();
	if (MANUAL_MAKE_TO_MODELS[u]) return [...MANUAL_MAKE_TO_MODELS[u]];
	const k = Object.keys(MANUAL_MAKE_TO_MODELS).find(
		(key) => key.toUpperCase() === u,
	);
	return k ? [...MANUAL_MAKE_TO_MODELS[k]] : [];
}

function newManualImportRowId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function newManualCarOrderId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
}

const GLORIA_VEHDETAIL_ATTR_ORDER = [
	"ACRISS",
	"Make",
	"Model",
	"Transmission",
	"Doors",
	"Seats",
	"BagsSmall",
	"BagsMedium",
	"ImageURL",
] as const;

function sortedGloriaVehdetailEntries(
	rec: Record<string, string>,
): [string, string][] {
	const keys = Object.keys(rec);
	const preferred = GLORIA_VEHDETAIL_ATTR_ORDER.filter((k) => keys.includes(k));
	const rest = keys
		.filter(
			(k) => !(GLORIA_VEHDETAIL_ATTR_ORDER as readonly string[]).includes(k),
		)
		.sort();
	const ordered = [...preferred, ...rest];
	return ordered.map((k) => [k, rec[k] ?? ""]);
}

function isAvailStatusSuccess(status?: string | null): boolean {
	return (
		String(status ?? "")
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "") === "available"
	);
}

const compactText = (value: unknown, fallback = "—") => {
	const text = String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
	return text || fallback;
};

const formatStoredMoney = (
	amount?: string | number | null,
	currency?: string | null,
) => {
	const raw = amount == null ? "" : String(amount).trim();
	if (!raw) return "—";
	const n = Number(raw);
	const formatted = Number.isFinite(n) ? n.toFixed(2) : raw;
	return `${currency ? `${currency} ` : ""}${formatted}`;
};

const termIdentity = (term: any) =>
	[
		term?.code,
		term?.header,
		term?.details,
		term?.price,
		term?.excess,
		term?.deposit,
	]
		.map((v) => compactText(v, ""))
		.join("|");

const normalizeTerms = (terms: any[] | undefined) => {
	const seen = new Set<string>();
	return (terms ?? [])
		.filter((term) => !!(term?.header || term?.code || term?.details))
		.filter((term) => {
			const key = termIdentity(term);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
};

const TermSummaryList: React.FC<{
	terms: any[];
	accent: "emerald" | "blue";
	currency?: string;
}> = ({ terms, accent, currency }) => {
	if (terms.length === 0) return null;
	const isIncluded = accent === "emerald";
	const borderClass = isIncluded ? "border-emerald-200" : "border-blue-200";
	const bgClass = isIncluded ? "bg-emerald-50" : "bg-blue-50";
	const textClass = isIncluded ? "text-emerald-800" : "text-blue-800";
	const marker = isIncluded ? "✓" : "+";

	return (
		<div className="space-y-2">
			{terms.map((term, index) => {
				const code = compactText(term.code, "Item");
				const title = compactText(term.header || term.details, code);
				const details = compactText(term.details || term.header, "");
				const meta = [
					term.price != null && compactText(term.price, "")
						? `Price ${formatStoredMoney(term.price, term.currency || currency)}`
						: null,
					term.cover_amount != null && compactText(term.cover_amount, "")
						? `Cover ${term.cover_amount}`
						: null,
					term.excess != null && compactText(term.excess, "")
						? `Excess ${term.excess}`
						: null,
					term.deposit != null && compactText(term.deposit, "")
						? `Deposit ${term.deposit}`
						: null,
				].filter(Boolean);

				return (
					<details
						key={`${code}-${index}`}
						className={`group rounded-lg border ${borderClass} bg-white`}
					>
						<summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-2.5 text-sm marker:hidden">
							<span className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full ${bgClass} ${textClass} text-xs font-bold`}>
								{marker}
							</span>
							<span className="min-w-0 flex-1">
								<span className="flex flex-wrap items-center gap-2">
									<code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
										{code}
									</code>
									<span className="font-medium text-slate-900">{title}</span>
								</span>
								{meta.length > 0 ? (
									<span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
										{meta.map((item) => (
											<span key={item}>{item}</span>
										))}
									</span>
								) : null}
							</span>
							<ChevronDown className="mt-1 h-4 w-4 flex-none text-slate-400 transition-transform group-open:rotate-180" />
						</summary>
						{details && details !== title ? (
							<div className="border-t border-slate-100 px-3 pb-3 pt-2 text-sm leading-6 text-slate-700">
								{details}
							</div>
						) : null}
					</details>
				);
			})}
		</div>
	);
};

// Card for a single stored availability sample (in the "Stored samples" list)
const StoredSampleCard: React.FC<{
	sample: import("../api/endpoints").StoredAvailabilitySample;
	/** When set, each vehicle row links to Daily Prices pre-filled for that sample + offer index */
	buildDailyPricingHref?: (offerIndex: number) => string;
}> = ({ sample, buildDailyPricingHref }) => {
	const [expanded, setExpanded] = useState(false);
	const [page, setPage] = useState(0);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	const offers: any[] = sample.offersSummary ?? [];
	const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
	const pageOffers = offers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	const pickupDate = sample.pickupIso?.slice(0, 16).replace("T", " ") ?? "—";
	const returnDate = sample.returnIso?.slice(0, 16).replace("T", " ") ?? "—";
	const fetchedDate = sample.fetchedAt
		? new Date(sample.fetchedAt).toLocaleString()
		: "—";

	const adapterFmt = String(
		(sample as any).adapterType || sample.criteria?.adapterType || "xml",
	).toLowerCase();
	const adapterChipClass: Record<string, string> = {
		xml: "bg-orange-50 text-orange-800 border-orange-200",
		json: "bg-emerald-50 text-emerald-800 border-emerald-200",
		grpc: "bg-violet-50 text-violet-800 border-violet-200",
		manual: "bg-slate-100 text-slate-800 border-slate-200",
	};
	const adapterLabel: Record<string, string> = {
		xml: "OTA XML",
		json: "Gloria JSON",
		grpc: "Gloria gRPC",
		manual: "Manual import",
	};

	const goPage = (next: number) => {
		setPage(Math.max(0, Math.min(totalPages - 1, next)));
		setExpandedCard(null);
	};

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
			<button
				type="button"
				aria-expanded={expanded}
				onClick={() => {
					setExpanded((value) => !value);
					setPage(0);
					setExpandedCard(null);
				}}
				className="w-full bg-white px-5 py-5 text-left transition hover:bg-slate-50"
			>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-lg font-semibold tracking-tight text-slate-950">
								{sample.pickupLoc || "—"} → {sample.returnLoc || "—"}
							</h3>
							<Badge variant="info" size="sm" className="rounded-full">
								{sample.offersCount} vehicle{sample.offersCount !== 1 ? "s" : ""}
							</Badge>
							<span
								className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${adapterChipClass[adapterFmt] || adapterChipClass.xml}`}
							>
								{adapterLabel[adapterFmt] || adapterFmt.toUpperCase()}
							</span>
							{sample.criteria?.requestorId ? (
								<span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
									Account: {sample.criteria.requestorId}
								</span>
							) : null}
						</div>
						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
								<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Pick-up</p>
								<p className="mt-1 font-mono text-sm font-semibold text-slate-900">{pickupDate}</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
								<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Return</p>
								<p className="mt-1 font-mono text-sm font-semibold text-slate-900">{returnDate}</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
								<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Fetched</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">{fetchedDate}</p>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:min-w-40">
						<span className="text-xs font-semibold text-slate-600">
							{expanded ? "Hide vehicles" : "View vehicles"}
						</span>
						<ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
					</div>
				</div>
			</button>

			{expanded && (
				<div className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-5">
					{offers.length === 0 ? (
						<div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
							No vehicle data is stored for this sample. Re-fetch availability to refresh the stored data.
						</div>
					) : (
						<>
							<div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-slate-600">
									Showing <span className="font-semibold text-slate-950">{page * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-950">{Math.min((page + 1) * PAGE_SIZE, offers.length)}</span> of <span className="font-semibold text-slate-950">{offers.length}</span> vehicles
								</p>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => goPage(page - 1)}
										disabled={page === 0}
										className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
										aria-label="Previous page"
									>
										‹
									</button>
									<span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
										{page + 1} / {totalPages}
									</span>
									<button
										type="button"
										onClick={() => goPage(page + 1)}
										disabled={page >= totalPages - 1}
										className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
										aria-label="Next page"
									>
										›
									</button>
								</div>
							</div>

							<div className="space-y-4">
								{pageOffers.map((offer: any, idx: number) => {
									const globalIdx = page * PAGE_SIZE + idx;
									const includedList = normalizeTerms(offer.included);
									const notIncludedList = normalizeTerms(offer.not_included);
									const extras = (offer.priced_equips ?? []) as any[];
									const isOpen = expandedCard === globalIdx;
									const termPreview = includedList.slice(0, 5);

									return (
										<article key={globalIdx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
											<div className="grid gap-4 p-4 lg:grid-cols-[160px_minmax(0,1fr)_180px]">
												<div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3">
													{offer.picture_url ? (
														<img
															src={displayVehicleImageUrl(offer.picture_url)}
															alt={offer.vehicle_make_model || "Vehicle"}
															className="max-h-full max-w-full object-contain"
															onError={(e) => {
																(e.target as HTMLImageElement).style.display = "none";
															}}
														/>
													) : (
														<span className="text-sm font-semibold text-slate-300">No image</span>
													)}
												</div>

												<div className="min-w-0">
													<div className="flex flex-wrap items-start justify-between gap-3">
														<div className="min-w-0">
															<h4 className="text-lg font-bold text-slate-950">{compactText(offer.vehicle_make_model)}</h4>
															<div className="mt-2 flex flex-wrap gap-1.5">
																{offer.vehicle_class ? <Badge variant="info" size="sm" className="font-mono">{offer.vehicle_class}</Badge> : null}
																{offer.transmission_type ? <Badge variant="default" size="sm">{offer.transmission_type}</Badge> : null}
																{offer.door_count ? <Badge variant="default" size="sm">{offer.door_count} doors</Badge> : null}
																{offer.gloria_vehdetails_attributes?.Seats ? <Badge variant="default" size="sm">{offer.gloria_vehdetails_attributes.Seats} seats</Badge> : null}
																{offer.baggage ? <Badge variant="default" size="sm">Bags {offer.baggage}</Badge> : null}
															</div>
														</div>
														<Badge variant={isAvailStatusSuccess(offer.availability_status) ? "success" : "default"} size="sm">
															{offer.availability_status || "Available"}
														</Badge>
													</div>

													<div className="mt-4 grid gap-2 sm:grid-cols-3">
														<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
															<p className="text-[11px] font-bold uppercase text-emerald-700">Included</p>
															<p className="text-lg font-bold text-emerald-950">{includedList.length}</p>
														</div>
														<div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
															<p className="text-[11px] font-bold uppercase text-blue-700">Optional</p>
															<p className="text-lg font-bold text-blue-950">{notIncludedList.length}</p>
														</div>
														<div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
															<p className="text-[11px] font-bold uppercase text-violet-700">Extras</p>
															<p className="text-lg font-bold text-violet-950">{extras.length}</p>
														</div>
													</div>

													{termPreview.length > 0 ? (
														<div className="mt-4 flex flex-wrap gap-1.5">
															{termPreview.map((term, index) => (
																<span key={`${termIdentity(term)}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800" title={compactText(term.details || term.header)}>
																	✓ {compactText(term.code || term.header, "Item")}
																</span>
															))}
															{includedList.length > termPreview.length ? (
																<span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">+{includedList.length - termPreview.length} more</span>
															) : null}
														</div>
													) : null}
												</div>

												<div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:text-right">
													<div>
														<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total price</p>
														<p className="mt-1 text-2xl font-bold text-emerald-700">{formatStoredMoney(offer.total_price, offer.currency)}</p>
														{offer.gloria_pricing_attributes?.DailyGross ? (
															<p className="mt-1 text-xs text-slate-500">Daily {formatStoredMoney(offer.gloria_pricing_attributes.DailyGross, offer.currency)}</p>
														) : null}
													</div>
													<div className="flex flex-wrap gap-2 lg:justify-end">
														{buildDailyPricingHref ? (
															<Link to={buildDailyPricingHref(globalIdx)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50" onClick={(e) => e.stopPropagation()}>
																Manage daily prices
															</Link>
														) : null}
														<button type="button" onClick={() => setExpandedCard(isOpen ? null : globalIdx)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100">
															{isOpen ? "Hide details" : "View details"}
														</button>
													</div>
												</div>
											</div>

											{isOpen && (
												<div className="border-t border-slate-200 bg-slate-50 p-4">
													<div className="grid gap-4 xl:grid-cols-3">
														<div className="space-y-4 xl:col-span-1">
															{offer.veh_id ? (
																<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
																	<p className="text-xs font-bold uppercase tracking-wide text-slate-500">VehID / CarOrderID</p>
																	<code className="mt-2 block break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900">{offer.veh_id}</code>
																</div>
															) : null}
															{offer.gloria_pricing_attributes && Object.keys(offer.gloria_pricing_attributes).length > 0 ? (
																<div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
																	<p className="text-xs font-bold uppercase tracking-wide text-amber-800">Pricing attributes</p>
																	<dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
																		{Object.entries(offer.gloria_pricing_attributes).map(([key, value]) => (
																			<div key={key} className="rounded-lg bg-amber-50 px-2 py-1.5">
																				<dt className="font-semibold text-amber-800">{key}</dt>
																				<dd className="mt-0.5 truncate font-mono text-slate-900" title={String(value)}>{String(value)}</dd>
																			</div>
																		))}
																	</dl>
																</div>
															) : null}
															{offer.gloria_vehdetails_attributes && Object.keys(offer.gloria_vehdetails_attributes).length > 0 ? (
																<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
																	<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vehicle attributes</p>
																	<dl className="mt-3 space-y-2 text-xs">
																		{sortedGloriaVehdetailEntries(offer.gloria_vehdetails_attributes as Record<string, string>).map(([key, value]) => (
																			<div key={key} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
																				<dt className="font-semibold text-slate-500">{key}</dt>
																				<dd className="min-w-0 break-words font-mono text-slate-900">{key === "ImageURL" && String(value).startsWith("http") ? <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Image link</a> : value || "—"}</dd>
																			</div>
																		))}
																	</dl>
																</div>
															) : null}
														</div>

														<div className="space-y-4 xl:col-span-2">
															{includedList.length > 0 ? (
																<div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
																	<div className="mb-3 flex items-center justify-between gap-3">
																		<p className="text-sm font-bold text-emerald-900">Included in price</p>
																		<Badge variant="success" size="sm">{includedList.length}</Badge>
																	</div>
																	<TermSummaryList terms={includedList} accent="emerald" currency={offer.currency} />
																</div>
															) : null}
															{notIncludedList.length > 0 ? (
																<div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
																	<div className="mb-3 flex items-center justify-between gap-3">
																		<p className="text-sm font-bold text-blue-900">Not included / optional cover</p>
																		<Badge variant="info" size="sm">{notIncludedList.length}</Badge>
																	</div>
																	<TermSummaryList terms={notIncludedList} accent="blue" currency={offer.currency} />
																</div>
															) : null}
															{extras.length > 0 ? (
																<div className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
																	<div className="mb-3 flex items-center justify-between gap-3">
																		<p className="text-sm font-bold text-violet-900">Equipment add-ons</p>
																		<Badge variant="default" size="sm">{extras.length}</Badge>
																	</div>
																	<div className="grid gap-2 sm:grid-cols-2">
																		{extras.map((eq, index) => (
																			<div key={index} className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm">
																				<p className="font-semibold text-slate-950">{compactText(eq.description || eq.equip_type)}</p>
																				{eq.long_description ? <p className="mt-1 text-xs text-slate-600">{compactText(eq.long_description)}</p> : null}
																				{eq.charge?.Amount ? <p className="mt-1 text-xs font-semibold text-violet-900">{formatStoredMoney(eq.charge.Amount, eq.currency || offer.currency)}</p> : null}
																			</div>
																		))}
																	</div>
																</div>
															) : null}
														</div>
													</div>
												</div>
											)}
										</article>
									);
								})}
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

const AvailabilityFetchResultDisplay: React.FC<{ result: any }> = ({
	result,
}) => {
	const isError = !!result.error;
	const isDuplicate =
		!result.error && result.stored === false && result.duplicate === true;
	const isStored = !result.error && result.stored === true;
	const isFormatError =
		result.error === "INVALID_FORMAT" ||
		result.error === "INVALID_RESPONSE_FORMAT";
	const [showSample, setShowSample] = useState(isFormatError);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);
	const [page, setPage] = useState(0);

	const allOffers: any[] = result.offersSummary ?? [];
	const totalPages = Math.max(1, Math.ceil(allOffers.length / PAGE_SIZE));
	const pageOffers = allOffers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	return (
		<div className="space-y-4">
			{/* Status banner */}
			<Card
				className={`border-2 ${
					isError
						? "border-red-200 bg-red-50"
						: isDuplicate
							? "border-amber-200 bg-amber-50"
							: "border-green-200 bg-green-50"
				}`}
			>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{isError ? (
								<XCircle className="w-5 h-5 text-red-600" />
							) : isDuplicate ? (
								<Info className="w-5 h-5 text-amber-600" />
							) : (
								<CheckCircle2 className="w-5 h-5 text-green-600" />
							)}
							<CardTitle
								className={`text-lg font-bold ${
									isError
										? "text-red-900"
										: isDuplicate
											? "text-amber-900"
											: "text-green-900"
								}`}
							>
								{isError
									? "Fetch Failed"
									: isDuplicate
										? "Duplicate — Not Stored"
										: result.criteria?.adapterType === "manual"
											? "Manual import summary"
											: "Fetch & Store Summary"}
							</CardTitle>
						</div>
						{!isError && (result.offersCount ?? 0) >= 0 && (
							<Badge
								variant={isDuplicate ? "secondary" : "success"}
								className="font-semibold"
							>
								{result.offersCount} vehicle
								{result.offersCount !== 1 ? "s" : ""}
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<p
						className={`text-sm font-medium ${
							isError
								? "text-red-800"
								: isDuplicate
									? "text-amber-800"
									: "text-green-800"
						}`}
					>
						{result.message}
					</p>
					{isStored && (
						<p className="text-xs text-green-700 mt-1">
							{result.isNew
								? "New availability sample stored in database."
								: "Existing sample updated with new data."}
						</p>
					)}
					{isDuplicate && (
						<p className="text-xs text-amber-700 mt-1">
							Same data already stored for this criteria; no duplicate was
							saved.
						</p>
					)}
					{result.criteria && (
						<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
							<span>
								<strong>Pick-up:</strong> {result.criteria.pickupLoc}{" "}
								{result.criteria.pickupIso?.slice(0, 16)}
							</span>
							<span>
								<strong>Return:</strong> {result.criteria.returnLoc}{" "}
								{result.criteria.returnIso?.slice(0, 16)}
							</span>
							{result.criteria.requestorId && (
								<span>
									<strong>Requestor ID:</strong> {result.criteria.requestorId}
								</span>
							)}
							{result.criteria.driverAge && (
								<span>
									<strong>Driver age:</strong> {result.criteria.driverAge}
								</span>
							)}
							{result.criteria.citizenCountry && (
								<span>
									<strong>Country:</strong> {result.criteria.citizenCountry}
								</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Vehicle results cards */}
			{!isError && allOffers.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-gray-700">
							{allOffers.length} vehicle{allOffers.length !== 1 ? "s" : ""}{" "}
							available
							{totalPages > 1 && (
								<span className="font-normal text-gray-500 ml-1">
									(page {page + 1} of {totalPages})
								</span>
							)}
						</p>
						{totalPages > 1 && (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										setPage((p) => Math.max(0, p - 1));
										setExpandedCard(null);
									}}
									disabled={page === 0}
									className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
								>
									‹ Prev
								</button>
								<span className="text-xs text-gray-500">
									{page + 1} / {totalPages}
								</span>
								<button
									type="button"
									onClick={() => {
										setPage((p) => Math.min(totalPages - 1, p + 1));
										setExpandedCard(null);
									}}
									disabled={page >= totalPages - 1}
									className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
								>
									Next ›
								</button>
							</div>
						)}
					</div>
					{pageOffers.map((offer: any, idx: number) => {
						const globalIdx = page * PAGE_SIZE + idx;
						return (
							<div
								key={globalIdx}
								className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden"
							>
								<div className="flex gap-4 p-4">
									{/* Car image */}
									{offer.picture_url ? (
										<img
											src={displayVehicleImageUrl(offer.picture_url)}
											alt={offer.vehicle_make_model || "Vehicle"}
											className="w-32 h-20 object-contain flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = "none";
											}}
										/>
									) : (
										<div className="w-32 h-20 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
											<svg
												className="w-10 h-10 text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
												/>
											</svg>
										</div>
									)}

									{/* Car details */}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2 flex-wrap">
											<div>
												<h3 className="font-bold text-gray-900 text-base leading-tight">
													{offer.vehicle_make_model || "—"}
												</h3>
												<div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
													{offer.vehicle_class && (
														<span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
															{offer.vehicle_class}
														</span>
													)}
													{offer.vehicle_category && (
														<span className="text-xs text-gray-500">
															Cat {offer.vehicle_category}
														</span>
													)}
													{offer.transmission_type && (
														<span className="text-xs text-gray-600">
															{offer.transmission_type}
														</span>
													)}
													{offer.air_condition_ind && (
														<span className="text-xs text-gray-600">
															A/C: {offer.air_condition_ind}
														</span>
													)}
													{offer.door_count && (
														<span className="text-xs text-gray-600">
															{offer.door_count} doors
														</span>
													)}
													{offer.baggage && (
														<span className="text-xs text-gray-600">
															Bags small/medium: {offer.baggage}
														</span>
													)}
													{offer.gloria_vehdetails_attributes?.Seats && (
														<span className="text-xs text-gray-600">
															{offer.gloria_vehdetails_attributes.Seats} seats
														</span>
													)}
												</div>
												{offer.manual_business_rules &&
													typeof offer.manual_business_rules === "object" && (
														<p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
															{(offer.manual_business_rules as any).seats !=
																null &&
																String(
																	(offer.manual_business_rules as any).seats,
																).trim() !== "" && (
																	<span>
																		Seats:{" "}
																		{(offer.manual_business_rules as any).seats}
																	</span>
																)}
															{(offer.manual_business_rules as any)
																.min_lead_hours != null && (
																<span>
																	Min lead:{" "}
																	{
																		(offer.manual_business_rules as any)
																			.min_lead_hours
																	}{" "}
																	h
																</span>
															)}
															{(offer.manual_business_rules as any)
																.max_lead_days != null && (
																<span>
																	Max lead:{" "}
																	{
																		(offer.manual_business_rules as any)
																			.max_lead_days
																	}{" "}
																	d
																</span>
															)}
															{(offer.manual_business_rules as any).mileage !=
																null && (
																<span>
																	Mileage:{" "}
																	{(offer.manual_business_rules as any).mileage}
																</span>
															)}
														</p>
													)}
											</div>
											<div className="text-right flex-shrink-0">
												<div className="text-xl font-bold text-emerald-700">
													{offer.total_price
														? `${offer.currency || ""} ${Number(offer.total_price).toFixed(2)}`
														: "—"}
												</div>
												<div className="text-xs text-gray-500">
													total incl. tax
												</div>
												<Badge
													variant={
														isAvailStatusSuccess(offer.availability_status)
															? "success"
															: "default"
													}
													className="mt-1 text-xs"
												>
													{offer.availability_status || "Available"}
												</Badge>
											</div>
										</div>

										{/* Included terms (brief chips) */}
										{(offer.included?.filter((t: any) => t.header || t.code)
											.length ?? 0) > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{(offer.included ?? [])
													.filter((t: any) => t.header || t.code)
													.map((t: any, i: number) => (
														<span
															key={i}
															className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 max-w-[16rem]"
															title={t.details ? String(t.details) : undefined}
														>
															<svg
																className="w-3 h-3 shrink-0"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path
																	fillRule="evenodd"
																	d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																	clipRule="evenodd"
																/>
															</svg>
															<span className="truncate">
																{t.code ? (
																	<span className="font-mono">{t.code}</span>
																) : null}
																{t.code ? " · " : null}
																{t.details || t.header}
															</span>
														</span>
													))}
											</div>
										)}
									</div>
								</div>

								{/* Expand/collapse for full details */}
								<button
									type="button"
									onClick={() =>
										setExpandedCard(
											expandedCard === globalIdx ? null : globalIdx,
										)
									}
									className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
								>
									<span>
										{expandedCard === globalIdx
											? "Hide details"
											: "Show full details (terms, extras, VehID)"}
									</span>
									<ChevronDown
										className={`w-4 h-4 transition-transform ${expandedCard === globalIdx ? "rotate-180" : ""}`}
									/>
								</button>

								{expandedCard === globalIdx && (
									<div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4 bg-gray-50">
										{/* VehID */}
										{offer.veh_id && (
											<div className="flex items-center gap-2 text-xs">
												<span className="text-gray-500 font-medium">
													VehID:
												</span>
												<code className="bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-800">
													{offer.veh_id}
												</code>
												<span className="text-gray-400">
													(booking reference)
												</span>
											</div>
										)}

										{offer.gloria_vehdetails_attributes &&
											Object.keys(offer.gloria_vehdetails_attributes).length >
												0 && (
												<div className="text-xs bg-white border border-gray-200 rounded p-2">
													<p className="font-semibold text-gray-700 mb-1">
														GLORIA vehdetails (@attributes)
													</p>
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono">
														{sortedGloriaVehdetailEntries(
															offer.gloria_vehdetails_attributes as Record<
																string,
																string
															>,
														).map(([k, v]) => (
															<div
																key={k}
																className="flex justify-between gap-2 sm:col-span-2"
															>
																<span className="text-gray-500 shrink-0">
																	{k}
																</span>
																<span className="truncate text-right" title={v}>
																	{k === "ImageURL" && v.startsWith("http") ? (
																		<a
																			href={v}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-blue-600 underline"
																		>
																			link
																		</a>
																	) : (
																		v
																	)}
																</span>
															</div>
														))}
													</div>
												</div>
											)}
										{offer.gloria_pricing_attributes &&
											Object.keys(offer.gloria_pricing_attributes).length >
												0 && (
												<div className="text-xs">
													<p className="font-semibold text-amber-800 mb-1">
														pricing @attributes
													</p>
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono bg-white border border-gray-200 rounded p-2">
														{Object.entries(
															offer.gloria_pricing_attributes,
														).map(([k, v]) => (
															<div
																key={k}
																className="flex justify-between gap-2"
															>
																<span className="text-gray-500">{k}</span>
																<span className="truncate">{String(v)}</span>
															</div>
														))}
													</div>
												</div>
											)}
										{offer.gloria_terms &&
											Array.isArray(offer.gloria_terms) &&
											offer.gloria_terms.length > 0 && (
												<details className="text-xs">
													<summary className="font-semibold text-gray-700 cursor-pointer">
														Terms JSON ({offer.gloria_terms.length})
													</summary>
													<pre className="mt-1 p-2 bg-white border rounded max-h-40 overflow-auto text-[10px]">
														{JSON.stringify(offer.gloria_terms, null, 2)}
													</pre>
												</details>
											)}

										{/* Included terms */}
										{(offer.included?.filter((t: any) => t.header || t.code)
											.length ?? 0) > 0 && (
											<div>
												<p className="text-xs font-semibold text-green-700 mb-1.5">
													Included in price
												</p>
												<div className="space-y-2">
													{(offer.included ?? []).map((t: any, i: number) => (
														<div
															key={i}
															className="flex items-start gap-2 text-xs border-b border-green-100 pb-2 last:border-0"
														>
															<svg
																className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path
																	fillRule="evenodd"
																	d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																	clipRule="evenodd"
																/>
															</svg>
															<div className="flex-1 min-w-0">
																{t.code ? (
																	<p className="font-mono text-green-900/90 mb-0.5">
																		{t.code}
																	</p>
																) : null}
																<p className="font-medium text-gray-800 whitespace-pre-wrap">
																	{t.details || t.header}
																</p>
																<p className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-x-2">
																	{t.currency ? (
																		<span>{t.currency}</span>
																	) : null}
																	{t.excess ? (
																		<span>Excess: {t.excess}</span>
																	) : null}
																	{t.deposit ? (
																		<span>Deposit: {t.deposit}</span>
																	) : null}
																	{t.price ? (
																		<span>Price: {t.price}</span>
																	) : null}
																</p>
															</div>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Not included in price */}
										{(offer.not_included?.filter((t: any) => t.header || t.code)
											.length ?? 0) > 0 && (
											<div>
												<p className="text-xs font-semibold text-blue-700 mb-1.5">
													Not included in price
												</p>
												<div className="space-y-1.5">
													{(offer.not_included ?? []).map(
														(t: any, i: number) => (
															<div
																key={i}
																className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded p-2"
															>
																<svg
																	className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M12 6v6m0 0v6m0-6h6m-6 0H6"
																	/>
																</svg>
																<div className="flex-1 min-w-0">
																	{t.code ? (
																		<p className="font-mono text-blue-900/90 mb-0.5">
																			{t.code}
																		</p>
																	) : null}
																	<p className="font-medium text-gray-800 whitespace-pre-wrap">
																		{t.details || t.header}
																	</p>
																	<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600 mt-1">
																		{t.price != null &&
																		String(t.price).trim() !== "" ? (
																			<span className="text-blue-800 font-semibold">
																				{t.price}{" "}
																				{t.currency || offer.currency || ""}
																			</span>
																		) : null}
																		{t.cover_amount ? (
																			<span>Cover: {t.cover_amount}</span>
																		) : null}
																		{t.excess ? (
																			<span>Excess: {t.excess}</span>
																		) : null}
																		{t.deposit ? (
																			<span>Deposit: {t.deposit}</span>
																		) : null}
																	</div>
																</div>
															</div>
														),
													)}
												</div>
											</div>
										)}

										{/* Priced equipment */}
										{(offer.priced_equips?.length ?? 0) > 0 && (
											<div>
												<p className="text-xs font-semibold text-purple-700 mb-1.5">
													Equipment add-ons
												</p>
												<div className="grid grid-cols-2 gap-2">
													{(offer.priced_equips ?? []).map(
														(eq: any, i: number) => (
															<div
																key={i}
																className="text-xs bg-purple-50 border border-purple-100 rounded p-2"
															>
																<div className="font-medium text-gray-800">
																	{eq.description ||
																		eq.equip_type ||
																		eq.vendor_equip_id ||
																		"—"}
																</div>
																{eq.long_description ? (
																	<p className="text-gray-600 mt-0.5 whitespace-pre-wrap">
																		{eq.long_description}
																	</p>
																) : null}
																<div className="text-purple-700 font-semibold">
																	{eq.charge?.Amount
																		? `${eq.currency || offer.currency || ""} ${Number(eq.charge.Amount).toFixed(2)}/rental`
																		: ""}
																	{eq.charge?.UnitCharge && eq.charge?.UnitName
																		? ` (${eq.charge.UnitCharge}/${eq.charge.UnitName})`
																		: ""}
																</div>
															</div>
														),
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}

					{/* Bottom pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-2">
							<button
								type="button"
								onClick={() => {
									setPage((p) => Math.max(0, p - 1));
									setExpandedCard(null);
								}}
								disabled={page === 0}
								className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
							>
								‹ Previous
							</button>
							{Array.from({ length: totalPages }, (_, i) => (
								<button
									key={i}
									type="button"
									onClick={() => {
										setPage(i);
										setExpandedCard(null);
									}}
									className={`px-3 py-1.5 text-sm rounded border transition-colors ${i === page ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" : "border-gray-300 hover:bg-gray-50"}`}
								>
									{i + 1}
								</button>
							))}
							<button
								type="button"
								onClick={() => {
									setPage((p) => Math.min(totalPages - 1, p + 1));
									setExpandedCard(null);
								}}
								disabled={page >= totalPages - 1}
								className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
							>
								Next ›
							</button>
						</div>
					)}
				</div>
			)}

			{/* Raw XML response debug section — always shown when present */}
			{(result.rawResponsePreview || result.parsedPreview) && (
				<details className="border border-gray-200 rounded-lg bg-gray-50">
					<summary className="px-4 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 rounded-lg flex items-center gap-2">
						<svg
							className="w-3.5 h-3.5 text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
							/>
						</svg>
						Debug: raw endpoint response &amp; parsed XML structure
					</summary>
					<div className="p-4 space-y-3">
						{result.parsedPreview && (
							<div>
								<p className="text-xs font-semibold text-gray-700 mb-1">
									Parsed XML structure (first VehAvailCore):
								</p>
								<pre className="text-xs font-mono bg-white border border-gray-200 rounded p-3 overflow-x-auto max-h-48 text-gray-800">
									{JSON.stringify(result.parsedPreview, null, 2)}
								</pre>
							</div>
						)}
						{result.rawResponsePreview && (
							<div>
								<p className="text-xs font-semibold text-gray-700 mb-1">
									Raw endpoint response (first 3000 chars):
								</p>
								<pre className="text-xs font-mono bg-white border border-gray-200 rounded p-3 overflow-x-auto max-h-64 text-gray-800">
									{result.rawResponsePreview}
								</pre>
							</div>
						)}
					</div>
				</details>
			)}

			{isFormatError && result.details && (
				<Card className="border-2 border-red-200">
					<CardHeader className="bg-red-50 border-b border-red-200">
						<div className="flex items-center gap-3">
							<XCircle className="w-5 h-5 text-red-600" />
							<CardTitle className="text-lg font-bold text-red-900">
								Format Error
							</CardTitle>
						</div>
						<p className="text-sm text-red-700 mt-2">
							The endpoint response format is not recognized. For XML mode, the
							endpoint can return either OTA_VehAvailRateRS or
							GLORIA_availabilityrs (with VehAvairsdetails/availcars) in
							response to the request.
						</p>
						<p className="text-xs text-red-600 mt-1 font-semibold">
							Expected keys:{" "}
							<code className="bg-red-100 px-1 rounded">
								VehAvailRSCore + VehVendorAvails
							</code>{" "}
							(OTA) or{" "}
							<code className="bg-red-100 px-1 rounded">
								VehAvairsdetails + availcars
							</code>{" "}
							(GLORIA).
						</p>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="space-y-4">
							{result.details.dataPreview && (
								<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-sm font-semibold text-red-900 mb-2">
										Response preview:
									</p>
									<pre className="text-xs bg-red-100 text-red-900 p-3 rounded overflow-x-auto max-h-40">
										{result.details.dataPreview}
									</pre>
								</div>
							)}
							{result.details.expectedFormats &&
								result.details.expectedFormats.length > 0 && (
									<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<p className="text-sm font-semibold text-blue-900 mb-2">
											Expected formats:
										</p>
										<ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
											{result.details.expectedFormats.map(
												(format: string, idx: number) => (
													<li key={idx}>{format}</li>
												),
											)}
										</ul>
										{result.details.help && (
											<p className="text-xs text-blue-700 mt-2 italic">
												{result.details.help}
											</p>
										)}
									</div>
								)}
							<div className="border border-gray-200 rounded-lg overflow-hidden">
								<button
									type="button"
									onClick={() => setShowSample(!showSample)}
									className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
								>
									<div className="flex items-center gap-2">
										<FileText className="w-4 h-4 text-gray-600" />
										<span className="text-sm font-semibold text-gray-800">
											Sample OTA VehAvailRSCore format (how your data should
											look)
										</span>
									</div>
									{showSample ? (
										<ChevronUp className="w-4 h-4 text-gray-600" />
									) : (
										<ChevronDown className="w-4 h-4 text-gray-600" />
									)}
								</button>
								{showSample && (
									<div className="p-4 bg-white border-t border-gray-200">
										<p className="text-xs text-gray-700 font-semibold mb-2">
											JSON root structure:
										</p>
										<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-80">{`{
  "@attributes": { "TimeStamp", "Target", "Version", "CDCode" },
  "Success": [],
  "VehAvailRSCore": {
    "VehRentalCore": {
      "@attributes": { "PickUpDateTime", "ReturnDateTime" },
      "PickUpLocation": { "@attributes": { "LocationCode", "Locationname", ... } },
      "ReturnLocation": { "@attributes": { "LocationCode", "Locationname", ... } }
    },
    "VehVendorAvails": {
      "VehVendorAvail": {
        "VehAvails": {
          "VehAvail": [
            {
              "VehAvailCore": { "@attributes": { "Status", "RStatus", "VehID" } },
              "Vehicle": { "VehMakeModel", "VehType", "VehClass", "VehTerms" },
              "RentalRate": { ... },
              "VehicleCharges": { "VehicleCharge": [...], "TotalCharge": { "@attributes": { "RateTotalAmount", "CurrencyCode" } } },
              "PricedEquips": [ ... ]
            }
          ]
        }
      }
    }
  }
}`}</pre>
										<p className="text-xs text-gray-600 mt-2">
											PHP{" "}
											<code className="bg-gray-100 px-1 rounded">
												var_dump()
											</code>{" "}
											of the same structure is also parsed automatically.
										</p>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "default"> = {
	paid: "success",
	open: "warning",
	draft: "default",
	uncollectible: "default",
	void: "default",
};

function formatAmount(cents: number, currency: string): string {
	const code = currency.toUpperCase() === "EUR" ? "EUR" : currency;
	return new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency: code,
		minimumFractionDigits: 2,
	}).format(cents / 100);
}

function SourceTransactionsTab() {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["source", "transactions"],
		queryFn: () => transactionsApi.getMyTransactions(),
	});
	const items: SourceTransaction[] = data?.items ?? [];
	const paidCount = items.filter((t) => t.status === "paid").length;
	const openCount = items.filter(
		(t) => t.status === "open" || t.status === "draft",
	).length;
	const totalPaidCents = items.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
	const primaryCurrency = items[0]?.currency || "EUR";

	return (
		<>
			<div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-8 text-white sm:px-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
						<div className="max-w-3xl">
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
								<Receipt className="h-3.5 w-3.5" /> Billing ledger
							</div>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Transactions
							</h1>
							<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
								Review plan payments, invoice status, billing periods, and
								downloadable invoice documents from Stripe.
							</p>
						</div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => refetch()}
							disabled={isLoading}
							className="border-white/20 bg-white/10 text-white hover:bg-white/20"
						>
							<RefreshCw
								className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
							/>
							Refresh transactions
						</Button>
					</div>
				</div>
				<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Total records
						</p>
						<p className="mt-2 text-lg font-bold text-blue-950">
							{items.length}
						</p>
						<p className="mt-1 text-xs text-blue-700">Loaded billing items</p>
					</div>
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Paid
						</p>
						<p className="mt-2 text-lg font-bold text-emerald-950">
							{paidCount}
						</p>
						<p className="mt-1 text-xs text-emerald-700">Completed invoices</p>
					</div>
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
							Open/draft
						</p>
						<p className="mt-2 text-lg font-bold text-amber-950">{openCount}</p>
						<p className="mt-1 text-xs text-amber-700">
							Need attention if unpaid
						</p>
					</div>
					<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							Paid total
						</p>
						<p className="mt-2 text-lg font-bold text-slate-950">
							{formatAmount(totalPaidCents, primaryCurrency)}
						</p>
						<p className="mt-1 text-xs text-slate-500">
							Based on loaded invoices
						</p>
					</div>
				</div>
			</div>

			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-blue-50">
					<CardTitle className="text-xl font-bold text-slate-950">
						Invoice history
					</CardTitle>
					<p className="mt-1 text-sm leading-6 text-slate-600">
						Use hosted invoice links for payment details, tax information, and
						downloadable PDF invoices.
					</p>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 flex justify-center">
							<Loader size="lg" />
						</div>
					) : error ? (
						<p className="text-red-600 py-4">
							Failed to load transactions. Please try again.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-[900px] w-full text-sm">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
										<th className="text-left px-4 py-3">Date</th>
										<th className="text-left px-4 py-3">Plan</th>
										<th className="text-left px-4 py-3">Status</th>
										<th className="text-right px-4 py-3">Amount</th>
										<th className="text-right px-4 py-3">Period</th>
										<th className="text-right px-4 py-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{items.map((t) => (
										<tr
											key={t.id}
											className="border-b border-slate-100 hover:bg-blue-50/40"
										>
											<td className="px-4 py-3 text-slate-700">
												{t.createdAt ? formatDate(t.createdAt) : "—"}
											</td>
											<td className="px-4 py-3 font-semibold text-slate-900">
												{t.planName ?? "—"}
											</td>
											<td className="px-4 py-3">
												<Badge variant={STATUS_VARIANTS[t.status] ?? "default"}>
													{t.status}
												</Badge>
											</td>
											<td className="px-4 py-3 text-right font-bold text-slate-950">
												{formatAmount(t.amountPaid || t.amountDue, t.currency)}
											</td>
											<td className="px-4 py-3 text-right text-slate-600">
												{t.periodStart && t.periodEnd
													? `${formatDate(t.periodStart).split(" ")[0]} – ${formatDate(t.periodEnd).split(" ")[0]}`
													: "—"}
											</td>
											<td className="px-4 py-3 text-right">
												{t.hostedInvoiceUrl && (
													<a
														href={t.hostedInvoiceUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-blue-600 hover:underline"
													>
														<ExternalLink className="w-4 h-4" />
														View
													</a>
												)}
												{t.invoicePdf && (
													<a
														href={t.invoicePdf}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-gray-600 hover:underline ml-2"
													>
														<FileText className="w-4 h-4" />
														PDF
													</a>
												)}
												{!t.hostedInvoiceUrl && !t.invoicePdf && "—"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{items.length === 0 && (
								<div className="px-6 py-12 text-center">
									<Receipt className="mx-auto h-10 w-10 text-slate-300" />
									<p className="mt-3 font-semibold text-slate-900">
										No transactions yet
									</p>
									<p className="mt-1 text-sm text-slate-500">
										Transactions appear here after a plan payment is created
										through Stripe.
									</p>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}

export default function SourcePage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const dailyPricingDeeplinkSampleId = searchParams.get("sample");
	const dailyPricingDeeplinkOfferRaw = searchParams.get("offer");
	const dailyPricingDeeplinkOfferIndex =
		dailyPricingDeeplinkOfferRaw != null && dailyPricingDeeplinkOfferRaw !== ""
			? Math.max(0, parseInt(dailyPricingDeeplinkOfferRaw, 10) || 0)
			: undefined;

	const buildDailyPricingLink = useCallback(
		(sampleId: string, offerIndex: number) => {
			const p = new URLSearchParams();
			p.set("tab", "pricing");
			p.set("sample", sampleId);
			p.set("offer", String(Math.max(0, offerIndex)));
			return `/source?${p.toString()}`;
		},
		[],
	);
	const [user, setUser] = useState<any>(null);

	// Get active tab from URL or default to dashboard
	const tabFromUrl = searchParams.get("tab") as
		| "dashboard"
		| "agreements"
		| "locations"
		| "branches"
		| "location-branches"
		| "pricing"
		| "daily-pricing"
		| "transactions"
		| "reservations"
		| "cancellations"
		| "location-requests"
		| "health"
		| "verification"
		| "support"
		| "docs"
		| "settings"
		| null;
	const initialTab =
		tabFromUrl === "location-requests" || tabFromUrl === "locations"
			? "location-branches"
			: tabFromUrl === "branches"
				? "location-branches"
				: tabFromUrl === "daily-pricing"
					? "pricing"
					: tabFromUrl;
	const [activeTab, setActiveTab] = useState<
		| "dashboard"
		| "agreements"
		| "locations"
		| "branches"
		| "location-branches"
		| "pricing"
		| "daily-pricing"
		| "transactions"
		| "reservations"
		| "cancellations"
		| "location-requests"
		| "health"
		| "verification"
		| "support"
		| "docs"
		| "settings"
	>(initialTab || "dashboard");
	const [panelTourOpen, setPanelTourOpen] = useState(false);
	const [panelTourStartTab, setPanelTourStartTab] = useState(activeTab);
	const [panelTourNudgeDismissed, setPanelTourNudgeDismissed] = useState(false);
	const [planRequiredContext, setPlanRequiredContext] = useState<{
		action: string;
		description?: string;
	} | null>(null);
	const [isLocationRequestModalOpen, setIsLocationRequestModalOpen] =
		useState(false);
	const [
		isLocationRequestsStatusModalOpen,
		setIsLocationRequestsStatusModalOpen,
	] = useState(false);
	const startPanelTour = useCallback(() => {
		setPanelTourStartTab(activeTab);
		setPanelTourOpen(true);
	}, [activeTab]);
	const activeTabTourName = activeTab
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
	const panelTourButtonLabel =
		activeTab === "dashboard" ? "Panel tour" : `${activeTabTourName} tour`;

	// Agreement detail modal state
	const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
		null,
	);
	const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

	// Error modal state
	const [errorModal, setErrorModal] = useState<{
		isOpen: boolean;
		title?: string;
		message: string;
		error?: string;
	}>({
		isOpen: false,
		message: "",
	});

	// Branch quota exceeded modal (402): add more branches then retry import
	const [quotaModal, setQuotaModal] = useState<{
		payload: BranchQuotaExceededPayload;
		retry: () => Promise<void>;
	} | null>(null);
	const [isAddingBranches, setIsAddingBranches] = useState(false);

	// Locations state (defined early for use in loadSyncedLocations)
	const [locations, setLocations] = useState<Location[]>([]);
	const [isLoadingLocations, setIsLoadingLocations] = useState(false);
	const [showLocations, setShowLocations] = useState(false);
	const [locationsListMeta, setLocationsListMeta] = useState<{
		inherited?: boolean;
		hasMockData?: boolean;
	} | null>(null);

	// Selected agreement for filtering locations (defined early for use in loadLocations)
	const [selectedAgreementFilterId, setSelectedAgreementFilterId] =
		useState<string>("");

	// Function to load synced locations from backend (defined early so it can be used in handlers)
	const loadSyncedLocations = useCallback(async () => {
		if (!user?.company?.id) return;

		setIsLoadingLocations(true);
		try {
			const response = await endpointsApi.getSyncedLocations(user.company.id);
			if (response.items && response.items.length > 0) {
				setLocations(response.items);
				setShowLocations(true);
			} else {
				// If no synced locations, clear the list but don't show error
				setLocations([]);
				setShowLocations(false);
			}
		} catch (error: any) {
			console.error("Failed to load synced locations:", error);
			// Don't show error toast on auto-load, only on manual sync
		} finally {
			setIsLoadingLocations(false);
		}
	}, [user?.company?.id]);

	// Function to load locations (defined early so it can be used in useEffect)
	const loadLocations = useCallback(
		async (showToast = true) => {
			setIsLoadingLocations(true);
			try {
				if (selectedAgreementFilterId) {
					const response = await endpointsApi.getLocationsByAgreement(
						selectedAgreementFilterId,
					);
					setLocations(response.items || []);
					setLocationsListMeta({
						inherited: response.inherited,
						hasMockData: response.hasMockData,
					});
				} else {
					setLocationsListMeta(null);
					// Load synced locations (source coverage) when no agreement filter
					if (user?.company?.id) {
						const response = await endpointsApi.getSyncedLocations(
							user.company.id,
						);
						setLocations(response.items || []);
					} else {
						const response = await endpointsApi.getLocations();
						setLocations(response.items);
					}
				}
				setShowLocations(true);
				if (showToast) {
					toast.success("Locations loaded successfully!");
				}
			} catch (error: any) {
				console.error("Failed to load locations:", error);

				if (showToast) {
					const errorData = error.response?.data || {};
					const errorCode = errorData.error;
					const errorMessage = errorData.message || error.message;

					// Show user-friendly error messages
					if (
						errorCode === "DATABASE_AUTH_ERROR" ||
						errorCode === "DATABASE_CONFIG_ERROR"
					) {
						toast.error(
							"Server configuration error. Please contact the administrator.",
						);
					} else if (error.response?.status >= 500) {
						toast.error(
							"Server error. Please try again later or contact support.",
						);
					} else {
						toast.error(
							errorMessage || "Failed to load locations. Please try again.",
						);
					}
				}
			} finally {
				setIsLoadingLocations(false);
			}
		},
		[selectedAgreementFilterId, user?.company?.id],
	);

	// Sync URL when tab changes
	const handleTabChange = (
		tab:
			| "dashboard"
			| "agreements"
			| "locations"
			| "branches"
			| "location-branches"
			| "pricing"
			| "daily-pricing"
			| "transactions"
			| "reservations"
			| "cancellations"
			| "location-requests"
			| "health"
			| "verification"
			| "support"
			| "docs"
			| "settings",
		opts?: { branchImport?: "endpoint" | "manual" },
	) => {
		if (tab === "daily-pricing") {
			setActiveTab("pricing");
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("tab", "pricing");
				if (next.has("branchImport")) next.delete("branchImport");
				return next;
			});
			return;
		}
		if (tab === "locations" || tab === "location-requests") {
			setActiveTab("location-branches");
			if (tab === "location-requests") {
				setIsLocationRequestsStatusModalOpen(true);
			}
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("tab", "location-branches");
				next.set("branchImport", "endpoint");
				return next;
			});
			if (user?.company?.id) {
				setTimeout(() => loadSyncedLocations(), 100);
			}
			return;
		}
		// Legacy nav + tour: "Manual Branch import" → unified Location & Branches (manual tools)
		if (tab === "branches") {
			setActiveTab("location-branches");
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("tab", "location-branches");
				next.set("branchImport", "manual");
				return next;
			});
			return;
		}
		if (tab === "location-branches") {
			setActiveTab("location-branches");
			const mode = opts?.branchImport ?? "endpoint";
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("tab", "location-branches");
				next.set("branchImport", mode === "manual" ? "manual" : "endpoint");
				return next;
			});
			if (user?.company?.id) {
				setTimeout(() => loadSyncedLocations(), 100);
			}
			return;
		}
		setActiveTab(tab);
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("tab", tab);
			if (next.has("branchImport")) next.delete("branchImport");
			return next;
		});
		// When switching to locations tab, refresh the locations data
		if (tab === "locations" && user?.company?.id) {
			// Small delay to ensure state is updated
			setTimeout(() => {
				loadSyncedLocations();
			}, 100);
		}
	};

	const handleViewAgreement = (agreementId: string) => {
		setSelectedAgreementId(agreementId);
		setIsAgreementModalOpen(true);
	};

	// Sync tab when URL changes (back/forward button)
	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab === "daily-pricing") {
			setActiveTab("pricing");
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set("tab", "pricing");
					if (next.has("branchImport")) next.delete("branchImport");
					return next;
				},
				{ replace: true },
			);
			return;
		}
		if (tab === "locations" || tab === "location-requests") {
			setActiveTab("location-branches");
			if (tab === "location-requests") {
				setIsLocationRequestsStatusModalOpen(true);
			}
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set("tab", "location-branches");
					next.set("branchImport", "endpoint");
					return next;
				},
				{ replace: true },
			);
			return;
		}
		if (tab === "branches") {
			setActiveTab("location-branches");
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set("tab", "location-branches");
					next.set("branchImport", "manual");
					return next;
				},
				{ replace: true },
			);
			return;
		}
		if (
			tab &&
			[
				"dashboard",
				"agreements",
				"location-branches",
				"pricing",
				"transactions",
				"reservations",
				"cancellations",
				"health",
				"verification",
				"support",
				"docs",
				"settings",
			].includes(tab)
		) {
			setActiveTab(tab as any);
		} else if (!tab) {
			// If no tab in URL, set to dashboard and update URL
			setSearchParams({ tab: "dashboard" }, { replace: true });
		}
	}, [searchParams, setSearchParams]);

	// Track if we've already auto-loaded locations for this tab session
	const hasAutoLoadedRef = useRef(false);

	// Auto-load locations when locations tab is opened (first visit or tab switch)
	// This ensures locations are automatically loaded when visiting the locations tab
	useEffect(() => {
		// Reset the ref when switching away from locations tab
		if (activeTab !== "locations") {
			hasAutoLoadedRef.current = false;
			return;
		}

		// Only auto-load once when the locations tab becomes active
		if (
			activeTab === "locations" &&
			user?.company?.id &&
			!isLoadingLocations &&
			!hasAutoLoadedRef.current
		) {
			hasAutoLoadedRef.current = true;
			// Auto-load locations on first visit to locations tab
			// This will show the locations immediately without requiring a button click
			if (!showLocations && locations.length === 0) {
				loadLocations(false); // Don't show toast on auto-load
			}
			// Also load synced locations for the sync functionality (but only once)
			loadSyncedLocations();
		}
	}, [activeTab, user?.company?.id]);

	// Keep Pricing list + TanStack cache in sync with GET /sources/availability-samples
	useEffect(() => {
		if (activeTab === "pricing") {
			loadStoredSamples();
		}
	}, [activeTab]);

	useEffect(() => {
		if (activeTab !== "pricing" || !dailyPricingDeeplinkSampleId) return;
		const timer = window.setTimeout(() => {
			document
				.getElementById("pricing-daily-prices")
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 250);
		return () => window.clearTimeout(timer);
	}, [activeTab, dailyPricingDeeplinkSampleId, dailyPricingDeeplinkOfferIndex]);

	const [agents, setAgents] = useState<Agent[]>([]);
	const [isLoadingAgents, setIsLoadingAgents] = useState(false);
	const [isCreatingAgreement, setIsCreatingAgreement] = useState(false);

	// Endpoint configuration state
	const [endpointConfig, setEndpointConfig] = useState<EndpointConfig | null>(
		null,
	);
	const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(false);
	const [isEditingEndpoints, setIsEditingEndpoints] = useState(false);
	const [isUpdatingEndpoints, setIsUpdatingEndpoints] = useState(false);
	const [httpEndpoint, setHttpEndpoint] = useState("");
	const [grpcEndpoint, setGrpcEndpoint] = useState("");

	// Note: selectedAgreementFilterId is defined earlier (line 59) for use in loadLocations
	const [isSyncingLocations, setIsSyncingLocations] = useState(false);
	const [isImportingBranches, setIsImportingBranches] = useState(false);
	const [isImportingLocations, setIsImportingLocations] = useState(false);
	const [isLocationEndpointConfigOpen, setIsLocationEndpointConfigOpen] =
		useState(false);
	const [locationEndpointUrl, setLocationEndpointUrl] = useState("");
	const [isSavingLocationEndpoint, setIsSavingLocationEndpoint] =
		useState(false);
	const [isValidatingLocationEndpoint, setIsValidatingLocationEndpoint] =
		useState(false);
	const [showLocationImportResult, setShowLocationImportResult] =
		useState(false);
	const [locationImportResult, setLocationImportResult] = useState<any>(null);
	const [locationConfigTab, setLocationConfigTab] = useState<
		"settings" | "sample"
	>("settings");
	const [locationSamplePaste, setLocationSamplePaste] = useState("");
	const [locationListEndpointUrl, setLocationListEndpointUrl] = useState("");
	const [locationListRequestRoot, setLocationListRequestRoot] = useState("");
	const [locationListAccountId, setLocationListAccountId] = useState("");
	const [isLocationListConfigOpen, setIsLocationListConfigOpen] =
		useState(false);
	const [isSavingLocationListConfig, setIsSavingLocationListConfig] =
		useState(false);
	const [isImportingLocationList, setIsImportingLocationList] = useState(false);
	const [locationListImportResult, setLocationListImportResult] =
		useState<any>(null);
	const [showLocationListImportResult, setShowLocationListImportResult] =
		useState(false);
	const [locationListConfigTab, setLocationListConfigTab] = useState<
		"settings" | "sample"
	>("settings");
	const [locationListTransport, setLocationListTransport] = useState<
		"http" | "grpc"
	>("http");
	const [locationListSampleFormat, setLocationListSampleFormat] = useState<
		"xml" | "grpc"
	>("xml");
	const [locationListSamplePaste, setLocationListSamplePaste] = useState("");
	const [locationListSampleValidation, setLocationListSampleValidation] =
		useState<{
			ok: boolean;
			format?: string;
			count?: number;
			errors?: string[];
		} | null>(null);
	const [locationSampleValidation, setLocationSampleValidation] = useState<{
		ok: boolean;
		format?: string;
		count?: number;
		errors?: string[];
	} | null>(null);
	const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
	const [availabilityEndpointUrl, setAvailabilityEndpointUrl] = useState("");
	const [isSavingAvailabilityEndpoint, setIsSavingAvailabilityEndpoint] =
		useState(false);
	const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
	const [fetchAvailabilityResult, setFetchAvailabilityResult] = useState<{
		message: string;
		offersCount?: number;
		stored?: boolean;
		isNew?: boolean;
		error?: string;
		details?: {
			expectedFormats?: string[];
			help?: string;
			dataPreview?: string;
		};
	} | null>(null);
	// OTA request parameters for the pricing tab test form
	const [otaRequestorId, setOtaRequestorId] = useState("");
	const [otaPickupLoc, setOtaPickupLoc] = useState("TIAA01");
	const [otaReturnLoc, setOtaReturnLoc] = useState("TIAA01");
	const [otaPickupDateTime, setOtaPickupDateTime] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() + 30);
		d.setHours(14, 0, 0, 0);
		return d.toISOString().slice(0, 16);
	});
	const [otaReturnDateTime, setOtaReturnDateTime] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() + 34);
		d.setHours(14, 0, 0, 0);
		return d.toISOString().slice(0, 16);
	});
	const [otaDriverAge, setOtaDriverAge] = useState(30);
	const [otaCitizenCountry, setOtaCitizenCountry] = useState("US");
	const [forceRefreshAvailability, setForceRefreshAvailability] =
		useState(false);
	const [availabilityAdapterType, setAvailabilityAdapterType] = useState<
		"xml" | "json" | "grpc"
	>("xml");
	/** Top-level: live endpoint (OTA/JSON/gRPC) vs manual GLORIA-shaped entry */
	const [pricingEntryMode, setPricingEntryMode] = useState<
		"endpoint" | "manual"
	>("endpoint");
	const [grpcEndpointAddress, setGrpcEndpointAddress] = useState("");
	const [showManualImportModal, setShowManualImportModal] = useState(false);
	const [manualFleetId, setManualFleetId] = useState<string | null>(null);
	const [manualSelectedFleet, setManualSelectedFleet] = useState<SourceFleet | null>(
		null,
	);
	const [showGloriaXmlResponseModal, setShowGloriaXmlResponseModal] =
		useState(false);
	const [isSubmittingManualImport, setIsSubmittingManualImport] =
		useState(false);
	const [customAcrissCodes, setCustomAcrissCodes] = useState<string[]>([]);
	const [newAcrissDraft, setNewAcrissDraft] = useState("");
	const [manualAcriss, setManualAcriss] = useState("");
	const [manualMake, setManualMake] = useState("");
	const [manualModel, setManualModel] = useState("");
	const [manualModalPickupLoc, setManualModalPickupLoc] = useState("TIAA01");
	const [manualModalReturnLoc, setManualModalReturnLoc] = useState("TIAA01");
	const [manualModalPickupDt, setManualModalPickupDt] = useState("");
	const [manualModalReturnDt, setManualModalReturnDt] = useState("");
	const [manualCurrency, setManualCurrency] = useState("EUR");
	const [manualTotalPrice, setManualTotalPrice] = useState("150");
	const [manualTransmission, setManualTransmission] = useState("Automatic");
	const [manualDoors, setManualDoors] = useState("4");
	const [manualSeats, setManualSeats] = useState("5");
	const [manualBagsS, setManualBagsS] = useState("1");
	const [manualBagsM, setManualBagsM] = useState("2");
	const [manualMinLead, setManualMinLead] = useState("2");
	const [manualMaxLead, setManualMaxLead] = useState("365");
	const [manualMileage, setManualMileage] = useState("0");
	const [manualImageUrl, setManualImageUrl] = useState("");
	const [isUploadingManualVehicleImage, setIsUploadingManualVehicleImage] =
		useState(false);
	const manualVehicleImageInputRef = useRef<HTMLInputElement>(null);
	const [manualCarOrderId, setManualCarOrderId] = useState("");
	const [manualRentalDuration, setManualRentalDuration] = useState("");
	const [gloriaMetaTimestamp, setGloriaMetaTimestamp] = useState("");
	const [gloriaMetaTarget, setGloriaMetaTarget] = useState("Production");
	const [gloriaMetaVersion, setGloriaMetaVersion] = useState("1.00");
	const [manualPricingCarOrderId, setManualPricingCarOrderId] = useState("");
	const [manualPricingCurrency, setManualPricingCurrency] = useState("");
	const [manualPricingDuration, setManualPricingDuration] = useState("");
	const [manualPricingDailyNet, setManualPricingDailyNet] = useState("");
	const [manualPricingDailyTax, setManualPricingDailyTax] = useState("");
	const [manualPricingDailyGross, setManualPricingDailyGross] = useState("");
	const [manualPricingTotalNet, setManualPricingTotalNet] = useState("");
	const [manualPricingTotalTax, setManualPricingTotalTax] = useState("");
	const [manualPricingTotalGross, setManualPricingTotalGross] = useState("");
	const [manualPricingTaxRate, setManualPricingTaxRate] = useState("");
	const [manualTermRows, setManualTermRows] = useState<ManualImportTermRow[]>([]);
	type ManualLineRow = {
		id: string;
		code: string;
		description: string;
		excess: string;
		deposit: string;
		currency: string;
	};
	type ManualNotRow = ManualLineRow & { cover_amount: string; price: string };
	type ManualExtraRow = {
		id: string;
		code: string;
		description: string;
		price: string;
		currency: string;
		long_description: string;
	};
	const [includedRows, setIncludedRows] = useState<ManualLineRow[]>([]);
	const [notIncludedRows, setNotIncludedRows] = useState<ManualNotRow[]>([]);
	const [extraRows, setExtraRows] = useState<ManualExtraRow[]>([]);
	// Stored availability samples (loaded on pricing tab mount)
	const [storedSamples, setStoredSamples] = useState<
		import("../api/endpoints").StoredAvailabilitySample[]
	>([]);
	const [isLoadingStoredSamples, setIsLoadingStoredSamples] = useState(false);
	const queryClient = useQueryClient();

	// Branches state
	const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
	const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
	const [isBranchCreateModalOpen, setIsBranchCreateModalOpen] = useState(false);

	// gRPC Test state
	const [grpcTestResult, setGrpcTestResult] =
		useState<SourceGrpcTestResponse | null>(null);
	const [isTestingGrpc, setIsTestingGrpc] = useState(false);

	// Health state
	const [healthLoading, setHealthLoading] = useState(false);
	const [health, setHealth] = useState<SourceHealth | null>(null);

	// Verification re-run state
	const [verificationStatus, setVerificationStatus] = useState<
		"IDLE" | "PENDING" | "RUNNING" | "PASSED" | "FAILED"
	>("IDLE");
	const [verificationLoading, setVerificationLoading] = useState(false);
	const [verificationResult, setVerificationResult] =
		useState<VerificationResult | null>(null);
	const [verificationHistory, setVerificationHistory] = useState<
		VerificationResult[]
	>([]);

	// Notification state
	const [showNotifications, setShowNotifications] = useState(false);

	// Fetch unread notification count
	const { data: notificationsData } = useQuery({
		queryKey: ["notifications-count"],
		queryFn: async () => {
			try {
				const response = await api.get("/endpoints/notifications", {
					params: { limit: 50, unreadOnly: true },
				});
				const items = response.data?.items || response.data?.data?.items || [];
				return items.filter((n: any) => !n.read && !n.readAt);
			} catch (error) {
				return [];
			}
		},
		refetchInterval: 30000, // Refetch every 30 seconds
		retry: 1,
		enabled: !!user?.company?.id,
	});

	const unreadCount = notificationsData?.length || 0;

	// Subscription (plan gate for branches/locations)
	const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
		queryKey: ["subscription"],
		queryFn: () => subscriptionApi.getMySubscription(),
		retry: false,
		enabled: !!user?.company?.id,
	});
	const subscriptionActive =
		!!subscription?.active &&
		!!subscription.currentPeriodEnd &&
		new Date(subscription.currentPeriodEnd) > new Date();
	const nearExpiry =
		subscriptionActive &&
		!!subscription?.currentPeriodEnd &&
		(new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
			(7 * 24 * 60 * 60 * 1000) <
			1;

	const openPlanRequired = useCallback(
		(action = "continue", description?: string) => {
			setPlanRequiredContext({ action, description });
			toast.error("Choose a plan first to continue.");
		},
		[],
	);

	const requireActivePlan = useCallback(
		(action = "continue", description?: string) => {
			if (subscriptionActive) return true;
			if (isLoadingSubscription) {
				toast("Checking your plan status…");
				return false;
			}
			openPlanRequired(action, description);
			return false;
		},
		[subscriptionActive, isLoadingSubscription, openPlanRequired],
	);

	const selectBranchImportMode = useCallback(
		(mode: "endpoint" | "manual") => {
			setSearchParams((prev) => {
				const n = new URLSearchParams(prev);
				n.set("tab", "location-branches");
				n.set("branchImport", mode === "manual" ? "manual" : "endpoint");
				return n;
			});
			if (mode === "manual") {
				setIsLocationListConfigOpen(false);
				if (
					requireActivePlan(
						"add a branch",
						"Adding a branch creates an operational branch record. Choose a plan before adding branches.",
					)
				) {
					setIsBranchCreateModalOpen(true);
				}
			} else {
				setIsBranchCreateModalOpen(false);
				setLocationListConfigTab("settings");
				setLocationListSampleValidation(null);
				setIsLocationListConfigOpen(true);
			}
		},
		[setSearchParams, requireActivePlan],
	);

	const dashboardDataEnabled =
		activeTab === "dashboard" &&
		!!user?.company?.id &&
		user?.company?.status === "ACTIVE" &&
		subscriptionActive;

	const dashboardBranchesQuery = useQuery({
		queryKey: ["branches", "dashboard-summary", user?.company?.id],
		queryFn: () => branchesApi.listBranches({ limit: 1, offset: 0 }),
		enabled: dashboardDataEnabled,
		staleTime: 30_000,
	});

	const dashboardLocationsQuery = useQuery({
		queryKey: ["dashboard", "locations-summary", user?.company?.id],
		queryFn: () => endpointsApi.getSyncedLocations(user.company.id),
		enabled: dashboardDataEnabled,
		staleTime: 30_000,
	});

	const dashboardAvailabilityQuery = useQuery({
		queryKey: ["availability-samples"],
		queryFn: async () => {
			const { samples } = await endpointsApi.getAvailabilitySamples();
			return samples;
		},
		enabled: dashboardDataEnabled,
		staleTime: 30_000,
	});

	const dashboardSamples = dashboardAvailabilityQuery.data ?? storedSamples;
	const dashboardBranchCount = dashboardBranchesQuery.data?.total;
	const dashboardLocationCount =
		dashboardLocationsQuery.data?.items?.length ??
		(locations.length > 0 ? locations.length : undefined);
	const dashboardOfferCount = useMemo(
		() =>
			dashboardSamples.reduce((total, sample) => {
				const summarized = sample.offersSummary?.length;
				return (
					total +
					(Number.isFinite(sample.offersCount)
						? sample.offersCount
						: summarized || 0)
				);
			}, 0),
		[dashboardSamples],
	);
	const dashboardUniqueSampleLocations = useMemo(() => {
		const codes = new Set<string>();
		dashboardSamples.forEach((sample) => {
			if (sample.pickupLoc) codes.add(sample.pickupLoc.toUpperCase());
			if (sample.returnLoc) codes.add(sample.returnLoc.toUpperCase());
		});
		return codes.size;
	}, [dashboardSamples]);
	const dashboardLatestSample = useMemo(() => {
		return [...dashboardSamples].sort((a, b) => {
			const left = new Date(a.fetchedAt || a.updatedAt || 0).getTime();
			const right = new Date(b.fetchedAt || b.updatedAt || 0).getTime();
			return right - left;
		})[0];
	}, [dashboardSamples]);
	const companyLogoUrl = uploadsPublicUrl(
		user?.company?.registrationPhotoUrl ||
			user?.company?.logoUrl ||
			user?.company?.photoUrl,
	);
	const showPanelTourNudge = Boolean(
		user?.company?.id &&
			user?.company?.status === "ACTIVE" &&
			!panelTourOpen &&
			!panelTourNudgeDismissed &&
			!localStorage.getItem(SOURCE_PANEL_TOUR_STORAGE_KEY(user.company.id)),
	);
	const companyInitials =
		String(user?.company?.companyName || "Source")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "S";

	const [isDashboardProfileEditorOpen, setIsDashboardProfileEditorOpen] =
		useState(false);
	const [isSavingDashboardProfile, setIsSavingDashboardProfile] =
		useState(false);
	const [dashboardProfileDraft, setDashboardProfileDraft] = useState({
		registrationBranchName: "",
		companyWebsiteUrl: "",
		companyAddress: "",
	});

	const openDashboardProfileEditor = useCallback(() => {
		setDashboardProfileDraft({
			registrationBranchName: user?.company?.registrationBranchName || "",
			companyWebsiteUrl: user?.company?.companyWebsiteUrl || "",
			companyAddress: user?.company?.companyAddress || "",
		});
		setIsDashboardProfileEditorOpen(true);
	}, [
		user?.company?.registrationBranchName,
		user?.company?.companyWebsiteUrl,
		user?.company?.companyAddress,
	]);

	const saveDashboardProfileDetails = async () => {
		const website = dashboardProfileDraft.companyWebsiteUrl.trim();
		if (website) {
			try {
				new URL(website);
			} catch {
				toast.error("Enter a valid website URL including https://");
				return;
			}
		}

		setIsSavingDashboardProfile(true);
		try {
			const response = await api.patch("/settings", {
				registrationBranchName:
					dashboardProfileDraft.registrationBranchName.trim(),
				companyWebsiteUrl: website,
				companyAddress: dashboardProfileDraft.companyAddress.trim(),
			});
			const data = response.data || {};
			const storedUser = localStorage.getItem("user");
			let currentUser = user;
			if (storedUser) {
				try {
					currentUser = JSON.parse(storedUser);
				} catch {
					currentUser = user;
				}
			}
			if (currentUser?.company) {
				const nextUser = {
					...currentUser,
					company: {
						...currentUser.company,
						companyName: data.companyName ?? currentUser.company.companyName,
						companyCode: data.companyCode ?? currentUser.company.companyCode,
						companyWebsiteUrl: data.companyWebsiteUrl ?? "",
						registrationBranchName: data.registrationBranchName ?? null,
						companyAddress: data.companyAddress ?? null,
						registrationPhotoUrl:
							data.registrationPhotoUrl ??
							currentUser.company.registrationPhotoUrl,
						type: data.companyType ?? currentUser.company.type,
						status: data.companyStatus ?? currentUser.company.status,
						approvalStatus:
							data.companyApprovalStatus ?? currentUser.company.approvalStatus,
					},
				};
				localStorage.setItem("user", JSON.stringify(nextUser));
				setUser(nextUser);
				window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
			}
			setIsDashboardProfileEditorOpen(false);
			toast.success("Source details saved");
		} catch (error: any) {
			console.error("Failed to save source details:", error);
			toast.error(
				error.response?.data?.message || "Failed to save source details",
			);
		} finally {
			setIsSavingDashboardProfile(false);
		}
	};

	useEffect(() => {
		if (searchParams.get("checkout") === "success") {
			queryClient.invalidateQueries({ queryKey: ["subscription"] });
			sessionStorage.setItem("source_panel_tour_pending_checkout", "1");
			const tab = searchParams.get("tab") || "dashboard";
			setSearchParams({ tab }, { replace: true });
		}
	}, [searchParams, queryClient, setSearchParams]);

	useEffect(() => {
		const companyId = user?.company?.id;
		if (!companyId || isLoadingSubscription) return;
		if (sessionStorage.getItem("source_panel_tour_pending_checkout") !== "1")
			return;
		if (localStorage.getItem(SOURCE_PANEL_TOUR_STORAGE_KEY(companyId))) {
			sessionStorage.removeItem("source_panel_tour_pending_checkout");
			return;
		}
		if (!subscriptionActive) return;
		sessionStorage.removeItem("source_panel_tour_pending_checkout");
		setPanelTourStartTab("dashboard");
		setPanelTourOpen(true);
	}, [user?.company?.id, isLoadingSubscription, subscriptionActive]);

	useEffect(() => {
		const companyId = user?.company?.id;
		if (!companyId || user?.company?.status !== "ACTIVE") return;
		if (isLoadingSubscription || panelTourOpen || activeTab !== "dashboard")
			return;
		if (searchParams.get("renew") === "1") return;
		if (localStorage.getItem(SOURCE_PANEL_TOUR_STORAGE_KEY(companyId))) return;

		const sessionKey = `source_panel_tour_auto_started_${companyId}`;
		if (sessionStorage.getItem(sessionKey) === "1") return;
		sessionStorage.setItem(sessionKey, "1");

		const timer = window.setTimeout(() => {
			setPanelTourStartTab("dashboard");
			setPanelTourOpen(true);
		}, 650);
		return () => window.clearTimeout(timer);
	}, [
		user?.company?.id,
		user?.company?.status,
		isLoadingSubscription,
		panelTourOpen,
		activeTab,
		searchParams,
	]);

	// Form state for creating agreement
	const [selectedAgentId, setSelectedAgentId] = useState("");
	const [agreementAccountNumber, setAgreementAccountNumber] = useState("");
	const [agreementMarginPercent, setAgreementMarginPercent] = useState("0");
	const [agreementContactName, setAgreementContactName] = useState("");
	const [agreementContactEmail, setAgreementContactEmail] = useState("");
	const [agreementContactPhone, setAgreementContactPhone] = useState("");

	useEffect(() => {
		// Load user data from localStorage
		const userData = localStorage.getItem("user");
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
				setAgreementContactEmail(
					(prev) => prev || parsedUser.email || parsedUser.company?.email || "",
				);
				setAgreementContactName(
					(prev) =>
						prev ||
						parsedUser.name ||
						parsedUser.fullName ||
						parsedUser.company?.companyName ||
						"",
				);
				setAgreementContactPhone(
					(prev) =>
						prev ||
						parsedUser.phone ||
						parsedUser.telephone ||
						parsedUser.company?.phone ||
						parsedUser.company?.telephone ||
						"",
				);

				// Check if company exists before accessing its properties
				if (!parsedUser?.company?.id) {
					console.warn("User data missing company information");
					return;
				}

				// Load persisted gRPC test result
				const savedGrpcTest = localStorage.getItem(
					`grpcTestResult_${parsedUser.company.id}`,
				);
				if (savedGrpcTest) {
					try {
						const parsed = JSON.parse(savedGrpcTest);
						// Check if the test result is still valid (same endpoint)
						const savedEndpoint = localStorage.getItem(
							`grpcEndpoint_${parsedUser.company.id}`,
						);
						if (savedEndpoint && parsed.addr === savedEndpoint) {
							setGrpcTestResult(parsed);
						}
					} catch (e) {
						console.error("Failed to parse saved gRPC test result:", e);
					}
				}

				// Load persisted last sync time
				const savedSyncTime = localStorage.getItem(
					`lastSyncTime_${parsedUser.company.id}`,
				);
				if (savedSyncTime) {
					setLastSyncTime(savedSyncTime);
				}

				// Only load agents and endpoints if company status is ACTIVE
				if (parsedUser.company?.status === "ACTIVE") {
					loadAgents();
					loadEndpointConfig();
					// Preload health
					loadHealth();
					// Load verification status
					loadVerificationStatus();
				}
			} catch (error) {
				console.error("Failed to parse user data from localStorage:", error);
			}
		}
	}, []);

	useEffect(() => {
		const applyUserFromStorage = () => {
			const userData = localStorage.getItem("user");
			if (!userData) return;
			try {
				setUser(JSON.parse(userData));
			} catch {
				/* ignore */
			}
		};
		window.addEventListener(PROFILE_UPDATED_EVENT, applyUserFromStorage);
		return () =>
			window.removeEventListener(PROFILE_UPDATED_EVENT, applyUserFromStorage);
	}, []);

	const loadVerificationStatus = async () => {
		try {
			const result = await verificationApi.getStatus();
			if (result) {
				setVerificationResult(result);
				setVerificationStatus(result.passed ? "PASSED" : "FAILED");
				setVerificationHistory([result]);
			}
		} catch (error) {
			console.error("Failed to load verification status:", error);
		}
	};

	const runSourceVerification = async () => {
		setVerificationLoading(true);
		setVerificationStatus("RUNNING");
		try {
			const result = await verificationApi.runVerification();
			setVerificationResult(result);
			setVerificationStatus(result.passed ? "PASSED" : "FAILED");
			setVerificationHistory((previous) => [result, ...previous.slice(0, 4)]);
			if (result.passed) {
				toast.success("Verification completed successfully! All tests passed.");
			} else {
				const failedSteps =
					result.steps?.filter((step: any) => !step.passed) || [];
				const failedStepNames =
					failedSteps.map((step: any) => step.name).join(", ") || "unknown";
				toast.error(
					`Verification failed: ${failedSteps.length} step(s) failed (${failedStepNames})`,
				);
			}
		} catch (error: any) {
			setVerificationStatus("FAILED");
			toast.error(error.response?.data?.message || "Verification failed");
		} finally {
			setVerificationLoading(false);
		}
	};

	const loadAgents = async () => {
		try {
			setIsLoadingAgents(true);
			const response = await agreementsApi.getAllAgents();
			setAgents(response.items);
		} catch (error: any) {
			console.error("Failed to load agents:", error);

			const errorData = error.response?.data || {};
			const errorCode = errorData.error;
			const errorMessage = errorData.message || error.message;

			// Show user-friendly error messages
			if (
				errorCode === "DATABASE_AUTH_ERROR" ||
				errorCode === "DATABASE_CONFIG_ERROR"
			) {
				toast.error(
					"Server configuration error. Please contact the administrator.",
				);
			} else if (error.response?.status === 404) {
				toast.error(
					"Agreements endpoint not found. Please check your backend configuration.",
				);
			} else if (error.response?.status >= 500) {
				toast.error("Server error. Please try again later or contact support.");
			} else {
				toast.error(errorMessage || "Failed to load agents. Please try again.");
			}
		} finally {
			setIsLoadingAgents(false);
		}
	};

	const loadEndpointConfig = async () => {
		try {
			setIsLoadingEndpoints(true);
			const response = await endpointsApi.getConfig();
			setEndpointConfig(response);
			setHttpEndpoint(response.httpEndpoint);
			setGrpcEndpoint(response.grpcEndpoint);
			setLocationEndpointUrl(response.locationEndpointUrl || "");
			setLocationListEndpointUrl(response.locationListEndpointUrl || "");
			setLocationListRequestRoot(response.locationListRequestRoot || "");
			setLocationListAccountId(response.locationListAccountId || "");
			setLocationListTransport(
				response.locationListTransport === "grpc" ? "grpc" : "http",
			);
			setAvailabilityEndpointUrl(response.availabilityEndpointUrl || "");
			// Pre-fill OTA requestor ID from saved account ID
			if (response.locationListAccountId) {
				setOtaRequestorId(response.locationListAccountId);
			}

			// Save endpoint to localStorage for validation
			if (user?.company?.id) {
				localStorage.setItem(
					`grpcEndpoint_${user.company.id}`,
					response.grpcEndpoint || "",
				);
			}

			// Check if we have a saved test result for this endpoint
			if (user?.company?.id && response.grpcEndpoint) {
				const savedGrpcTest = localStorage.getItem(
					`grpcTestResult_${user.company.id}`,
				);
				if (savedGrpcTest) {
					try {
						const parsed = JSON.parse(savedGrpcTest);
						// Only use saved result if endpoint matches
						if (parsed.addr === response.grpcEndpoint) {
							setGrpcTestResult(parsed);
						} else {
							// Endpoint changed, clear old test result
							setGrpcTestResult(null);
							localStorage.removeItem(`grpcTestResult_${user.company.id}`);
						}
					} catch (e) {
						console.error("Failed to parse saved gRPC test result:", e);
					}
				}
			} else if (user?.company?.id && !response.grpcEndpoint) {
				// No endpoint configured, clear test result
				setGrpcTestResult(null);
				localStorage.removeItem(`grpcTestResult_${user.company.id}`);
			}

			// Load persisted gRPC test result from database
			if (response.lastGrpcTestResult && response.lastGrpcTestAt) {
				setGrpcTestResult(response.lastGrpcTestResult);
			}

			// Load persisted last sync time from database and load synced locations
			if (response.lastLocationSyncAt) {
				setLastSyncTime(response.lastLocationSyncAt);
				// If we have a sync timestamp, load the synced locations
				if (user?.company?.id) {
					try {
						const locationsResponse = await endpointsApi.getSyncedLocations(
							user.company.id,
						);
						if (locationsResponse.items && locationsResponse.items.length > 0) {
							setLocations(locationsResponse.items);
							setShowLocations(true);
						}
					} catch (error) {
						// Silently fail - locations might not be synced yet
						console.log("No synced locations found yet");
					}
				}
			}
		} catch (error: any) {
			console.error("Failed to load endpoint configuration:", error);

			const errorData = error.response?.data || {};
			const errorCode = errorData.error;
			const errorMessage = errorData.message || error.message;

			// Show user-friendly error messages
			if (
				errorCode === "DATABASE_AUTH_ERROR" ||
				errorCode === "DATABASE_CONFIG_ERROR"
			) {
				toast.error(
					"Server configuration error. Please contact the administrator.",
				);
			} else if (error.response?.status === 404) {
				toast.error(
					"Endpoints endpoint not found. Please check your backend configuration.",
				);
			} else if (error.response?.status >= 500) {
				toast.error("Server error. Please try again later or contact support.");
			} else {
				toast.error(
					errorMessage ||
						"Failed to load endpoint configuration. Please try again.",
				);
			}
		} finally {
			setIsLoadingEndpoints(false);
		}
	};

	// Load locationEndpointUrl and availabilityEndpointUrl when endpointConfig changes
	useEffect(() => {
		if (endpointConfig?.locationEndpointUrl) {
			setLocationEndpointUrl(endpointConfig.locationEndpointUrl);
		}
		if (endpointConfig?.availabilityEndpointUrl) {
			setAvailabilityEndpointUrl(endpointConfig.availabilityEndpointUrl);
		}
		if (endpointConfig?.grpcEndpoint) {
			setGrpcEndpointAddress(
				(endpointConfig.grpcEndpoint as string).replace(/^grpc:\/\//, ""),
			);
		}
		if (endpointConfig?.locationListEndpointUrl != null) {
			setLocationListEndpointUrl(endpointConfig.locationListEndpointUrl || "");
		}
		if (endpointConfig?.locationListRequestRoot != null) {
			setLocationListRequestRoot(endpointConfig.locationListRequestRoot || "");
		}
		if (endpointConfig?.locationListAccountId != null) {
			setLocationListAccountId(endpointConfig.locationListAccountId || "");
		}
		if (
			endpointConfig?.locationListTransport != null &&
			endpointConfig?.locationListTransport !== undefined
		) {
			setLocationListTransport(
				endpointConfig.locationListTransport === "grpc" ? "grpc" : "http",
			);
		}
	}, [endpointConfig]);

	const loadHealth = async () => {
		try {
			setHealthLoading(true);
			const res = await api.get("/health/my-source");
			setHealth(res.data);
		} catch (e: any) {
			console.error("Failed to load health data:", e);
			// Set default health data if request fails
			setHealth({
				sourceId: user?.company?.id || "",
				healthy: true,
				status: "NO_DATA",
				slowRate: 0,
				fastRate: 1,
				healthRate: 1,
				sampleCount: 0,
				slowCount: 0,
				backoffLevel: 0,
				strikeCount: 0,
				strikesForBackoff: 3,
				slowThresholdMs: 3000,
				backoffScheduleMinutes: [15, 30, 60, 120, 240],
				monitorEnabled: false,
				isExcluded: false,
				excludedUntil: null,
				updatedAt: null,
				lastStrikeAt: null,
				lastResetAt: null,
				lastResetBy: null,
				nextBackoffMinutes: null,
			});
		} finally {
			setHealthLoading(false);
		}
	};

	const updateEndpointConfig = async () => {
		if (!httpEndpoint || !grpcEndpoint) {
			toast.error("Please fill in all endpoint fields");
			return;
		}

		setIsUpdatingEndpoints(true);
		try {
			const response = await endpointsApi.updateConfig({
				httpEndpoint,
				grpcEndpoint,
			});
			toast.success(
				response.message || "Endpoint configuration updated successfully!",
			);
			setIsEditingEndpoints(false);
			// Reload endpoint configuration
			await loadEndpointConfig();
		} catch (error: any) {
			console.error("Failed to update endpoint configuration:", error);
			if (error.response?.data?.message) {
				toast.error(error.response.data.message);
			} else {
				toast.error("Failed to update endpoint configuration");
			}
		} finally {
			setIsUpdatingEndpoints(false);
		}
	};

	const cancelEditEndpoints = () => {
		if (endpointConfig) {
			setHttpEndpoint(endpointConfig.httpEndpoint);
			setGrpcEndpoint(endpointConfig.grpcEndpoint);
		}
		setIsEditingEndpoints(false);
	};

	const syncLocations = async () => {
		if (!user?.company?.id) {
			toast.error("Company ID not found");
			return;
		}
		if (
			!requireActivePlan(
				"sync locations",
				"Location sync writes coverage from your endpoint into Gloria. Choose a plan before running live imports.",
			)
		)
			return;

		setIsSyncingLocations(true);
		try {
			// Run the sync - this returns {added, removed, total}
			const syncResponse = await endpointsApi.syncLocations(user.company.id);

			// Reload endpoint config to get updated lastLocationSyncAt
			await loadEndpointConfig();

			// Fetch the synced locations from the backend
			const locationsResponse = await endpointsApi.getSyncedLocations(
				user.company.id,
			);

			// Update locations state
			if (locationsResponse.items && locationsResponse.items.length > 0) {
				setLocations(locationsResponse.items);
				setShowLocations(true);
			} else {
				setLocations([]);
				setShowLocations(false);
			}

			// Show success message based on sync response
			// Sync is successful even if added=0, removed=0, total=0 (means no changes)
			if (syncResponse && typeof syncResponse === "object") {
				const added = syncResponse.added || 0;
				const removed = syncResponse.removed || 0;
				const total = syncResponse.total || 0;

				if (added > 0 || removed > 0) {
					toast.success(
						`Locations synced successfully! Added: ${added}, Removed: ${removed}, Total: ${total}`,
					);
				} else if (total > 0) {
					toast.success(
						`Locations synced successfully! ${total} location(s) available.`,
					);
				} else {
					// Sync completed but no locations found - this is still a successful sync
					toast.success(
						"Location sync completed successfully. No locations to sync.",
					);
				}
			} else {
				// Fallback if response format is unexpected
				if (locationsResponse.items && locationsResponse.items.length > 0) {
					toast.success(
						`Locations synced successfully! ${locationsResponse.items.length} location(s) available.`,
					);
				} else {
					toast.success("Location sync completed successfully.");
				}
			}

			// Update lastSyncTime from endpointConfig (which was just refreshed)
			if (endpointConfig?.lastLocationSyncAt) {
				setLastSyncTime(endpointConfig.lastLocationSyncAt);
			} else {
				const syncTime = new Date().toISOString();
				setLastSyncTime(syncTime);
			}
		} catch (error: any) {
			console.error("Failed to sync locations:", error);
			toast.error(error.response?.data?.message || "Failed to sync locations");
		} finally {
			setIsSyncingLocations(false);
		}
	};

	const importBranches = async () => {
		if (
			!requireActivePlan(
				"import branches",
				"Branch imports create or update operational branch records. Select a branch plan before importing.",
			)
		)
			return;
		setIsImportingBranches(true);
		try {
			const result = await endpointsApi.importBranches();
			toast.success(
				`Branches imported successfully! ${result.imported} new, ${result.updated} updated`,
			);
		} catch (error: any) {
			console.error("Failed to import branches:", error);
			const errorData = error.response?.data || {};
			const errorMessage = errorData.message || "Failed to import branches";
			const errorCode = errorData.error || "";
			if (
				error.response?.status === 402 &&
				errorCode === "BRANCH_QUOTA_EXCEEDED"
			) {
				setQuotaModal({
					payload: errorData as BranchQuotaExceededPayload,
					retry: () => importBranches(),
				});
			} else if (
				error.response?.status === 400 &&
				(errorCode === "NOT_APPROVED" || errorMessage.includes("approved"))
			) {
				setErrorModal({
					isOpen: true,
					title: "Account Approval Required",
					message: errorMessage,
					error: errorCode,
				});
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsImportingBranches(false);
		}
	};

	const importLocations = async () => {
		if (
			!requireActivePlan(
				"import locations",
				"Location imports save supplier coverage into Gloria. Choose a plan before running imports.",
			)
		)
			return;
		setIsImportingLocations(true);
		try {
			const result = await endpointsApi.importLocations();

			// Check if there are errors in the response
			if (result.errors && result.errors.length > 0) {
				// Partial success or errors - show result modal
				setLocationImportResult(result);
				setShowLocationImportResult(true);

				if (result.imported > 0 || result.updated > 0) {
					toast.success(
						`Locations imported: ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped`,
						{ duration: 5000 },
					);
				} else {
					toast.warning(
						`Import completed but no locations were imported. ${result.skipped} location(s) were skipped.`,
						{ duration: 7000 },
					);
				}
			} else if (result.imported > 0 || result.updated > 0) {
				// Complete success
				toast.success(
					`Locations imported successfully! ${result.imported} new, ${result.updated} updated`,
				);
			} else {
				toast.warning("No locations found to import");
			}

			// Reload synced locations after import
			if (user?.company?.id) {
				loadSyncedLocations();
			}
			// Reload endpoint config to get updated lastLocationSyncAt
			await loadEndpointConfig();
		} catch (error: any) {
			console.error("Failed to import locations:", error);
			const errorData = error.response?.data || {};
			const errorMessage = errorData.message || "Failed to import locations";
			const errorCode = errorData.error || "";

			// Handle format errors with detailed display
			if (
				error.response?.status === 400 &&
				(errorCode === "INVALID_FORMAT" ||
					errorCode === "INVALID_RESPONSE_FORMAT")
			) {
				setLocationImportResult({
					message: errorMessage,
					error: errorCode,
					details: errorData.details,
					imported: 0,
					updated: 0,
					skipped: 0,
					total: 0,
					errors: [
						{
							index: 0,
							error: errorMessage,
							details: errorData.details,
						},
					],
				});
				setShowLocationImportResult(true);
				toast.error(errorMessage, { duration: 8000 });
			} else if (
				error.response?.status === 402 &&
				errorCode === "BRANCH_QUOTA_EXCEEDED"
			) {
				setQuotaModal({
					payload: errorData as BranchQuotaExceededPayload,
					retry: () => importLocations(),
				});
			} else if (
				error.response?.status === 400 &&
				(errorCode === "NOT_APPROVED" || errorMessage.includes("approved"))
			) {
				setErrorModal({
					isOpen: true,
					title: "Account Approval Required",
					message: errorMessage,
					error: errorCode,
				});
			} else {
				setLocationImportResult({
					message: errorMessage,
					error: errorCode,
					details: errorData.details,
					imported: 0,
					updated: 0,
					skipped: 0,
					total: 0,
					errors: [
						{
							index: 0,
							error: errorMessage,
							details: errorData.details,
						},
					],
				});
				setShowLocationImportResult(true);
				toast.error(errorMessage, { duration: 8000 });
			}
		} finally {
			setIsImportingLocations(false);
		}
	};

	const handleConfirmAddBranches = async () => {
		if (!quotaModal) return;
		const { payload, retry } = quotaModal;
		const newQuantity = payload.currentCount + payload.adding;
		setIsAddingBranches(true);
		try {
			await subscriptionApi.updateSubscriptionQuantity(newQuantity);
			setQuotaModal(null);
			toast.success(
				`Added ${payload.needToAdd} branches. Your subscription will be prorated.`,
			);
			await retry();
		} catch (e: any) {
			toast.error(e.response?.data?.message || "Failed to update subscription");
		} finally {
			setIsAddingBranches(false);
		}
	};

	const handleSaveLocationEndpointUrl = async () => {
		setIsSavingLocationEndpoint(true);
		try {
			await endpointsApi.updateConfig({
				httpEndpoint: endpointConfig?.httpEndpoint || "",
				grpcEndpoint: endpointConfig?.grpcEndpoint || "",
				branchEndpointUrl: endpointConfig?.branchEndpointUrl,
				locationEndpointUrl: locationEndpointUrl,
				availabilityEndpointUrl: endpointConfig?.availabilityEndpointUrl,
			});
			queryClient.invalidateQueries({ queryKey: ["endpointConfig"] });
			await loadEndpointConfig();
			setIsLocationEndpointConfigOpen(false);
			toast.success("Location endpoint URL configured successfully");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Failed to save endpoint URL",
			);
		} finally {
			setIsSavingLocationEndpoint(false);
		}
	};

	const handleSaveLocationListConfig = async () => {
		setIsSavingLocationListConfig(true);
		try {
			await endpointsApi.updateConfig({
				httpEndpoint: endpointConfig?.httpEndpoint || "",
				grpcEndpoint: endpointConfig?.grpcEndpoint || "",
				branchEndpointUrl: endpointConfig?.branchEndpointUrl,
				locationEndpointUrl: endpointConfig?.locationEndpointUrl,
				locationListEndpointUrl: locationListEndpointUrl.trim() || undefined,
				locationListRequestRoot: locationListRequestRoot.trim() || undefined,
				locationListAccountId: locationListAccountId.trim() || undefined,
				locationListTransport,
				availabilityEndpointUrl: endpointConfig?.availabilityEndpointUrl,
			});
			queryClient.invalidateQueries({ queryKey: ["endpointConfig"] });
			await loadEndpointConfig();
			setIsLocationListConfigOpen(false);
			toast.success("Location list endpoint configuration saved");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Failed to save configuration",
			);
		} finally {
			setIsSavingLocationListConfig(false);
		}
	};

	/** Re-fetch location list (+ branch rows from XML/JSON). Upserts only — server does not delete existing branches. */
	const runLocationListImport = async (mode: "import" | "sync") => {
		if (
			!requireActivePlan(
				mode === "sync" ? "sync from endpoint" : "import from endpoint",
				"Location & Branches endpoint imports write coverage and branch records into Gloria. Choose a plan before running them.",
			)
		)
			return;
		setIsImportingLocationList(true);
		setLocationListImportResult(null);
		setShowLocationListImportResult(false);
		const failTitle =
			mode === "sync"
				? "Failed to sync from endpoint"
				: "Failed to import location list";
		try {
			const result = await endpointsApi.importLocationList();
			setLocationListImportResult(result);
			setShowLocationListImportResult(true);
			if (result.errors && result.errors.length > 0) {
				if ((result.imported || 0) > 0 || (result.updated || 0) > 0) {
					toast.success(
						mode === "sync"
							? `Synced: ${result.imported || 0} new, ${result.updated || 0} updated locations; ${result.branchesImported || 0} new, ${result.branchesUpdated || 0} updated branches`
							: `Location list imported: ${result.imported || 0} new, ${result.updated || 0} updated locations; ${result.branchesImported || 0} new, ${result.branchesUpdated || 0} updated branches`,
					);
				} else {
					toast.warning(
						`${mode === "sync" ? "Sync" : "Import"} completed with issues. ${result.skipped || 0} skipped.`,
					);
				}
			} else {
				toast.success(
					mode === "sync"
						? `Synced: ${result.imported || 0} locations, ${result.branchesImported || 0} branches created, ${result.branchesUpdated || 0} branches updated`
						: `Location list imported: ${result.imported || 0} locations, ${result.branchesImported || 0} branches created, ${result.branchesUpdated || 0} branches updated`,
				);
			}
			queryClient.invalidateQueries({ queryKey: ["branches"] });
			await loadEndpointConfig();
			if (user?.company?.id) loadSyncedLocations();
		} catch (error: any) {
			const errorData = error.response?.data || {};
			setLocationListImportResult({
				message: errorData.message || failTitle,
				error: errorData.error,
				imported: 0,
				updated: 0,
				skipped: 0,
				total: 0,
				errors: [{ index: 0, error: errorData.message || error.message }],
				details: errorData.details
					? { dataPreview: errorData.details }
					: undefined,
			});
			setShowLocationListImportResult(true);
			toast.error(errorData.message || failTitle);
		} finally {
			setIsImportingLocationList(false);
		}
	};

	const importLocationList = () => runLocationListImport("import");
	const syncLocationListFromEndpoint = () => runLocationListImport("sync");

	const handleSaveAvailabilityEndpointUrl = async () => {
		setIsSavingAvailabilityEndpoint(true);
		try {
			await endpointsApi.updateConfig({
				httpEndpoint: endpointConfig?.httpEndpoint || "",
				grpcEndpoint: endpointConfig?.grpcEndpoint || "",
				branchEndpointUrl: endpointConfig?.branchEndpointUrl || undefined,
				locationEndpointUrl: endpointConfig?.locationEndpointUrl || undefined,
				locationListEndpointUrl:
					endpointConfig?.locationListEndpointUrl || undefined,
				locationListRequestRoot:
					endpointConfig?.locationListRequestRoot || undefined,
				locationListAccountId:
					otaRequestorId.trim() ||
					endpointConfig?.locationListAccountId ||
					undefined,
				availabilityEndpointUrl: availabilityEndpointUrl.trim() || undefined,
			});
			queryClient.invalidateQueries({ queryKey: ["endpointConfig"] });
			await loadEndpointConfig();
			toast.success("Availability endpoint URL saved");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message ||
					"Failed to save availability endpoint URL",
			);
		} finally {
			setIsSavingAvailabilityEndpoint(false);
		}
	};

	const loadStoredSamples = async () => {
		setIsLoadingStoredSamples(true);
		try {
			const { samples } = await endpointsApi.getAvailabilitySamples();
			setStoredSamples(samples);
			queryClient.invalidateQueries({ queryKey: ["availability-samples"] });
		} catch {
			// silently ignore — tab still works without historical data
		} finally {
			setIsLoadingStoredSamples(false);
		}
	};

	const nhtsaMakesQuery = useQuery({
		queryKey: ["nhtsa-vpic", "makes"],
		queryFn: fetchNhtsaMakes,
		enabled: showManualImportModal,
		staleTime: 1000 * 60 * 60 * 24,
		retry: 1,
	});

	const makeTrimmed = manualMake.trim();
	const [vpicMakeDebounced, setVpicMakeDebounced] = useState("");
	useEffect(() => {
		if (!showManualImportModal) {
			setVpicMakeDebounced("");
			return;
		}
		const t = window.setTimeout(
			() => setVpicMakeDebounced(manualMake.trim()),
			450,
		);
		return () => window.clearTimeout(t);
	}, [manualMake, showManualImportModal]);

	const nhtsaModelsQuery = useQuery({
		queryKey: ["nhtsa-vpic", "models", vpicMakeDebounced.toLowerCase()],
		queryFn: () => fetchNhtsaModelsForMake(vpicMakeDebounced),
		enabled: showManualImportModal && vpicMakeDebounced.length > 0,
		staleTime: 1000 * 60 * 60 * 6,
		retry: 1,
	});

	const manualMakeOptions = useMemo(() => {
		const s = new Set<string>(MANUAL_MAKES);
		const api = nhtsaMakesQuery.data;
		if (api?.length) for (const m of api) s.add(m);
		return [...s].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" }),
		);
	}, [nhtsaMakesQuery.data]);

	const manualModelOptions = useMemo(() => {
		if (!makeTrimmed) return [];
		const s = new Set<string>();
		for (const m of getFallbackModelsForMake(manualMake)) s.add(m);
		const api = nhtsaModelsQuery.data;
		const apiMatches =
			api?.length &&
			vpicMakeDebounced.length > 0 &&
			vpicMakeDebounced.trim().toLowerCase() === makeTrimmed.toLowerCase();
		if (apiMatches) for (const m of api) s.add(m);
		return [...s].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" }),
		);
	}, [manualMake, makeTrimmed, vpicMakeDebounced, nhtsaModelsQuery.data]);

	const openManualImportModal = () => {
		if (
			!requireActivePlan(
				"store manual availability",
				"Manual availability entries are saved as pricing/availability samples for agents. Choose a plan before storing them.",
			)
		)
			return;
		setManualModalPickupLoc(otaPickupLoc);
		setManualModalReturnLoc(otaReturnLoc);
		setManualModalPickupDt(otaPickupDateTime);
		setManualModalReturnDt(otaReturnDateTime);
		setManualPricingCurrency((c) => c || manualCurrency || "EUR");
		setManualPricingTotalGross((g) => g || manualTotalPrice);
		setManualCurrency((c) => c || manualPricingCurrency || "EUR");
		const carOrderId = newManualCarOrderId();
		setManualCarOrderId(carOrderId);
		setManualPricingCarOrderId(carOrderId);
		setIncludedRows(buildDefaultIncludedRows(newManualImportRowId));
		setNotIncludedRows([
			{
				id: newManualImportRowId(),
				code: "",
				description: "",
				excess: "",
				deposit: "",
				currency: "",
				cover_amount: "",
				price: "",
			},
		]);
		setExtraRows([
			{
				id: newManualImportRowId(),
				code: "",
				description: "",
				price: "",
				currency: "",
				long_description: "",
			},
		]);
		setManualTermRows([createEmptyTermRow(newManualImportRowId)]);
		setShowManualImportModal(true);
	};

	const selectPricingEntryMode = (mode: "endpoint" | "manual") => {
		setPricingEntryMode(mode);
		if (mode === "manual") {
			openManualImportModal();
		} else {
			setShowManualImportModal(false);
		}
	};

	const handleAddCustomAcriss = () => {
		const c = newAcrissDraft
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "");
		if (c.length < 2 || c.length > 8) {
			toast.error("ACRISS code must be 2–8 letters or digits");
			return;
		}
		setCustomAcrissCodes((prev) => (prev.includes(c) ? prev : [...prev, c]));
		setManualAcriss(c);
		setNewAcrissDraft("");
		toast.success(`ACRISS ${c} added`);
	};

	const handleManualVehicleImageSelected = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setIsUploadingManualVehicleImage(true);
		try {
			const { url } =
				await endpointsApi.uploadManualAvailabilityVehicleImage(file);
			setManualImageUrl(url);
			toast.success("Image uploaded — URL filled; click Store sample to save.");
		} catch (err: any) {
			const msg =
				err.response?.data?.message || err.message || "Image upload failed";
			toast.error(msg);
		} finally {
			setIsUploadingManualVehicleImage(false);
		}
	};

	const handleManualImportSubmit = async () => {
		if (
			!requireActivePlan(
				"store manual availability",
				"Manual availability entries are saved as pricing/availability samples for agents. Choose a plan before storing them.",
			)
		)
			return;
		const pickupIso = manualModalPickupDt ? `${manualModalPickupDt}:00` : "";
		const returnIso = manualModalReturnDt ? `${manualModalReturnDt}:00` : "";
		if (!manualModalPickupLoc.trim() || !manualModalReturnLoc.trim()) {
			toast.error("Pick-up and return location codes are required");
			return;
		}
		if (!pickupIso || !returnIso) {
			toast.error("Pick-up and return date/time are required");
			return;
		}
		if (manualFleetId && manualSelectedFleet) {
			const fleetCodes = manualSelectedFleet.branches.map((b) =>
				b.branchCode.toUpperCase(),
			);
			const pickup = manualModalPickupLoc.trim().toUpperCase();
			const ret = manualModalReturnLoc.trim().toUpperCase();
			if (
				fleetCodes.length > 0 &&
				(!fleetCodes.includes(pickup) || !fleetCodes.includes(ret))
			) {
				toast.error(
					"Pick-up and return branches must belong to the selected fleet",
				);
				return;
			}
		}
		if (!manualAcriss.trim()) {
			toast.error("Select or add an ACRISS code");
			return;
		}
		if (!manualMake.trim() || !manualModel.trim()) {
			toast.error("Select make and model");
			return;
		}
		const currencyStr = (manualPricingCurrency || manualCurrency).trim().toUpperCase();
		if (!currencyStr || currencyStr.length < 3) {
			toast.error("Currency is required (pricing @Currency)");
			return;
		}
		const totalGrossStr = (manualPricingTotalGross || manualTotalPrice).trim();
		const total = Number(totalGrossStr);
		if (!Number.isFinite(total) || total < 0) {
			toast.error("Total gross is required (pricing @TotalGross)");
			return;
		}
		const missingIncluded = missingRequiredIncludedCodes(includedRows);
		if (missingIncluded.length > 0) {
			toast.error(
				`Included in price must include: ${missingIncluded.join(", ")}`,
			);
			return;
		}
		const termsBuilt = buildGloriaTermsFromRows(manualTermRows);
		const termsParsed = termsBuilt.length ? termsBuilt : undefined;
		for (const ex of extraRows) {
			if (!ex.description.trim()) continue;
			const p = Number(ex.price);
			if (!Number.isFinite(p) || p < 0) {
				toast.error(
					`Optional extra "${ex.description.slice(0, 40)}…" needs a valid price`,
				);
				return;
			}
		}
		setIsSubmittingManualImport(true);
		setFetchAvailabilityResult(null);
		try {
			const optInt = (s: string) => {
				if (!s.trim()) return undefined;
				const v = Number(s);
				return Number.isFinite(v) ? v : undefined;
			};
			const s = (v: string) => (v.trim() ? v.trim() : undefined);
			const pricing: ManualGloriaPricingPayload = {
				total_gross: totalGrossStr,
				currency: currencyStr,
			};
			const carOrderId =
				s(manualCarOrderId) ||
				s(manualPricingCarOrderId) ||
				newManualCarOrderId();
			pricing.car_order_id = carOrderId;
			if (s(manualPricingDuration)) pricing.duration = s(manualPricingDuration);
			if (s(manualPricingDailyNet))
				pricing.daily_net = s(manualPricingDailyNet);
			if (s(manualPricingDailyTax))
				pricing.daily_tax = s(manualPricingDailyTax);
			if (s(manualPricingDailyGross))
				pricing.daily_gross = s(manualPricingDailyGross);
			if (s(manualPricingTotalNet))
				pricing.total_net = s(manualPricingTotalNet);
			if (s(manualPricingTotalTax))
				pricing.total_tax = s(manualPricingTotalTax);
			if (s(manualPricingTaxRate)) pricing.tax_rate = s(manualPricingTaxRate);

			const response_meta =
				s(gloriaMetaTimestamp) || s(gloriaMetaTarget) || s(gloriaMetaVersion)
					? {
							...(s(gloriaMetaTimestamp)
								? { timestamp: s(gloriaMetaTimestamp)! }
								: {}),
							...(s(gloriaMetaTarget) ? { target: s(gloriaMetaTarget)! } : {}),
							...(s(gloriaMetaVersion)
								? { version: s(gloriaMetaVersion)! }
								: {}),
						}
					: undefined;

			const result = await endpointsApi.postManualAvailabilitySample({
				pickupLoc: manualModalPickupLoc.trim().toUpperCase(),
				returnLoc: manualModalReturnLoc.trim().toUpperCase(),
				pickupIso,
				returnIso,
				rental_duration: optInt(manualRentalDuration),
				requestorId: otaRequestorId.trim() || undefined,
				driverAge: otaDriverAge || undefined,
				citizenCountry: otaCitizenCountry.trim() || undefined,
				force: forceRefreshAvailability || undefined,
				...(manualFleetId
					? {
							fleet_id: manualFleetId,
							fleet_code: manualSelectedFleet?.fleetCode,
							fleet_branch_codes: manualSelectedFleet?.branches.map((b) =>
								b.branchCode.toUpperCase(),
							),
						}
					: {}),
				response_meta,
				pricing,
				included: includedRows
					.filter((r) => r.description.trim() || r.code.trim())
					.map(({ id: _id, ...r }) => ({
						code: s(r.code),
						description: r.description.trim(),
						excess: s(r.excess),
						deposit: s(r.deposit),
						currency: s(r.currency),
					})),
				not_included: notIncludedRows
					.filter((r) => r.description.trim() || r.code.trim())
					.map(({ id: _id, ...r }) => ({
						code: s(r.code),
						description: r.description.trim(),
						excess: s(r.excess),
						deposit: s(r.deposit),
						price: s(r.price),
						cover_amount: s(r.cover_amount),
						currency: s(r.currency),
					})),
				extras: extraRows
					.filter((e) => e.description.trim())
					.map(({ id: _id, ...e }) => ({
						code: s(e.code),
						description: e.description.trim(),
						price: Number(e.price),
						currency: s(e.currency),
						long_description: s(e.long_description),
					})),
				terms: termsParsed,
				vehicle: {
					acriss: manualAcriss.trim(),
					make: manualMake.trim(),
					model: manualModel.trim(),
					currency: manualCurrency.trim() || "EUR",
					total_price: total,
					transmission: manualTransmission.trim() || undefined,
					doors: manualDoors.trim() === "" ? undefined : manualDoors.trim(),
					seats: manualSeats.trim() === "" ? undefined : manualSeats.trim(),
					bags_small:
						manualBagsS.trim() === "" ? undefined : manualBagsS.trim(),
					bags_medium:
						manualBagsM.trim() === "" ? undefined : manualBagsM.trim(),
					min_lead_hours: optInt(manualMinLead),
					max_lead_days: optInt(manualMaxLead),
					mileage: optInt(manualMileage),
					image_url: manualImageUrl.trim() || undefined,
					car_order_id: carOrderId,
				},
			});
			setFetchAvailabilityResult(result);
			if (result.duplicate) {
				toast("Data unchanged — not stored (same data already exists)", {
					icon: "ℹ️",
				});
			} else {
				toast.success(result.message);
				loadStoredSamples();
				setShowManualImportModal(false);
			}
		} catch (error: any) {
			const errorData = error.response?.data || {};
			const errorMessage = errorData.message || "Failed to store manual sample";
			setFetchAvailabilityResult({
				message: errorMessage,
				error: errorData.error || "REQUEST_FAILED",
				details: errorData.details,
			});
			toast.error(errorMessage);
		} finally {
			setIsSubmittingManualImport(false);
		}
	};

	const handleFetchAvailability = async () => {
		if (
			!requireActivePlan(
				"fetch and store availability",
				"Pricing and availability fetches are stored for agent search readiness. Choose a plan before saving supplier responses.",
			)
		)
			return;
		const isGrpc = availabilityAdapterType === "grpc";
		const urlToUse = isGrpc
			? grpcEndpointAddress.trim() || (endpointConfig as any)?.grpcEndpoint
			: availabilityEndpointUrl.trim() ||
				endpointConfig?.availabilityEndpointUrl ||
				endpointConfig?.httpEndpoint;
		if (!urlToUse) {
			if (isGrpc) {
				toast.error("Enter a gRPC endpoint address (e.g. localhost:50051)");
			} else {
				toast.error("Configure an availability endpoint URL first");
			}
			return;
		}
		if (!otaPickupLoc.trim() || !otaReturnLoc.trim()) {
			toast.error("Pick-up and Return location codes are required");
			return;
		}
		setIsFetchingAvailability(true);
		setFetchAvailabilityResult(null);
		try {
			const result = await endpointsApi.fetchAvailability({
				url: isGrpc
					? grpcEndpointAddress.trim() || undefined
					: availabilityEndpointUrl.trim() || undefined,
				adapterType: availabilityAdapterType,
				pickupLoc: otaPickupLoc.trim(),
				returnLoc: otaReturnLoc.trim(),
				pickupDateTime: otaPickupDateTime
					? `${otaPickupDateTime}:00`
					: undefined,
				returnDateTime: otaReturnDateTime
					? `${otaReturnDateTime}:00`
					: undefined,
				requestorId: otaRequestorId.trim() || undefined,
				driverAge: otaDriverAge || undefined,
				citizenCountry: otaCitizenCountry.trim() || undefined,
				force: forceRefreshAvailability || undefined,
			});
			setFetchAvailabilityResult(result);
			if (result.duplicate) {
				toast("Data unchanged — not stored (same data already exists)", {
					icon: "ℹ️",
				});
			} else {
				toast.success(result.message);
				// Reload stored samples so the new result appears in the stored-samples list
				loadStoredSamples();
			}
		} catch (error: any) {
			const errorData = error.response?.data || {};
			const errorMessage = errorData.message || "Failed to fetch availability";
			const errorCode = errorData.error || "";
			setFetchAvailabilityResult({
				message: errorMessage,
				error: errorCode,
				details: errorData.details,
			});
			toast.error(errorMessage);
		} finally {
			setIsFetchingAvailability(false);
		}
	};

	const validateLocationEndpoint = async () => {
		if (!locationEndpointUrl.trim()) {
			toast.error("Please enter a location endpoint URL first");
			return;
		}

		setIsValidatingLocationEndpoint(true);
		try {
			// Test the endpoint by making a request
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

			let testUrl = locationEndpointUrl.trim();
			if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
				testUrl = `http://${testUrl}`;
			}

			const response = await fetch(testUrl, {
				method: "GET",
				headers: {
					"Request-Type": "LocationRq",
					"Content-Type": "application/json",
				},
				signal: controller.signal,
			} as any);

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Endpoint returned status ${response.status}`);
			}

			const responseText = await response.text();

			// Try to parse as JSON
			let isValid = false;
			let format = "";
			try {
				const json = JSON.parse(responseText);
				if (
					Array.isArray(json) ||
					json.Locations ||
					json.items ||
					json.Location
				) {
					isValid = true;
					format = "JSON";
				} else if (
					json.OTA_VehLocSearchRS?.VehMatchedLocs ||
					json.gloria?.VehMatchedLocs
				) {
					isValid = true;
					format = "JSON (OTA_VehLocSearchRS)";
				}
			} catch {
				// Try XML
				if (
					responseText.includes("<Locations>") ||
					responseText.includes("<Location>")
				) {
					isValid = true;
					format = "XML";
				} else if (
					responseText.includes("OTA_VehLocSearchRS") &&
					responseText.includes("VehMatchedLocs")
				) {
					isValid = true;
					format = "PHP var_dump / OTA";
				}
			}

			if (isValid) {
				toast.success(`Endpoint is valid! Detected ${format} format.`);
			} else {
				toast.warning(
					"Endpoint responded but format could not be detected. Expected JSON, XML, or PHP var_dump (OTA_VehLocSearchRS).",
				);
			}
		} catch (error: any) {
			if (error.name === "AbortError") {
				toast.error("Endpoint validation timed out");
			} else {
				toast.error(
					`Endpoint validation failed: ${error.message || "Unknown error"}`,
				);
			}
		} finally {
			setIsValidatingLocationEndpoint(false);
		}
	};

	/** Client-side validation of pasted location sample (JSON, XML, or PHP var_dump OTA). */
	const validateLocationSample = () => {
		const pasted = locationSamplePaste.trim();
		setLocationSampleValidation(null);
		if (!pasted) {
			setLocationSampleValidation({
				ok: false,
				errors: ["Paste sample data first."],
			});
			return;
		}
		const errors: string[] = [];
		try {
			const parsed = JSON.parse(pasted);
			let count = 0;
			if (Array.isArray(parsed)) count = parsed.length;
			else if (Array.isArray(parsed.Locations)) count = parsed.Locations.length;
			else if (Array.isArray(parsed.items)) count = parsed.items.length;
			else if (parsed.OTA_VehLocSearchRS?.VehMatchedLocs)
				count = parsed.OTA_VehLocSearchRS.VehMatchedLocs.length;
			else if (parsed.gloria?.VehMatchedLocs)
				count = parsed.gloria.VehMatchedLocs.length;
			if (count > 0) {
				setLocationSampleValidation({ ok: true, format: "JSON", count });
				return;
			}
			errors.push(
				"JSON is valid but no known location array found (expect Locations, items, or OTA_VehLocSearchRS.VehMatchedLocs).",
			);
		} catch {
			if (
				pasted.includes("OTA_VehLocSearchRS") &&
				pasted.includes("VehMatchedLocs")
			) {
				const locationDetailCount = (
					pasted.match(/\["LocationDetail"\]/g) || []
				).length;
				const count = locationDetailCount;
				setLocationSampleValidation({
					ok: count > 0,
					format: "PHP var_dump / OTA",
					count: count || undefined,
					errors:
						count === 0
							? ["OTA structure found but no LocationDetail blocks detected."]
							: undefined,
				});
				return;
			}
			const xmlLocCount = (pasted.match(/<Location\b/g) || []).length;
			if (pasted.includes("<Locations>") || xmlLocCount > 0) {
				setLocationSampleValidation({
					ok: xmlLocCount > 0,
					format: "XML",
					count: xmlLocCount || undefined,
				});
				return;
			}
			errors.push(
				"Could not recognize format. Use JSON, XML, or PHP var_dump with OTA_VehLocSearchRS and VehMatchedLocs.",
			);
		}
		setLocationSampleValidation({ ok: false, errors });
	};

	/** Validate pasted sample for Location & Branches (GLORIA XML response or gRPC GetLocations JSON). */
	const validateLocationListSample = () => {
		const pasted = locationListSamplePaste.trim();
		setLocationListSampleValidation(null);
		if (!pasted) {
			setLocationListSampleValidation({
				ok: false,
				errors: ["Paste sample data first."],
			});
			return;
		}
		if (locationListSampleFormat === "grpc") {
			try {
				const parsed = JSON.parse(pasted);
				const locs = parsed.locations;
				if (!Array.isArray(locs)) {
					setLocationListSampleValidation({
						ok: false,
						errors: [
							'Expected JSON object with a top-level "locations" array (SourceProviderService.GetLocations).',
						],
					});
					return;
				}
				if (locs.length === 0) {
					setLocationListSampleValidation({
						ok: false,
						errors: ['"locations" array is empty.'],
					});
					return;
				}
				const lenErrors: string[] = [];
				let missing = 0;
				for (let i = 0; i < locs.length; i++) {
					const l = locs[i];
					const u =
						l && typeof (l as { unlocode?: string }).unlocode === "string"
							? (l as { unlocode: string }).unlocode.trim().toUpperCase()
							: "";
					if (!u) {
						missing++;
						continue;
					}
					if (u.length < 4 || u.length > 5) {
						lenErrors.push(
							`locations[${i}].unlocode "${u}" must be 4–5 characters (UN/LOCODE).`,
						);
					}
				}
				if (missing > 0) {
					setLocationListSampleValidation({
						ok: false,
						errors: [
							`${missing} entr(y/ies) missing a non-empty "unlocode" string.`,
						],
					});
					return;
				}
				if (lenErrors.length > 0) {
					setLocationListSampleValidation({
						ok: false,
						errors: lenErrors.slice(0, 8),
					});
					return;
				}
				setLocationListSampleValidation({
					ok: true,
					format: "gRPC GetLocations (JSON wire shape)",
					count: locs.length,
				});
			} catch {
				setLocationListSampleValidation({
					ok: false,
					errors: ["Invalid JSON."],
				});
			}
			return;
		}
		const errors: string[] = [];
		const trimmed = pasted.trimStart();
		if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
			const detailCount = (pasted.match(/<LocationDetail\b/gi) || []).length;
			if (detailCount > 0) {
				setLocationListSampleValidation({
					ok: true,
					format: "GLORIA location list XML",
					count: detailCount,
				});
				return;
			}
			const root = (locationListRequestRoot || "GLORIA_locationlistrq").replace(
				/rq$/i,
				"rs",
			);
			if (
				pasted.includes(`<${root}`) ||
				pasted.includes("<GLORIA_locationlist")
			) {
				setLocationListSampleValidation({
					ok: false,
					errors: [
						`Found ${root} (or GLORIA_locationlist) but no <LocationDetail> elements.`,
					],
				});
				return;
			}
			errors.push(
				"XML did not match expected GLORIA location list shape (look for LocationDetail inside the response).",
			);
		} else {
			errors.push(
				"For HTTP XML samples, paste raw XML. Switch to the gRPC tab for JSON from GetLocations.",
			);
		}
		setLocationListSampleValidation({ ok: false, errors });
	};

	const testSourceGrpc = async () => {
		if (!grpcEndpoint) {
			toast.error("Please set gRPC endpoint first");
			return;
		}

		setIsTestingGrpc(true);
		setGrpcTestResult(null);

		try {
			console.log("Testing gRPC connection to:", grpcEndpoint);
			const response = await endpointsApi.testSourceGrpc({
				addr: grpcEndpoint,
				grpcEndpoints: {
					health: "health", // Always test health
					locations: "locations", // Also test locations endpoint
				},
			});
			console.log("gRPC test response:", response);
			setGrpcTestResult(response);

			// Save test result to localStorage
			if (user?.company?.id) {
				localStorage.setItem(
					`grpcTestResult_${user.company.id}`,
					JSON.stringify(response),
				);
				localStorage.setItem(`grpcEndpoint_${user.company.id}`, grpcEndpoint);
			}

			if (response.ok) {
				toast.success("gRPC test completed successfully!");
			} else {
				const failedEndpoints = Object.entries(response.endpoints || {})
					.filter(([_, result]) => result && !result.ok)
					.map(([name]) => name);
				toast.error(`gRPC test failed: ${failedEndpoints.join(", ")}`);
			}
		} catch (error: any) {
			console.error("Failed to test gRPC:", error);
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to test gRPC connection";
			toast.error(errorMessage);
			// Set a failed result so UI shows the error
			setGrpcTestResult({
				ok: false,
				addr: grpcEndpoint,
				totalMs: 0,
				endpoints: {
					health: {
						ok: false,
						error: errorMessage,
						ms: 0,
					},
					locations: null,
					availability: null,
					bookings: null,
				},
				tested: [],
			});
		} finally {
			setIsTestingGrpc(false);
		}
	};

	const createAgreement = async () => {
		if (!selectedAgentId) {
			toast.error("Select the agent receiving supplier access");
			return;
		}
		if (!agreementAccountNumber.trim()) {
			toast.error("Enter the supplier account/requester number");
			return;
		}
		const margin = Number(agreementMarginPercent);
		if (!Number.isFinite(margin) || margin < 0) {
			toast.error("Enter a valid margin percentage");
			return;
		}
		if (!agreementContactName.trim() || !agreementContactEmail.trim()) {
			toast.error("Enter a commercial contact name and email");
			return;
		}
		if (!agreementContactPhone.trim()) {
			toast.error("Enter a commercial contact telephone");
			return;
		}
		const agreementRefToUse = agreementAccountNumber.trim().toUpperCase();

		// Duplicate check
		try {
			const dup = await agreementsApi.checkDuplicate({
				agreementRef: agreementRefToUse,
				agentId: selectedAgentId,
				sourceId: user.company.id,
			});
			if (dup?.duplicate) {
				const proceed = window.confirm(
					"Duplicate agreement detected. Proceed anyway?",
				);
				if (!proceed) return;
			}
		} catch (error) {
			console.debug("Duplicate agreement check skipped:", error);
		}

		setIsCreatingAgreement(true);
		try {
			const agreementData: CreateAgreementRequest = {
				agent_id: selectedAgentId,
				source_id: user.company.id,
				agreement_ref: agreementRefToUse,
				account_number: agreementAccountNumber.trim(),
				margin_percent: margin,
				contact_name: agreementContactName.trim(),
				contact_email: agreementContactEmail.trim(),
				contact_phone: agreementContactPhone.trim(),
			};

			const created = await agreementsApi.createAgreement(agreementData);
			toast.success(created.message || "Operational agreement saved!");

			// Reset form
			setSelectedAgentId("");
			setAgreementAccountNumber("");
			setAgreementMarginPercent("0");

			// Reload agents to get updated data
			await loadAgents();
		} catch (error: any) {
			console.error("Failed to create agreement:", error);
			if (error.response?.data?.message) {
				toast.error(error.response.data.message);
			} else {
				toast.error("Failed to create agreement");
			}
		} finally {
			setIsCreatingAgreement(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("user");
		toast.success("Logged out successfully");
		navigate("/login");
	};

	const branchImportIsManual =
		activeTab === "location-branches" &&
		searchParams.get("branchImport") === "manual";

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<Sidebar
				activeTab={activeTab}
				onTabChange={handleTabChange}
				user={user}
				onLogout={handleLogout}
				keepOpenForTour={panelTourOpen}
				onRequestPanelTour={startPanelTour}
			/>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
				{/* Topbar - Hidden on mobile, shown on desktop */}
				<header className="hidden lg:block bg-white border-b border-gray-200 shadow-sm">
					<div className="px-6 py-4 flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<h2 className="text-lg font-semibold text-gray-900">
								Gloria - Rental company
							</h2>
						</div>

						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
								<div className="text-right">
									<div className="text-sm font-semibold text-gray-900">
										{user?.company?.companyName}
									</div>
									<div className="text-xs text-gray-500">{user?.email}</div>
								</div>
							</div>

							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="hidden xl:inline-flex relative overflow-hidden rounded-full border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 shadow-sm hover:shadow-md"
								onClick={startPanelTour}
								title={
									activeTab === "dashboard"
										? "Walk through the full Gloria - Rental company portal"
										: `Walk through this ${activeTab.replace(/-/g, " ")} page`
								}
							>
								<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-60" />
								<Sparkles className="relative h-4 w-4 mr-1.5 shrink-0 text-blue-600 animate-pulse" />
								<span className="relative">{panelTourButtonLabel}</span>
							</Button>
							<button
								type="button"
								className="xl:hidden relative p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors shadow-sm"
								onClick={startPanelTour}
								aria-label="Start panel tour"
								title={panelTourButtonLabel}
							>
								<span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
								<Sparkles className="h-5 w-5 text-blue-600" />
							</button>

							<button
								type="button"
								onClick={() => setShowNotifications(true)}
								className="group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
								aria-label={
									unreadCount > 0
										? `Open notifications, ${unreadCount} unread`
										: "Open notifications"
								}
								title="Notifications"
							>
								<span className="absolute inset-0 rounded-2xl bg-cyan-400/0 transition group-hover:bg-cyan-400/5" />
								<Bell className="relative h-5 w-5 transition group-hover:text-slate-950" />
								{unreadCount > 0 && (
									<span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
										{unreadCount > 99 ? "99+" : unreadCount}
									</span>
								)}
							</button>
						</div>
					</div>
				</header>

				{/* Mobile topbar spacing */}
				<div className="lg:hidden h-16"></div>

				{/* Main content area */}
				<main className="flex-1 overflow-y-auto">
					{activeTab === "docs" ? (
						<div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-200">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
								<h3 className="text-lg font-semibold text-blue-900 mb-2">
									API Documentation
								</h3>
								<p className="text-sm text-blue-700 mb-4">
									Click the "Docs" link in the sidebar to open the full API
									documentation in a new tab.
								</p>
								<a
									href={`${import.meta.env.PROD ? "/source" : ""}/docs-fullscreen`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
								>
									Open API Documentation
									<svg
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</a>
							</div>
						</div>
					) : (
						<div className="max-w-6xl mx-auto px-6 py-8">
							<div key={activeTab} className="animate-in fade-in duration-200">
								{subscriptionActive &&
									nearExpiry &&
									subscription?.currentPeriodEnd && (
										<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
											<span className="text-amber-900 font-medium">
												Your plan expires on{" "}
												{new Date(
													subscription.currentPeriodEnd,
												).toLocaleDateString()}
												. Renew now to continue.
											</span>
											<Button
												size="sm"
												variant="primary"
												onClick={() =>
													setSearchParams((prev) => ({
														...Object.fromEntries(prev),
														renew: "1",
													}))
												}
											>
												Renew now
											</Button>
										</div>
									)}
								{!isLoadingSubscription &&
									!subscriptionActive &&
									searchParams.get("renew") !== "1" &&
									user?.company?.status === "ACTIVE" && (
										<div className="mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-5 shadow-sm">
											<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
												<div className="flex items-start gap-4">
													<div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
														<span className="absolute inset-0 rounded-2xl bg-cyan-300/30 animate-ping" />
														<Sparkles className="relative h-5 w-5" />
													</div>
													<div>
														<p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
															Approved source onboarding
														</p>
														<h3 className="mt-1 text-xl font-bold text-slate-950">
															Explore the portal first, choose a plan when you
															are ready to import.
														</h3>
														<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
															Your Source company is approved. You can tour the
															dashboard, branches, pricing, verification,
															health, and docs before paying. Import, sync, and
															stored availability actions will ask for a plan
															first.
														</p>
													</div>
												</div>
												<div className="flex flex-wrap gap-2 lg:justify-end">
													<Button
														type="button"
														variant="secondary"
														onClick={() => {
															setPanelTourStartTab("dashboard");
															setPanelTourOpen(true);
														}}
														className="bg-white"
													>
														<Sparkles className="mr-2 h-4 w-4" />
														Take portal tour
													</Button>
													<Button
														type="button"
														variant="primary"
														onClick={() =>
															setSearchParams((prev) => {
																const next = new URLSearchParams(prev);
																next.set("renew", "1");
																return next;
															})
														}
													>
														Choose plan
													</Button>
												</div>
											</div>
										</div>
									)}
								{searchParams.get("renew") === "1" ? (
									<PlanPicker />
								) : (
									<>
										{activeTab === "dashboard" && (
											<>
												<div className="mb-8 space-y-6">
													<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
														<div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-6 py-7 text-white sm:px-8">
															<div
																className="absolute inset-0 opacity-20"
																aria-hidden="true"
															>
																<div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400 blur-3xl" />
																<div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-indigo-300 blur-3xl" />
															</div>
															<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
																<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
																	<div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/10 text-3xl font-bold text-white shadow-lg ring-1 ring-white/20">
																		<span>{companyInitials}</span>
																		{companyLogoUrl && (
																			<img
																				src={companyLogoUrl}
																				alt={`${user?.company?.companyName || "Source company"} logo`}
																				className="absolute inset-0 h-full w-full object-contain bg-white p-2"
																				onError={(event) => {
																					(
																						event.currentTarget as HTMLImageElement
																					).style.display = "none";
																				}}
																			/>
																		)}
																	</div>
																	<div className="min-w-0">
																		<div className="mb-3 flex flex-wrap items-center gap-2">
																			<Badge
																				variant={
																					user?.company?.status === "ACTIVE"
																						? "success"
																						: "warning"
																				}
																				className="bg-white/95"
																			>
																				{String(
																					user?.company?.status || "Unknown",
																				).replace(/_/g, " ")}
																			</Badge>
																			{user?.company?.approvalStatus && (
																				<Badge
																					variant="info"
																					className="bg-white/95"
																				>
																					Approval:{" "}
																					{String(
																						user.company.approvalStatus,
																					).replace(/_/g, " ")}
																				</Badge>
																			)}
																		</div>
																		<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
																			{user?.company?.companyName ||
																				"Source overview"}
																		</h1>
																		<p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
																			Monitor coverage, branch readiness,
																			agreement activity, and stored
																			availability/pricing data from one clean
																			dashboard.
																		</p>
																	</div>
																</div>

																<div className="flex flex-wrap gap-2">
																	<Button
																		type="button"
																		variant="secondary"
																		onClick={() => handleTabChange("settings")}
																		className="bg-white text-slate-900 hover:bg-blue-50"
																	>
																		<Settings className="mr-2 h-4 w-4" />
																		Edit source details
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		onClick={() => {
																			dashboardBranchesQuery.refetch();
																			dashboardLocationsQuery.refetch();
																			dashboardAvailabilityQuery.refetch();
																			loadEndpointConfig();
																			loadHealth();
																		}}
																		loading={
																			dashboardBranchesQuery.isFetching ||
																			dashboardLocationsQuery.isFetching ||
																			dashboardAvailabilityQuery.isFetching ||
																			isLoadingEndpoints ||
																			healthLoading
																		}
																		className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
																	>
																		<RefreshCw className="mr-2 h-4 w-4" />
																		Refresh overview
																	</Button>
																</div>
															</div>
														</div>

														<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
															<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
																<div className="flex items-start justify-between gap-3">
																	<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																		Primary branch
																	</p>
																	<button
																		type="button"
																		onClick={openDashboardProfileEditor}
																		className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
																	>
																		{user?.company?.registrationBranchName
																			? "Edit"
																			: "Set"}
																	</button>
																</div>
																<p className="mt-2 truncate text-sm font-semibold text-slate-900">
																	{user?.company?.registrationBranchName ||
																		"Not set"}
																</p>
															</div>
															<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
																<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																	Company ID
																</p>
																<div className="mt-2 flex items-center gap-2">
																	<code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
																		{user?.company?.id || "—"}
																	</code>
																	{user?.company?.id && (
																		<button
																			type="button"
																			onClick={() => {
																				navigator.clipboard.writeText(
																					user.company.id,
																				);
																				toast.success("Company ID copied!");
																			}}
																			className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
																		>
																			Copy
																		</button>
																	)}
																</div>
															</div>
															<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
																<div className="flex items-start justify-between gap-3">
																	<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																		Website
																	</p>
																	<button
																		type="button"
																		onClick={openDashboardProfileEditor}
																		className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
																	>
																		{user?.company?.companyWebsiteUrl
																			? "Edit"
																			: "Set"}
																	</button>
																</div>
																{user?.company?.companyWebsiteUrl ? (
																	<a
																		href={user.company.companyWebsiteUrl}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-blue-700 hover:text-blue-900"
																	>
																		<span className="truncate">
																			{user.company.companyWebsiteUrl}
																		</span>
																		<ExternalLink className="h-3.5 w-3.5 shrink-0" />
																	</a>
																) : (
																	<p className="mt-2 text-sm font-semibold text-slate-400">
																		Not set
																	</p>
																)}
															</div>
															<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
																<div className="flex items-start justify-between gap-3">
																	<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																		Address
																	</p>
																	<button
																		type="button"
																		onClick={openDashboardProfileEditor}
																		className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
																	>
																		{user?.company?.companyAddress
																			? "Edit"
																			: "Set"}
																	</button>
																</div>
																<p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
																	{user?.company?.companyAddress || "Not set"}
																</p>
															</div>
														</div>
													</div>
												</div>

												<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
													<Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
														<CardContent className="p-5">
															<div className="flex items-start justify-between gap-4">
																<div>
																	<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
																		Branches
																	</p>
																	<p className="mt-2 text-3xl font-bold text-slate-900">
																		{dashboardBranchesQuery.isLoading
																			? "…"
																			: dashboardBranchCount == null
																				? "—"
																				: dashboardBranchCount.toLocaleString()}
																	</p>
																	<p className="mt-1 text-xs text-slate-500">
																		Imported and manually managed branch records
																	</p>
																</div>
																<div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
																	<svg
																		className="h-6 w-6"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h1m-1 4h1m-1 4h1m5-4h1m-1 4h1"
																		/>
																	</svg>
																</div>
															</div>
															<button
																type="button"
																onClick={() =>
																	handleTabChange("location-branches")
																}
																className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
															>
																Manage branches →
															</button>
														</CardContent>
													</Card>

													<Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
														<CardContent className="p-5">
															<div className="flex items-start justify-between gap-4">
																<div>
																	<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
																		Locations
																	</p>
																	<p className="mt-2 text-3xl font-bold text-slate-900">
																		{dashboardLocationsQuery.isLoading
																			? "…"
																			: dashboardLocationCount == null
																				? "—"
																				: dashboardLocationCount.toLocaleString()}
																	</p>
																	<p className="mt-1 text-xs text-slate-500">
																		Coverage locations currently visible to
																		Gloria
																	</p>
																</div>
																<div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
																	<svg
																		className="h-6 w-6"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
																		/>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
																		/>
																	</svg>
																</div>
															</div>
															<button
																type="button"
																onClick={() =>
																	handleTabChange("location-branches")
																}
																className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
															>
																Review Location & Branches →
															</button>
														</CardContent>
													</Card>

													<Card className="border border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
														<CardContent className="p-5">
															<div className="flex items-start justify-between gap-4">
																<div>
																	<p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
																		Stored samples
																	</p>
																	<p className="mt-2 text-3xl font-bold text-slate-900">
																		{dashboardAvailabilityQuery.isLoading &&
																		dashboardSamples.length === 0
																			? "…"
																			: dashboardSamples.length.toLocaleString()}
																	</p>
																	<p className="mt-1 text-xs text-slate-500">
																		{dashboardUniqueSampleLocations.toLocaleString()}{" "}
																		pickup/return codes represented
																	</p>
																</div>
																<div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
																	<svg
																		className="h-6 w-6"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
																		/>
																	</svg>
																</div>
															</div>
															<button
																type="button"
																onClick={() => handleTabChange("pricing")}
																className="mt-4 text-sm font-semibold text-violet-700 hover:text-violet-900"
															>
																Open pricing →
															</button>
														</CardContent>
													</Card>

													<Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
														<CardContent className="p-5">
															<div className="flex items-start justify-between gap-4">
																<div>
																	<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
																		Availability offers
																	</p>
																	<p className="mt-2 text-3xl font-bold text-slate-900">
																		{dashboardAvailabilityQuery.isLoading &&
																		dashboardSamples.length === 0
																			? "…"
																			: dashboardOfferCount.toLocaleString()}
																	</p>
																	<p className="mt-1 text-xs text-slate-500">
																		Vehicle offers parsed from stored samples
																	</p>
																</div>
																<div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
																	<svg
																		className="h-6 w-6"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
																		/>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h8l-2-5h-6v5z"
																		/>
																	</svg>
																</div>
															</div>
															<p className="mt-4 text-xs text-amber-800">
																Latest:{" "}
																{dashboardLatestSample
																	? `${dashboardLatestSample.pickupLoc || "—"} → ${dashboardLatestSample.returnLoc || "—"}`
																	: "No stored availability yet"}
															</p>
														</CardContent>
													</Card>
												</div>

												<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
													<Card className="border border-gray-200 shadow-sm lg:col-span-2">
														<CardHeader>
															<div className="flex items-center justify-between gap-4">
																<div>
																	<CardTitle className="text-lg font-semibold text-gray-900">
																		Operational readiness
																	</CardTitle>
																	<p className="mt-1 text-sm text-gray-600">
																		Current connection and source health
																		signals.
																	</p>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => handleTabChange("health")}
																>
																	Health details
																</Button>
															</div>
														</CardHeader>
														<CardContent>
															<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
																<div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
																	<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
																		Health status
																	</p>
																	<p
																		className={`mt-2 text-xl font-bold ${
																			health?.healthy
																				? "text-green-700"
																				: health
																					? "text-amber-700"
																					: "text-gray-500"
																		}`}
																	>
																		{health?.healthy
																			? "Healthy"
																			: health
																				? "Needs review"
																				: healthLoading
																					? "Checking…"
																					: "Not checked"}
																	</p>
																	{health?.sampleCount !== undefined && (
																		<p className="mt-1 text-xs text-gray-500">
																			{health.sampleCount} health samples
																		</p>
																	)}
																</div>
																<div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
																	<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
																		gRPC connection
																	</p>
																	<p
																		className={`mt-2 text-xl font-bold ${
																			grpcTestResult?.ok
																				? "text-green-700"
																				: endpointConfig?.grpcEndpoint
																					? "text-amber-700"
																					: "text-gray-500"
																		}`}
																	>
																		{grpcTestResult?.ok
																			? "Connected"
																			: endpointConfig?.grpcEndpoint
																				? "Test required"
																				: "Not set"}
																	</p>
																	{grpcTestResult?.ok ? (
																		<p className="mt-1 text-xs text-gray-500">
																			{grpcTestResult.totalMs}ms latency
																		</p>
																	) : endpointConfig?.grpcEndpoint ? (
																		<p className="mt-1 text-xs text-gray-500">
																			Run a gRPC test to confirm readiness
																		</p>
																	) : null}
																</div>
																<div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
																	<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
																		Agreements
																	</p>
																	<p className="mt-2 text-xl font-bold text-slate-900">
																		{(agents || [])
																			.flatMap(
																				(agent) => agent.agentAgreements || [],
																			)
																			.filter(
																				(agreement) =>
																					agreement.status === "ACCEPTED" ||
																					agreement.status === "ACTIVE",
																			)
																			.length.toLocaleString()}{" "}
																		active
																	</p>
																	<p className="mt-1 text-xs text-gray-500">
																		{(agents || [])
																			.flatMap(
																				(agent) => agent.agentAgreements || [],
																			)
																			.filter(
																				(agreement) =>
																					agreement.status === "OFFERED",
																			)
																			.length.toLocaleString()}{" "}
																		pending setup
																	</p>
																</div>
															</div>
														</CardContent>
													</Card>

													<Card className="border border-gray-200 shadow-sm">
														<CardHeader>
															<CardTitle className="text-lg font-semibold text-gray-900">
																Next actions
															</CardTitle>
														</CardHeader>
														<CardContent className="space-y-3">
															<button
																type="button"
																onClick={() => handleTabChange("settings")}
																className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:border-blue-200 hover:bg-blue-50"
															>
																Edit company profile and logo
																<span className="text-blue-700">→</span>
															</button>
															<button
																type="button"
																onClick={() =>
																	handleTabChange("location-branches")
																}
																className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:border-emerald-200 hover:bg-emerald-50"
															>
																Import locations or request missing places
																<span className="text-emerald-700">→</span>
															</button>
															<button
																type="button"
																onClick={() => handleTabChange("pricing")}
																className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:border-violet-200 hover:bg-violet-50"
															>
																Fetch or import availability
																<span className="text-violet-700">→</span>
															</button>
														</CardContent>
													</Card>
												</div>

												<Card className="mb-8 border border-gray-200 shadow-sm">
													<CardHeader>
														<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
															<div>
																<CardTitle className="text-lg font-semibold text-gray-900">
																	Stored availability samples
																</CardTitle>
																<p className="mt-1 text-sm text-gray-600">
																	Latest stored pricing/availability visibility
																	from the Pricing tab, including manual imports
																	and endpoint fetches.
																</p>
															</div>
															<div className="flex flex-wrap gap-2">
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		dashboardAvailabilityQuery.refetch()
																	}
																	loading={
																		dashboardAvailabilityQuery.isFetching
																	}
																>
																	Refresh
																</Button>
																<Button
																	type="button"
																	variant="secondary"
																	size="sm"
																	onClick={() => handleTabChange("pricing")}
																>
																	Open pricing
																</Button>
															</div>
														</div>
													</CardHeader>
													<CardContent className="max-w-full overflow-x-hidden">
														{dashboardAvailabilityQuery.isLoading &&
														dashboardSamples.length === 0 ? (
															<div className="flex items-center gap-2 py-5 text-sm text-gray-500">
																<Loader size="sm" />
																Loading stored availability samples…
															</div>
														) : dashboardSamples.length === 0 ? (
															<div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
																<p className="text-sm font-semibold text-gray-900">
																	No stored samples yet
																</p>
																<p className="mt-1 text-sm text-gray-600">
																	Use Pricing to fetch from your endpoint or
																	manually import availability so vehicles and
																	prices appear here.
																</p>
																<Button
																	type="button"
																	variant="primary"
																	size="sm"
																	className="mt-4"
																	onClick={() => handleTabChange("pricing")}
																>
																	Add availability data
																</Button>
															</div>
														) : (
															<div className="space-y-4">
																{dashboardSamples.slice(0, 3).map((sample) => (
																	<StoredSampleCard
																		key={sample.id}
																		sample={sample}
																		buildDailyPricingHref={(offerIdx) =>
																			buildDailyPricingLink(sample.id, offerIdx)
																		}
																	/>
																))}
																{dashboardSamples.length > 3 && (
																	<div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
																		Showing 3 of{" "}
																		{dashboardSamples.length.toLocaleString()}{" "}
																		stored samples.{" "}
																		<button
																			type="button"
																			onClick={() => handleTabChange("pricing")}
																			className="font-semibold text-blue-700 hover:text-blue-900"
																		>
																			View all samples in Pricing
																		</button>
																	</div>
																)}
															</div>
														)}
													</CardContent>
												</Card>

												{/* Endpoint Configuration */}
												{user?.company.status === "ACTIVE" && (
													<div className="mt-6">
														<EndpointConfiguration
															endpointConfig={endpointConfig}
															isLoadingEndpoints={isLoadingEndpoints}
															isEditingEndpoints={isEditingEndpoints}
															isUpdatingEndpoints={isUpdatingEndpoints}
															httpEndpoint={httpEndpoint}
															grpcEndpoint={grpcEndpoint}
															setHttpEndpoint={setHttpEndpoint}
															setGrpcEndpoint={setGrpcEndpoint}
															setIsEditingEndpoints={setIsEditingEndpoints}
															updateEndpointConfig={updateEndpointConfig}
															cancelEditEndpoints={cancelEditEndpoints}
														/>
													</div>
												)}

												{/* gRPC Connection Test */}
												{user?.company.status === "ACTIVE" &&
													endpointConfig?.grpcEndpoint && (
														<div className="mt-6">
															<GrpcConnectionTest
																grpcEndpoint={grpcEndpoint}
																grpcTestResult={grpcTestResult}
																isTestingGrpc={isTestingGrpc}
																testSourceGrpc={testSourceGrpc}
															/>
														</div>
													)}

												{/* Offer Agreement Shortcut */}
												{user?.company.status === "ACTIVE" &&
													endpointConfig?.grpcEndpoint &&
													grpcTestResult?.ok && (
														<Card className="mt-6 bg-gray-50 border border-gray-200">
															<CardContent className="p-6">
																<div className="flex items-center justify-between">
																	<div className="flex items-center gap-4">
																		<svg
																			className="w-6 h-6 text-gray-600"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																			/>
																		</svg>
																		<div>
																			<h3 className="text-lg font-semibold text-gray-900 mb-1">
																				Ready to Offer an Agreement?
																			</h3>
																			<p className="text-sm text-gray-600">
																				Create and offer agreements to agents to
																				start accepting bookings from them.
																			</p>
																		</div>
																	</div>
																	<Button
																		onClick={() =>
																			handleTabChange("agreements")
																		}
																		variant="primary"
																	>
																		Offer New Agreement
																	</Button>
																</div>
															</CardContent>
														</Card>
													)}

												{/* Status alert */}
												{user?.company.status === "PENDING_VERIFICATION" && (
													<PendingVerification />
												)}
												{user?.company.status === "ACTIVE" &&
													!endpointConfig?.grpcEndpoint && (
														<Card className="mt-6 border border-yellow-200 bg-yellow-50">
															<CardContent className="p-6">
																<div className="flex items-start gap-4">
																	<div className="p-2 bg-yellow-100 rounded-lg">
																		<svg
																			className="w-6 h-6 text-yellow-600"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
																			/>
																		</svg>
																	</div>
																	<div className="flex-1">
																		<h4 className="font-bold text-yellow-900 mb-1">
																			Setup Required
																		</h4>
																		<p className="text-sm text-yellow-800">
																			Configure your endpoints to start managing
																			agreements and accepting bookings.
																		</p>
																	</div>
																</div>
															</CardContent>
														</Card>
													)}
												<Modal
													isOpen={isDashboardProfileEditorOpen}
													onClose={() => setIsDashboardProfileEditorOpen(false)}
													title="Edit source details"
													size="lg"
													closeOnBackdropClick={!isSavingDashboardProfile}
												>
													<div className="space-y-5">
														<p className="text-sm text-gray-600">
															Update the details shown on this overview. Saving
															writes to the same company settings used by the
															Settings page.
														</p>

														<div>
															<label className="mb-1 block text-sm font-medium text-gray-700">
																Primary branch name
															</label>
															<Input
																value={
																	dashboardProfileDraft.registrationBranchName
																}
																onChange={(event) =>
																	setDashboardProfileDraft((draft) => ({
																		...draft,
																		registrationBranchName: event.target.value,
																	}))
																}
																placeholder="e.g. Main office or primary branch"
															/>
														</div>

														<div>
															<label className="mb-1 block text-sm font-medium text-gray-700">
																Website URL
															</label>
															<Input
																value={dashboardProfileDraft.companyWebsiteUrl}
																onChange={(event) =>
																	setDashboardProfileDraft((draft) => ({
																		...draft,
																		companyWebsiteUrl: event.target.value,
																	}))
																}
																placeholder="https://example.com"
																type="url"
															/>
															<p className="mt-1 text-xs text-gray-500">
																Include https:// for a valid website.
															</p>
														</div>

														<div>
															<label className="mb-1 block text-sm font-medium text-gray-700">
																Company address
															</label>
															<textarea
																value={dashboardProfileDraft.companyAddress}
																onChange={(event) =>
																	setDashboardProfileDraft((draft) => ({
																		...draft,
																		companyAddress: event.target.value,
																	}))
																}
																rows={4}
																placeholder="Street, city, postcode, country"
																className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
															/>
														</div>

														<div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
															<Button
																type="button"
																variant="ghost"
																onClick={() =>
																	setIsDashboardProfileEditorOpen(false)
																}
																disabled={isSavingDashboardProfile}
															>
																Cancel
															</Button>
															<Button
																type="button"
																variant="primary"
																onClick={saveDashboardProfileDetails}
																loading={isSavingDashboardProfile}
															>
																Save details
															</Button>
														</div>
													</div>
												</Modal>
											</>
										)}

										{activeTab === "agreements" && (
											<>
												<div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
													<div className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-8 text-white sm:px-8">
														<div
															className="absolute inset-0 opacity-25"
															aria-hidden="true"
														>
															<div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400 blur-3xl" />
															<div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-300 blur-3xl" />
														</div>
														<div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
															<div className="max-w-3xl">
																<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
																	<FileText className="h-3.5 w-3.5" />
																	Commercial access
																</div>
																<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
																	Agreements made easy
																</h1>
																<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
																	Legal paperwork stays offline. Register which
																	agents can access your supply, the supplier
																	account/requester ID, and the price margin.
																</p>
															</div>
															<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur">
																<p className="font-bold text-white">
																	Your company contact
																</p>
																<p className="mt-1 text-blue-100">
																	Share this email with agents for offline legal
																	documents and account setup.
																</p>
																<div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-mono text-xs">
																	<span className="min-w-0 flex-1 truncate">
																		{user?.email || "source@example.com"}
																	</span>
																	<button
																		type="button"
																		className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold text-white hover:bg-white/25"
																		onClick={() => {
																			if (user?.email) {
																				navigator.clipboard.writeText(
																					user.email,
																				);
																				toast.success("Email copied");
																			}
																		}}
																	>
																		Copy
																	</button>
																</div>
															</div>
														</div>
													</div>
													<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
														<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																Available agents
															</p>
															<p className="mt-2 text-2xl font-bold text-slate-950">
																{(agents || []).length}
															</p>
															<p className="mt-1 text-xs text-slate-500">
																{
																	(agents || []).filter(
																		(agent) => agent.status === "ACTIVE",
																	).length
																}{" "}
																active
															</p>
														</div>
														<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
																Access records
															</p>
															<p className="mt-2 text-2xl font-bold text-blue-950">
																{
																	(agents || []).flatMap(
																		(agent) => agent.agentAgreements || [],
																	).length
																}
															</p>
															<p className="mt-1 text-xs text-blue-700">
																All statuses
															</p>
														</div>
														<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
																Ready to trade
															</p>
															<p className="mt-2 text-2xl font-bold text-emerald-950">
																{
																	(agents || [])
																		.flatMap(
																			(agent) => agent.agentAgreements || [],
																		)
																		.filter(
																			(agreement) =>
																				agreement.status === "ACTIVE" ||
																				agreement.status === "ACCEPTED",
																		).length
																}
															</p>
															<p className="mt-1 text-xs text-emerald-700">
																Active or legacy accepted
															</p>
														</div>
														<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
																Pending setup
															</p>
															<p className="mt-2 text-2xl font-bold text-amber-950">
																{
																	(agents || [])
																		.flatMap(
																			(agent) => agent.agentAgreements || [],
																		)
																		.filter(
																			(agreement) =>
																				agreement.status === "OFFERED" ||
																				agreement.status === "DRAFT",
																		).length
																}
															</p>
															<p className="mt-1 text-xs text-amber-700">
																Needs follow-up
															</p>
														</div>
													</div>
												</div>

												<div className="mb-6 grid gap-4 lg:grid-cols-3">
													<Card className="border border-blue-100 bg-blue-50">
														<CardContent className="p-4">
															<div className="flex items-start gap-3">
																<FileText className="mt-0.5 h-5 w-5 text-blue-700" />
																<div>
																	<p className="font-bold text-blue-950">
																		Account / requester ID
																	</p>
																	<p className="mt-1 text-sm leading-6 text-blue-800">
																		The supplier-assigned account number is sent
																		as RequestorID when Gloria asks for prices.
																	</p>
																</div>
															</div>
														</CardContent>
													</Card>
													<Card className="border border-emerald-100 bg-emerald-50">
														<CardContent className="p-4">
															<div className="flex items-start gap-3">
																<CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
																<div>
																	<p className="font-bold text-emerald-950">
																		Active means usable
																	</p>
																	<p className="mt-1 text-sm leading-6 text-emerald-800">
																		Saved operational agreements become active
																		after offline legal terms are confirmed.
																	</p>
																</div>
															</div>
														</CardContent>
													</Card>
													<Card className="border border-amber-100 bg-amber-50">
														<CardContent className="p-4">
															<div className="flex items-start gap-3">
																<Info className="mt-0.5 h-5 w-5 text-amber-700" />
																<div>
																	<p className="font-bold text-amber-950">
																		Margin is applied here
																	</p>
																	<p className="mt-1 text-sm leading-6 text-amber-800">
																		Enter the agreed percentage and Gloria adds
																		it to supplier prices returned to agents.
																	</p>
																</div>
															</div>
														</CardContent>
													</Card>
												</div>

												<div className="mt-6 space-y-6">
													{user?.company?.status === "ACTIVE" ? (
														<CreateAgreementForm
															agents={agents}
															selectedAgentId={selectedAgentId}
															accountNumber={agreementAccountNumber}
															marginPercent={agreementMarginPercent}
															contactName={agreementContactName}
															contactEmail={agreementContactEmail}
															contactPhone={agreementContactPhone}
															isCreatingAgreement={isCreatingAgreement}
															setSelectedAgentId={setSelectedAgentId}
															setAccountNumber={setAgreementAccountNumber}
															setMarginPercent={setAgreementMarginPercent}
															setContactName={setAgreementContactName}
															setContactEmail={setAgreementContactEmail}
															setContactPhone={setAgreementContactPhone}
															createAgreement={createAgreement}
															user={user}
														/>
													) : null}
													{user?.company?.status === "ACTIVE" ? (
														<MyAgreements user={user} />
													) : (
														<Card className="border border-amber-200 bg-amber-50">
															<CardContent className="p-4 text-sm text-amber-900">
																Your Source company must be active before
																operational supplier access can be used. Once
																approved, this section will show connected
																agents and account IDs.
															</CardContent>
														</Card>
													)}
													<AvailableAgents
														agents={agents}
														isLoadingAgents={isLoadingAgents}
														onViewAgreement={handleViewAgreement}
													/>
												</div>
											</>
										)}

										{activeTab === "locations" && (
											<>
												{/* Header */}
												<div
													className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
													data-tour="locations-header"
												>
													<div className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 px-6 py-8 text-white sm:px-8">
														<div
															className="absolute inset-0 opacity-25"
															aria-hidden="true"
														>
															<div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400 blur-3xl" />
															<div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-blue-300 blur-3xl" />
														</div>
														<div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
															<div className="max-w-3xl">
																<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
																	<Info className="h-3.5 w-3.5" />
																	Coverage control center
																</div>
																<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
																	Locations
																</h1>
																<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
																	Manage where agents can pick up and return
																	vehicles. Sync or import your supplier
																	coverage, request missing places for admin
																	review, then verify the final UN/LOCODE table
																	below.
																</p>
															</div>
															<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur">
																<p className="font-bold text-white">
																	Recommended setup order
																</p>
																<ol className="mt-2 space-y-1 text-xs leading-5 text-blue-100">
																	<li>1. Configure/sync supplier coverage.</li>
																	<li>
																		2. Request missing locations if a code is
																		not available.
																	</li>
																	<li>
																		3. Load and review table status before agent
																		testing.
																	</li>
																</ol>
															</div>
														</div>
													</div>
													<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
														<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																Loaded rows
															</p>
															<p className="mt-2 text-2xl font-bold text-slate-950">
																{locations.length || "—"}
															</p>
															<p className="mt-1 text-xs text-slate-500">
																Current table data
															</p>
														</div>
														<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
																Last sync
															</p>
															<p className="mt-2 text-sm font-bold text-blue-950">
																{lastSyncTime
																	? new Date(lastSyncTime).toLocaleDateString()
																	: "Never"}
															</p>
															<p className="mt-1 text-xs text-blue-700">
																Coverage refresh
															</p>
														</div>
														<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
																Agreement filter
															</p>
															<p className="mt-2 text-sm font-bold text-emerald-950">
																{selectedAgreementFilterId
																	? "Active"
																	: "All coverage"}
															</p>
															<p className="mt-1 text-xs text-emerald-700">
																Current view
															</p>
														</div>
														<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
																Missing places
															</p>
															<p className="mt-2 text-sm font-bold text-amber-950">
																Request to admin
															</p>
															<p className="mt-1 text-xs text-amber-700">
																Tracked on this page
															</p>
														</div>
													</div>
												</div>

												<div className="mt-6 space-y-6">
													{/* Location Sync Status */}
													<Card
														className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200"
														data-tour="locations-sync-status"
													>
														<CardHeader className="border-b border-slate-200 bg-white">
															<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
																<div className="flex items-start gap-3">
																	<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
																		<RefreshCw className="h-5 w-5" />
																	</div>
																	<div>
																		<CardTitle className="text-xl font-bold text-slate-950">
																			Coverage actions
																		</CardTitle>
																		<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
																			Use these controls to refresh coverage
																			from your source adapter, branch endpoint,
																			or location endpoint. Write actions will
																			ask for a plan if you have not subscribed
																			yet.
																		</p>
																	</div>
																</div>
																<div
																	className="flex flex-wrap gap-2"
																	data-tour="locations-sync-actions"
																>
																	<Button
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			syncLocations();
																		}}
																		loading={isSyncingLocations}
																		variant="primary"
																		size="sm"
																		disabled={isSyncingLocations}
																		title={
																			!subscriptionActive
																				? "Choose a plan before syncing locations."
																				: undefined
																		}
																		className="rounded-full shadow-sm"
																	>
																		<RefreshCw className="mr-2 h-4 w-4" />
																		Sync Locations
																	</Button>
																	<Button
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			importBranches();
																		}}
																		loading={isImportingBranches}
																		variant="secondary"
																		size="sm"
																		disabled={isImportingBranches}
																		title={
																			!subscriptionActive
																				? "Choose a plan before importing branches."
																				: undefined
																		}
																		className="rounded-full shadow-sm"
																	>
																		<ExternalLink className="mr-2 h-4 w-4" />
																		Import Branches
																	</Button>
																	<Button
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			setIsLocationEndpointConfigOpen(true);
																		}}
																		variant="secondary"
																		size="sm"
																		className="rounded-full shadow-sm"
																		title="Configure location import endpoint URL"
																	>
																		<Settings className="mr-2 h-4 w-4" />
																		Configure Endpoint
																	</Button>
																	<Button
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			importLocations();
																		}}
																		loading={isImportingLocations}
																		variant="secondary"
																		size="sm"
																		disabled={isImportingLocations}
																		className="rounded-full shadow-sm"
																		title={
																			!subscriptionActive
																				? "Choose a plan before importing locations."
																				: endpointConfig?.locationEndpointUrl
																					? `Import from ${endpointConfig.locationEndpointUrl}`
																					: "Import from configured endpoint"
																		}
																	>
																		<ExternalLink className="mr-2 h-4 w-4" />
																		Import Locations
																	</Button>
																</div>
															</div>
														</CardHeader>
														<CardContent className="p-5">
															<div className="grid gap-4 md:grid-cols-3">
																<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
																	<p className="text-xs font-bold uppercase tracking-wide text-blue-700">
																		Last sync
																	</p>
																	<p className="mt-2 text-lg font-bold text-blue-950">
																		{lastSyncTime
																			? new Date(lastSyncTime).toLocaleString()
																			: "Never synced"}
																	</p>
																	<p className="mt-1 text-xs text-blue-700">
																		Updated after successful sync/import.
																	</p>
																</div>
																<div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
																	<p className="text-xs font-bold uppercase tracking-wide text-purple-700">
																		Table rows
																	</p>
																	<p className="mt-2 text-3xl font-bold text-purple-950">
																		{locations.length || "—"}
																	</p>
																	<p className="mt-1 text-xs text-purple-700">
																		Load coverage below to refresh this count.
																	</p>
																</div>
																<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
																	<p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
																		Best source for branches
																	</p>
																	<p className="mt-2 text-lg font-bold text-emerald-950">
																		Location & Branches
																	</p>
																	<p className="mt-1 text-xs text-emerald-700">
																		Use detailed branch imports for
																		address/contact rows.
																	</p>
																</div>
															</div>
															<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
																<strong className="text-slate-950">Tip:</strong>{" "}
																Sync Locations refreshes coverage-only data.
																Import Branches or Location & Branches is better
																when you need desk names, addresses, phone
																numbers, opening hours, or pickup instructions.
															</div>
														</CardContent>
													</Card>

													{/* Missing Location Requests */}
													<Card
														className="overflow-hidden border-2 border-cyan-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
														data-tour="locations-request-card"
													>
														<CardHeader className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50">
															<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
																<div className="flex items-start gap-3">
																	<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-cyan-100">
																		<Plus className="h-5 w-5 text-cyan-700" />
																	</div>
																	<div>
																		<CardTitle className="text-xl font-bold text-gray-900">
																			Request a Missing Location
																		</CardTitle>
																		<p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
																			If a pickup/return place is not available
																			in Gloria’s location master, send it to
																			the admin team for review. Approved
																			requests become visible for coverage and
																			future imports.
																		</p>
																	</div>
																</div>
																<Button
																	type="button"
																	variant="primary"
																	onClick={() =>
																		setIsLocationRequestModalOpen(true)
																	}
																	data-tour="locations-request-button"
																	className="shadow-md hover:shadow-lg"
																>
																	<Plus className="mr-2 h-4 w-4" />
																	Request missing location
																</Button>
															</div>
														</CardHeader>
														<CardContent className="p-5">
															<div className="grid gap-3 md:grid-cols-3">
																<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
																	<p className="text-sm font-bold text-blue-950">
																		1. Submit details
																	</p>
																	<p className="mt-1 text-xs leading-5 text-blue-800">
																		Provide name, country, city/IATA code,
																		address, and why agents need this location.
																	</p>
																</div>
																<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
																	<p className="text-sm font-bold text-amber-950">
																		2. Admin review
																	</p>
																	<p className="mt-1 text-xs leading-5 text-amber-800">
																		Admins verify the place, normalize codes,
																		and approve or reject with notes.
																	</p>
																</div>
																<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
																	<p className="text-sm font-bold text-emerald-950">
																		3. Track status here
																	</p>
																	<p className="mt-1 text-xs leading-5 text-emerald-800">
																		Your submitted requests and admin decisions
																		are listed below on this Locations page.
																	</p>
																</div>
															</div>
														</CardContent>
													</Card>

													<div data-tour="locations-requests-list">
														<LocationRequestList />
													</div>

													{/* Filter and Load Section */}
													<Card
														className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200"
														data-tour="locations-filter-card"
													>
														<CardHeader className="border-b border-slate-200 bg-white">
															<div className="flex items-start gap-3">
																<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
																	<ChevronDown className="h-5 w-5" />
																</div>
																<div>
																	<CardTitle className="text-xl font-bold text-slate-950">
																		Load coverage table
																	</CardTitle>
																	<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
																		Choose whether to view all Source coverage
																		or the locations allowed by a specific
																		supplier access record.
																	</p>
																</div>
															</div>
														</CardHeader>
														<CardContent className="p-5">
															<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
																<div>
																	<label className="mb-2 block text-sm font-bold text-slate-700">
																		Agreement scope
																	</label>
																	<select
																		className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
																		value={selectedAgreementFilterId}
																		onChange={(e) =>
																			setSelectedAgreementFilterId(
																				e.target.value,
																			)
																		}
																	>
																		<option value="">
																			All source coverage
																		</option>
																		{(agents || [])
																			.flatMap((a) => a.agentAgreements || [])
																			.map((ag) => (
																				<option key={ag.id} value={ag.id}>
																					{ag.agreementRef} · {ag.status}
																				</option>
																			))}
																	</select>
																	<p className="mt-2 text-xs leading-5 text-slate-500">
																		All source coverage shows what your supplier
																		serves. Agreement scope helps verify what a
																		specific agent can use.
																	</p>
																</div>
																<Button
																	onClick={(e) => {
																		e.preventDefault();
																		e.stopPropagation();
																		loadLocations(true);
																	}}
																	size="sm"
																	variant="primary"
																	className="h-11 rounded-full px-5 shadow-sm"
																>
																	<RefreshCw className="mr-2 h-4 w-4" />
																	Load table
																</Button>
															</div>
														</CardContent>
													</Card>

													{/* Available Locations */}
													<AvailableLocations
														locations={locations}
														isLoadingLocations={isLoadingLocations}
														showLocations={showLocations}
														loadLocations={loadLocations}
														showRemoveButton={!selectedAgreementFilterId}
														agreementFilterActive={!!selectedAgreementFilterId}
														listMeta={locationsListMeta}
													/>
												</div>

												{/* Location Endpoint Configuration Modal */}
												<Modal
													isOpen={isLocationEndpointConfigOpen}
													onClose={() => {
														setIsLocationEndpointConfigOpen(false);
														setLocationConfigTab("settings");
														setLocationSamplePaste("");
														setLocationSampleValidation(null);
													}}
													title="Configure Location Import Endpoint"
													size="lg"
												>
													<div className="space-y-4">
														{/* Tabs */}
														<div className="flex border-b border-gray-200">
															<button
																type="button"
																onClick={() => setLocationConfigTab("settings")}
																className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
																	locationConfigTab === "settings"
																		? "border-blue-600 text-blue-600"
																		: "border-transparent text-gray-500 hover:text-gray-700"
																}`}
															>
																Settings
															</button>
															<button
																type="button"
																onClick={() => setLocationConfigTab("sample")}
																className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
																	locationConfigTab === "sample"
																		? "border-blue-600 text-blue-600"
																		: "border-transparent text-gray-500 hover:text-gray-700"
																}`}
															>
																Sample & Validate
															</button>
														</div>

														{locationConfigTab === "settings" && (
															<>
																<div>
																	<label className="block text-sm font-medium text-gray-700 mb-2">
																		Location Endpoint URL
																	</label>
																	<Input
																		value={locationEndpointUrl}
																		onChange={(e) =>
																			setLocationEndpointUrl(e.target.value)
																		}
																		placeholder="https://example.com/loctest.php"
																		helperText="Enter the URL that returns location data in JSON, XML, or PHP var_dump (OTA_VehLocSearchRS) format"
																	/>
																</div>
																<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
																	<p className="text-sm text-blue-800 font-semibold mb-2">
																		Supported formats
																	</p>
																	<ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
																		<li>
																			JSON:{" "}
																			<code>{`{ Locations: [...] }`}</code>,{" "}
																			<code>{`{ items: [...] }`}</code>, or
																			array
																		</li>
																		<li>
																			XML:{" "}
																			<code>{`<Locations><Location>...</Location></Locations>`}</code>
																		</li>
																		<li>
																			<strong>PHP var_dump / OTA:</strong>{" "}
																			<code>OTA_VehLocSearchRS</code> with{" "}
																			<code>VehMatchedLocs</code> and{" "}
																			<code>LocationDetail</code> (attr: Code,
																			Name, Latitude, Longitude;
																			Address.CountryName.attr.Code). Unlocode
																			derived as country + first 3 of Code (e.g.
																			DXBA02 → AEDXB).
																		</li>
																	</ul>
																	<p className="text-xs text-blue-600 mt-2">
																		Use the <strong>Sample & Validate</strong>{" "}
																		tab to see an example and paste your
																		response to check format.
																	</p>
																</div>
																<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
																	<Button
																		variant="secondary"
																		onClick={validateLocationEndpoint}
																		loading={isValidatingLocationEndpoint}
																		disabled={!locationEndpointUrl.trim()}
																		type="button"
																	>
																		<svg
																			className="w-4 h-4 mr-2"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
																			/>
																		</svg>
																		Test Endpoint
																	</Button>
																	<Button
																		variant="secondary"
																		onClick={() =>
																			setIsLocationEndpointConfigOpen(false)
																		}
																		type="button"
																	>
																		Cancel
																	</Button>
																	<Button
																		variant="primary"
																		onClick={handleSaveLocationEndpointUrl}
																		loading={isSavingLocationEndpoint}
																		disabled={!locationEndpointUrl.trim()}
																	>
																		Save
																	</Button>
																</div>
															</>
														)}

														{locationConfigTab === "sample" && (
															<>
																<div>
																	<p className="text-sm font-medium text-gray-700 mb-2">
																		Expected sample (OTA PHP var_dump)
																	</p>
																	<p className="text-xs text-gray-600 mb-2">
																		Your endpoint should return a structure like
																		this. Each location has{" "}
																		<code>LocationDetail</code> with{" "}
																		<code>attr</code> (Code, Name, Latitude,
																		Longitude) and{" "}
																		<code>Address.CountryName.attr.Code</code>{" "}
																		(e.g. AE).
																	</p>
																	<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre">
																		{`array(1) {
  ["OTA_VehLocSearchRS"]=> array(4) {
    ["VehMatchedLocs"]=> array(2) {
      [0]=> array(1) {
        ["VehMatchedLoc"]=> array(1) {
          ["LocationDetail"]=> array(6) {
            ["attr"]=> array(8) {
              ["Code"]=> string(6) "DXBA02"
              ["Name"]=> string(13) "Dubai Airport"
              ["Latitude"]=> string(9) "25.236158"
              ["Longitude"]=> string(9) "55.362354"
              ["BranchType"]=> string(6) "DXBA02"
            }
            ["Address"]=> array(4) {
              ["CountryName"]=> array(2) {
                ["value"]=> string(20) "UNITED ARAB EMIRATES"
                ["attr"]=> array(1) { ["Code"]=> string(2) "AE" }
              }
            }
          }
        }
      }
      [1]=> ... second location ...
    }
  }
}`}
																	</pre>
																</div>
																<div>
																	<label className="block text-sm font-medium text-gray-700 mb-2">
																		Paste your sample response
																	</label>
																	<p className="text-xs text-gray-500 mb-1">
																		Paste JSON, XML, or PHP var_dump output here
																		and click Validate to check format and
																		location count.
																	</p>
																	<textarea
																		value={locationSamplePaste}
																		onChange={(e) => {
																			setLocationSamplePaste(e.target.value);
																			setLocationSampleValidation(null);
																		}}
																		placeholder="Paste endpoint response (JSON, XML, or PHP var_dump)..."
																		className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																		spellCheck={false}
																	/>
																	<div className="flex items-center gap-3 mt-2">
																		<Button
																			type="button"
																			variant="secondary"
																			onClick={validateLocationSample}
																			disabled={!locationSamplePaste.trim()}
																		>
																			Validate sample
																		</Button>
																		{locationSampleValidation && (
																			<div
																				className={`flex-1 text-sm ${locationSampleValidation.ok ? "text-green-700" : "text-red-700"}`}
																			>
																				{locationSampleValidation.ok ? (
																					<span>
																						<CheckCircle2 className="w-4 h-4 inline mr-1 align-middle" />
																						Detected{" "}
																						<strong>
																							{locationSampleValidation.format}
																						</strong>
																						{locationSampleValidation.count !=
																							null &&
																							` — ${locationSampleValidation.count} location(s)`}
																						.
																					</span>
																				) : (
																					<span>
																						<XCircle className="w-4 h-4 inline mr-1 align-middle" />
																						{locationSampleValidation.errors?.join(
																							" ",
																						) || "Validation failed."}
																					</span>
																				)}
																			</div>
																		)}
																	</div>
																	{locationSampleValidation?.errors &&
																		locationSampleValidation.errors.length >
																			0 && (
																			<ul className="mt-2 text-xs text-red-700 list-disc list-inside">
																				{locationSampleValidation.errors.map(
																					(err, i) => (
																						<li key={i}>{err}</li>
																					),
																				)}
																			</ul>
																		)}
																</div>
																<div className="flex justify-end pt-2 border-t border-gray-200">
																	<Button
																		variant="secondary"
																		onClick={() =>
																			setIsLocationEndpointConfigOpen(false)
																		}
																		type="button"
																	>
																		Close
																	</Button>
																</div>
															</>
														)}
													</div>
												</Modal>

												{/* Location Import Results Modal */}
												<Modal
													isOpen={
														showLocationImportResult &&
														locationImportResult !== null
													}
													onClose={() => {
														setShowLocationImportResult(false);
														setLocationImportResult(null);
													}}
													title="Location Import Results"
													size="xl"
												>
													{locationImportResult && (
														<div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
															<LocationImportResultDisplay
																result={locationImportResult}
															/>
														</div>
													)}
												</Modal>
											</>
										)}

										{activeTab === "location-branches" && (
											<>
												<div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
													<div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 px-6 py-8 text-white sm:px-8">
														<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
															<div className="max-w-3xl">
																<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
																	<FileText className="h-3.5 w-3.5" />
																	Branch onboarding
																</div>
																<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
																	Location &amp; Branches
																</h1>
																<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
																	{branchImportIsManual
																		? "Upload branch files, sync from your branch HTTP endpoint, or add branches manually — or switch to supplier endpoint for GLORIA location list import."
																		: "Connect your supplier Location List feed, validate a real sample, then import coverage and branch details into GLORIA."}
																</p>
															</div>
															<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur">
																<p className="font-bold text-white">
																	Endpoint mode flow
																</p>
																<ol className="mt-2 space-y-1 text-xs leading-5 text-blue-100">
																	<li>1. Configure HTTP/XML or gRPC source.</li>
																	<li>2. Validate the supplier response.</li>
																	<li>
																		3. Import, sync, and review rows below.
																	</li>
																</ol>
															</div>
														</div>
													</div>
													<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
														<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																Current mode
															</p>
															<p className="mt-2 text-lg font-bold text-slate-950">
																{branchImportIsManual
																	? "Manual tools"
																	: "Supplier endpoint"}
															</p>
															<p className="mt-1 text-xs text-slate-500">
																Switch anytime below
															</p>
														</div>
														<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
																Transport
															</p>
															<p className="mt-2 text-lg font-bold text-blue-950">
																{locationListTransport === "grpc"
																	? "gRPC"
																	: "HTTP/XML"}
															</p>
															<p className="mt-1 text-xs text-blue-700">
																Saved in endpoint settings
															</p>
														</div>
														<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
																HTTP/XML result
															</p>
															<p className="mt-2 text-lg font-bold text-emerald-950">
																Branches + coverage
															</p>
															<p className="mt-1 text-xs text-emerald-700">
																Best for rich desk data
															</p>
														</div>
														<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
																gRPC result
															</p>
															<p className="mt-2 text-lg font-bold text-amber-950">
																Coverage only
															</p>
															<p className="mt-1 text-xs text-amber-700">
																No branch detail rows
															</p>
														</div>
													</div>
												</div>

												<Card
													className="mb-6 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200"
													data-tour="location-branches-import-mode"
												>
													<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-slate-50">
														<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
															<div>
																<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
																	<Info className="h-3.5 w-3.5" />
																	Start here
																</div>
																<CardTitle className="text-xl font-bold text-slate-950">
																	How do you want to add branches?
																</CardTitle>
																<p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
																	Choose one option below. You can switch later,
																	and switching does not delete existing
																	branches. The selected option controls which
																	setup tools appear on this page.
																</p>
															</div>
															<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
																<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																	Currently selected
																</p>
																<p className="mt-1 font-bold text-slate-950">
																	{branchImportIsManual
																		? "Manual & file tools"
																		: "Supplier Location List"}
																</p>
															</div>
														</div>
													</CardHeader>
													<CardContent className="grid gap-4 p-5 lg:grid-cols-2">
														<button
															type="button"
															role="radio"
															aria-checked={!branchImportIsManual}
															onClick={() => selectBranchImportMode("endpoint")}
															className={`group relative rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!branchImportIsManual ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}
														>
															<div className="flex items-start gap-4">
																<div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm">
																	<RefreshCw className="h-5 w-5" />
																</div>
																<div className="min-w-0 flex-1">
																	<div className="flex flex-wrap items-center gap-2">
																		<p className="font-bold text-slate-950">
																			Supplier Location List
																		</p>
																		{!branchImportIsManual ? (
																			<span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
																				<CheckCircle2 className="h-3.5 w-3.5" />{" "}
																				Selected
																			</span>
																		) : (
																			<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
																				Click to switch
																			</span>
																		)}
																	</div>
																	<p className="mt-2 text-sm leading-6 text-slate-600">
																		Use this when your supplier system has a
																		repeatable location-list feed. HTTP/XML
																		imports detailed branch rows; gRPC only
																		updates served locations.
																	</p>
																	<div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
																		<span className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-200">
																			Best for scheduled imports
																		</span>
																		<span className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-200">
																			Import actions appear below
																		</span>
																	</div>
																</div>
															</div>
														</button>
														<button
															type="button"
															role="radio"
															aria-checked={branchImportIsManual}
															onClick={() => selectBranchImportMode("manual")}
															className={`group relative rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${branchImportIsManual ? "border-slate-400 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
														>
															<div className="flex items-start gap-4">
																<div className="rounded-xl bg-slate-900 p-2 text-white shadow-sm">
																	<Plus className="h-5 w-5" />
																</div>
																<div className="min-w-0 flex-1">
																	<div className="flex flex-wrap items-center gap-2">
																		<p className="font-bold text-slate-950">
																			Manual & file tools
																		</p>
																		{branchImportIsManual ? (
																			<span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
																				<CheckCircle2 className="h-3.5 w-3.5" />{" "}
																				Selected
																			</span>
																		) : (
																			<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
																				Click to switch
																			</span>
																		)}
																	</div>
																	<p className="mt-2 text-sm leading-6 text-slate-600">
																		Use this for first uploads, quick
																		corrections, or when you do not have a
																		repeatable supplier feed yet. Supports JSON,
																		XML, CSV, Excel, and manual add.
																	</p>
																	<div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
																		<span className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
																			Best for one-time setup
																		</span>
																		<span className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
																			Shows upload & add tools
																		</span>
																	</div>
																</div>
															</div>
														</button>
													</CardContent>
												</Card>

												<Card
													className="mb-6 overflow-hidden border-0 shadow-sm ring-1 ring-cyan-200"
													data-tour="locations-request-card"
												>
													<CardHeader className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-blue-50">
														<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
															<div className="flex items-start gap-3">
																<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200">
																	<MapPin className="h-5 w-5" />
																</div>
																<div>
																	<CardTitle className="text-xl font-bold text-slate-950">
																		Missing location requests
																	</CardTitle>
																	<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
																		If your supplier feed uses a pickup or
																		return place that is not yet in Gloria,
																		request it here. Admins review the details
																		and mark it approved or rejected with notes.
																	</p>
																</div>
															</div>
															<div className="flex flex-wrap gap-2">
																<Button
																	type="button"
																	variant="primary"
																	onClick={() =>
																		setIsLocationRequestModalOpen(true)
																	}
																	data-tour="locations-request-button"
																	className="shadow-sm"
																>
																	<Plus className="mr-2 h-4 w-4" />
																	Request location
																</Button>
																<Button
																	type="button"
																	variant="secondary"
																	onClick={() =>
																		setIsLocationRequestsStatusModalOpen(true)
																	}
																	data-tour="locations-requests-list"
																	className="shadow-sm"
																>
																	<FileText className="mr-2 h-4 w-4" />
																	View request status
																</Button>
															</div>
														</div>
													</CardHeader>
													<CardContent className="bg-white p-5">
														<div className="grid gap-3 md:grid-cols-3">
															<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
																<p className="text-sm font-bold text-blue-950">
																	1. Submit details
																</p>
																<p className="mt-1 text-xs leading-5 text-blue-800">
																	Enter location name, country code, city/IATA
																	code, address, and the business reason.
																</p>
															</div>
															<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
																<p className="text-sm font-bold text-amber-950">
																	2. Admin review
																</p>
																<p className="mt-1 text-xs leading-5 text-amber-800">
																	The admin team validates the place and decides
																	whether it should be added.
																</p>
															</div>
															<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
																<p className="text-sm font-bold text-emerald-950">
																	3. Track approval
																</p>
																<p className="mt-1 text-xs leading-5 text-emerald-800">
																	Use status history to see pending, approved,
																	rejected, review date, and admin notes.
																</p>
															</div>
														</div>
													</CardContent>
												</Card>

												{!branchImportIsManual && (
													<Card className="mb-6 overflow-hidden border-0 shadow-lg ring-1 ring-slate-200">
														<CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
															<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
																<div>
																	<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
																		<FileText className="h-3.5 w-3.5" />
																		Supplier response guide
																	</div>
																	<CardTitle className="text-2xl font-bold text-white">
																		Sample supplier payloads
																	</CardTitle>
																	<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
																		HTTP/XML imports full branch rows and
																		coverage. gRPC GetLocations updates coverage
																		only. Use Sample &amp; Validate for full
																		payload examples.
																	</p>
																</div>
																<div className="flex flex-wrap gap-2">
																	<Button
																		type="button"
																		variant="secondary"
																		className="border-white/20 bg-white/10 text-white hover:bg-white/20"
																		onClick={() => {
																			setLocationListConfigTab("sample");
																			setLocationListSampleFormat(
																				locationListTransport === "grpc"
																					? "grpc"
																					: "xml",
																			);
																			setLocationListSampleValidation(null);
																			setIsLocationListConfigOpen(true);
																		}}
																	>
																		Sample &amp; Validate
																	</Button>
																</div>
															</div>
														</CardHeader>
														<CardContent className="space-y-4 bg-white p-5">
															<div className="flex flex-wrap items-center gap-3">
																<Button
																	variant="secondary"
																	onClick={() => {
																		setLocationListConfigTab("settings");
																		setIsLocationListConfigOpen(true);
																	}}
																	type="button"
																	data-tour="location-branches-configure-endpoint"
																>
																	Configure Endpoint
																</Button>
																<Button
																	variant="primary"
																	onClick={importLocationList}
																	loading={isImportingLocationList}
																	disabled={
																		isImportingLocationList ||
																		(subscriptionActive &&
																			(locationListTransport === "grpc"
																				? !(
																						grpcEndpoint ||
																						endpointConfig?.grpcEndpoint ||
																						""
																					)
																						.toString()
																						.trim()
																				: !locationListEndpointUrl.trim()))
																	}
																	type="button"
																	data-tour="location-branches-import-endpoint"
																>
																	Import from endpoint
																</Button>
																<Button
																	variant="secondary"
																	onClick={syncLocationListFromEndpoint}
																	loading={isImportingLocationList}
																	disabled={
																		isImportingLocationList ||
																		(subscriptionActive &&
																			(locationListTransport === "grpc"
																				? !(
																						grpcEndpoint ||
																						endpointConfig?.grpcEndpoint ||
																						""
																					)
																						.toString()
																						.trim()
																				: !locationListEndpointUrl.trim()))
																	}
																	type="button"
																	className="gap-2"
																	title="Re-fetch from supplier. Branches and locations are upserted; nothing is deleted."
																	data-tour="location-branches-sync-endpoint"
																>
																	<RefreshCw
																		className={`w-4 h-4 shrink-0 ${isImportingLocationList ? "animate-spin" : ""}`}
																	/>
																	Sync from endpoint
																</Button>
																{locationListTransport === "http" &&
																	locationListEndpointUrl && (
																		<span
																			className="min-w-0 truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
																			title={locationListEndpointUrl}
																		>
																			{locationListEndpointUrl}
																		</span>
																	)}
																{locationListTransport === "grpc" &&
																	(grpcEndpoint ||
																		endpointConfig?.grpcEndpoint) && (
																		<span
																			className="min-w-0 truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
																			title={
																				grpcEndpoint ||
																				endpointConfig?.grpcEndpoint ||
																				""
																			}
																		>
																			gRPC:{" "}
																			{grpcEndpoint ||
																				endpointConfig?.grpcEndpoint}
																		</span>
																	)}
															</div>
															<p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
																<strong>Sync</strong> upserts by branch code —
																existing rows update, new codes add, omitted
																codes are not deleted. gRPC only updates
																UN/LOCODE coverage; switch to manual tools for
																branch details after gRPC.
															</p>
														</CardContent>
													</Card>
												)}

												<BranchList
													subscriptionActive={subscriptionActive}
													onRequirePlan={openPlanRequired}
													onEdit={(branch) => {
														setSelectedBranch(branch);
														setIsEditBranchModalOpen(true);
													}}
													onQuotaExceeded={(payload, retry) =>
														setQuotaModal({ payload, retry })
													}
													hideHeader={!branchImportIsManual}
													createModalOpen={isBranchCreateModalOpen}
													onCreateModalOpenChange={setIsBranchCreateModalOpen}
												/>

												<Modal
													isOpen={isLocationListConfigOpen}
													onClose={() => {
														setIsLocationListConfigOpen(false);
														setLocationListConfigTab("settings");
														setLocationListSampleFormat("xml");
														setLocationListSamplePaste("");
														setLocationListSampleValidation(null);
													}}
													title="Configure Location List Endpoint"
													size="lg"
												>
													<div className="space-y-4">
														<div className="flex border-b border-gray-200">
															<button
																type="button"
																onClick={() =>
																	setLocationListConfigTab("settings")
																}
																className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${locationListConfigTab === "settings" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
															>
																Settings
															</button>
															<button
																type="button"
																onClick={() =>
																	setLocationListConfigTab("sample")
																}
																className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${locationListConfigTab === "sample" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
															>
																Sample &amp; Validate
															</button>
														</div>
														{locationListConfigTab === "settings" && (
															<>
																<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
																	<p className="text-sm font-medium text-gray-800 mb-3">
																		How should Gloria fetch your location list?
																	</p>
																	<div className="flex flex-col gap-3">
																		<label className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
																			<input
																				type="radio"
																				name="locationListTransport"
																				className="mt-1"
																				checked={
																					locationListTransport === "http"
																				}
																				onChange={() =>
																					setLocationListTransport("http")
																				}
																			/>
																			<span>
																				<strong>HTTP — POST XML</strong> to your
																				supplier URL (GLORIA_locationlistrq /
																				…rs with LocationDetail). Whitelist
																				applies to this URL.
																			</span>
																		</label>
																		<label className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
																			<input
																				type="radio"
																				name="locationListTransport"
																				className="mt-1"
																				checked={
																					locationListTransport === "grpc"
																				}
																				onChange={() =>
																					setLocationListTransport("grpc")
																				}
																			/>
																			<span>
																				<strong>gRPC — GetLocations</strong>{" "}
																				empty request on{" "}
																				<code className="bg-white px-1 rounded text-xs">
																					SourceProviderService
																				</code>{" "}
																				using the same{" "}
																				<strong>
																					gRPC endpoint (host:port)
																				</strong>{" "}
																				as the rest of your integration
																				(configure under Endpoints / Settings if
																				needed).
																			</span>
																		</label>
																	</div>
																</div>
																{locationListTransport === "http" && (
																	<>
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-2">
																				Endpoint URL
																			</label>
																			<Input
																				value={locationListEndpointUrl}
																				onChange={(e) =>
																					setLocationListEndpointUrl(
																						e.target.value,
																					)
																				}
																				placeholder="https://example.com/locationlist.php"
																				helperText="URL that accepts POST XML with your request root (e.g. GLORIA_locationlistrq)"
																			/>
																		</div>
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-2">
																				Request root element name
																			</label>
																			<Input
																				value={locationListRequestRoot}
																				onChange={(e) =>
																					setLocationListRequestRoot(
																						e.target.value,
																					)
																				}
																				placeholder="GLORIA_locationlistrq"
																				helperText="Root element of the XML request body; response is expected to use the same name with 'rs' suffix (e.g. GLORIA_locationlistrs)"
																			/>
																		</div>
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-2">
																				Account ID (optional)
																			</label>
																			<Input
																				value={locationListAccountId}
																				onChange={(e) =>
																					setLocationListAccountId(
																						e.target.value,
																					)
																				}
																				placeholder="e.g. Gloria001"
																				helperText='Used in request as <AccountID ID="..."/>'
																			/>
																		</div>
																	</>
																)}
																{locationListTransport === "grpc" && (
																	<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
																		<p className="font-medium mb-1">
																			gRPC endpoint
																		</p>
																		<p className="text-xs text-blue-800">
																			Saved address:{" "}
																			<code className="bg-white px-1.5 py-0.5 rounded border border-blue-100">
																				{(
																					grpcEndpoint ||
																					endpointConfig?.grpcEndpoint ||
																					"(not set)"
																				).toString()}
																			</code>
																			. Set it in your main endpoint
																			configuration, test with{" "}
																			<strong>Test gRPC</strong>, then save
																			here.
																		</p>
																	</div>
																)}
																<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
																	<Button
																		variant="secondary"
																		onClick={() =>
																			setIsLocationListConfigOpen(false)
																		}
																		type="button"
																	>
																		Cancel
																	</Button>
																	<Button
																		variant="primary"
																		onClick={handleSaveLocationListConfig}
																		loading={isSavingLocationListConfig}
																		disabled={
																			locationListTransport === "http"
																				? !locationListEndpointUrl.trim()
																				: !(
																						grpcEndpoint ||
																						endpointConfig?.grpcEndpoint ||
																						""
																					)
																						.toString()
																						.trim()
																		}
																		type="button"
																	>
																		Save
																	</Button>
																</div>
															</>
														)}
														{locationListConfigTab === "sample" && (
															<>
																<div className="flex gap-2 border-b border-gray-200 pb-2">
																	<button
																		type="button"
																		onClick={() => {
																			setLocationListSampleFormat("xml");
																			setLocationListSampleValidation(null);
																		}}
																		className={`px-3 py-1.5 text-xs font-medium rounded-md ${
																			locationListSampleFormat === "xml"
																				? "bg-slate-800 text-white"
																				: "bg-gray-100 text-gray-600 hover:bg-gray-200"
																		}`}
																	>
																		HTTP / XML
																	</button>
																	<button
																		type="button"
																		onClick={() => {
																			setLocationListSampleFormat("grpc");
																			setLocationListSampleValidation(null);
																		}}
																		className={`px-3 py-1.5 text-xs font-medium rounded-md ${
																			locationListSampleFormat === "grpc"
																				? "bg-slate-800 text-white"
																				: "bg-gray-100 text-gray-600 hover:bg-gray-200"
																		}`}
																	>
																		gRPC (GetLocations)
																	</button>
																</div>

																{locationListSampleFormat === "xml" && (
																	<div>
																		<p className="text-sm font-medium text-gray-700 mb-2">
																			Sample request (POST body)
																		</p>
																		<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-40 font-mono whitespace-pre">{`<?xml version="1.0" encoding="UTF-8"?>
<${locationListRequestRoot || "GLORIA_locationlistrq"} TimeStamp="${new Date().toISOString().slice(0, 19)}" Target="Production" Version="1.00">
  <ACC>
    <Source>
      <AccountID ID="${locationListAccountId || "Gloria001"}"/>
    </Source>
  </ACC>
</${locationListRequestRoot || "GLORIA_locationlistrq"}>`}</pre>
																	</div>
																)}
																{locationListSampleFormat === "xml" && (
																	<div>
																		<p className="text-sm font-medium text-gray-700 mb-2">
																			Expected response structure
																		</p>
																		<p className="text-xs text-gray-500 mb-1">
																			The endpoint returns XML. Below is the
																			JSON schema showing the expected structure
																			and field types. Country code is taken
																			from the{" "}
																			<code className="bg-gray-200 px-1 rounded">
																				CountryCode
																			</code>{" "}
																			element inside each{" "}
																			<code className="bg-gray-200 px-1 rounded">
																				Country
																			</code>
																			.
																		</p>
																		<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-[28rem] font-mono whitespace-pre">{`{
  "${locationListRequestRoot ? locationListRequestRoot.replace(/rq$/i, "rs") : "GLORIA_locationlistrs"}": {
    "@attributes": {
      "TimeStamp": "string",
      "Target": "string",
      "Version": "string"
    },
    "Success": {},
    "RentalBrand": "string",
    "CountryList": [
      {
        "Country": "string",
        "CountryCode": "string (2-letter ISO)",
        "VehMatchedLocs": [
          {
            "VehMatchedLoc": [
              {
                "LocationDetail": {
                  "@attributes": {
                    "BranchType": "string",
                    "AtAirport": "true | false",
                    "LocationType": "string",
                    "Code": "string",
                    "Brand": "string",
                    "Name": "string",
                    "Latitude": "number",
                    "Longitude": "number"
                  },
                  "Address": {
                    "AddressLine": "string",
                    "CityName": "string",
                    "PostalCode": "string",
                    "CountryName": {
                      "@attributes": { "Code": "string" },
                      "value": "string"
                    }
                  },
                  "Telephone": {
                    "@attributes": { "PhoneNumber": "string" }
                  },
                  "Opening": {
                    "monday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "tuesday":   { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "wednesday": { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "thursday":  { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "friday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "saturday":  { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "sunday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } }
                  },
                  "PickupInstructions": {
                    "@attributes": { "Pickup": "string" }
                  },
                  "Cars": {
                    "Code": [
                      {
                        "@attributes": {
                          "Acrisscode": "string",
                          "Group": "string",
                          "Make": "string",
                          "Model": "string",
                          "Doors": "number",
                          "Seats": "number",
                          "DepositAmount": "number | empty"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}`}</pre>
																		<p className="text-xs text-gray-400 mt-2 italic">
																			The actual response is XML; this JSON
																			schema shows the structure and field
																			types.
																		</p>
																	</div>
																)}

																{locationListSampleFormat === "grpc" && (
																	<div className="space-y-4">
																		<p className="text-sm text-gray-700">
																			Over <strong>gRPC</strong> (HTTP/2 to your
																			configured{" "}
																			<code className="bg-gray-100 px-1 rounded text-xs">
																				host:port
																			</code>
																			), Gloria calls{" "}
																			<code className="bg-gray-100 px-1 rounded text-xs">
																				SourceProviderService.GetLocations
																			</code>{" "}
																			as defined in{" "}
																			<code className="bg-gray-100 px-1 rounded text-xs">
																				source_provider.proto
																			</code>
																			. There is{" "}
																			<strong>no XML POST body</strong> like the
																			HTTP path — the request is an empty
																			protobuf message.
																		</p>

																		<div>
																			<p className="text-sm font-medium text-gray-700 mb-2">
																				Proto service (reference)
																			</p>
																			<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono whitespace-pre">{`service SourceProviderService {
  rpc GetHealth       (Empty) returns (HealthResponse);
  rpc GetLocations    (Empty) returns (LocationsResponse);
  // … GetAvailability, CreateBooking, …
}

// Request — no fields (Gloria sends this empty)
message Empty {}

// One coverage row
message Location {
  string unlocode = 1;  // required, 4–5 chars UN/LOCODE
  string name     = 2;  // optional; used as place label on import
}

message LocationsResponse {
  repeated Location locations = 1;
}`}</pre>
																		</div>

																		<div>
																			<p className="text-sm font-medium text-gray-700 mb-2">
																				Sample request (conceptual)
																			</p>
																			<p className="text-xs text-gray-600 mb-2">
																				On the wire this is{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					Empty
																				</code>{" "}
																				with no payload. Unlike HTTP/XML, you do
																				not return a GLORIA XML envelope — only
																				the protobuf{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					LocationsResponse
																				</code>
																				.
																			</p>
																			<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono whitespace-pre">{`{}`}</pre>
																		</div>

																		<div>
																			<p className="text-sm font-medium text-gray-700 mb-2">
																				Expected response — JSON shape (for this
																				validator)
																			</p>
																			<p className="text-xs text-gray-500 mb-2">
																				Live gRPC responses are binary protobuf.
																				Paste{" "}
																				<strong>
																					JSON with the same logical shape
																				</strong>{" "}
																				here (e.g. from a test harness or JSON
																				transcoding). Each entry is imported as
																				coverage (UN/LOCODE + place). The proto{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					Location
																				</code>{" "}
																				message has only{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					unlocode
																				</code>{" "}
																				and{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					name
																				</code>{" "}
																				— there is no Opening, Cars, or Address
																				on this RPC. For the rich XML tree
																				(branches per{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					LocationDetail
																				</code>
																				, hours, cars, etc.), use the{" "}
																				<strong>HTTP / XML</strong> tab and a
																				GLORIA location list XML response.
																			</p>
																			<pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-[28rem] font-mono whitespace-pre">{`{
  "locations": [
    {
      "unlocode": "AEDXB",
      "name": "Dubai"
    },
    {
      "unlocode": "GBLON",
      "name": "London"
    }
  ]
}

// Logical schema (matches LocationsResponse → Location)
{
  "locations": [
    {
      "unlocode": "string (required, 4–5 characters, UN/LOCODE)",
      "name": "string (optional; used as place / label when upserting UNLocode)"
    }
  ]
}`}</pre>
																			<p className="text-xs text-gray-400 mt-2 italic">
																				Only{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					unlocode
																				</code>{" "}
																				and{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					name
																				</code>{" "}
																				exist on{" "}
																				<code className="bg-gray-200 px-1 rounded">
																					Location
																				</code>{" "}
																				in proto3 — no Opening/Cars/Address
																				here; use HTTP/XML location list if you
																				need that richness in one import.
																			</p>
																		</div>

																		<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
																			<strong>Tip:</strong> If{" "}
																			<strong>Validate sample</strong> passes
																			but live import fails, confirm TLS/ALPN,
																			that the same{" "}
																			<code className="bg-white px-1 rounded">
																				host:port
																			</code>{" "}
																			is saved under Endpoints, and that your
																			server implements{" "}
																			<code className="bg-white px-1 rounded">
																				GetLocations
																			</code>{" "}
																			on{" "}
																			<code className="bg-white px-1 rounded">
																				SourceProviderService
																			</code>{" "}
																			exactly as in the proto.
																		</div>
																	</div>
																)}

																<div className="border-t border-gray-200 pt-4">
																	<label className="block text-sm font-medium text-gray-700 mb-2">
																		Paste sample{" "}
																		{locationListSampleFormat === "grpc"
																			? "GetLocations JSON"
																			: "HTTP XML response"}
																	</label>
																	<p className="text-xs text-gray-500 mb-1">
																		{locationListSampleFormat === "grpc"
																			? "Paste JSON (same shape as LocationsResponse). Validate checks each locations[].unlocode (non-empty, 4–5 chars)."
																			: "Paste a fragment or full XML; we look for LocationDetail nodes or GLORIA list response roots."}
																	</p>
																	<textarea
																		value={locationListSamplePaste}
																		onChange={(e) => {
																			setLocationListSamplePaste(
																				e.target.value,
																			);
																			setLocationListSampleValidation(null);
																		}}
																		placeholder={
																			locationListSampleFormat === "grpc"
																				? '{ "locations": [ { "unlocode": "AEDXB", "name": "Dubai" } ] }'
																				: "Paste XML from GLORIA_locationlistrs..."
																		}
																		className="w-full h-36 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																		spellCheck={false}
																	/>
																	<div className="flex items-center gap-3 mt-2">
																		<Button
																			type="button"
																			variant="secondary"
																			onClick={validateLocationListSample}
																			disabled={!locationListSamplePaste.trim()}
																		>
																			Validate sample
																		</Button>
																		{locationListSampleValidation && (
																			<div
																				className={`flex-1 text-sm ${
																					locationListSampleValidation.ok
																						? "text-green-700"
																						: "text-red-700"
																				}`}
																			>
																				{locationListSampleValidation.ok ? (
																					<span>
																						<CheckCircle2 className="w-4 h-4 inline mr-1 align-middle" />
																						Detected{" "}
																						<strong>
																							{
																								locationListSampleValidation.format
																							}
																						</strong>
																						{locationListSampleValidation.count !=
																							null &&
																							` — ${locationListSampleValidation.count} location(s)`}
																						.
																					</span>
																				) : (
																					<span>
																						<XCircle className="w-4 h-4 inline mr-1 align-middle" />
																						{locationListSampleValidation.errors?.join(
																							" ",
																						) || "Validation failed."}
																					</span>
																				)}
																			</div>
																		)}
																	</div>
																	{locationListSampleValidation?.errors &&
																		locationListSampleValidation.errors.length >
																			0 && (
																			<ul className="mt-2 text-xs text-red-700 list-disc list-inside">
																				{locationListSampleValidation.errors.map(
																					(err, i) => (
																						<li key={i}>{err}</li>
																					),
																				)}
																			</ul>
																		)}
																</div>
																<div className="flex justify-end pt-2 border-t border-gray-200">
																	<Button
																		variant="secondary"
																		onClick={() =>
																			setIsLocationListConfigOpen(false)
																		}
																		type="button"
																	>
																		Close
																	</Button>
																</div>
															</>
														)}
													</div>
												</Modal>

												<Modal
													isOpen={
														showLocationListImportResult &&
														locationListImportResult !== null
													}
													onClose={() => {
														setShowLocationListImportResult(false);
														setLocationListImportResult(null);
													}}
													title="Location List Import Results"
													size="xl"
												>
													{locationListImportResult && (
														<div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
															<LocationImportResultDisplay
																result={locationListImportResult}
															/>
															{(locationListImportResult.branchesImported !=
																null ||
																locationListImportResult.branchesUpdated !=
																	null) && (
																<div className="mt-4 flex gap-2">
																	{(locationListImportResult.branchesImported ||
																		0) > 0 && (
																		<Badge variant="success">
																			{
																				locationListImportResult.branchesImported
																			}{" "}
																			branches created
																		</Badge>
																	)}
																	{(locationListImportResult.branchesUpdated ||
																		0) > 0 && (
																		<Badge variant="info">
																			{locationListImportResult.branchesUpdated}{" "}
																			branches updated
																		</Badge>
																	)}
																</div>
															)}
														</div>
													)}
												</Modal>
											</>
										)}

										{activeTab === "pricing" && (
											<>
												<div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
													<div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 px-6 py-8 text-white sm:px-8">
														<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
															<div className="max-w-3xl">
																<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
																	<Receipt className="h-3.5 w-3.5" />
																	Rates workspace
																</div>
																<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
																	Pricing &amp; Availability
																</h1>
																<p className="mt-3 text-sm leading-6 text-emerald-50 sm:text-base">
																	Validate live pricing responses or manually
																	store clean samples before agents quote your
																	vehicles. Use the same page for OTA XML,
																	Gloria JSON, Gloria gRPC, and manual
																	availability entry.
																</p>
															</div>
															<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-emerald-50 backdrop-blur">
																<p className="font-bold text-white">
																	Recommended flow
																</p>
																<ol className="mt-2 space-y-1 text-xs leading-5 text-emerald-100">
																	<li>1. Pick Endpoint or Manual.</li>
																	<li>
																		2. Fill request details and preview payload.
																	</li>
																	<li>
																		3. Fetch/store samples, then review results
																		below.
																	</li>
																</ol>
															</div>
														</div>
													</div>
													<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
														<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																Data source
															</p>
															<p className="mt-2 text-lg font-bold text-slate-950">
																{pricingEntryMode === "manual"
																	? "Manual entry"
																	: "Live endpoint"}
															</p>
															<p className="mt-1 text-xs text-slate-500">
																Switch in the setup card
															</p>
														</div>
														<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
																Format
															</p>
															<p className="mt-2 text-lg font-bold text-emerald-950">
																{pricingEntryMode === "manual"
																	? "GLORIA sample"
																	: availabilityAdapterType === "xml"
																		? "OTA / XML"
																		: availabilityAdapterType === "json"
																			? "Gloria JSON"
																			: "Gloria gRPC"}
															</p>
															<p className="mt-1 text-xs text-emerald-700">
																Normalized before storing
															</p>
														</div>
														<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
																Action
															</p>
															<p className="mt-2 text-lg font-bold text-blue-950">
																Fetch &amp; Store
															</p>
															<p className="mt-1 text-xs text-blue-700">
																Creates availability samples
															</p>
														</div>
														<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
															<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
																Plan note
															</p>
															<p className="mt-2 text-lg font-bold text-amber-950">
																Store actions
															</p>
															<p className="mt-1 text-xs text-amber-700">
																May require an active plan
															</p>
														</div>
													</div>
												</div>

												<div className="mt-6 space-y-6">
													{/* ── Format Selector + Endpoint + Request Parameters ── */}
													<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
														<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-emerald-50">
															<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
																<div>
																	<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
																		<Sparkles className="h-3.5 w-3.5" /> Step 1
																		· Choose source
																	</div>
																	<CardTitle className="text-2xl font-bold text-slate-950">
																		How will GLORIA receive prices?
																	</CardTitle>
																	<p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
																		Use a live endpoint when your system can
																		return rates on demand. Use manual entry for
																		demos, first setup, or clean one-off
																		samples.
																	</p>
																</div>
																<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
																	<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																		Selected
																	</p>
																	<p className="mt-1 font-bold text-slate-950">
																		{pricingEntryMode === "manual"
																			? "Manual sample"
																			: "Live endpoint"}
																	</p>
																</div>
															</div>
														</CardHeader>
														<CardContent className="space-y-5 p-5">
															<div
																className="grid gap-4 lg:grid-cols-2"
																role="group"
																aria-label="Pricing data source"
															>
																<button
																	type="button"
																	data-tour="pricing-entry-endpoint"
																	onClick={() =>
																		selectPricingEntryMode("endpoint")
																	}
																	className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${pricingEntryMode === "endpoint" ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200"}`}
																>
																	<div className="flex items-start gap-4">
																		<div className="rounded-xl bg-emerald-600 p-2 text-white shadow-sm">
																			<ExternalLink className="h-5 w-5" />
																		</div>
																		<div className="min-w-0 flex-1">
																			<div className="flex flex-wrap items-center gap-2">
																				<p className="font-bold text-slate-950">
																					Live endpoint
																				</p>
																				{pricingEntryMode === "endpoint" ? (
																					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
																						<CheckCircle2 className="h-3.5 w-3.5" />{" "}
																						Selected
																					</span>
																				) : (
																					<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
																						Click to use
																					</span>
																				)}
																			</div>
																			<p className="mt-2 text-sm leading-6 text-slate-600">
																				GLORIA sends a request to your pricing
																				API and stores the normalized vehicle
																				offers returned by your system.
																			</p>
																			<div className="mt-4 flex flex-wrap gap-2 text-xs">
																				<span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
																					OTA XML
																				</span>
																				<span className="rounded-full bg-white px-3 py-1 font-semibold text-blue-700 ring-1 ring-blue-100">
																					JSON
																				</span>
																				<span className="rounded-full bg-white px-3 py-1 font-semibold text-purple-700 ring-1 ring-purple-100">
																					gRPC
																				</span>
																			</div>
																		</div>
																	</div>
																</button>
																<button
																	type="button"
																	data-tour="pricing-entry-manual"
																	onClick={() => selectPricingEntryMode("manual")}
																	className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${pricingEntryMode === "manual" ? "border-slate-400 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
																>
																	<div className="flex items-start gap-4">
																		<div className="rounded-xl bg-slate-900 p-2 text-white shadow-sm">
																			<Plus className="h-5 w-5" />
																		</div>
																		<div className="min-w-0 flex-1">
																			<div className="flex flex-wrap items-center gap-2">
																				<p className="font-bold text-slate-950">
																					Manual sample
																				</p>
																				{pricingEntryMode === "manual" ? (
																					<span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
																						<CheckCircle2 className="h-3.5 w-3.5" />{" "}
																						Selected
																					</span>
																				) : (
																					<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
																						Click to use
																					</span>
																				)}
																			</div>
																			<p className="mt-2 text-sm leading-6 text-slate-600">
																				Enter vehicle, dates, included items,
																				extras, terms, and price manually. Best
																				for onboarding, demos, and quick
																				corrections.
																			</p>
																			<div className="mt-4 flex flex-wrap gap-2 text-xs">
																				<span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
																					No API call
																				</span>
																				<span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
																					Stores same samples
																				</span>
																			</div>
																		</div>
																	</div>
																</button>
															</div>

															{pricingEntryMode === "manual" ? (
																<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
																	<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
																		<div>
																			<p className="text-sm font-bold text-emerald-950">
																				Manual availability entry is selected
																			</p>
																			<p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-800">
																				Create a GLORIA-shaped sample with
																				vehicle, price, inclusions, optional
																				extras, and terms. It is stored in the
																				same samples list as live endpoint
																				fetches.
																			</p>
																			<p className="mt-2 text-xs text-emerald-800">
																				Tip: request fields in the next card can
																				prefill the manual sample.
																			</p>
																		</div>
																		<Button
																			type="button"
																			variant="primary"
																			onClick={openManualImportModal}
																			data-tour="pricing-manual-import"
																		>
																			Open manual import form
																		</Button>
																	</div>
																</div>
															) : (
																<>
																	<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
																		<p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
																			Choose response format
																		</p>
																		<div className="grid gap-3 md:grid-cols-3">
																			<button
																				type="button"
																				onClick={() =>
																					setAvailabilityAdapterType("xml")
																				}
																				data-tour="pricing-format-xml"
																				className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${availabilityAdapterType === "xml" ? "border-emerald-300 bg-white ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-200"}`}
																			>
																				<div className="flex items-center justify-between gap-2">
																					<p className="font-bold text-slate-950">
																						Gloria XML
																					</p>
																					{availabilityAdapterType ===
																						"xml" && (
																						<CheckCircle2 className="h-5 w-5 text-emerald-600" />
																					)}
																				</div>
																				<p className="mt-2 text-xs leading-5 text-slate-600">
																					POST GLORIA_availabilityrq XML and
																					receive OTA/GLORIA XML rates.
																				</p>
																			</button>
																			<button
																				type="button"
																				onClick={() =>
																					setAvailabilityAdapterType("json")
																				}
																				data-tour="pricing-format-json"
																				className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${availabilityAdapterType === "json" ? "border-blue-300 bg-white ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}
																			>
																				<div className="flex items-center justify-between gap-2">
																					<p className="font-bold text-slate-950">
																						Gloria JSON
																					</p>
																					{availabilityAdapterType ===
																						"json" && (
																						<CheckCircle2 className="h-5 w-5 text-blue-600" />
																					)}
																				</div>
																				<p className="mt-2 text-xs leading-5 text-slate-600">
																					POST Gloria field names and receive a
																					vehicles[] response.
																				</p>
																			</button>
																			<button
																				type="button"
																				onClick={() =>
																					setAvailabilityAdapterType("grpc")
																				}
																				data-tour="pricing-format-grpc"
																				className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${availabilityAdapterType === "grpc" ? "border-purple-300 bg-white ring-2 ring-purple-100" : "border-slate-200 bg-white hover:border-purple-200"}`}
																			>
																				<div className="flex items-center justify-between gap-2">
																					<p className="font-bold text-slate-950">
																						Gloria gRPC
																					</p>
																					{availabilityAdapterType ===
																						"grpc" && (
																						<CheckCircle2 className="h-5 w-5 text-purple-600" />
																					)}
																				</div>
																				<p className="mt-2 text-xs leading-5 text-slate-600">
																					Call
																					SourceProviderService.GetAvailability.
																				</p>
																			</button>
																		</div>
																	</div>

																	{/* Endpoint field — HTTP for xml/json, gRPC address for grpc */}
																	{availabilityAdapterType !== "grpc" ? (
																		<div>
																			<p className="text-xs text-gray-500 mb-2">
																				{availabilityAdapterType === "xml"
																					? "Gloria POSTs a GLORIA_availabilityrq XML body (Content-Type: text/xml) to match Postman / av.php. The response can be OTA_VehAvailRateRS XML or GLORIA_availabilityrs with VehAvairsdetails + availcars[]."
																					: "Gloria POSTs a JSON body with Gloria field names (Content-Type: application/json) and expects { vehicles: [...] } back."}
																			</p>
																			<div className="flex flex-col gap-3 lg:flex-row lg:items-end">
																				<div className="flex-1">
																					<label className="mb-1 block text-sm font-semibold text-slate-700">
																						Endpoint URL
																					</label>
																					<Input
																						value={availabilityEndpointUrl}
																						onChange={(e) =>
																							setAvailabilityEndpointUrl(
																								e.target.value,
																							)
																						}
																						placeholder={
																							PRICING_SAMPLE_AV_ENDPOINT
																						}
																					/>
																				</div>
																				<Button
																					variant="secondary"
																					onClick={
																						handleSaveAvailabilityEndpointUrl
																					}
																					loading={isSavingAvailabilityEndpoint}
																					disabled={
																						!availabilityEndpointUrl.trim()
																					}
																					data-tour="pricing-save-endpoint"
																				>
																					Save
																				</Button>
																			</div>
																			{endpointConfig?.availabilityEndpointUrl && (
																				<p className="text-xs text-gray-500 mt-1">
																					Saved:{" "}
																					<code className="bg-gray-100 px-1 rounded">
																						{
																							endpointConfig.availabilityEndpointUrl
																						}
																					</code>
																				</p>
																			)}
																		</div>
																	) : (
																		<div>
																			<p className="text-xs text-gray-500 mb-2">
																				Gloria connects to your gRPC source
																				backend via{" "}
																				<code className="bg-gray-100 px-1 rounded">
																					source_provider.proto
																				</code>{" "}
																				— calls{" "}
																				<code className="bg-gray-100 px-1 rounded">
																					GetAvailability
																				</code>
																				.
																			</p>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				gRPC Address{" "}
																				<span className="font-normal text-gray-400">
																					(host:port)
																				</span>
																			</label>
																			<Input
																				value={grpcEndpointAddress}
																				onChange={(e) =>
																					setGrpcEndpointAddress(e.target.value)
																				}
																				placeholder="localhost:50051"
																			/>
																			{(endpointConfig as any)
																				?.grpcEndpoint && (
																				<p className="text-xs text-gray-500 mt-1">
																					Saved:{" "}
																					<code className="bg-gray-100 px-1 rounded">
																						{
																							(endpointConfig as any)
																								.grpcEndpoint
																						}
																					</code>
																				</p>
																			)}
																		</div>
																	)}
																</>
															)}
														</CardContent>
													</Card>

													{/* ── Request Parameters ── */}
													<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
														<CardHeader className="border-b border-slate-200 bg-white">
															<div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
																<div>
																	<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
																		<FileText className="h-3.5 w-3.5" /> Step 2
																		· Request details
																	</div>
																	<CardTitle className="text-2xl font-bold text-slate-950">
																		{pricingEntryMode === "manual"
																			? "Manual availability entry"
																			: `${availabilityAdapterType === "xml" ? "GLORIA_availabilityrq" : availabilityAdapterType === "json" ? "Gloria JSON" : "Gloria gRPC"} request parameters`}
																	</CardTitle>
																	<p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
																		Fill the operational details GLORIA sends to
																		your supplier system. Use the preview to
																		confirm the exact payload before storing
																		samples.
																	</p>
																</div>
																<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
																	<strong className="block text-slate-900">
																		Result
																	</strong>
																	Stored samples power agent quoting and
																	testing.
																</div>
															</div>
														</CardHeader>
														<CardContent className="space-y-5 p-5">
															{pricingEntryMode === "manual" ? (
																<>
																	<p className="text-sm text-gray-600 leading-relaxed">
																		Use{" "}
																		<strong className="text-gray-800">
																			Format &amp; Endpoint → Open manual import
																			form
																		</strong>{" "}
																		for locations, dates, ACRISS, vehicle,
																		pricing, and extras. Results from{" "}
																		<strong>Store sample</strong> show below,
																		same list as endpoint fetches.
																	</p>
																	<div className="flex flex-wrap items-center gap-3 pt-1">
																		<label className="flex items-center gap-1.5 cursor-pointer select-none">
																			<input
																				type="checkbox"
																				checked={forceRefreshAvailability}
																				onChange={(e) =>
																					setForceRefreshAvailability(
																						e.target.checked,
																					)
																				}
																				className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500"
																			/>
																			<span className="text-xs text-gray-600">
																				Force re-store (manual)
																			</span>
																		</label>
																	</div>
																</>
															) : (
																<>
																	<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">
																		{availabilityAdapterType === "xml" && (
																			<>
																				Gloria sends a{" "}
																				<strong>
																					GLORIA_availabilityrq XML POST
																				</strong>{" "}
																				(
																				<code className="bg-blue-100 px-1 rounded text-[11px]">
																					ACC / AccountID
																				</code>
																				,{" "}
																				<code className="bg-blue-100 px-1 rounded text-[11px]">
																					VehAvailbody
																				</code>
																				) to your endpoint. Fill in the fields
																				below and click{" "}
																				<strong>Fetch &amp; Store</strong>.
																			</>
																		)}
																		{availabilityAdapterType === "json" && (
																			<>
																				Gloria sends a{" "}
																				<strong>JSON POST</strong> with Gloria
																				field names (
																				<code>pickup_unlocode</code>,{" "}
																				<code>agreement_ref</code>, etc.) and
																				expects{" "}
																				<code className="bg-blue-100 px-1 rounded">{`{ "vehicles": [ ... ] }`}</code>{" "}
																				back.
																			</>
																		)}
																		{availabilityAdapterType === "grpc" && (
																			<>
																				Gloria calls{" "}
																				<strong>GetAvailability</strong> on your
																				source backend using{" "}
																				<code>source_provider.proto</code>{" "}
																				(AvailabilityRequest →
																				AvailabilityResponse).
																			</>
																		)}
																	</div>

																	<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
																		{/* RequestorID */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				Account ID{" "}
																				<span className="text-gray-400 font-normal">
																					(GLORIA ACC / AccountID)
																				</span>
																			</label>
																			<Input
																				value={otaRequestorId}
																				onChange={(e) =>
																					setOtaRequestorId(e.target.value)
																				}
																				placeholder="Gloria002"
																				helperText="Mapped to &lt;ACC&gt;&lt;Source&gt;&lt;AccountID ID=&quot;…&quot;/&gt;. JSON/gRPC still use agreement_ref / requestor semantics."
																			/>
																		</div>

																		{/* Citizen country */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				Driver residency{" "}
																				<span className="text-gray-400 font-normal">
																					(ISO 2-letter → DriverCitizenCountry
																					in GLORIA XML)
																				</span>
																			</label>
																			<Input
																				value={otaCitizenCountry}
																				onChange={(e) =>
																					setOtaCitizenCountry(
																						e.target.value.toUpperCase(),
																					)
																				}
																				placeholder="US"
																				maxLength={2}
																				helperText="e.g. US, GB, AE, IE"
																			/>
																		</div>

																		{/* PickUpLocation */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				PickUpLocation LocationCode
																			</label>
																			<Input
																				value={otaPickupLoc}
																				onChange={(e) =>
																					setOtaPickupLoc(
																						e.target.value.toUpperCase(),
																					)
																				}
																				placeholder="TIAA01"
																				helperText="Branch location code (from your branches)"
																			/>
																		</div>

																		{/* ReturnLocation */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				ReturnLocation LocationCode
																			</label>
																			<Input
																				value={otaReturnLoc}
																				onChange={(e) =>
																					setOtaReturnLoc(
																						e.target.value.toUpperCase(),
																					)
																				}
																				placeholder="TIAA01"
																				helperText="Same as pick-up for one-way or same-location rental"
																			/>
																		</div>

																		{/* PickUpDateTime */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				PickUpDateTime
																			</label>
																			<input
																				type="datetime-local"
																				value={otaPickupDateTime}
																				onChange={(e) =>
																					setOtaPickupDateTime(e.target.value)
																				}
																				className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																			/>
																		</div>

																		{/* ReturnDateTime */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				ReturnDateTime
																			</label>
																			<input
																				type="datetime-local"
																				value={otaReturnDateTime}
																				onChange={(e) =>
																					setOtaReturnDateTime(e.target.value)
																				}
																				className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																			/>
																		</div>

																		{/* Driver Age */}
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-1">
																				Driver Age
																			</label>
																			<input
																				type="number"
																				min={18}
																				max={99}
																				value={otaDriverAge}
																				onChange={(e) =>
																					setOtaDriverAge(
																						Number(e.target.value),
																					)
																				}
																				className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																			/>
																		</div>
																	</div>

																	{/* Request preview — only when using a live endpoint */}
																	<details className="border border-gray-200 rounded-lg">
																		<summary className="px-4 py-2 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-50">
																			{availabilityAdapterType === "xml" &&
																				"Preview GLORIA_availabilityrq XML that will be sent"}
																			{availabilityAdapterType === "json" &&
																				"Preview Gloria JSON request body that will be sent"}
																			{availabilityAdapterType === "grpc" &&
																				"Preview Gloria gRPC AvailabilityRequest that will be sent"}
																		</summary>
																		{availabilityAdapterType === "xml" && (
																			<pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-96 border-t border-gray-200 whitespace-pre">{`<?xml version="1.0" encoding="UTF-8"?>
<GLORIA_availabilityrq TimeStamp="${new Date().toISOString().slice(0, 19)}" Target="Production" Version="1.00">
  <ACC>
    <Source>
      <AccountID ID="${(otaRequestorId || "").trim() || "Gloria002"}"/>
    </Source>
  </ACC>
  <VehAvailbody>
    <Vehmain PickUpDateTime="${otaPickupDateTime ? `${otaPickupDateTime}:00` : "2026-05-23T09:00:00"}"
             ReturnDateTime="${otaReturnDateTime ? `${otaReturnDateTime}:00` : "2026-05-27T11:00:00"}">
      <collectionbranch LocationCode="${otaPickupLoc || "TIAA02"}"/>
      <returnbranch LocationCode="${otaReturnLoc || "TIAA02"}"/>
    </Vehmain>
    <DriverAge Age="${otaDriverAge || 30}"/>
    <DriverCitizenCountry Code="${otaCitizenCountry || "FR"}"/>
  </VehAvailbody>
</GLORIA_availabilityrq>`}</pre>
																		)}
																		{availabilityAdapterType === "json" && (
																			<pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-56 border-t border-gray-200">
																				{JSON.stringify(
																					{
																						agreement_ref:
																							otaRequestorId || "1000097",
																						pickup_unlocode:
																							otaPickupLoc || "TIAA01",
																						dropoff_unlocode:
																							otaReturnLoc || "TIAA01",
																						pickup_iso: otaPickupDateTime
																							? otaPickupDateTime + ":00"
																							: "2026-03-18T14:00:00",
																						dropoff_iso: otaReturnDateTime
																							? otaReturnDateTime + ":00"
																							: "2026-03-22T14:00:00",
																						driver_age: otaDriverAge || 30,
																						residency_country:
																							otaCitizenCountry || "US",
																					},
																					null,
																					2,
																				)}
																			</pre>
																		)}
																		{availabilityAdapterType === "grpc" && (
																			<pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-56 border-t border-gray-200">{`// source_provider.proto — AvailabilityRequest
message AvailabilityRequest {
  agreement_ref      = "${otaRequestorId || "1000097"}"
  pickup_unlocode    = "${otaPickupLoc || "TIAA01"}"
  dropoff_unlocode   = "${otaReturnLoc || "TIAA01"}"
  pickup_iso         = "${otaPickupDateTime ? otaPickupDateTime + ":00" : "2026-03-18T14:00:00"}"
  dropoff_iso        = "${otaReturnDateTime ? otaReturnDateTime + ":00" : "2026-03-22T14:00:00"}"
  driver_age         = ${otaDriverAge || 30}
  residency_country  = "${otaCitizenCountry || "US"}"
}
// Endpoint: ${grpcEndpointAddress || "host:port"} → GetAvailability`}</pre>
																		)}
																	</details>

																	<div className="flex flex-wrap items-center gap-3 pt-2">
																		<Button
																			variant="primary"
																			onClick={handleFetchAvailability}
																			loading={isFetchingAvailability}
																			data-tour="pricing-fetch-store"
																			disabled={
																				isFetchingAvailability ||
																				(subscriptionActive &&
																					(availabilityAdapterType === "grpc"
																						? !grpcEndpointAddress.trim() &&
																							!(endpointConfig as any)
																								?.grpcEndpoint
																						: !availabilityEndpointUrl.trim() &&
																							!endpointConfig?.availabilityEndpointUrl &&
																							!endpointConfig?.httpEndpoint))
																			}
																		>
																			Fetch &amp; Store
																		</Button>
																		<label className="flex items-center gap-1.5 cursor-pointer select-none">
																			<input
																				type="checkbox"
																				checked={forceRefreshAvailability}
																				onChange={(e) =>
																					setForceRefreshAvailability(
																						e.target.checked,
																					)
																				}
																				className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																			/>
																			<span className="text-xs text-gray-600">
																				Force re-store
																			</span>
																		</label>
																		<p className="text-xs text-gray-500 self-center max-w-xl">
																			{availabilityAdapterType === "xml" &&
																				"GLORIA_availabilityrq POST → OTA_RS or GLORIA_availabilityrs → normalized & stored. Large supplier responses can take 1–2 minutes; wait for the request to finish."}
																			{availabilityAdapterType === "json" &&
																				"JSON POST → Gloria vehicles[] → stored in Gloria"}
																			{availabilityAdapterType === "grpc" &&
																				"gRPC GetAvailability → VehicleOffer[] → stored in Gloria"}
																		</p>
																	</div>
																</>
															)}

															{fetchAvailabilityResult && (
																<AvailabilityFetchResultDisplay
																	result={fetchAvailabilityResult}
																/>
															)}
														</CardContent>
													</Card>

													<ManualAvailabilityImportModal
													isOpen={showManualImportModal}
													onClose={() => setShowManualImportModal(false)}
													onSubmit={handleManualImportSubmit}
													isSubmitting={isSubmittingManualImport}
													selectedFleetId={manualFleetId}
													selectedFleet={manualSelectedFleet}
													onFleetChange={(id, fleet) => {
														setManualFleetId(id);
														setManualSelectedFleet(fleet);
													}}
													forceRefresh={forceRefreshAvailability}
													onForceRefreshChange={setForceRefreshAvailability}
													pickupLoc={manualModalPickupLoc}
													onPickupLoc={setManualModalPickupLoc}
													returnLoc={manualModalReturnLoc}
													onReturnLoc={setManualModalReturnLoc}
													pickupDt={manualModalPickupDt}
													onPickupDt={setManualModalPickupDt}
													returnDt={manualModalReturnDt}
													onReturnDt={setManualModalReturnDt}
													acriss={manualAcriss}
													onAcriss={setManualAcriss}
													customAcrissCodes={customAcrissCodes}
													newAcrissDraft={newAcrissDraft}
													onNewAcrissDraft={setNewAcrissDraft}
													onAddCustomAcriss={handleAddCustomAcriss}
													make={manualMake}
													onMake={setManualMake}
													onMakeCommit={() => setManualModel("")}
													model={manualModel}
													onModel={setManualModel}
													makeOptions={manualMakeOptions}
													modelOptions={manualModelOptions}
													makeTrimmed={makeTrimmed}
													nhtsaMakesLoading={nhtsaMakesQuery.isLoading}
													nhtsaModelsLoading={
														!!makeTrimmed && nhtsaModelsQuery.isLoading
													}
													rentalDuration={manualRentalDuration}
													onRentalDuration={(v) => {
														setManualRentalDuration(v);
														setManualPricingDuration(v);
													}}
													carOrderId={manualCarOrderId || manualPricingCarOrderId}
													onCarOrderId={(v) => {
														setManualCarOrderId(v);
														setManualPricingCarOrderId(v);
													}}
													currency={manualPricingCurrency || manualCurrency}
													onCurrency={(v) => {
														const c = v.toUpperCase();
														setManualPricingCurrency(c);
														setManualCurrency(c);
													}}
													totalGross={manualPricingTotalGross || manualTotalPrice}
													onTotalGross={(v) => {
														setManualPricingTotalGross(v);
														setManualTotalPrice(v);
													}}
													metaTimestamp={gloriaMetaTimestamp}
													onMetaTimestamp={setGloriaMetaTimestamp}
													metaTarget={gloriaMetaTarget}
													onMetaTarget={setGloriaMetaTarget}
													metaVersion={gloriaMetaVersion}
													onMetaVersion={setGloriaMetaVersion}
													pricingDuration={manualPricingDuration}
													onPricingDuration={setManualPricingDuration}
													pricingDailyNet={manualPricingDailyNet}
													onPricingDailyNet={setManualPricingDailyNet}
													pricingDailyTax={manualPricingDailyTax}
													onPricingDailyTax={setManualPricingDailyTax}
													pricingDailyGross={manualPricingDailyGross}
													onPricingDailyGross={setManualPricingDailyGross}
													pricingTotalNet={manualPricingTotalNet}
													onPricingTotalNet={setManualPricingTotalNet}
													pricingTotalTax={manualPricingTotalTax}
													onPricingTotalTax={setManualPricingTotalTax}
													pricingTaxRate={manualPricingTaxRate}
													onPricingTaxRate={setManualPricingTaxRate}
													includedRows={includedRows}
													setIncludedRows={setIncludedRows}
													notIncludedRows={notIncludedRows}
													setNotIncludedRows={setNotIncludedRows}
													extraRows={extraRows}
													setExtraRows={setExtraRows}
													newRowId={newManualImportRowId}
													termRows={manualTermRows}
													setTermRows={setManualTermRows}
													transmission={manualTransmission}
													onTransmission={setManualTransmission}
													doors={manualDoors}
													onDoors={setManualDoors}
													seats={manualSeats}
													onSeats={setManualSeats}
													bagsS={manualBagsS}
													onBagsS={setManualBagsS}
													bagsM={manualBagsM}
													onBagsM={setManualBagsM}
													minLead={manualMinLead}
													onMinLead={setManualMinLead}
													maxLead={manualMaxLead}
													onMaxLead={setManualMaxLead}
													mileage={manualMileage}
													onMileage={setManualMileage}
													imageUrl={manualImageUrl}
													onImageUrl={setManualImageUrl}
													imageInputRef={manualVehicleImageInputRef}
													onImageSelected={handleManualVehicleImageSelected}
													isUploadingImage={isUploadingManualVehicleImage}
													displayImageUrl={displayVehicleImageUrl}
												/>





													{/* ── Stored Availability Samples ── */}
													<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
														<CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/90 px-6 py-6">
															<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
																<div className="flex min-w-0 gap-4">
																	<div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md sm:flex">
																		<Layers
																			className="h-6 w-6"
																			aria-hidden
																		/>
																	</div>
																	<div className="min-w-0 flex-1">
																		<div className="mb-2 flex flex-wrap items-center gap-2">
																			<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
																				<Sparkles
																					className="h-3.5 w-3.5"
																					aria-hidden
																				/>
																				Saved searches
																			</span>
																			{storedSamples.length > 0 ? (
																				<Badge
																					variant="info"
																					className="font-semibold"
																				>
																					{storedSamples.length} sample
																					{storedSamples.length !== 1
																						? "s"
																						: ""}
																				</Badge>
																			) : null}
																		</div>
																		<CardTitle className="text-2xl font-bold tracking-tight text-slate-950">
																			Stored availability samples
																		</CardTitle>
																		<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
																			Each sample is one availability test —
																			pickup and return branches, travel dates,
																			and the vehicle offers Gloria stored from
																			your live endpoint or a manual entry.
																		</p>
																		<div className="mt-4 grid gap-2 sm:grid-cols-3">
																			<div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm">
																				<p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
																					<RefreshCw
																						className="h-3.5 w-3.5 text-blue-600"
																						aria-hidden
																					/>
																					How they appear
																				</p>
																				<p className="mt-1 text-xs leading-5 text-slate-600">
																					After{" "}
																					<strong>Fetch &amp; Store</strong> or{" "}
																					<strong>manual import</strong> above.
																				</p>
																			</div>
																			<div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm">
																				<p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
																					<ChevronDown
																						className="h-3.5 w-3.5 text-violet-600"
																						aria-hidden
																					/>
																					Expand a sample
																				</p>
																				<p className="mt-1 text-xs leading-5 text-slate-600">
																					See vehicles, prices, terms, cover,
																					and extras — summaries only, not full
																					policy text.
																				</p>
																			</div>
																			<div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm">
																				<p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
																					<MapPin
																						className="h-3.5 w-3.5 text-emerald-600"
																						aria-hidden
																					/>
																					Daily prices
																				</p>
																				<p className="mt-1 text-xs leading-5 text-slate-600">
																					Use{" "}
																					<strong>
																						Manage daily prices
																					</strong>{" "}
																					on a vehicle card below.
																				</p>
																			</div>
																		</div>
																	</div>
																</div>
																<Button
																	variant="secondary"
																	onClick={loadStoredSamples}
																	loading={isLoadingStoredSamples}
																	className="shrink-0 self-start rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
																>
																	<RefreshCw className="mr-2 h-4 w-4" />
																	Refresh list
																</Button>
															</div>
														</CardHeader>
														<CardContent className="max-w-full overflow-x-hidden bg-slate-50/40 p-5">
															{isLoadingStoredSamples &&
															storedSamples.length === 0 ? (
																<div className="flex items-center gap-2 text-sm text-gray-500 py-4">
																	<svg
																		className="animate-spin w-4 h-4 text-blue-500"
																		fill="none"
																		viewBox="0 0 24 24"
																	>
																		<circle
																			className="opacity-25"
																			cx="12"
																			cy="12"
																			r="10"
																			stroke="currentColor"
																			strokeWidth="4"
																		/>
																		<path
																			className="opacity-75"
																			fill="currentColor"
																			d="M4 12a8 8 0 018-8v8z"
																		/>
																	</svg>
																	Loading stored samples…
																</div>
															) : storedSamples.length === 0 ? (
																<p className="text-sm text-gray-400 italic py-4">
																	No stored samples yet. Use{" "}
																	<strong>Fetch &amp; Store</strong> to pull
																	from your endpoint, or{" "}
																	<strong>Manual import</strong> to enter one
																	vehicle without an API.
																</p>
															) : (
																<div className="space-y-4">
																	{storedSamples.map((sample) => (
																		<StoredSampleCard
																			key={sample.id}
																			sample={sample}
																			buildDailyPricingHref={(offerIdx) =>
																				buildDailyPricingLink(
																					sample.id,
																					offerIdx,
																				)
																			}
																		/>
																	))}
																</div>
															)}
														</CardContent>
													</Card>

													<div
														id="pricing-daily-prices"
														data-tour="pricing-daily-prices"
														className="scroll-mt-24"
													>
														<DailyPricingCalendar
															deeplinkSampleId={dailyPricingDeeplinkSampleId}
															deeplinkOfferIndex={dailyPricingDeeplinkOfferIndex}
															requireActivePlan={requireActivePlan}
														/>
													</div>

													<GloriaXmlResponseBuilderModal
														isOpen={showGloriaXmlResponseModal}
														onClose={() => setShowGloriaXmlResponseModal(false)}
													/>

													{/* ── OTA Format Reference ── */}
													{/* ── Format reference — switches with the format selector above ── */}
													<Card className="border border-gray-200 shadow-sm">
														<CardHeader>
															<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
																<CardTitle className="text-lg">
																	{availabilityAdapterType === "xml" &&
																		"Gloria XML — request & responses"}
																	{availabilityAdapterType === "json" &&
																		"Gloria JSON format reference"}
																	{availabilityAdapterType === "grpc" &&
																		"Gloria gRPC format reference"}
																</CardTitle>
																{availabilityAdapterType === "xml" && (
																	<Button
																		type="button"
																		variant="secondary"
																		size="sm"
																		className="shrink-0 gap-1.5"
																		onClick={() =>
																			setShowGloriaXmlResponseModal(true)
																		}
																	>
																		<FileCode2 className="h-4 w-4" />
																		Build expected XML response
																	</Button>
																)}
															</div>
														</CardHeader>
														<CardContent className="space-y-4">
															{/* ── OTA XML reference ── */}
															{availabilityAdapterType === "xml" && (
																<div className="space-y-5">
																	<div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg">
																		<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
																			<div>
																				<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
																					<FileText className="h-3.5 w-3.5" />{" "}
																					XML availability contract
																				</div>
																				<h3 className="text-2xl font-bold">
																					Gloria XML — request &amp; response
																					guide
																				</h3>
																				<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
																					Configure your availability URL, then
																					Gloria posts{" "}
																					<strong>GLORIA_availabilityrq</strong>{" "}
																					as{" "}
																					<code className="rounded bg-white/10 px-1">
																						text/xml
																					</code>
																					. Your endpoint can reply with either
																					OTA XML or GLORIA_availabilityrs; both
																					are normalized into stored pricing
																					samples.
																				</p>
																			</div>
																			<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm">
																				<p className="font-semibold text-cyan-100">
																					Endpoint example
																				</p>
																				<code className="mt-2 block max-w-sm truncate rounded bg-slate-950/40 px-3 py-2 text-xs text-slate-100">
																					{PRICING_SAMPLE_AV_ENDPOINT}
																				</code>
																			</div>
																		</div>
																	</div>

																	<div className="grid gap-3 md:grid-cols-4">
																		{[
																			[
																				"Account",
																				"AccountID",
																				"Comes from the Account ID field.",
																			],
																			[
																				"Branches",
																				"collectionbranch / returnbranch",
																				"Use your branch codes.",
																			],
																			[
																				"Dates",
																				"Vehmain",
																				"Pickup and return ISO datetimes.",
																			],
																			[
																				"Driver",
																				"DriverAge / DriverCitizenCountry",
																				"Age and residency filters.",
																			],
																		].map(([title, code, help]) => (
																			<div
																				key={title}
																				className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
																			>
																				<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
																					{title}
																				</p>
																				<code className="mt-2 block rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-800">
																					{code}
																				</code>
																				<p className="mt-2 text-xs leading-5 text-slate-600">
																					{help}
																				</p>
																			</div>
																		))}
																	</div>

																	<div className="grid gap-5 xl:grid-cols-2">
																		<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
																			<div className="border-b border-slate-200 p-4">
																				<span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">
																					1. Request Gloria sends
																				</span>
																				<h4 className="mt-3 font-bold text-slate-950">
																					GLORIA_availabilityrq
																				</h4>
																			</div>
																			<pre className="max-h-80 overflow-x-auto rounded-b-2xl bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">{`<GLORIA_availabilityrq TimeStamp="2025-04-28T10:30:45" Target="Production" Version="1.00">
  <ACC><Source><AccountID ID="Gloria002"/></Source></ACC>
  <VehAvailbody>
    <Vehmain PickUpDateTime="2026-05-23T09:00:00" ReturnDateTime="2026-05-27T11:00:00">
      <collectionbranch LocationCode="TIAA02"/>
      <returnbranch LocationCode="TIAA02"/>
    </Vehmain>
    <DriverAge Age="30"/>
    <DriverCitizenCountry Code="FR"/>
  </VehAvailbody>
</GLORIA_availabilityrq>`}</pre>
																		</div>

																		<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
																			<div className="border-b border-slate-200 p-4">
																				<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
																					2A. Accepted response
																				</span>
																				<h4 className="mt-3 font-bold text-slate-950">
																					OTA_VehAvailRateRS
																				</h4>
																			</div>
																			<pre className="max-h-80 overflow-x-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">{`<OTA_VehAvailRateRS>
  <Success />
  <VehAvailRSCore>...</VehAvailRSCore>
  <VehVendorAvails>
    <VehAvailCore Status="Available" VehID="CDAR65505909190226">
      <Vehicle AirConditionInd="Yes" TransmissionType="Automatic">
        <VehMakeModel Name="TOYOTA COROLLA" PictureURL="https://...png" />
        <VehType VehicleCategory="CDAR" DoorCount="5" Baggage="2" />
        <VehTerms>
          <Included code="CDW" price="0.00" excess="900.00" deposit="900.00" />
          <NotIncluded code="PCDW" price="60.00" excess="0.00" deposit="500.00" />
        </VehTerms>
      </Vehicle>
      <TotalCharge RateTotalAmount="132.00" CurrencyCode="EUR" />
      <PricedEquips><PricedEquip><Equipment Description="GPS" vendorEquipID="GPS" /></PricedEquip></PricedEquips>
    </VehAvailCore>
  </VehVendorAvails>
</OTA_VehAvailRateRS>`}</pre>
																			<div className="rounded-b-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900">
																				<strong>Gloria extracts:</strong> VehID,
																				car name/image, ACRISS, transmission,
																				seats/doors/bags, total price/currency,
																				included/not-included terms, and priced
																				equipment.
																			</div>
																		</div>
																	</div>

																	<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
																		<div className="border-b border-slate-200 p-4">
																			<span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
																				2B. Also accepted
																			</span>
																			<h4 className="mt-3 font-bold text-slate-950">
																				GLORIA_availabilityrs
																			</h4>
																		</div>
																		<pre className="max-h-80 overflow-x-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">{`<GLORIA_availabilityrs>
  <Success />
  <VehAvairsdetails>
    <availcars ACRISS="CCAR">
      <vehdetails Make="SKODA" Model="FABIA" Transmission="Automatic" Doors="4" Seats="5" ImageURL="http://..." />
      <pricing CarOrderID="CCAR12345629-04-26" Currency="EUR" DailyGross="30.00" TotalGross="150.00" />
      <includedinprice><Item Code="CDW" ItemDescription="Collision damage waiver" Excess="1200.00" Deposit="1200.00" /></includedinprice>
      <notincludedinprice><Item Code="FP" ItemDescription="Fuel policy upgrade" Price="35.00" /></notincludedinprice>
      <OptionalExtras><Item Code="GPS" ItemDescription="GPS" Price="25.00" /></OptionalExtras>
    </availcars>
  </VehAvairsdetails>
</GLORIA_availabilityrs>`}</pre>
																		<div className="rounded-b-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-900">
																			<strong>Mapping:</strong> availcars may be
																			object or array. pricing.CarOrderID
																			becomes the booking reference;
																			TotalGross/Currency become price;
																			includedinprice, notincludedinprice, and
																			OptionalExtras keep every Item line.
																		</div>
																	</div>

																	<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
																		<div className="flex gap-3">
																			<AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
																			<p>
																				<strong>Supplier tip:</strong> Document
																				every code your API may return for
																				included items, not-included items,
																				optional extras, insurance, fuel,
																				deposits, and policies. Gloria preserves
																				unknown codes as raw code + description
																				so new supplier codes do not break
																				ingestion.
																			</p>
																		</div>
																	</div>
																</div>
															)}

															{/* ── Gloria JSON reference ── */}
															{availabilityAdapterType === "json" && (
																<>
																	<p className="text-sm text-gray-700">
																		Your endpoint must accept a{" "}
																		<strong>JSON POST</strong> (
																		<code className="bg-gray-100 px-1 rounded">
																			Content-Type: application/json
																		</code>
																		) and return{" "}
																		<code className="bg-gray-100 px-1 rounded">{`{ "vehicles": [ ... ] }`}</code>
																		. Field names use Gloria's naming convention
																		(matching{" "}
																		<code className="bg-gray-100 px-1 rounded">
																			source_provider.proto
																		</code>
																		).
																	</p>
																	<div>
																		<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
																			Request body Gloria sends (JSON POST)
																		</p>
																		<pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48">{`{
  "agreement_ref":     "1000097",            // broker account number
  "pickup_unlocode":   "TIAA01",             // pick-up location code
  "dropoff_unlocode":  "TIAA01",             // return location code
  "pickup_iso":        "2026-03-18T14:00:00",
  "dropoff_iso":       "2026-03-22T14:00:00",
  "driver_age":        35,
  "residency_country": "US"                  // ISO 2-letter country code
}`}</pre>
																	</div>
																	<div>
																		<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
																			Expected response your endpoint returns
																		</p>
																		<pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-72">{`{
  "vehicles": [
    {
      "supplier_offer_ref":  "CDAR65505909190226",  // unique offer ID (required for booking)
      "vehicle_class":       "CDAR",                // ACRISS code
      "make_model":          "TOYOTA COROLLA",       // car name
      "currency":            "EUR",
      "total_price":         132.00,
      "availability_status": "AVAILABLE",            // AVAILABLE | ON_REQUEST | SOLD_OUT
      "picture_url":         "https://...corolla.png",
      "door_count":          "5",
      "baggage":             "2",
      "vehicle_category":    "CDAR",
      "veh_id":              "CDAR65505909190226",
      // Optional: rich terms + pricing as a JSON string
      "ota_vehicle_json": "{
        \\"veh_terms_included\\": [
          { \\"code\\": \\"CDW\\", \\"header\\": \\"Standard Insurance (CDW)\\",
            \\"price\\": \\"0.00\\", \\"excess\\": \\"900.00\\", \\"deposit\\": \\"900.00\\" }
        ],
        \\"veh_terms_not_included\\": [
          { \\"code\\": \\"PCDW\\", \\"header\\": \\"Premium Insurance (PCDW)\\",
            \\"price\\": \\"60.00\\", \\"excess\\": \\"0.00\\" }
        ],
        \\"vehicle_charges\\": [
          { \\"Amount\\": \\"110.00\\", \\"CurrencyCode\\": \\"EUR\\",
            \\"UnitCharge\\": \\"33.00\\", \\"Quantity\\": \\"4\\" }
        ],
        \\"total_charge\\": { \\"RateTotalAmount\\": \\"132.00\\", \\"CurrencyCode\\": \\"EUR\\" },
        \\"priced_equips\\": [
          { \\"description\\": \\"GPS\\", \\"equip_type\\": \\"GPS\\",
            \\"charge\\": { \\"Amount\\": 32.00 } }
        ]
      }"
    }
  ]
}`}</pre>
																	</div>
																	<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
																		<p className="font-semibold">
																			What Gloria extracts from each vehicle
																			object:
																		</p>
																		<ul className="list-disc list-inside space-y-0.5 mt-1">
																			<li>
																				<code>supplier_offer_ref</code> — unique
																				offer ID (required for booking)
																			</li>
																			<li>
																				<code>vehicle_class</code>,{" "}
																				<code>make_model</code> — ACRISS code
																				and car name
																			</li>
																			<li>
																				<code>total_price</code> +{" "}
																				<code>currency</code> — price and
																				currency
																			</li>
																			<li>
																				<code>availability_status</code> —
																				AVAILABLE / ON_REQUEST / SOLD_OUT
																			</li>
																			<li>
																				<code>picture_url</code>,{" "}
																				<code>door_count</code>,{" "}
																				<code>baggage</code>,{" "}
																				<code>vehicle_category</code>,{" "}
																				<code>veh_id</code>
																			</li>
																			<li>
																				<code>ota_vehicle_json</code> — optional
																				JSON string for terms, charges, extras
																				(same rich data as OTA XML)
																			</li>
																		</ul>
																	</div>
																	<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
																		<p className="font-semibold">
																			Terms/codes guidance (JSON mode):
																		</p>
																		<ul className="list-disc list-inside space-y-0.5 mt-1">
																			<li>
																				Include as many code rows as available
																				in your source for included,
																				not-included, extras, and policies.
																			</li>
																			<li>
																				Some suppliers return partial sets;
																				Gloria stores whatever is present
																				without requiring every possible code.
																			</li>
																			<li>
																				If new codes appear later, they should
																				still be passed through (code +
																				description + amounts) so brokers can
																				display them.
																			</li>
																		</ul>
																	</div>
																</>
															)}

															{/* ── Gloria gRPC reference ── */}
															{availabilityAdapterType === "grpc" && (
																<>
																	<p className="text-sm text-gray-700">
																		Your source backend must implement{" "}
																		<strong>SourceProviderService</strong> from{" "}
																		<code className="bg-gray-100 px-1 rounded">
																			source_provider.proto
																		</code>
																		. Gloria connects directly via gRPC and
																		calls{" "}
																		<code className="bg-gray-100 px-1 rounded">
																			GetAvailability
																		</code>{" "}
																		— no HTTP needed.
																	</p>
																	<div>
																		<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
																			Proto definition (source_provider.proto)
																		</p>
																		<pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-72">{`syntax = "proto3";
package source_provider;

// ── Request ──────────────────────────────────────────────────────────
message AvailabilityRequest {
  string agreement_ref     = 1;   // broker account number
  string pickup_unlocode   = 2;   // pick-up location code  (e.g. TIAA01)
  string dropoff_unlocode  = 3;   // return location code
  string pickup_iso        = 4;   // ISO datetime  2026-03-18T14:00:00
  string dropoff_iso       = 5;
  int32  driver_age        = 6;
  string residency_country = 7;   // ISO 2-letter  (e.g. US)
  repeated string vehicle_classes = 8;  // optional ACRISS filter
}

// ── Response ─────────────────────────────────────────────────────────
message VehicleOffer {
  string supplier_offer_ref  = 1;   // unique offer ID — required for booking
  string vehicle_class       = 2;   // ACRISS code (e.g. CDAR)
  string make_model          = 3;   // car name  (e.g. TOYOTA COROLLA)
  string currency            = 4;   // ISO 4217  (e.g. EUR)
  double total_price         = 5;
  string availability_status = 6;   // AVAILABLE | ON_REQUEST | SOLD_OUT
  // Optional rich fields
  string picture_url         = 7;
  string door_count          = 8;
  string baggage             = 9;
  string vehicle_category    = 10;  // ACRISS (e.g. CDAR)
  string veh_id              = 11;
  string ota_vehicle_json    = 12;  // JSON: terms, charges, priced_equips
}

message AvailabilityResponse {
  repeated VehicleOffer vehicles = 1;
}

// ── Service ──────────────────────────────────────────────────────────
service SourceProviderService {
  rpc GetHealth      (Empty)               returns (HealthResponse);
  rpc GetLocations   (Empty)               returns (LocationsResponse);
  rpc GetAvailability(AvailabilityRequest) returns (AvailabilityResponse);
  rpc CreateBooking  (BookingCreateRequest)returns (BookingResponse);
  rpc ModifyBooking  (BookingRef)          returns (BookingResponse);
  rpc CancelBooking  (BookingRef)          returns (BookingResponse);
  rpc CheckBooking   (BookingRef)          returns (BookingResponse);
}`}</pre>
																	</div>
																	<div>
																		<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
																			Example ota_vehicle_json value (rich terms
																			&amp; pricing)
																		</p>
																		<pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48">{`// Set VehicleOffer.ota_vehicle_json to a JSON string like:
{
  "veh_terms_included": [
    { "code": "CDW", "header": "Standard Insurance (CDW)",
      "price": "0.00", "excess": "900.00", "deposit": "900.00",
      "mandatory": "Yes", "details": "Collision damage waiver..." }
  ],
  "veh_terms_not_included": [
    { "code": "PCDW", "header": "Premium Insurance (PCDW)",
      "price": "60.00", "excess": "0.00", "mandatory": "No" }
  ],
  "vehicle_charges": [
    { "Amount": "110.00", "CurrencyCode": "EUR",
      "UnitCharge": "33.00", "Quantity": "4", "UnitName": "Day" }
  ],
  "total_charge": { "RateTotalAmount": "132.00", "CurrencyCode": "EUR" },
  "priced_equips": [
    { "description": "GPS", "equip_type": "GPS",
      "charge": { "Amount": 32.00 } }
  ]
}`}</pre>
																	</div>
																	<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
																		<p className="font-semibold">
																			What Gloria extracts from each
																			VehicleOffer:
																		</p>
																		<ul className="list-disc list-inside space-y-0.5 mt-1">
																			<li>
																				<code>supplier_offer_ref</code> — unique
																				offer ID (required for booking)
																			</li>
																			<li>
																				<code>vehicle_class</code>,{" "}
																				<code>make_model</code> — ACRISS code
																				and car name
																			</li>
																			<li>
																				<code>total_price</code> +{" "}
																				<code>currency</code>
																			</li>
																			<li>
																				<code>availability_status</code> —
																				AVAILABLE / ON_REQUEST / SOLD_OUT
																			</li>
																			<li>
																				<code>picture_url</code>,{" "}
																				<code>door_count</code>,{" "}
																				<code>baggage</code>,{" "}
																				<code>vehicle_category</code>,{" "}
																				<code>veh_id</code>
																			</li>
																			<li>
																				<code>ota_vehicle_json</code> — JSON
																				string parsed for terms, charges, extras
																				(same as OTA XML VehTerms /
																				PricedEquips)
																			</li>
																		</ul>
																		<p className="mt-2 font-semibold">
																			gRPC address format:
																		</p>
																		<p className="font-mono">
																			host:port &nbsp;(e.g.{" "}
																			<strong>localhost:50051</strong> or{" "}
																			<strong>source.example.com:443</strong>)
																		</p>
																		<p className="mt-1">
																			No <code>grpc://</code> prefix needed —
																			Gloria adds the insecure channel
																			automatically.
																		</p>
																	</div>
																	<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
																		Keep rich policy/terms data in{" "}
																		<code>ota_vehicle_json</code> (included,
																		not-included, extras, charges). Missing
																		sections are allowed; available sections are
																		stored and shown. Suppliers may return
																		partial code lists or add new codes later —
																		document the full catalogue for brokers even
																		if not every field appears in every
																		response.
																	</div>
																</>
															)}
														</CardContent>
													</Card>
												</div>
											</>
										)}


										{activeTab === "transactions" && <SourceTransactionsTab />}

										{activeTab === "reservations" && (
											<div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
												<SourceBookingsPanel
													view="reservations"
													title="Reservations"
													description="Bookings from agents that are not cancelled (requested, confirmed, or other active states). Same data as Gloria stores when agents book your source."
												/>
											</div>
										)}

										{activeTab === "cancellations" && (
											<div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
												<SourceBookingsPanel
													view="cancellations"
													title="Cancellations"
													description="Bookings that have been cancelled (agent or flow updated status to CANCELLED in Gloria)."
												/>
											</div>
										)}

										{activeTab === "health" && (
											<SourceHealthPanel
												health={health}
												healthLoading={healthLoading}
												endpointConfig={endpointConfig}
												onRefresh={loadHealth}
											/>
										)}

										{activeTab === "settings" && (
											<>
												<SettingsPage />
											</>
										)}

										{activeTab === "support" && (
											<>
												<Support />
											</>
										)}

										{activeTab === "verification" && (
											<>
												<SourceVerificationPlayground
													endpointConfig={endpointConfig}
													locationListEndpointUrl={locationListEndpointUrl}
													setLocationListEndpointUrl={
														setLocationListEndpointUrl
													}
													locationListRequestRoot={locationListRequestRoot}
													setLocationListRequestRoot={
														setLocationListRequestRoot
													}
													locationListAccountId={locationListAccountId}
													setLocationListAccountId={setLocationListAccountId}
													locationListTransport={locationListTransport}
													setLocationListTransport={setLocationListTransport}
													isSavingLocationListConfig={
														isSavingLocationListConfig
													}
													handleSaveLocationListConfig={
														handleSaveLocationListConfig
													}
													isImportingLocationList={isImportingLocationList}
													syncLocationListFromEndpoint={
														syncLocationListFromEndpoint
													}
													locationListImportResult={locationListImportResult}
													locationListSampleFormat={locationListSampleFormat}
													setLocationListSampleFormat={
														setLocationListSampleFormat
													}
													locationListSamplePaste={locationListSamplePaste}
													setLocationListSamplePaste={
														setLocationListSamplePaste
													}
													validateLocationListSample={
														validateLocationListSample
													}
													locationListSampleValidation={
														locationListSampleValidation
													}
													availabilityEndpointUrl={availabilityEndpointUrl}
													setAvailabilityEndpointUrl={
														setAvailabilityEndpointUrl
													}
													availabilityAdapterType={availabilityAdapterType}
													setAvailabilityAdapterType={
														setAvailabilityAdapterType
													}
													grpcEndpoint={grpcEndpoint}
													grpcEndpointAddress={grpcEndpointAddress}
													setGrpcEndpointAddress={setGrpcEndpointAddress}
													otaRequestorId={otaRequestorId}
													setOtaRequestorId={setOtaRequestorId}
													otaPickupLoc={otaPickupLoc}
													setOtaPickupLoc={setOtaPickupLoc}
													otaReturnLoc={otaReturnLoc}
													setOtaReturnLoc={setOtaReturnLoc}
													otaPickupDateTime={otaPickupDateTime}
													setOtaPickupDateTime={setOtaPickupDateTime}
													otaReturnDateTime={otaReturnDateTime}
													setOtaReturnDateTime={setOtaReturnDateTime}
													otaDriverAge={otaDriverAge}
													setOtaDriverAge={setOtaDriverAge}
													otaCitizenCountry={otaCitizenCountry}
													setOtaCitizenCountry={setOtaCitizenCountry}
													forceRefreshAvailability={forceRefreshAvailability}
													setForceRefreshAvailability={
														setForceRefreshAvailability
													}
													isSavingAvailabilityEndpoint={
														isSavingAvailabilityEndpoint
													}
													handleSaveAvailabilityEndpointUrl={
														handleSaveAvailabilityEndpointUrl
													}
													isFetchingAvailability={isFetchingAvailability}
													handleFetchAvailability={handleFetchAvailability}
													fetchAvailabilityResult={fetchAvailabilityResult}
													grpcTestResult={grpcTestResult}
													isTestingGrpc={isTestingGrpc}
													testSourceGrpc={testSourceGrpc}
													verificationStatus={verificationStatus}
													verificationLoading={verificationLoading}
													verificationResult={verificationResult}
													verificationHistory={verificationHistory}
													runSourceVerification={runSourceVerification}
												/>
											</>
										)}
									</>
								)}
							</div>
						</div>
					)}
				</main>
			</div>

			{/* Request Missing Location Modal */}
			<Modal
				isOpen={isLocationRequestModalOpen}
				onClose={() => setIsLocationRequestModalOpen(false)}
				title="Request a Missing Location"
				size="xl"
			>
				<div className="max-h-[85vh] overflow-y-auto pr-1">
					<LocationRequestForm
						onSuccess={() => {
							setIsLocationRequestModalOpen(false);
							setIsLocationRequestsStatusModalOpen(true);
						}}
					/>
				</div>
			</Modal>

			{/* Location Request Status Modal */}
			<Modal
				isOpen={isLocationRequestsStatusModalOpen}
				onClose={() => setIsLocationRequestsStatusModalOpen(false)}
				title="Location Request Status"
				size="xl"
			>
				<div
					className="max-h-[85vh] overflow-y-auto pr-1"
					data-tour="locations-requests-list"
				>
					<LocationRequestList />
				</div>
			</Modal>

			{/* Branch Edit Modal */}
			<BranchEditModal
				branch={selectedBranch}
				isOpen={isEditBranchModalOpen}
				onClose={() => {
					setIsEditBranchModalOpen(false);
					setSelectedBranch(null);
				}}
			/>

			{/* Agreement Detail Modal */}
			<AgreementDetailModal
				agreementId={selectedAgreementId}
				isOpen={isAgreementModalOpen}
				onClose={() => {
					setIsAgreementModalOpen(false);
					setSelectedAgreementId(null);
				}}
			/>

			{/* Error Modal */}
			<ErrorModal
				isOpen={errorModal.isOpen}
				onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
				title={errorModal.title}
				message={errorModal.message}
				error={errorModal.error}
				type={
					errorModal.message?.toLowerCase().includes("warning")
						? "warning"
						: errorModal.message?.toLowerCase().includes("info")
							? "info"
							: "error"
				}
			/>

			{/* Branch quota exceeded modal: add more branches then retry */}
			{quotaModal && (
				<Modal
					isOpen={!!quotaModal}
					onClose={() => setQuotaModal(null)}
					title="Add more branches"
				>
					<div className="space-y-4">
						<p className="text-gray-700">{quotaModal.payload.message}</p>
						<p className="text-sm text-gray-600">
							Add <strong>{quotaModal.payload.needToAdd}</strong> more branch
							{quotaModal.payload.needToAdd !== 1 ? "es" : ""} to your
							subscription. Your next invoice will be prorated.
						</p>
						<div className="flex justify-end gap-2">
							<Button
								variant="secondary"
								onClick={() => setQuotaModal(null)}
								disabled={isAddingBranches}
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								onClick={handleConfirmAddBranches}
								loading={isAddingBranches}
								disabled={isAddingBranches}
							>
								Confirm and add branches
							</Button>
						</div>
					</div>
				</Modal>
			)}

			{/* Plan required modal: first-time users can explore, but imports/storage require a plan */}
			{planRequiredContext && (
				<Modal
					isOpen={!!planRequiredContext}
					onClose={() => setPlanRequiredContext(null)}
					title="Choose a plan to continue"
					size="xl"
				>
					<div className="max-h-[85vh] overflow-y-auto pr-1">
						<div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
									<Sparkles className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
										Plan required
									</p>
									<h3 className="mt-1 text-xl font-bold text-slate-950">
										Subscribe before you {planRequiredContext.action}.
									</h3>
									<p className="mt-2 text-sm leading-6 text-slate-600">
										{planRequiredContext.description ||
											"You can keep exploring the Gloria - Rental company portal and docs, but write actions such as imports, syncs, and stored availability require an active plan."}
									</p>
								</div>
							</div>
						</div>
						<PlanPicker />
					</div>
				</Modal>
			)}

			{/* Notifications Drawer */}
			{showPanelTourNudge && (
				<div className="fixed bottom-5 right-5 z-[120] max-w-sm rounded-3xl border border-blue-100 bg-white/95 p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-3">
					<div className="flex items-start gap-3">
						<div className="relative mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
							<span className="absolute inset-0 rounded-2xl animate-ping bg-cyan-400/30" />
							<Sparkles className="relative h-5 w-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-bold text-slate-900">
								{activeTab === "dashboard"
									? "New Gloria - Rental company tour"
									: "Page tour available"}
							</p>
							<p className="mt-1 text-xs leading-5 text-slate-600">
								{activeTab === "dashboard"
									? "Take a smooth guided walkthrough of Locations, Branches, Pricing, Verification, and Health."
									: "You are inside a section, so the tour will focus only on this page and its important controls."}
							</p>
							<div className="mt-3 flex items-center gap-2">
								<Button
									type="button"
									size="sm"
									onClick={startPanelTour}
									className="rounded-full"
								>
									Start tour
								</Button>
								<button
									type="button"
									className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
									onClick={() => setPanelTourNudgeDismissed(true)}
								>
									Later
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<NotificationsDrawer
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
				endpoint="/endpoints/notifications"
				markReadEndpoint={(id) => `/endpoints/notifications/${id}/read`}
			/>

			<SourcePanelTour
				open={panelTourOpen}
				currentTab={panelTourStartTab}
				onClose={() => setPanelTourOpen(false)}
				onStepChangeTab={(tab, opts) => {
					handleTabChange(tab as any, opts);
				}}
				onComplete={() => {
					const id = user?.company?.id;
					if (id) localStorage.setItem(SOURCE_PANEL_TOUR_STORAGE_KEY(id), "1");
				}}
			/>
		</div>
	);
}
