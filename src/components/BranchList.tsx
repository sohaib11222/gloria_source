import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Search,
	Edit,
	MapPin,
	X,
	Plus,
	Filter,
	Store,
	Building2,
	Upload,
	RefreshCw,
	Phone,
	Clock,
	ChevronDown,
	ChevronUp,
	Plane,
	Navigation,
	Info,
	Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import { Loader } from "./ui/Loader";
import { branchesApi, Branch } from "../api/branches";
import { endpointsApi } from "../api/endpoints";
import { BranchCreateModal } from "./BranchCreateModal";
import { BranchUploadModal } from "./BranchUploadModal";
import { ValidationErrorsDisplay } from "./ValidationErrorsDisplay";
import { Modal } from "./ui/Modal";
import toast from "react-hot-toast";
import { ImportBranchesResponse } from "../api/endpoints";
import { BranchQuotaExceededPayload } from "../api/subscription";
import {
	BRANCH_DAYS,
	extractWeekOpeningHours,
	formatDayHoursLabelForDay,
} from "../lib/branchOpeningHours";

const PLAN_REQUIRED_TITLE = "Select a plan to continue.";

function getOpeningHours(branch: Branch): Record<string, string> | null {
	const week = extractWeekOpeningHours(
		branch.rawJson as Record<string, unknown> | null | undefined,
	);
	const result: Record<string, string> = {};
	for (const day of BRANCH_DAYS) {
		const label = formatDayHoursLabelForDay(day, week[day]);
		if (label !== "—") result[day] = label;
	}
	return Object.keys(result).length > 0 ? result : null;
}

function getPickupInstructions(branch: Branch): string | null {
	const raw = branch.rawJson;
	if (!raw) return null;
	const pi =
		raw.PickupInstructions ||
		raw.pickupInstructions ||
		raw.LocationDetail?.PickupInstructions;
	if (!pi) return null;
	if (typeof pi === "string") return pi;
	return (
		pi?.attr?.Pickup ||
		pi?.["@_Pickup"] ||
		pi?.["@attributes"]?.Pickup ||
		pi?.Pickup ||
		null
	);
}

function getAtAirport(branch: Branch): boolean | null {
	const raw = branch.rawJson;
	if (!raw) return null;
	const val =
		raw.AtAirport ??
		raw.atAirport ??
		raw.attr?.AtAirport ??
		raw["@_AtAirport"] ??
		raw["@attributes"]?.AtAirport ??
		raw.LocationDetail?.["@_AtAirport"] ??
		null;
	if (val === "true" || val === true) return true;
	if (val === "false" || val === false) return false;
	return null;
}

const DAY_SHORT: Record<string, string> = {
	monday: "Mon",
	tuesday: "Tue",
	wednesday: "Wed",
	thursday: "Thu",
	friday: "Fri",
	saturday: "Sat",
	sunday: "Sun",
};

const formatDisplayValue = (value?: string | number | null) => {
	const text = value == null ? "" : String(value).trim();
	return text || "—";
};

