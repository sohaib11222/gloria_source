import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Loader } from "./ui/Loader";
import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Eye,
	FileText,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import api from "../lib/api";
import { AgreementDetailModal } from "./AgreementDetailModal";

interface Agreement {
	id: string;
	agentId: string;
	sourceId: string;
	agreementRef: string;
	status:
		| "DRAFT"
		| "OFFERED"
		| "ACCEPTED"
		| "ACTIVE"
		| "SUSPENDED"
		| "EXPIRED"
		| "REJECTED";
	validFrom: string;
	validTo: string;
	createdAt: string;
	updatedAt: string;
	agent?: {
		id: string;
		companyName: string;
		email: string;
		status: string;
	};
	source?: {
		id: string;
		companyName: string;
		email: string;
		status: string;
	};
}

interface MyAgreementsProps {
	user: any;
}

const STATUSES = [
	"ALL",
	"DRAFT",
	"OFFERED",
	"ACCEPTED",
	"ACTIVE",
	"SUSPENDED",
	"EXPIRED",
	"REJECTED",
] as const;

type StatusFilter = (typeof STATUSES)[number];

function statusVariant(
	status?: string,
): "default" | "success" | "warning" | "danger" | "info" {
	switch ((status || "").toUpperCase()) {
		case "ACTIVE":
		case "ACCEPTED":
			return "success";
		case "OFFERED":
		case "DRAFT":
			return "warning";
		case "SUSPENDED":
		case "EXPIRED":
		case "REJECTED":
			return "danger";
		default:
			return "info";
	}
}

