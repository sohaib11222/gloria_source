import React from "react";
import {
	AlertCircle,
	CheckCircle2,
	RefreshCw,
	Settings,
	XCircle,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import type { EndpointConfig, SourceGrpcTestResponse } from "../api/endpoints";
import type { VerificationResult } from "../api/verification";

type VerificationStatus = "IDLE" | "PENDING" | "RUNNING" | "PASSED" | "FAILED";
type LocationListTransport = "http" | "grpc";
type LocationListSampleFormat = "xml" | "grpc";
type AvailabilityAdapterType = "xml" | "json" | "grpc";

interface SourceVerificationPlaygroundProps {
	endpointConfig: EndpointConfig | null;
	locationListEndpointUrl: string;
	setLocationListEndpointUrl: (value: string) => void;
	locationListRequestRoot: string;
	setLocationListRequestRoot: (value: string) => void;
	locationListAccountId: string;
	setLocationListAccountId: (value: string) => void;
	locationListTransport: LocationListTransport;
	setLocationListTransport: (value: LocationListTransport) => void;
	isSavingLocationListConfig: boolean;
	handleSaveLocationListConfig: () => Promise<void>;
	isImportingLocationList: boolean;
	syncLocationListFromEndpoint: () => void | Promise<void>;
	locationListImportResult: any;
	locationListSampleFormat: LocationListSampleFormat;
	setLocationListSampleFormat: (value: LocationListSampleFormat) => void;
	locationListSamplePaste: string;
	setLocationListSamplePaste: (value: string) => void;
	validateLocationListSample: () => void;
	locationListSampleValidation: {
		ok: boolean;
		format?: string;
		count?: number;
		errors?: string[];
	} | null;
	availabilityEndpointUrl: string;
	setAvailabilityEndpointUrl: (value: string) => void;
	availabilityAdapterType: AvailabilityAdapterType;
	setAvailabilityAdapterType: (value: AvailabilityAdapterType) => void;
	grpcEndpoint: string;
	grpcEndpointAddress: string;
	setGrpcEndpointAddress: (value: string) => void;
	otaRequestorId: string;
	setOtaRequestorId: (value: string) => void;
	otaPickupLoc: string;
	setOtaPickupLoc: (value: string) => void;
	otaReturnLoc: string;
	setOtaReturnLoc: (value: string) => void;
	otaPickupDateTime: string;
	setOtaPickupDateTime: (value: string) => void;
	otaReturnDateTime: string;
	setOtaReturnDateTime: (value: string) => void;
	otaDriverAge: number;
	setOtaDriverAge: (value: number) => void;
	otaCitizenCountry: string;
	setOtaCitizenCountry: (value: string) => void;
	forceRefreshAvailability: boolean;
	setForceRefreshAvailability: (value: boolean) => void;
	isSavingAvailabilityEndpoint: boolean;
	handleSaveAvailabilityEndpointUrl: () => Promise<void>;
	isFetchingAvailability: boolean;
	handleFetchAvailability: () => Promise<void>;
	fetchAvailabilityResult: any;
	grpcTestResult: SourceGrpcTestResponse | null;
	isTestingGrpc: boolean;
	testSourceGrpc: () => Promise<void>;
	verificationStatus: VerificationStatus;
	verificationLoading: boolean;
	verificationResult: VerificationResult | null;
	verificationHistory: VerificationResult[];
	runSourceVerification: () => Promise<void>;
}

function resultBadge(ok: boolean | undefined) {
	if (ok === true) return <Badge variant="success">Passed</Badge>;
	if (ok === false) return <Badge variant="danger">Needs work</Badge>;
	return <Badge variant="default">Not tested</Badge>;
}

function shortJson(value: unknown) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value ?? "");
	}
}

function formatLastRun(value?: string) {
	if (!value) return "Never";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Never";
	return date.toLocaleString();
}

const adapterLabels: Record<AvailabilityAdapterType, string> = {
	xml: "Gloria XML / OTA XML",
	json: "Gloria JSON",
	grpc: "Gloria gRPC",
};