const formatLabel = (value?: string | null) => {
	const text = value?.trim();
	if (!text) return "—";
	return text
		.replace(/[_-]+/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusVariant = (
	status?: string | null,
): "default" | "success" | "warning" | "danger" | "info" => {
	const normalized = status?.toUpperCase();
	if (normalized === "ACTIVE") return "success";
	if (normalized === "INACTIVE" || normalized === "DISABLED") return "danger";
	if (normalized === "PENDING") return "warning";
	return "default";
};

const getBranchTypeLabels = (branch: Branch) => {
	const atAirport = getAtAirport(branch);
	const labels: string[] = [];

	if (atAirport === true) labels.push("Airport");

	const locationType = branch.locationType?.trim();
	if (locationType && locationType.toUpperCase() !== "AIRPORT") {
		labels.push(formatLabel(locationType));
	}

	const collectionType = branch.collectionType?.trim();
	if (collectionType) {
		const label = formatLabel(collectionType);
		if (!labels.some((item) => item.toLowerCase() === label.toLowerCase())) {
			labels.push(label);
		}
	}

	if (labels.length === 0 && atAirport === false) labels.push("Non-airport");
	return labels;
};

const DetailCard: React.FC<{
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}> = ({ title, icon, children, className = "" }) => (
	<div
		className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}
	>
		<div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
			<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
				{icon}
			</span>
			{title}
		</div>
		<div className="space-y-1 text-sm leading-6 text-slate-700">{children}</div>
	</div>
);

const BranchTable: React.FC<{
	branches: Branch[];
	onEdit?: (branch: Branch) => void;
	subscriptionActive: boolean;
}> = ({ branches, onEdit, subscriptionActive }) => {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
			<div className="overflow-x-auto">
				<table className="min-w-[1080px] w-full divide-y divide-slate-200">
					<thead className="bg-slate-50">
						<tr>
							<th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Details
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Branch
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Location
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Contact
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Type
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								Status
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
								LOCODE
							</th>
							<th className="w-24 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200 bg-white">
						{branches.map((branch) => {
							const isExpanded = expandedId === branch.id;
							const atAirport = getAtAirport(branch);
							const hours = getOpeningHours(branch);
							const pickup = getPickupInstructions(branch);
							const typeLabels = getBranchTypeLabels(branch);
							const addressParts = [
								branch.city,
								branch.postalCode,
								branch.country || branch.countryCode,
							].filter(Boolean);
							const hasCoordinates =
								branch.latitude != null || branch.longitude != null;
							const hasAddress = Boolean(
								branch.addressLine ||
									branch.city ||
									branch.postalCode ||
									branch.country ||
									branch.countryCode,
							);
							const hasContact = Boolean(branch.phone || branch.email);
							const hasOperationalDetails = Boolean(
								hours ||
									pickup ||
									hasCoordinates ||
									hasAddress ||
									hasContact ||
									typeLabels.length > 0,
							);

							return (
								<React.Fragment key={branch.id}>
									<tr
										className={`${isExpanded ? "bg-blue-50/40" : "bg-white"} transition-colors hover:bg-slate-50`}
									>
										<td className="px-4 py-4 align-top">
											<button
												type="button"
												onClick={() =>
													hasOperationalDetails &&
													setExpandedId(isExpanded ? null : branch.id)
												}
												disabled={!hasOperationalDetails}
												className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
												aria-label={
													isExpanded
														? "Hide branch details"
														: "Show branch details"
												}
											>
												{isExpanded ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
											</button>
										</td>
										<td className="px-4 py-4 align-top">
											<div className="flex items-start gap-3">
												<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
													<Store className="h-5 w-5" />
												</span>
												<div className="min-w-0">
													<code className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
														{formatDisplayValue(branch.branchCode)}
													</code>
													<p
														className="mt-2 max-w-[260px] truncate text-sm font-semibold text-slate-950"
														title={branch.name || undefined}
													>
														{formatDisplayValue(branch.name)}
													</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-4 align-top">
											<div className="space-y-2">
												<div className="flex flex-wrap items-center gap-2">
													{branch.countryCode ? (
														<Badge
															variant="info"
															size="sm"
															className="font-mono uppercase"
														>
															{branch.countryCode}
														</Badge>
													) : null}
													<span className="text-sm font-medium text-slate-900">
														{formatDisplayValue(branch.city)}
													</span>
												</div>
												{branch.addressLine ? (
													<p
														className="max-w-[280px] truncate text-xs text-slate-500"
														title={branch.addressLine}
													>
														{branch.addressLine}
													</p>
												) : null}
												{!branch.addressLine && branch.country ? (
													<p className="text-xs text-slate-500">
														{branch.country}
													</p>
												) : null}
											</div>
										</td>
										<td className="px-4 py-4 align-top">
											<div className="space-y-1.5 text-xs text-slate-600">
												{branch.phone ? (
													<div className="flex items-center gap-1.5 whitespace-nowrap">
														<Phone className="h-3.5 w-3.5 text-slate-400" />
														<span>{branch.phone}</span>
													</div>
												) : null}
												{branch.email ? (
													<div className="flex items-center gap-1.5">
														<Mail className="h-3.5 w-3.5 flex-none text-slate-400" />
														<span
															className="max-w-[220px] truncate"
															title={branch.email}
														>
															{branch.email}
														</span>
													</div>
												) : null}
												{!branch.phone && !branch.email ? (
													<span className="text-slate-400">—</span>
												) : null}
											</div>
										</td>
										<td className="px-4 py-4 align-top">
											{typeLabels.length > 0 ? (
												<div className="flex max-w-[220px] flex-wrap gap-1.5">
													{typeLabels.map((label) => (
														<Badge
															key={label}
															variant={
																label.toLowerCase().includes("airport")
																	? "info"
																	: "default"
															}
															size="sm"
														>
															{label}
														</Badge>
													))}
												</div>
											) : (
												<span className="text-sm text-slate-400">—</span>
											)}
											{atAirport === true ? (
												<p className="mt-1 text-[11px] font-medium text-blue-700">
													Airport pickup location
												</p>
											) : null}
										</td>
										<td className="px-4 py-4 align-top">
											<Badge
												variant={getStatusVariant(branch.status)}
												size="sm"
												className="uppercase tracking-wide"
											>
												{branch.status ? formatLabel(branch.status) : "Unknown"}
											</Badge>
										</td>
										<td className="px-4 py-4 align-top">
											{branch.natoLocode ? (
												<Badge
													variant="info"
													size="sm"
													className="font-mono uppercase"
												>
													{branch.natoLocode}
												</Badge>
											) : (
												<Badge variant="warning" size="sm">
													Unmapped
												</Badge>
											)}
										</td>
										<td className="px-4 py-4 align-top text-right">
											<div className="flex justify-end gap-2">
												{onEdit && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onEdit(branch)}
														disabled={!subscriptionActive}
														title={
															!subscriptionActive
																? PLAN_REQUIRED_TITLE
																: "Edit branch"
														}
														className="rounded-md hover:bg-blue-50 hover:text-blue-700"
													>
														<Edit className="w-4 h-4" />
													</Button>
												)}
											</div>
										</td>
									</tr>
									{isExpanded && (
										<tr className="bg-slate-50">
											<td colSpan={8} className="px-4 pb-5 pt-0">
												<div className="rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 p-4">
													<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
														<div>
															<h4 className="text-sm font-semibold text-slate-950">
																Branch details
															</h4>
															<p className="text-xs text-slate-500">
																Complete imported branch record for{" "}
																{formatDisplayValue(branch.branchCode)}
															</p>
														</div>
														{branch.natoLocode ? (
															<Badge
																variant="info"
																size="sm"
																className="font-mono uppercase"
															>
																Mapped to {branch.natoLocode}
															</Badge>
														) : null}
													</div>
													<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
														{hasAddress && (
															<DetailCard
																title="Address"
																icon={<MapPin className="h-4 w-4" />}
															>
																{branch.addressLine ? (
																	<p className="font-medium text-slate-900">
																		{branch.addressLine}
																	</p>
																) : null}
																{addressParts.length > 0 ? (
																	<p>{addressParts.join(", ")}</p>
																) : null}
																{branch.country && branch.countryCode ? (
																	<p className="text-xs text-slate-500">
																		Country code: {branch.countryCode}
																	</p>
																) : null}
															</DetailCard>
														)}

														{hasContact && (
															<DetailCard
																title="Contact"
																icon={<Phone className="h-4 w-4" />}
															>
																{branch.phone ? (
																	<p className="font-medium text-slate-900">
																		{branch.phone}
																	</p>
																) : null}
																{branch.email ? (
																	<p className="break-all text-slate-600">
																		{branch.email}
																	</p>
																) : null}
															</DetailCard>
														)}

														{hasCoordinates && (
															<DetailCard
																title="Coordinates"
																icon={<Navigation className="h-4 w-4" />}
															>
																<p className="font-mono text-xs text-slate-900">
																	{branch.latitude != null
																		? branch.latitude.toFixed(6)
																		: "—"}
																	,{" "}
																	{branch.longitude != null
																		? branch.longitude.toFixed(6)
																		: "—"}
																</p>
															</DetailCard>
														)}

														{typeLabels.length > 0 && (
															<DetailCard
																title="Branch type"
																icon={
																	atAirport === true ? (
																		<Plane className="h-4 w-4" />
																	) : (
																		<Store className="h-4 w-4" />
																	)
																}
															>
																<div className="flex flex-wrap gap-1.5">
																	{typeLabels.map((label) => (
																		<Badge
																			key={label}
																			variant={
																				label.toLowerCase().includes("airport")
																					? "info"
																					: "default"
																			}
																			size="sm"
																		>
																			{label}
																		</Badge>
																	))}
																</div>
															</DetailCard>
														)}

														{hours && (
															<DetailCard
																title="Opening hours"
																icon={<Clock className="h-4 w-4" />}
																className="md:col-span-2"
															>
																<div className="grid gap-2 sm:grid-cols-2">
																	{Object.entries(hours).map(([day, time]) => (
																		<div
																			key={day}
																			className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
																		>
																			<span className="font-semibold text-slate-600">
																				{DAY_SHORT[day] || formatLabel(day)}
																			</span>
																			<span className="font-medium text-slate-900">
																				{time}
																			</span>
																		</div>
																	))}
																</div>
															</DetailCard>
														)}

														{pickup && (
															<DetailCard
																title="Pickup instructions"
																icon={<Info className="h-4 w-4" />}
																className="md:col-span-2 xl:col-span-4"
															>
																<p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
																	{pickup}
																</p>
															</DetailCard>
														)}
													</div>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

interface BranchListProps {
	subscriptionActive?: boolean;
	onEdit?: (branch: Branch) => void;
	onQuotaExceeded?: (
		payload: BranchQuotaExceededPayload,
		retry: () => Promise<void>,
	) => void;
	onRequirePlan?: (action: string, description?: string) => void;
	hideHeader?: boolean; // When true, hides the CardHeader with title and action buttons
	createModalOpen?: boolean;
	onCreateModalOpenChange?: (open: boolean) => void;
}

export const BranchList: React.FC<BranchListProps> = ({
	subscriptionActive = true,
	onEdit,
	onQuotaExceeded,
	onRequirePlan,
	hideHeader = false,
	createModalOpen,
	onCreateModalOpenChange,
}) => {
	const [filters, setFilters] = useState({
		status: "",
		search: "",
	});
	const [searchInput, setSearchInput] = useState("");
	const [page, setPage] = useState(0);
	const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false);
	const isCreateModalControlled =
		createModalOpen !== undefined && onCreateModalOpenChange !== undefined;
	const isCreateModalOpen = isCreateModalControlled
		? createModalOpen
		: internalCreateModalOpen;
	const setIsCreateModalOpen = (open: boolean) => {
		if (isCreateModalControlled) onCreateModalOpenChange(open);
		else setInternalCreateModalOpen(open);
	};
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [showImportResult, setShowImportResult] = useState(false);
	const [importResult, setImportResult] =
		useState<ImportBranchesResponse | null>(null);
	const limit = 25;

	const queryClient = useQueryClient();

	const requirePlan = (action: string, description?: string) => {
		if (subscriptionActive) return true;
		onRequirePlan?.(action, description);
		if (!onRequirePlan) toast.error(PLAN_REQUIRED_TITLE);
		return false;
	};

	// Load endpoint configuration
	const { data: endpointConfig } = useQuery({
		queryKey: ["endpointConfig"],
		queryFn: () => endpointsApi.getConfig(),
	});

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setFilters((prev) => ({ ...prev, search: searchInput }));
			setPage(0);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: branchesData, isLoading } = useQuery({
		queryKey: ["branches", filters, page],
		queryFn: () =>
			branchesApi.listBranches({
				...filters,
				limit,
				offset: page * limit,
			}),
	});

	const clearFilters = () => {
		setFilters({
			status: "",
			search: "",
		});
		setSearchInput("");
		setPage(0);
	};

	const branchTotal = branchesData?.total ?? 0;
	const branchCountLabel = isLoading
		? "Loading branches…"
		: `${branchTotal} branch${branchTotal !== 1 ? "es" : ""}`;
	const branchRangeLabel =
		!isLoading && branchTotal > 0
			? `Showing ${page * limit + 1}–${Math.min((page + 1) * limit, branchTotal)} of ${branchTotal}`
			: null;

	const hasActiveFilters = useMemo(() => {
		return Object.values(filters).some((v) => v !== "");
	}, [filters]);

	const importBranchesMutation = useMutation({
		mutationFn: async () => {
			try {
				const response = await endpointsApi.importBranches();
				return response;
			} catch (error: any) {
				// Handle 422 responses - backend now returns 200, but keep this for backwards compatibility
				if (error.response?.status === 422 && error.response?.data) {
					// Extract the response data - it contains summary and validationErrors
					const data = error.response.data;
					console.warn(
						"[BranchList] Received 422 response (should be 200 now):",
						data,
					);
					return {
						...data,
						summary: data.summary || {
							total: data.total || 0,
							valid: 0,
							invalid:
								data.summary?.invalid || data.validationErrors?.length || 0,
							imported: data.summary?.imported || data.imported || 0,
							updated: data.summary?.updated || data.updated || 0,
							skipped: data.summary?.skipped || data.skipped || 0,
						},
						validationErrors:
							data.validationErrors || data.invalidDetails || [],
					};
				}
				// Re-throw other errors
				throw error;
			}
		},
		onSuccess: (data) => {
			// Debug logging
			console.log("[BranchList] Import result:", data);

			// Get validation errors and invalid count from backend
			const invalidCount =
				data.summary?.invalid || data.validationErrors?.length || 0;
			const validationErrors =
				data.validationErrors || data.invalidDetails || [];

			console.log("[BranchList] Validation errors from backend:", {
				invalidCount,
				validationErrorsCount: validationErrors.length,
				validationErrors,
				summary: data.summary,
			});

			// Normalize the data structure - include validation errors even if branches were imported
			const normalizedData = {
				...data,
				validationErrors: validationErrors, // Always include validation errors if present
				summary: {
					total: data.summary?.total || data.total || 0,
					valid:
						data.summary?.valid ||
						Math.max(
							0,
							(data.summary?.total || data.total || 0) - invalidCount,
						),
					invalid: invalidCount, // Show actual invalid count from backend
					imported: data.summary?.imported || data.imported || 0,
					updated: data.summary?.updated || data.updated || 0,
					skipped: data.summary?.skipped || data.skipped || 0,
				},
			};

			console.log("[BranchList] Normalized data:", normalizedData);

			// Invalidate and refetch branches
			queryClient.invalidateQueries({ queryKey: ["branches"] });

			// Store result and show modal
			setImportResult(normalizedData);
			setShowImportResult(true);

			// Show appropriate toast based on result - use normalized summary
			const summary = normalizedData.summary;

			if (summary.imported + summary.updated > 0) {
				// Success (complete or partial)
				if (summary.skipped > 0) {
					toast.success(
						`Branches imported successfully! ${summary.imported} imported, ${summary.updated} updated, ${summary.skipped} skipped.`,
						{ duration: 5000 },
					);
				} else {
					toast.success(
						`Branches imported successfully! ${summary.imported} imported, ${summary.updated} updated.`,
						{ duration: 5000 },
					);
				}
			} else if (summary.skipped > 0) {
				// All skipped
				toast.warning(
					`Import completed but no branches were imported. ${summary.skipped} branch(es) were skipped.`,
					{ duration: 7000 },
				);
			} else {
				// No branches found
				toast.error(`No branches found to import.`, { duration: 5000 });
			}
		},
		onError: (error: any) => {
			console.error("Failed to import branches:", error);
			const status = error.response?.status;
			const data = error.response?.data || {};
			if (
				status === 402 &&
				data.error === "BRANCH_QUOTA_EXCEEDED" &&
				onQuotaExceeded
			) {
				onQuotaExceeded(data as BranchQuotaExceededPayload, () =>
					importBranchesMutation.mutateAsync(),
				);
				return;
			}
			const errorMessage =
				data.message ||
				error.message ||
				"Failed to import branches from endpoint";
			toast.error(errorMessage);
		},
		onSettled: () => {
			setIsImporting(false);
		},
	});

	const handleImportBranches = async () => {
		if (
			!requirePlan(
				"sync branches",
				"Branch sync writes endpoint data into Gloria. Choose a plan before importing or syncing branches.",
			)
		)
			return;
		setIsImporting(true);
		try {
			await importBranchesMutation.mutateAsync();
		} catch (error) {
			// Error handling is done in onError callback
		}
	};

	const handleUploadSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ["branches"] });
	};

	const handleCreateBranchSuccess = async () => {
		queryClient.invalidateQueries({ queryKey: ["branches"] });
		if (endpointConfig?.branchEndpointUrl) {
			try {
				await importBranchesMutation.mutateAsync();
				toast.success("Branch added and synced from endpoint");
			} catch {
				toast.success(
					"Branch added. Sync from endpoint failed or was skipped.",
				);
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* Filters */}
			<Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
				<CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b border-gray-200">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-white rounded-lg shadow-sm">
								<Filter className="w-5 h-5 text-purple-600" />
							</div>
							<div>
								<CardTitle className="text-xl font-bold text-gray-900">
									Filters
								</CardTitle>
								<p className="text-sm text-gray-600 mt-1">
									Filter branches by status or search branch details
									{!isLoading && branchTotal > 0 && branchRangeLabel ? (
										<span className="font-medium text-gray-800">
											{" "}
											· {branchRangeLabel}
										</span>
									) : null}
								</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2 sm:justify-end">
							<Badge
								variant={isLoading ? "default" : "info"}
								className="font-bold px-3 py-1 text-sm"
							>
								{branchCountLabel}
							</Badge>
							{hasActiveFilters && (
								<>
									<Badge variant="warning" className="font-bold">
										{Object.values(filters).filter((v) => v !== "").length}{" "}
										filter
										{Object.values(filters).filter((v) => v !== "").length !== 1
											? "s"
											: ""}{" "}
										active
									</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={clearFilters}
										className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
									>
										<X className="w-4 h-4" />
										Clear All
									</Button>
								</>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
							<div className="flex items-center gap-2 mb-3">
								<Building2 className="w-4 h-4 text-blue-600" />
								<label className="text-sm font-bold text-gray-700">
									Status
								</label>
							</div>
							<Select
								value={filters.status}
								onChange={(e) => {
									setFilters({ ...filters, status: e.target.value });
									setPage(0);
								}}
								options={[
									{ value: "", label: "All statuses" },
									{ value: "ACTIVE", label: "Active" },
									{ value: "INACTIVE", label: "Inactive" },
								]}
							/>
						</div>
						<div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
							<div className="flex items-center gap-2 mb-3">
								<Search className="w-4 h-4 text-green-600" />
								<label className="text-sm font-bold text-gray-700">
									Search
								</label>
							</div>
							<div className="relative">
								<Input
									placeholder="Branch code, name, or city..."
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									helperText={
										searchInput && searchInput !== filters.search
											? "Searching..."
											: undefined
									}
								/>
								<div className="absolute right-3 top-2.5 text-gray-400">
									<Search className="w-4 h-4" />
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Branches Table */}
			<Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
				{!hideHeader && (
					<CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<Store className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<CardTitle className="text-xl font-bold text-gray-900">
										Branches
									</CardTitle>
									<p className="text-sm text-gray-600 mt-1">
										{branchesData?.total ?? 0} branch
										{branchesData?.total !== 1 ? "es" : ""} found
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									data-tour="branches-upload-file"
									onClick={() => {
										if (
											!requirePlan(
												"upload branch file",
												"Uploading a branch file creates operational branch records. Choose a plan before uploading branches.",
											)
										)
											return;
										setIsUploadModalOpen(true);
									}}
									className="flex items-center gap-2 shadow-md hover:shadow-lg"
								>
									<Upload className="w-4 h-4" />
									Upload File
								</Button>
								<Button
									variant="secondary"
									size="sm"
									data-tour="branches-sync-endpoint"
									onClick={handleImportBranches}
									loading={isImporting}
									disabled={isImporting}
									className="flex items-center gap-2 shadow-md hover:shadow-lg"
									title="Sync branches from configured endpoint"
								>
									<RefreshCw
										className={`w-4 h-4 ${isImporting ? "animate-spin" : ""}`}
									/>
									Sync
								</Button>
								<Button
									variant="primary"
									size="sm"
									data-tour="branches-add-branch"
									onClick={() => {
										if (
											!requirePlan(
												"add a branch",
												"Adding a branch creates an operational branch record. Choose a plan before adding branches.",
											)
										)
											return;
										setIsCreateModalOpen(true);
									}}
									className="flex items-center gap-2 shadow-md hover:shadow-lg"
								>
									<Plus className="w-4 h-4" />
									Add Branch
								</Button>
							</div>
						</div>
					</CardHeader>
				)}
				<CardContent className="pt-6">
					{isLoading ? (
						<Loader className="min-h-48" />
					) : (
						<>
							{(branchesData?.items ?? []).length === 0 ? (
								<div className="text-center py-16">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
										<Store className="w-8 h-8 text-gray-400" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										No branches found
									</h3>
									<p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
										{hasActiveFilters
											? "Try adjusting your filters to see more results."
											: "Get started by uploading a file, syncing from your configured endpoint (Location & Branches), or creating a new branch."}
									</p>
									{!hasActiveFilters && (
										<div className="flex items-center justify-center gap-2">
											<Button
												variant="secondary"
												size="sm"
												onClick={() => {
													if (
														!requirePlan(
															"upload branch file",
															"Uploading a branch file creates operational branch records. Choose a plan before uploading branches.",
														)
													)
														return;
													setIsUploadModalOpen(true);
												}}
												title={
													!subscriptionActive ? PLAN_REQUIRED_TITLE : undefined
												}
												className="flex items-center gap-2"
											>
												<Upload className="w-4 h-4" />
												Upload File
											</Button>
											<Button
												variant="primary"
												size="sm"
												onClick={() => {
													if (
														!requirePlan(
															"add a branch",
															"Adding a branch creates an operational branch record. Choose a plan before adding branches.",
														)
													)
														return;
													setIsCreateModalOpen(true);
												}}
												title={
													!subscriptionActive ? PLAN_REQUIRED_TITLE : undefined
												}
												className="flex items-center gap-2"
											>
												<Plus className="w-4 h-4" />
												Add Branch
											</Button>
										</div>
									)}
								</div>
							) : (
								<BranchTable
									branches={branchesData?.items ?? []}
									onEdit={onEdit}
									subscriptionActive={subscriptionActive}
								/>
							)}

							{/* Pagination */}
							{branchesData && branchesData.total > limit && (
								<div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
									<div className="text-sm font-medium text-gray-700">
										Showing{" "}
										<span className="font-bold text-gray-900">
											{page * limit + 1}
										</span>{" "}
										to{" "}
										<span className="font-bold text-gray-900">
											{Math.min((page + 1) * limit, branchesData.total)}
										</span>{" "}
										of{" "}
										<span className="font-bold text-gray-900">
											{branchesData.total}
										</span>{" "}
										branches
									</div>
									<div className="flex gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={() => setPage((p) => Math.max(0, p - 1))}
											disabled={page === 0}
											className="shadow-sm hover:shadow-md"
										>
											Previous
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onClick={() => setPage((p) => p + 1)}
											disabled={!branchesData.hasMore}
											className="shadow-sm hover:shadow-md"
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Create Branch Modal */}
			<BranchCreateModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onSuccess={handleCreateBranchSuccess}
			/>

			{/* Upload Branches Modal */}
			<BranchUploadModal
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				onSuccess={handleUploadSuccess}
			/>

			{/* Import Results Modal */}
			<Modal
				isOpen={showImportResult && importResult !== null}
				onClose={() => {
					setShowImportResult(false);
					setImportResult(null);
				}}
				title="Import Results"
				size="xl"
			>
				{importResult && (
					<div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
						<ValidationErrorsDisplay
							summary={
								importResult.summary || {
									total: importResult.total || 0,
									valid:
										importResult.summary?.valid ||
										Math.max(
											0,
											(importResult.total || 0) -
												(importResult.summary?.invalid ||
													importResult.validationErrors?.length ||
													0),
										),
									invalid:
										importResult.summary?.invalid ||
										importResult.validationErrors?.length ||
										0,
									imported:
										importResult.summary?.imported ||
										importResult.imported ||
										0,
									updated:
										importResult.summary?.updated || importResult.updated || 0,
									skipped:
										importResult.summary?.skipped || importResult.skipped || 0,
								}
							}
							validationErrors={
								importResult.validationErrors ||
								importResult.invalidDetails ||
								[]
							}
							message={importResult.message || "Import completed"}
						/>
					</div>
				)}
			</Modal>
		</div>
	);
};
