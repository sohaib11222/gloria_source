import React from "react";
import {
	Activity,
	AlertTriangle,
	CheckCircle2,
	Clock3,
	ExternalLink,
	Gauge,
	Info,
	RefreshCw,
	Server,
	ShieldAlert,
	ShieldCheck,
	TimerReset,
	Zap,
} from "lucide-react";
import type { EndpointConfig } from "../api/endpoints";
import type { SourceHealth } from "../types/api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface SourceHealthPanelProps {
	health: SourceHealth | null;
	healthLoading: boolean;
	endpointConfig: EndpointConfig | null;
	onRefresh: () => void | Promise<void>;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const formatPercent = (value?: number | null) => {
	if (value == null || Number.isNaN(value)) return "0.0%";
	return `${clampPercent(value * 100).toFixed(1)}%`;
};

const formatDateTime = (value?: string | null) => {
	if (!value) return "Not recorded yet";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Not recorded yet"
		: date.toLocaleString();
};

const minutesUntil = (value?: string | null) => {
	if (!value) return null;
	const ms = new Date(value).getTime() - Date.now();
	if (Number.isNaN(ms) || ms <= 0) return null;
	const minutes = Math.ceil(ms / 60000);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
};

const endpointSet = (value?: string | null) => Boolean(value && value.trim());

const shortEndpoint = (value?: string | null) => {
	if (!value) return "Not configured";
	return value.length > 56 ? `${value.slice(0, 53)}…` : value;
};