export const SourceVerificationPlayground: React.FC<
	SourceVerificationPlaygroundProps
> = ({
	endpointConfig,
	locationListEndpointUrl,
	setLocationListEndpointUrl,
	locationListRequestRoot,
	setLocationListRequestRoot,
	locationListAccountId,
	setLocationListAccountId,
	locationListTransport,
	setLocationListTransport,
	isSavingLocationListConfig,
	handleSaveLocationListConfig,
	isImportingLocationList,
	syncLocationListFromEndpoint,
	locationListImportResult,
	locationListSampleFormat,
	setLocationListSampleFormat,
	locationListSamplePaste,
	setLocationListSamplePaste,
	validateLocationListSample,
	locationListSampleValidation,
	availabilityEndpointUrl,
	setAvailabilityEndpointUrl,
	availabilityAdapterType,
	setAvailabilityAdapterType,
	grpcEndpoint,
	grpcEndpointAddress,
	setGrpcEndpointAddress,
	otaRequestorId,
	setOtaRequestorId,
	otaPickupLoc,
	setOtaPickupLoc,
	otaReturnLoc,
	setOtaReturnLoc,
	otaPickupDateTime,
	setOtaPickupDateTime,
	otaReturnDateTime,
	setOtaReturnDateTime,
	otaDriverAge,
	setOtaDriverAge,
	otaCitizenCountry,
	setOtaCitizenCountry,
	forceRefreshAvailability,
	setForceRefreshAvailability,
	isSavingAvailabilityEndpoint,
	handleSaveAvailabilityEndpointUrl,
	isFetchingAvailability,
	handleFetchAvailability,
	fetchAvailabilityResult,
	grpcTestResult,
	isTestingGrpc,
	testSourceGrpc,
	verificationStatus,
	verificationLoading,
	verificationResult,
	verificationHistory,
	runSourceVerification,
}) => {
	const locationListResponseRoot = (
		locationListRequestRoot || "GLORIA_locationlistrq"
	).replace(/rq$/i, "rs");
	const canRunLocationList =
		locationListTransport === "grpc"
			? Boolean(grpcEndpoint || endpointConfig?.grpcEndpoint)
			: Boolean(locationListEndpointUrl.trim());
	const canRunAvailability =
		availabilityAdapterType === "grpc"
			? Boolean(
					grpcEndpointAddress.trim() ||
						endpointConfig?.grpcEndpoint ||
						grpcEndpoint,
				)
			: Boolean(
					availabilityEndpointUrl.trim() ||
						endpointConfig?.availabilityEndpointUrl ||
						endpointConfig?.httpEndpoint,
				);
	const verificationSteps = verificationResult?.steps ?? [];
	const passedSteps = verificationSteps.filter((step) => step.passed).length;
	const failedSteps = verificationSteps.length - passedSteps;

	return (
		<div className="space-y-8">
			<div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-start gap-4">
						<div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
							<CheckCircle2 className="h-8 w-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
								Source verification playground
							</h1>
							<p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
								Use this page before going live: configure how Gloria calls your
								supplier system, send real test requests, inspect parsed
								responses, and compare your payloads with the expected GLORIA
								shapes.
							</p>
						</div>
					</div>
					<Button
						onClick={runSourceVerification}
						loading={verificationLoading}
						disabled={verificationStatus === "RUNNING"}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Run full verification
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card className="border-gray-200">
					<CardContent className="p-5">
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
							Location list
						</p>
						<div className="mt-3">
							{resultBadge(
								locationListImportResult
									? !(locationListImportResult.errors?.length > 0)
									: undefined,
							)}
						</div>
						<p className="mt-2 text-xs text-gray-500">
							Branches and locations returned by your supplier.
						</p>
					</CardContent>
				</Card>
				<Card className="border-gray-200">
					<CardContent className="p-5">
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
							Availability/pricing
						</p>
						<div className="mt-3">
							{resultBadge(
								fetchAvailabilityResult
									? !fetchAvailabilityResult.error
									: undefined,
							)}
						</div>
						<p className="mt-2 text-xs text-gray-500">
							Vehicle offers, rates, terms, and extras.
						</p>
					</CardContent>
				</Card>
				<Card className="border-gray-200">
					<CardContent className="p-5">
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
							gRPC health
						</p>
						<div className="mt-3">
							{resultBadge(grpcTestResult ? grpcTestResult.ok : undefined)}
						</div>
						<p className="mt-2 text-xs text-gray-500">
							SourceProviderService connectivity.
						</p>
					</CardContent>
				</Card>
				<Card className="border-gray-200">
					<CardContent className="p-5">
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
							Automated verification
						</p>
						<div className="mt-3">
							{resultBadge(
								verificationResult ? verificationResult.passed : undefined,
							)}
						</div>
						<p className="mt-2 text-xs text-gray-500">
							{passedSteps}/{verificationSteps.length || 0} checks passed.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="border-blue-100 shadow-sm">
				<CardHeader className="border-b border-blue-100 bg-blue-50/60">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle className="text-xl font-bold text-gray-900">
								1. Location list endpoint playground
							</CardTitle>
							<p className="mt-1 text-sm text-gray-600">
								Gloria can fetch your complete location/branch list via HTTP XML
								or gRPC GetLocations. Test it here and confirm Gloria can parse
								locations before you rely on them in pricing.
							</p>
						</div>
						<Badge
							variant={locationListTransport === "grpc" ? "info" : "default"}
						>
							{locationListTransport === "grpc"
								? "gRPC GetLocations"
								: "HTTP XML POST"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6 p-6">
					<div className="grid gap-3 md:grid-cols-2">
						<label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200">
							<input
								type="radio"
								name="verificationLocationTransport"
								className="mt-1"
								checked={locationListTransport === "http"}
								onChange={() => setLocationListTransport("http")}
							/>
							<span>
								<span className="block text-sm font-semibold text-gray-900">
									HTTP — POST XML
								</span>
								<span className="mt-1 block text-xs leading-5 text-gray-600">
									Gloria posts <code>GLORIA_locationlistrq</code> to your
									supplier URL and expects a matching response root ending in{" "}
									<code>rs</code> containing <code>LocationDetail</code> rows.
								</span>
							</span>
						</label>
						<label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200">
							<input
								type="radio"
								name="verificationLocationTransport"
								className="mt-1"
								checked={locationListTransport === "grpc"}
								onChange={() => setLocationListTransport("grpc")}
							/>
							<span>
								<span className="block text-sm font-semibold text-gray-900">
									gRPC — GetLocations
								</span>
								<span className="mt-1 block text-xs leading-5 text-gray-600">
									Gloria calls SourceProviderService.GetLocations on your saved
									gRPC endpoint
									{endpointConfig?.grpcEndpoint
										? ` (${endpointConfig.grpcEndpoint})`
										: ""}
									.
								</span>
							</span>
						</label>
					</div>

					{locationListTransport === "http" ? (
						<div className="grid gap-4 md:grid-cols-3">
							<div className="md:col-span-3">
								<Input
									label="Endpoint URL"
									value={locationListEndpointUrl}
									onChange={(event) =>
										setLocationListEndpointUrl(event.target.value)
									}
									placeholder="https://ota.example.com/gloria/"
								/>
								<p className="mt-1 text-xs text-gray-500">
									Whitelist applies to this URL. Gloria sends XML with
									Content-Type: text/xml.
								</p>
							</div>
							<Input
								label="Request root element"
								value={locationListRequestRoot}
								onChange={(event) =>
									setLocationListRequestRoot(event.target.value)
								}
								placeholder="GLORIA_locationlistrq"
							/>
							<Input
								label="Account ID"
								value={locationListAccountId}
								onChange={(event) =>
									setLocationListAccountId(event.target.value)
								}
								placeholder="Gloria001"
							/>
							<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
								Response root expected:{" "}
								<code className="font-semibold text-gray-900">
									{locationListResponseRoot}
								</code>
							</div>
						</div>
					) : (
						<div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
							<p className="font-semibold">gRPC endpoint used for this test</p>
							<p className="mt-1 font-mono text-xs">
								{grpcEndpoint ||
									endpointConfig?.grpcEndpoint ||
									"No gRPC endpoint configured yet."}
							</p>
						</div>
					)}

					<div className="flex flex-wrap gap-3">
						<Button
							type="button"
							variant="secondary"
							onClick={handleSaveLocationListConfig}
							loading={isSavingLocationListConfig}
							disabled={
								locationListTransport === "http"
									? !locationListEndpointUrl.trim()
									: !(grpcEndpoint || endpointConfig?.grpcEndpoint)
							}
						>
							<Settings className="mr-2 h-4 w-4" />
							Save location list config
						</Button>
						<Button
							type="button"
							onClick={syncLocationListFromEndpoint}
							loading={isImportingLocationList}
							disabled={!canRunLocationList}
						>
							Test saved location list
						</Button>
					</div>

					{locationListImportResult && (
						<div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Badge
									variant={
										locationListImportResult.errors?.length
											? "warning"
											: "success"
									}
								>
									{locationListImportResult.errors?.length
										? "Completed with issues"
										: "Parsed successfully"}
								</Badge>
								<span className="text-sm text-gray-700">
									{locationListImportResult.message ||
										"Location list test completed"}
								</span>
							</div>
							<div className="grid gap-3 sm:grid-cols-4">
								{["total", "imported", "updated", "skipped"].map((key) => (
									<div
										key={key}
										className="rounded-lg bg-white p-3 ring-1 ring-gray-200"
									>
										<p className="text-xs font-semibold uppercase text-gray-500">
											{key}
										</p>
										<p className="mt-1 text-xl font-bold text-gray-900">
											{locationListImportResult[key] ?? 0}
										</p>
									</div>
								))}
							</div>
							{locationListImportResult.errors?.length > 0 && (
								<pre className="mt-4 max-h-56 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
									{shortJson(locationListImportResult.errors)}
								</pre>
							)}
						</div>
					)}

					<div className="grid gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<p className="text-sm font-semibold text-gray-900">
									Paste and validate your sample response
								</p>
								<button
									type="button"
									onClick={() => setLocationListSampleFormat("xml")}
									className={`rounded-md px-2.5 py-1 text-xs font-semibold ${locationListSampleFormat === "xml" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600"}`}
								>
									XML
								</button>
								<button
									type="button"
									onClick={() => setLocationListSampleFormat("grpc")}
									className={`rounded-md px-2.5 py-1 text-xs font-semibold ${locationListSampleFormat === "grpc" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600"}`}
								>
									gRPC JSON
								</button>
							</div>
							<textarea
								value={locationListSamplePaste}
								onChange={(event) =>
									setLocationListSamplePaste(event.target.value)
								}
								rows={8}
								placeholder={
									locationListSampleFormat === "grpc"
										? '{ "locations": [ { "unlocode": "AEDXB", "name": "Dubai" } ] }'
										: `<${locationListResponseRoot}>...</${locationListResponseRoot}>`
								}
								className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<div className="mt-3 flex flex-wrap items-center gap-3">
								<Button
									type="button"
									variant="secondary"
									onClick={validateLocationListSample}
									disabled={!locationListSamplePaste.trim()}
								>
									Validate sample
								</Button>
								{locationListSampleValidation && (
									<span
										className={`text-sm ${locationListSampleValidation.ok ? "text-green-700" : "text-red-700"}`}
									>
										{locationListSampleValidation.ok
											? `Valid ${locationListSampleValidation.format || ""}${locationListSampleValidation.count != null ? ` — ${locationListSampleValidation.count} location(s)` : ""}`
											: locationListSampleValidation.errors?.join(" ") ||
												"Validation failed"}
									</span>
								)}
							</div>
						</div>

						<details
							className="rounded-xl border border-gray-200 bg-gray-50 p-4"
							open
						>
							<summary className="cursor-pointer text-sm font-semibold text-gray-900">
								Expected location list shapes
							</summary>
							<div className="mt-4 space-y-4">
								<pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">{`<${locationListResponseRoot} TimeStamp="2026-06-01T10:00:00" Target="Production" Version="1.00">
  <Success/>
  <LocationList>
    <LocationDetail Branchcode="TIAA01" Name="Dubai Airport" LocationCode="AEDXB" CountryCode="AE">
      <Address>Dubai International Airport</Address>
      <Latitude>25.2532</Latitude>
      <Longitude>55.3657</Longitude>
    </LocationDetail>
  </LocationList>
</${locationListResponseRoot}>`}</pre>
								<pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">{`{
  "locations": [
    {
      "unlocode": "AEDXB",
      "name": "Dubai Airport",
      "branchCode": "TIAA01",
      "countryCode": "AE",
      "latitude": 25.2532,
      "longitude": 55.3657
    }
  ]
}`}</pre>
							</div>
						</details>
					</div>
				</CardContent>
			</Card>

			<Card className="border-violet-100 shadow-sm">
				<CardHeader className="border-b border-violet-100 bg-violet-50/60">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle className="text-xl font-bold text-gray-900">
								2. Availability & pricing playground
							</CardTitle>
							<p className="mt-1 text-sm text-gray-600">
								Send the same availability request used in the Pricing tab.
								Confirm vehicles, rates, terms, and extras are returned in a
								GLORIA-compatible shape.
							</p>
						</div>
						<Badge variant="info">
							{adapterLabels[availabilityAdapterType]}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6 p-6">
					<div className="flex flex-wrap gap-2">
						{(["xml", "json", "grpc"] as AvailabilityAdapterType[]).map(
							(adapter) => (
								<button
									key={adapter}
									type="button"
									onClick={() => setAvailabilityAdapterType(adapter)}
									className={`rounded-lg border px-3 py-2 text-sm font-semibold ${availabilityAdapterType === adapter ? "border-violet-600 bg-violet-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
								>
									{adapterLabels[adapter]}
								</button>
							),
						)}
					</div>

					{availabilityAdapterType === "grpc" ? (
						<Input
							label="gRPC endpoint address"
							value={grpcEndpointAddress}
							onChange={(event) => setGrpcEndpointAddress(event.target.value)}
							placeholder={endpointConfig?.grpcEndpoint || "host:50051"}
						/>
					) : (
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
							<div className="flex-1">
								<Input
									label="Availability endpoint URL"
									value={availabilityEndpointUrl}
									onChange={(event) =>
										setAvailabilityEndpointUrl(event.target.value)
									}
									placeholder="https://ota.example.com/gloria/availability"
								/>
								{endpointConfig?.availabilityEndpointUrl && (
									<p className="mt-1 text-xs text-gray-500">
										Saved: <code>{endpointConfig.availabilityEndpointUrl}</code>
									</p>
								)}
							</div>
							<Button
								type="button"
								variant="secondary"
								onClick={handleSaveAvailabilityEndpointUrl}
								loading={isSavingAvailabilityEndpoint}
								disabled={!availabilityEndpointUrl.trim()}
							>
								Save endpoint
							</Button>
						</div>
					)}

					<div className="grid gap-4 md:grid-cols-3">
						<Input
							label="Account ID / agreement_ref"
							value={otaRequestorId}
							onChange={(event) => setOtaRequestorId(event.target.value)}
							placeholder="Gloria001"
						/>
						<Input
							label="Pickup LocationCode"
							value={otaPickupLoc}
							onChange={(event) =>
								setOtaPickupLoc(event.target.value.toUpperCase())
							}
							placeholder="TIAA01"
						/>
						<Input
							label="Return LocationCode"
							value={otaReturnLoc}
							onChange={(event) =>
								setOtaReturnLoc(event.target.value.toUpperCase())
							}
							placeholder="TIAA01"
						/>
						<Input
							label="Pickup DateTime"
							type="datetime-local"
							value={otaPickupDateTime}
							onChange={(event) => setOtaPickupDateTime(event.target.value)}
						/>
						<Input
							label="Return DateTime"
							type="datetime-local"
							value={otaReturnDateTime}
							onChange={(event) => setOtaReturnDateTime(event.target.value)}
						/>
						<Input
							label="Driver age"
							type="number"
							min={18}
							value={otaDriverAge}
							onChange={(event) =>
								setOtaDriverAge(Number(event.target.value || 0))
							}
						/>
						<Input
							label="Driver residency country"
							maxLength={2}
							value={otaCitizenCountry}
							onChange={(event) =>
								setOtaCitizenCountry(event.target.value.toUpperCase())
							}
							placeholder="US"
						/>
						<label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 md:col-span-2">
							<input
								type="checkbox"
								checked={forceRefreshAvailability}
								onChange={(event) =>
									setForceRefreshAvailability(event.target.checked)
								}
							/>
							Force re-store even if the criteria already exists
						</label>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button
							type="button"
							onClick={handleFetchAvailability}
							loading={isFetchingAvailability}
							disabled={!canRunAvailability}
						>
							Fetch & inspect availability
						</Button>
						{availabilityAdapterType === "grpc" && (
							<Button
								type="button"
								variant="secondary"
								onClick={testSourceGrpc}
								loading={isTestingGrpc}
								disabled={
									!(
										grpcEndpoint ||
										endpointConfig?.grpcEndpoint ||
										grpcEndpointAddress
									)
								}
							>
								Test gRPC connection
							</Button>
						)}
					</div>

					{fetchAvailabilityResult && (
						<div
							className={`rounded-xl border p-4 ${fetchAvailabilityResult.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
						>
							<div className="mb-3 flex flex-wrap items-center gap-2">
								{fetchAvailabilityResult.error ? (
									<XCircle className="h-5 w-5 text-red-600" />
								) : (
									<CheckCircle2 className="h-5 w-5 text-green-600" />
								)}
								<p className="text-sm font-semibold text-gray-900">
									{fetchAvailabilityResult.message ||
										"Availability test completed"}
								</p>
								{fetchAvailabilityResult.offersCount != null && (
									<Badge variant="info">
										{fetchAvailabilityResult.offersCount} offer(s)
									</Badge>
								)}
								{fetchAvailabilityResult.duplicate && (
									<Badge variant="warning">Duplicate</Badge>
								)}
							</div>
							<pre className="max-h-72 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
								{shortJson(fetchAvailabilityResult)}
							</pre>
						</div>
					)}

					<details
						className="rounded-xl border border-gray-200 bg-gray-50 p-4"
						open
					>
						<summary className="cursor-pointer text-sm font-semibold text-gray-900">
							Expected availability request and response shapes
						</summary>
						<div className="mt-4 grid gap-4 lg:grid-cols-2">
							<pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">{`<GLORIA_availabilityrq TimeStamp="2026-06-01T10:00:00" Target="Production" Version="1.00">
  <ACC><Source><AccountID ID="${otaRequestorId || "Gloria001"}"/></Source></ACC>
  <VehAvailbody>
    <VehAvailRQCore>
      <VehRentalCore PickUpDateTime="${otaPickupDateTime || "2026-06-14T09:00"}:00" ReturnDateTime="${otaReturnDateTime || "2026-06-18T09:00"}:00">
        <PickUpLocation LocationCode="${otaPickupLoc || "TIAA01"}"/>
        <ReturnLocation LocationCode="${otaReturnLoc || "TIAA01"}"/>
      </VehRentalCore>
      <DriverType Age="${otaDriverAge || 30}"/>
      <DriverCitizenCountry>${otaCitizenCountry || "US"}</DriverCitizenCountry>
    </VehAvailRQCore>
  </VehAvailbody>
</GLORIA_availabilityrq>`}</pre>
							<pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">{`{
  "VehAvairsdetails": {
    "collectionbranch": "${otaPickupLoc || "TIAA01"}",
    "returnbranch": "${otaReturnLoc || "TIAA01"}"
  },
  "availcars": [
    {
      "vehdetails": { "Class": "CDAR", "Make": "Toyota", "Model": "Corolla", "Seats": "5" },
      "pricing": { "Currency": "USD", "TotalGross": "240.00", "DailyGross": "60.00" },
      "includedinprice": { "Item": [{ "Code": "TPL", "ItemDescription": "Third-party liability" }] }
    }
  ]
}`}</pre>
						</div>
					</details>
				</CardContent>
			</Card>

			<Card className="border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-200 bg-gray-50">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="text-xl font-bold text-gray-900">
								3. Automated verification run
							</CardTitle>
							<p className="mt-1 text-sm text-gray-600">
								Runs backend checks and stores the latest verification report
								for admin review.
							</p>
						</div>
						<Badge
							variant={
								verificationStatus === "PASSED"
									? "success"
									: verificationStatus === "FAILED"
										? "danger"
										: verificationStatus === "RUNNING"
											? "info"
											: "default"
							}
						>
							{verificationStatus}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6 p-6">
					<div className="flex flex-wrap items-center gap-3">
						<Button
							onClick={runSourceVerification}
							loading={verificationLoading}
							disabled={verificationStatus === "RUNNING"}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							{verificationResult
								? "Run verification again"
								: "Run verification"}
						</Button>
						<span className="text-xs text-gray-500">
							Last run: {formatLastRun(verificationResult?.created_at)}
						</span>
					</div>

					{verificationResult && (
						<div className="grid gap-4 md:grid-cols-3">
							<div className="rounded-xl border border-gray-200 bg-white p-4">
								<p className="text-xs font-semibold uppercase text-gray-500">
									Total checks
								</p>
								<p className="mt-1 text-2xl font-bold text-gray-900">
									{verificationSteps.length}
								</p>
							</div>
							<div className="rounded-xl border border-green-200 bg-green-50 p-4">
								<p className="text-xs font-semibold uppercase text-green-700">
									Passed
								</p>
								<p className="mt-1 text-2xl font-bold text-green-800">
									{passedSteps}
								</p>
							</div>
							<div className="rounded-xl border border-red-200 bg-red-50 p-4">
								<p className="text-xs font-semibold uppercase text-red-700">
									Failed
								</p>
								<p className="mt-1 text-2xl font-bold text-red-800">
									{failedSteps}
								</p>
							</div>
						</div>
					)}

					{verificationSteps.length > 0 ? (
						<div className="space-y-3">
							{verificationSteps.map((step, index) => (
								<div
									key={`${step.name}-${index}`}
									className={`rounded-xl border p-4 ${step.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
								>
									<div className="flex items-start gap-3">
										{step.passed ? (
											<CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
										) : (
											<XCircle className="mt-0.5 h-5 w-5 text-red-600" />
										)}
										<div>
											<p className="font-semibold text-gray-900">
												{step.name || `Step ${index + 1}`}
											</p>
											<p
												className={`mt-1 text-sm ${step.passed ? "text-green-700" : "text-red-700"}`}
											>
												{step.detail || "No detail returned."}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
							<AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
							<p className="mt-2 text-sm font-semibold text-gray-900">
								No verification report yet
							</p>
							<p className="mt-1 text-sm text-gray-600">
								Run the playground checks above, then run automated
								verification.
							</p>
						</div>
					)}

					{verificationHistory.length > 1 && (
						<details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
							<summary className="cursor-pointer text-sm font-semibold text-gray-900">
								Previous verification runs
							</summary>
							<div className="mt-3 space-y-2">
								{verificationHistory.slice(1).map((result, index) => (
									<div
										key={`${result.created_at}-${index}`}
										className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-gray-200"
									>
										<span>{formatLastRun(result.created_at)}</span>
										<Badge variant={result.passed ? "success" : "danger"}>
											{result.passed ? "Passed" : "Failed"}
										</Badge>
									</div>
								))}
							</div>
						</details>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
