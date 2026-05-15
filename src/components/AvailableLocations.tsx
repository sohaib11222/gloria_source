import { useMemo } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Database,
	ExternalLink,
	Globe2,
	Map,
	MapPin,
	Navigation,
	RefreshCw,
	Search,
	Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Location } from "../api/endpoints";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpointsApi } from "../api/endpoints";
import toast from "react-hot-toast";
import { Badge } from "./ui/Badge";

interface AvailableLocationsProps {
	locations: Location[];
	isLoadingLocations: boolean;
	showLocations: boolean;
	loadLocations: () => void;
	showRemoveButton?: boolean;
	agreementFilterActive?: boolean;
	listMeta?: { inherited?: boolean; hasMockData?: boolean } | null;
}

function formatCoordinates(loc: Location): string | null {
	if (loc.coordinatesMissing) return null;
	const lat = loc.latitude;
	const lon = loc.longitude;
	if (lat === 0 && lon === 0) return null;
	if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
	return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function formatLinkedAt(value?: string | null) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function masterBadge(location: Location) {
	if (location.hasMasterRecord === false) {
		return (
			<Badge variant="warning" className="gap-1 rounded-full">
				<AlertTriangle className="h-3 w-3" /> Pending
			</Badge>
		);
	}
	if (location.enrichedFromBranch) {
		return (
			<Badge
				variant="info"
				className="gap-1 rounded-full"
				title="Filled from an imported branch (natoLocode or branch code)"
			>
				<Database className="h-3 w-3" /> Branch
			</Badge>
		);
	}
	return (
		<Badge
			variant="success"
			className="gap-1 rounded-full"
			title="Gloria UN/LOCODE master record"
		>
			<CheckCircle2 className="h-3 w-3" /> Gloria
		</Badge>
	);
}

export const AvailableLocations: React.FC<AvailableLocationsProps> = ({
	locations,
	isLoadingLocations,
	showLocations,
	loadLocations,
	showRemoveButton = false,
	agreementFilterActive = false,
	listMeta,
}) => {
	const queryClient = useQueryClient();

	const removeLocationMutation = useMutation({
		mutationFn: (unlocode: string) => endpointsApi.removeLocation(unlocode),
		onSuccess: (data) => {
			toast.success(`Location ${data.unlocode} removed successfully!`);
			queryClient.invalidateQueries({ queryKey: ["locations"] });
			queryClient.invalidateQueries({ queryKey: ["syncedLocations"] });
			setTimeout(() => {
				loadLocations();
			}, 500);
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message || "Failed to remove location";
			toast.error(errorMessage);
		},
	});

	const handleRemoveLocation = (unlocode: string, place: string) => {
		if (
			window.confirm(
				`Are you sure you want to remove ${unlocode} (${place}) from your coverage?`,
			)
		) {
			removeLocationMutation.mutate(unlocode);
		}
	};

	const showLinkedCol = locations.some((l) => !!l.synced_at);
	const stats = useMemo(() => {
		return {
			total: locations.length,
			master: locations.filter(
				(location) =>
					location.hasMasterRecord !== false && !location.enrichedFromBranch,
			).length,
			branch: locations.filter((location) => location.enrichedFromBranch)
				.length,
			pending: locations.filter(
				(location) => location.hasMasterRecord === false,
			).length,
			mock: locations.filter((location) => location.isMock).length,
		};
	}, [locations]);

	return (
		<Card
			className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200"
			data-tour="locations-table"
		>
			<CardHeader className="border-b border-slate-200 bg-white">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex items-start gap-3">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
							<Map className="h-6 w-6" />
						</div>
						<div>
							<CardTitle className="text-xl font-bold text-slate-950">
								Available Locations
							</CardTitle>
							<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
								UN/LOCODE coverage used to decide where agents can pick up or
								return vehicles before pricing is requested.
							</p>
						</div>
					</div>
					<Button
						data-tour="locations-refresh"
						onClick={() => loadLocations()}
						loading={isLoadingLocations}
						variant="secondary"
						size="sm"
						className="rounded-full shadow-sm"
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh coverage
					</Button>
				</div>

				<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Rows
						</p>
						<p className="mt-1 text-2xl font-bold text-slate-950">
							{stats.total}
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
							Gloria master
						</p>
						<p className="mt-1 text-2xl font-bold text-emerald-950">
							{stats.master}
						</p>
					</div>
					<div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-blue-700">
							Branch filled
						</p>
						<p className="mt-1 text-2xl font-bold text-blue-950">
							{stats.branch}
						</p>
					</div>
					<div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-amber-700">
							Pending
						</p>
						<p className="mt-1 text-2xl font-bold text-amber-950">
							{stats.pending}
						</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-white p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Data mode
						</p>
						<p className="mt-1 text-sm font-bold text-slate-950">
							{stats.mock > 0 ? `${stats.mock} mock row(s)` : "Live"}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-5">
				<div
					className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4"
					data-tour="locations-about"
				>
					<div className="flex items-start gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
							<Globe2 className="h-4 w-4" />
						</div>
						<div>
							<p className="text-sm font-bold text-blue-950">
								How to read this table
							</p>
							<p className="mt-1 text-sm leading-6 text-blue-800">
								{agreementFilterActive ? (
									<>
										You are viewing coverage allowed for the selected agreement.
										Rows can include agreement overrides plus inherited source
										coverage.
										{listMeta?.inherited ? (
											<span className="mt-1 block font-semibold">
												No dedicated source rows exist yet, so the global
												UN/LOCODE list is shown in inherited mode.
											</span>
										) : null}
									</>
								) : (
									<>
										Rows are your source coverage from syncs/imports. “Gloria”
										means the code exists in the master location table, “Branch”
										means display data came from an imported branch, and
										“Pending” means the code still needs a master/branch match.
									</>
								)}
							</p>
						</div>
					</div>
				</div>

				{isLoadingLocations ? (
					<div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
						<RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
						<h3 className="mt-4 text-lg font-bold text-slate-950">
							Loading coverage
						</h3>
						<p className="mt-2 text-sm text-slate-600">
							Fetching your latest location rows…
						</p>
					</div>
				) : showLocations && locations.length > 0 ? (
					<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
											Location
										</th>
										<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
											Country / IATA
										</th>
										<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
											Coordinates
										</th>
										<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
											Master source
										</th>
										<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
											Data
										</th>
										{showLinkedCol && (
											<th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
												Linked
											</th>
										)}
										{showRemoveButton && (
											<th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
												Actions
											</th>
										)}
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{locations.map((location) => {
										const coords = formatCoordinates(location);
										return (
											<tr
												key={location.unlocode}
												className="transition hover:bg-blue-50/40"
											>
												<td className="px-5 py-4 align-top">
													<div className="flex items-start gap-3">
														<div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
															<MapPin className="h-4 w-4" />
														</div>
														<div className="min-w-0">
															<code className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">
																{location.unlocode || "—"}
															</code>
															<p className="mt-2 max-w-xs truncate text-sm font-semibold text-slate-950">
																{location.place || "Unnamed location"}
															</p>
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="flex flex-wrap gap-2">
														{location.country ? (
															<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
																{location.country}
															</span>
														) : (
															<span className="text-xs text-slate-400">
																No country
															</span>
														)}
														{location.iata_code ? (
															<span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
																IATA {location.iata_code}
															</span>
														) : null}
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													{coords ? (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
															<Navigation className="h-3.5 w-3.5" />
															{coords}
														</span>
													) : (
														<span className="text-xs text-slate-400">
															Missing
														</span>
													)}
												</td>
												<td className="px-5 py-4 align-top">
													{masterBadge(location)}
												</td>
												<td className="px-5 py-4 align-top">
													{location.isMock ? (
														<Badge variant="info" className="rounded-full">
															Mock
														</Badge>
													) : (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
															<CheckCircle2 className="h-3.5 w-3.5" /> Live
														</span>
													)}
												</td>
												{showLinkedCol && (
													<td className="px-5 py-4 align-top text-xs text-slate-600">
														<span className="inline-flex items-center gap-1.5">
															<Clock className="h-3.5 w-3.5 text-slate-400" />
															{formatLinkedAt(location.synced_at)}
														</span>
													</td>
												)}
												{showRemoveButton && (
													<td className="px-5 py-4 text-right align-top">
														<Button
															onClick={() =>
																handleRemoveLocation(
																	location.unlocode,
																	location.place,
																)
															}
															loading={removeLocationMutation.isPending}
															variant="secondary"
															size="sm"
															className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
														>
															<Trash2 className="mr-1.5 h-4 w-4" />
															Remove
														</Button>
													</td>
												)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				) : showLocations ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
						<MapPin className="mx-auto h-10 w-10 text-slate-400" />
						<h3 className="mt-4 text-lg font-bold text-slate-950">
							No locations found
						</h3>
						<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
							No coverage rows matched this view. Try a different agreement,
							sync/import coverage, or request a missing location above.
						</p>
						<Button
							onClick={() => loadLocations()}
							variant="secondary"
							size="sm"
							className="mt-5 rounded-full"
						>
							<RefreshCw className="mr-2 h-4 w-4" /> Try loading again
						</Button>
					</div>
				) : (
					<div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center">
						<Search className="mx-auto h-10 w-10 text-blue-500" />
						<h3 className="mt-4 text-lg font-bold text-blue-950">
							Ready to load coverage
						</h3>
						<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-800">
							Choose an agreement filter if needed, then load the table to view
							available pickup and return locations.
						</p>
						<Button
							onClick={() => loadLocations()}
							variant="primary"
							size="sm"
							className="mt-5 rounded-full"
						>
							<ExternalLink className="mr-2 h-4 w-4" /> Load locations
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