export const SourceHealthPanel: React.FC<SourceHealthPanelProps> = ({
	health,
	healthLoading,
	endpointConfig,
	onRefresh,
}) => {
	const hasSamples = (health?.sampleCount ?? 0) > 0;
	const slowRate = health?.slowRate ?? 0;
	const fastRate = health?.fastRate ?? Math.max(0, 1 - slowRate);
	const isExcluded = Boolean(
		health?.excludedUntil &&
			new Date(health.excludedUntil).getTime() > Date.now(),
	);
	const strikeCount = health?.strikeCount ?? 0;
	const strikesForBackoff = health?.strikesForBackoff ?? 3;
	const status = isExcluded
		? "EXCLUDED"
		: !hasSamples
			? "NO_DATA"
			: health?.healthy && strikeCount === 0
				? "HEALTHY"
				: "NEEDS_ATTENTION";
	const statusConfig = {
		EXCLUDED: {
			label: "Temporarily excluded",
			badge: "danger" as const,
			icon: ShieldAlert,
			panel: "border-red-200 bg-red-50 text-red-900",
			summary:
				"Gloria is temporarily skipping your source in availability search until the backoff window finishes.",
		},
		NEEDS_ATTENTION: {
			label: "Needs attention",
			badge: "warning" as const,
			icon: AlertTriangle,
			panel: "border-amber-200 bg-amber-50 text-amber-900",
			summary:
				"Recent responses were slow or failed. Improve response time before strikes reach the backoff limit.",
		},
		NO_DATA: {
			label: "Waiting for traffic",
			badge: "info" as const,
			icon: Info,
			panel: "border-slate-200 bg-slate-50 text-slate-900",
			summary:
				"No monitored availability requests have been recorded yet. Run tests from Verification or Pricing to create samples.",
		},
		HEALTHY: {
			label: "Healthy",
			badge: "success" as const,
			icon: ShieldCheck,
			panel: "border-emerald-200 bg-emerald-50 text-emerald-900",
			summary:
				"Your source endpoints are active and responding inside the expected performance window.",
		},
	}[status];
	const StatusIcon = statusConfig.icon;
	const remainingExclusion = minutesUntil(health?.excludedUntil);
	const endpointRows = [
		{
			label: "Availability / pricing",
			value: endpointConfig?.availabilityEndpointUrl,
			description: "Endpoint used for agent availability and price searches.",
		},
		{
			label: "Location list",
			value:
				endpointConfig?.locationListEndpointUrl ||
				endpointConfig?.locationEndpointUrl,
			description: "Endpoint used to import and validate branch/location data.",
		},
		{
			label: "gRPC server",
			value: endpointConfig?.grpcEndpoint,
			description:
				"Optional gRPC adapter health, locations, availability, and bookings.",
		},
		{
			label: "HTTP adapter",
			value: endpointConfig?.httpEndpoint,
			description:
				"Base HTTP source adapter endpoint configured for this company.",
		},
	];

	return (
		<div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl">
				<div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
				<div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
				<div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="max-w-3xl">
						<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
							<Activity className="h-3.5 w-3.5" />
							Source endpoint health
						</div>
						<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
							Health & performance monitor
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
							See if Gloria can safely route live availability traffic to your
							source. This page shows monitored samples, slow-response rate,
							strike/backoff state, and endpoint readiness in one place.
						</p>
					</div>
					<div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur">
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-white/15 p-3">
								<StatusIcon className="h-7 w-7" />
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-slate-300">
									Current status
								</p>
								<p className="mt-1 text-2xl font-bold">{statusConfig.label}</p>
							</div>
						</div>
						<Button
							onClick={onRefresh}
							loading={healthLoading}
							variant="secondary"
							className="mt-4 w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh health data
						</Button>
					</div>
				</div>
			</div>

			{healthLoading && !health ? (
				<Card className="border-slate-200 shadow-sm">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center">
						<div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
						<p className="font-semibold text-slate-900">Loading health data…</p>
						<p className="mt-1 text-sm text-slate-500">
							Checking the latest monitored samples for your source.
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<Card className={`border-2 shadow-sm ${statusConfig.panel}`}>
						<CardContent className="p-5">
							<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div className="flex gap-3">
									<div className="mt-0.5 rounded-2xl bg-white/70 p-3 shadow-sm">
										<StatusIcon className="h-6 w-6" />
									</div>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="text-xl font-bold">
												{statusConfig.label}
											</h2>
											<Badge variant={statusConfig.badge} size="md">
												{status}
											</Badge>
											{health?.monitorEnabled === false && (
												<Badge variant="warning" size="md">
													Monitor disabled
												</Badge>
											)}
										</div>
										<p className="mt-2 text-sm leading-6 opacity-90">
											{statusConfig.summary}
										</p>
										{isExcluded && health?.excludedUntil && (
											<p className="mt-2 text-sm font-semibold">
												Backoff ends {formatDateTime(health.excludedUntil)}
												{remainingExclusion
													? ` (${remainingExclusion} remaining)`
													: ""}
												.
											</p>
										)}
									</div>
								</div>
								<div className="text-sm md:text-right">
									<p className="font-semibold">Last updated</p>
									<p className="opacity-80">
										{formatDateTime(health?.updatedAt)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<MetricCard
							icon={Gauge}
							label="Healthy response rate"
							value={hasSamples ? formatPercent(fastRate) : "—"}
							description={
								hasSamples
									? `${formatPercent(slowRate)} slow / failed responses`
									: "Waiting for monitored requests"
							}
							barValue={hasSamples ? fastRate : 0}
							barClass="bg-emerald-500"
						/>
						<MetricCard
							icon={Server}
							label="Samples monitored"
							value={`${health?.sampleCount ?? 0}`}
							description={`${health?.slowCount ?? Math.round((health?.sampleCount ?? 0) * slowRate)} slow or failed samples`}
							barValue={Math.min((health?.sampleCount ?? 0) / 100, 1)}
							barClass="bg-blue-500"
						/>
						<MetricCard
							icon={AlertTriangle}
							label="Active strikes"
							value={`${strikeCount}/${strikesForBackoff}`}
							description="Fast successful responses reset active strikes"
							barValue={strikesForBackoff ? strikeCount / strikesForBackoff : 0}
							barClass={strikeCount > 0 ? "bg-amber-500" : "bg-emerald-500"}
						/>
						<MetricCard
							icon={TimerReset}
							label="Backoff level"
							value={`${health?.backoffLevel ?? 0}`}
							description={
								isExcluded
									? `Excluded until ${formatDateTime(health?.excludedUntil)}`
									: "No active exclusion window"
							}
							barValue={Math.min((health?.backoffLevel ?? 0) / 5, 1)}
							barClass={isExcluded ? "bg-red-500" : "bg-emerald-500"}
						/>
					</div>

					<div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
						<Card className="shadow-sm">
							<CardHeader className="bg-white">
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
										<Zap className="h-5 w-5" />
									</div>
									<div>
										<CardTitle>Endpoint readiness</CardTitle>
										<p className="mt-1 text-sm text-slate-500">
											Configured endpoints that feed health and availability
											traffic.
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{endpointRows.map((row) => {
									const configured = endpointSet(row.value);
									return (
										<div
											key={row.label}
											className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
										>
											<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div>
													<p className="font-semibold text-slate-900">
														{row.label}
													</p>
													<p className="mt-1 break-all text-sm text-slate-600">
														{shortEndpoint(row.value)}
													</p>
													<p className="mt-1 text-xs text-slate-500">
														{row.description}
													</p>
												</div>
												<Badge
													variant={configured ? "success" : "warning"}
													size="sm"
												>
													{configured ? "Configured" : "Missing"}
												</Badge>
											</div>
										</div>
									);
								})}
							</CardContent>
						</Card>

						<Card className="shadow-sm">
							<CardHeader className="bg-white">
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-slate-100 p-2 text-slate-700">
										<Clock3 className="h-5 w-5" />
									</div>
									<div>
										<CardTitle>Monitoring rules</CardTitle>
										<p className="mt-1 text-sm text-slate-500">
											How Gloria decides when to route or pause source traffic.
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4 text-sm text-slate-700">
								<RuleRow
									label="Slow threshold"
									value={`${health?.slowThresholdMs ?? 3000} ms`}
									description="Responses above this time are counted as slow samples. Failed requests are also treated as unhealthy."
								/>
								<RuleRow
									label="Strike limit"
									value={`${strikesForBackoff} strikes`}
									description="Consecutive slow/failed samples can trigger temporary exclusion. A fast success resets active strikes."
								/>
								<RuleRow
									label="Backoff ladder"
									value={(
										health?.backoffScheduleMinutes ?? [15, 30, 60, 120, 240]
									)
										.map((m) => (m >= 60 ? `${m / 60}h` : `${m}m`))
										.join(" → ")}
									description="Repeated exclusions increase the waiting period before traffic is restored."
								/>
								<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
									<div className="flex gap-2">
										<Info className="mt-0.5 h-4 w-4 shrink-0" />
										<p>
											To generate fresh health samples, run the
											Availability/Pricing test or the Verification playground.
											Then refresh this page.
										</p>
									</div>
								</div>
								<a
									href="/source?tab=verification"
									className="inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"
								>
									Open Verification playground
									<ExternalLink className="ml-1.5 h-4 w-4" />
								</a>
							</CardContent>
						</Card>
					</div>

					<Card className="shadow-sm">
						<CardHeader className="bg-white">
							<CardTitle>Latest health events</CardTitle>
							<p className="mt-1 text-sm text-slate-500">
								Important timestamps and recovery signals for your source.
							</p>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
								<EventTile
									icon={CheckCircle2}
									label="Last sample update"
									value={formatDateTime(health?.updatedAt)}
								/>
								<EventTile
									icon={AlertTriangle}
									label="Last strike"
									value={formatDateTime(health?.lastStrikeAt)}
								/>
								<EventTile
									icon={TimerReset}
									label="Excluded until"
									value={formatDateTime(health?.excludedUntil)}
								/>
								<EventTile
									icon={ShieldCheck}
									label="Last admin reset"
									value={formatDateTime(health?.lastResetAt)}
								/>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
};

interface MetricCardProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
	description: string;
	barValue: number;
	barClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
	icon: Icon,
	label,
	value,
	description,
	barValue,
	barClass,
}) => (
	<Card className="overflow-hidden shadow-sm">
		<CardContent className="p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-wider text-slate-500">
						{label}
					</p>
					<p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
				</div>
				<div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
					<Icon className="h-5 w-5" />
				</div>
			</div>
			<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
				<div
					className={`h-full rounded-full transition-all ${barClass}`}
					style={{ width: `${clampPercent(barValue * 100)}%` }}
				/>
			</div>
			<p className="mt-3 text-sm text-slate-600">{description}</p>
		</CardContent>
	</Card>
);

const RuleRow: React.FC<{
	label: string;
	value: string;
	description: string;
}> = ({ label, value, description }) => (
	<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
		<div className="flex items-start justify-between gap-3">
			<div>
				<p className="font-semibold text-slate-900">{label}</p>
				<p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
			</div>
			<span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
				{value}
			</span>
		</div>
	</div>
);

const EventTile: React.FC<{
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
}> = ({ icon: Icon, label, value }) => (
	<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
		<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
			<Icon className="h-5 w-5" />
		</div>
		<p className="text-xs font-bold uppercase tracking-wider text-slate-500">
			{label}
		</p>
		<p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
	</div>
);