function formatDate(value?: string) {
	if (!value) return "Not set";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Not set";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatDateTime(value?: string) {
	if (!value) return "Not set";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Not set";
	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function isLiveAgreement(status?: string) {
	const upper = (status || "").toUpperCase();
	return upper === "ACTIVE" || upper === "ACCEPTED";
}

export const MyAgreements: React.FC<MyAgreementsProps> = ({ user }) => {
	const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
		null,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

	const {
		data: agreementsData,
		isLoading,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["my-agreements"],
		queryFn: async () => {
			const response = await api.get("/agreements", {
				params: { scope: "source" },
			});
			return response.data;
		},
		enabled: !!user?.company?.id,
		refetchInterval: 30000,
		placeholderData: (previousData) => previousData,
	});

	const agreements: Agreement[] = (agreementsData?.items || []) as Agreement[];

	const statusCounts = useMemo(() => {
		const counts: Record<StatusFilter, number> = {
			ALL: agreements.length,
			DRAFT: 0,
			OFFERED: 0,
			ACCEPTED: 0,
			ACTIVE: 0,
			SUSPENDED: 0,
			EXPIRED: 0,
			REJECTED: 0,
		};

		agreements.forEach((agreement) => {
			const status = (agreement.status || "DRAFT") as StatusFilter;
			if (status in counts) counts[status] += 1;
		});

		return counts;
	}, [agreements]);

	const filteredAgreements = useMemo(() => {
		if (statusFilter === "ALL") return agreements;
		return agreements.filter((agreement) => agreement.status === statusFilter);
	}, [agreements, statusFilter]);

	const liveCount = agreements.filter((agreement) =>
		isLiveAgreement(agreement.status),
	).length;
	const pendingCount = agreements.filter((agreement) =>
		["DRAFT", "OFFERED"].includes(agreement.status),
	).length;
	const attentionCount = agreements.filter((agreement) =>
		["SUSPENDED", "EXPIRED", "REJECTED"].includes(agreement.status),
	).length;

	const handleViewAgreement = (agreementId: string) => {
		setSelectedAgreementId(agreementId);
		setIsModalOpen(true);
	};

	const isInitialLoading = isLoading && !agreementsData;

	return (
		<div className="space-y-6 animate-in fade-in duration-200">
			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div className="flex items-start gap-4">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-100 ring-1 ring-white/15">
								<ShieldCheck className="h-6 w-6" />
							</div>
							<div>
								<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
									Source agreements
								</div>
								<CardTitle className="text-2xl font-bold text-white">
									Agreement workspace
								</CardTitle>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
									Track every agent agreement connected to your Source company.
									Use this view to confirm who can search, quote, and book your
									supply.
								</p>
							</div>
						</div>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => refetch()}
							className="border-white/15 bg-white/10 text-white hover:bg-white/20"
						>
							<RefreshCw
								className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-2xl border border-white/10 bg-white/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
								Total agreements
							</p>
							<p className="mt-2 text-3xl font-bold text-white">
								{agreements.length}
							</p>
						</div>
						<div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
								Live / accepted
							</p>
							<p className="mt-2 text-3xl font-bold text-white">{liveCount}</p>
						</div>
						<div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-amber-100">
								Pending work
							</p>
							<p className="mt-2 text-3xl font-bold text-white">
								{pendingCount}
							</p>
						</div>
						<div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-rose-100">
								Needs attention
							</p>
							<p className="mt-2 text-3xl font-bold text-white">
								{attentionCount}
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
						<div className="grid gap-3 md:grid-cols-3">
							<div className="rounded-2xl border border-blue-100 bg-white p-4">
								<div className="flex items-center gap-2 text-sm font-bold text-blue-950">
									<FileText className="h-4 w-4 text-blue-600" /> 1. Agreement is
									assigned
								</div>
								<p className="mt-2 text-xs leading-5 text-slate-600">
									The commercial agreement reference is provisioned for one
									agent and your Source company.
								</p>
							</div>
							<div className="rounded-2xl border border-amber-100 bg-white p-4">
								<div className="flex items-center gap-2 text-sm font-bold text-amber-950">
									<Clock className="h-4 w-4 text-amber-600" /> 2. Signing /
									acceptance
								</div>
								<p className="mt-2 text-xs leading-5 text-slate-600">
									External signing or admin review moves the agreement from
									draft/offered into accepted or active state.
								</p>
							</div>
							<div className="rounded-2xl border border-emerald-100 bg-white p-4">
								<div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
									<CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3. Agent
									can trade
								</div>
								<p className="mt-2 text-xs leading-5 text-slate-600">
									Accepted/active agreements are used by search, pricing,
									booking, cancellation, and status flows.
								</p>
							</div>
						</div>
					</div>

					<div className="p-4 sm:p-5">
						<div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<h3 className="text-lg font-bold text-slate-950">
									Your agreement references
								</h3>
								<p className="mt-1 text-sm text-slate-600">
									Filter by status, then open an agreement to inspect its
									validity window and connected agent.
								</p>
							</div>
							{isFetching && !isInitialLoading && (
								<span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
									<RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating…
								</span>
							)}
						</div>

						<div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1">
							{STATUSES.map((status) => {
								const active = statusFilter === status;
								return (
									<button
										key={status}
										onClick={() => setStatusFilter(status)}
										className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
											active
												? "bg-slate-900 text-white shadow-sm"
												: "text-slate-600 hover:bg-white hover:text-slate-950"
										}`}
									>
										{status === "ALL" ? "All" : status}
										{statusCounts[status] > 0 && (
											<span
												className={`ml-2 rounded-full px-2 py-0.5 ${active ? "bg-white/15 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
											>
												{statusCounts[status]}
											</span>
										)}
									</button>
								);
							})}
						</div>

						{isInitialLoading ? (
							<div className="flex justify-center py-16">
								<Loader size="lg" />
							</div>
						) : filteredAgreements.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
									<FileText className="h-8 w-8 text-slate-400" />
								</div>
								<h3 className="text-lg font-bold text-slate-950">
									No agreements found
								</h3>
								<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
									{statusFilter === "ALL"
										? "No agreement references are connected yet. Coordinate externally with an agent or admin, then refresh this page when the reference is provisioned."
										: `No agreements currently have the ${statusFilter} status. Try another filter or refresh the list.`}
								</p>
							</div>
						) : (
							<div className="grid gap-4">
								{filteredAgreements.map((agreement) => (
									<button
										key={agreement.id}
										type="button"
										onClick={() => handleViewAgreement(agreement.id)}
										className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
									>
										<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-3">
													<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
														<FileText className="h-5 w-5" />
													</div>
													<div className="min-w-0">
														<p className="truncate text-lg font-bold text-slate-950 group-hover:text-blue-800">
															{agreement.agreementRef}
														</p>
														<p className="text-xs text-slate-500">
															ID {agreement.id.slice(0, 12)}…
														</p>
													</div>
													<Badge
														variant={statusVariant(agreement.status)}
														size="sm"
														className="uppercase tracking-wide"
													>
														{agreement.status}
													</Badge>
												</div>

												<div className="mt-4 grid gap-3 md:grid-cols-3">
													<div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
														<div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
															<Building2 className="h-3.5 w-3.5" /> Agent
														</div>
														<p className="truncate text-sm font-semibold text-slate-950">
															{agreement.agent?.companyName ||
																agreement.agentId ||
																"Unknown agent"}
														</p>
														{agreement.agent?.email && (
															<p className="mt-1 truncate text-xs text-slate-500">
																{agreement.agent.email}
															</p>
														)}
													</div>
													<div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
														<div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
															<Calendar className="h-3.5 w-3.5" /> Valid window
														</div>
														<p className="text-sm font-semibold text-slate-950">
															{formatDate(agreement.validFrom)}
														</p>
														<p className="mt-1 text-xs text-slate-500">
															to {formatDate(agreement.validTo)}
														</p>
													</div>
													<div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
														<div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
															<Clock className="h-3.5 w-3.5" /> Last update
														</div>
														<p className="text-sm font-semibold text-slate-950">
															{formatDateTime(agreement.updatedAt)}
														</p>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 text-sm font-bold text-blue-700">
												<Eye className="h-4 w-4" /> View details
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{attentionCount > 0 && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
						<p>
							Some agreements need attention. Open each suspended, expired, or
							rejected agreement to review the connected agent and coordinate
							the next step.
						</p>
					</div>
				</div>
			)}

			<AgreementDetailModal
				agreementId={selectedAgreementId}
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedAgreementId(null);
				}}
			/>
		</div>
	);
};
