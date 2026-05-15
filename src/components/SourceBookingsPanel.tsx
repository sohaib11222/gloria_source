import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Ban, CalendarRange, RefreshCw, Search } from "lucide-react";
import { sourceBookingsApi, SourceBookingView } from "../api/sourceBookings";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

function formatBookingTableDate(iso: string | null | undefined): string {
	if (!iso) return "—";
	try {
		return format(parseISO(iso), "dd/MM/yyyy HH:mm");
	} catch {
		return iso;
	}
}

function locLabel(unlocode: string | null | undefined): string {
	if (!unlocode) return "—";
	return unlocode;
}

export interface SourceBookingsPanelProps {
	view: SourceBookingView;
	title: string;
	description: string;
}

export const SourceBookingsPanel: React.FC<SourceBookingsPanelProps> = ({
	view,
	title,
	description,
}) => {
	const [search, setSearch] = useState("");

	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey: ["source-bookings", view],
		queryFn: () => sourceBookingsApi.list({ view, limit: 150, offset: 0 }),
	});

	const rows = data?.items ?? [];
	const cancelledCount = rows.filter(
		(b) => (b.status || "").toUpperCase() === "CANCELLED",
	).length;
	const activeCount = rows.length - cancelledCount;
	const uniqueAgents = new Set(
		rows.map((b) => b.agentCompanyName).filter(Boolean),
	).size;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((b) => {
			const hay = [
				b.id,
				b.supplierBookingRef,
				b.agentBookingRef,
				b.agreementRef,
				b.agentCompanyName,
				b.customerName,
				b.contact,
				b.pickupUnlocode,
				b.dropoffUnlocode,
				b.status,
				b.vehicleMakeModel,
				b.vehicleClass,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return hay.includes(q);
		});
	}, [rows, search]);

	const statusDot = (status: string) => {
		const s = (status || "").toUpperCase();
		const cancelled = s === "CANCELLED";
		return (
			<span
				className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${cancelled ? "bg-red-500" : "bg-emerald-500"}`}
				title={s}
				aria-label={s}
			/>
		);
	};

	const isCancellationView = view === "cancellations";
	const HeroIcon = isCancellationView ? Ban : CalendarRange;

	return (
		<div className="space-y-6">
			<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div
					className={`px-6 py-8 text-white sm:px-8 ${isCancellationView ? "bg-gradient-to-br from-slate-950 via-red-950 to-orange-950" : "bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950"}`}
				>
					<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div className="max-w-4xl">
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
								<HeroIcon className="h-3.5 w-3.5" /> Booking operations
							</div>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								{title}
							</h1>
							<p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
								{description}
							</p>
						</div>
						<Button
							type="button"
							variant="secondary"
							onClick={() => refetch()}
							disabled={isFetching}
							className="border-white/20 bg-white/10 text-white hover:bg-white/20"
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
					</div>
				</div>
				<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Loaded bookings
						</p>
						<p className="mt-2 text-lg font-bold text-blue-950">
							{rows.length}
						</p>
						<p className="mt-1 text-xs text-blue-700">
							From Gloria booking records
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Active
						</p>
						<p className="mt-2 text-lg font-bold text-emerald-950">
							{activeCount}
						</p>
						<p className="mt-1 text-xs text-emerald-700">Not cancelled</p>
					</div>
					<div className="rounded-2xl border border-red-100 bg-red-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-red-700">
							Cancelled
						</p>
						<p className="mt-2 text-lg font-bold text-red-950">
							{cancelledCount}
						</p>
						<p className="mt-1 text-xs text-red-700">Cancelled records</p>
					</div>
					<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							Agents
						</p>
						<p className="mt-2 text-lg font-bold text-slate-950">
							{uniqueAgents}
						</p>
						<p className="mt-1 text-xs text-slate-500">
							Unique booking partners
						</p>
					</div>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search ref, agent, customer, location…"
						className="pl-9"
					/>
				</div>
				<Button
					type="button"
					variant="secondary"
					onClick={() => refetch()}
					disabled={isFetching}
				>
					<RefreshCw
						className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
					/>
					Refresh
				</Button>
			</div>

			{error && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{String(
						(error as any)?.response?.data?.message ||
							(error instanceof Error ? error.message : "") ||
							"Failed to load bookings",
					)}
				</div>
			)}

			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
					<h2 className="text-lg font-bold text-slate-950">Booking list</h2>
					<p className="mt-1 text-sm text-slate-600">
						Search by reference, agent, customer, vehicle, status, or location
						code.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-[1100px] w-full text-sm">
						<thead>
							<tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
								<th className="px-3 py-2 w-8" />
								<th className="px-3 py-2 whitespace-nowrap">Created</th>
								<th className="px-3 py-2 whitespace-nowrap">Supplier ref</th>
								<th className="px-3 py-2 whitespace-nowrap">Pickup</th>
								<th className="px-3 py-2">Pickup loc</th>
								<th className="px-3 py-2 whitespace-nowrap">Return</th>
								<th className="px-3 py-2">Return loc</th>
								<th className="px-3 py-2">Customer</th>
								<th className="px-3 py-2">Contact</th>
								<th className="px-3 py-2">Agent</th>
								<th className="px-3 py-2 whitespace-nowrap">Agent ref</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{isLoading ? (
								<tr>
									<td
										colSpan={11}
										className="px-4 py-8 text-center text-gray-500"
									>
										Loading…
									</td>
								</tr>
							) : filtered.length === 0 ? (
								<tr>
									<td
										colSpan={11}
										className="px-4 py-8 text-center text-gray-500"
									>
										No bookings in this view yet. When an agent creates or
										cancels a booking against your source, it appears here
										automatically.
									</td>
								</tr>
							) : (
								filtered.map((b, idx) => {
									const rowBg =
										(b.status || "").toUpperCase() === "CANCELLED"
											? "bg-orange-50/80"
											: idx % 2 === 0
												? "bg-white"
												: "bg-slate-50/50";
									return (
										<tr
											key={b.id}
											className={`${rowBg} hover:bg-blue-50/50 transition-colors`}
										>
											<td className="px-3 py-2 align-middle">
												{statusDot(b.status)}
											</td>
											<td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
												{formatBookingTableDate(b.createdAt)}
											</td>
											<td className="px-3 py-2 font-mono text-blue-700 whitespace-nowrap">
												{b.supplierBookingRef || b.id.slice(0, 12)}
											</td>
											<td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
												{formatBookingTableDate(b.pickupDateTime)}
											</td>
											<td className="px-3 py-2 text-gray-800 max-w-[200px]">
												{locLabel(b.pickupUnlocode)}
											</td>
											<td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
												{formatBookingTableDate(b.dropoffDateTime)}
											</td>
											<td className="px-3 py-2 text-gray-800 max-w-[200px]">
												{locLabel(b.dropoffUnlocode)}
											</td>
											<td className="px-3 py-2 text-gray-900">
												{b.customerName || "—"}
											</td>
											<td className="px-3 py-2 text-gray-700 break-all max-w-[180px]">
												{b.contact || "—"}
											</td>
											<td className="px-3 py-2 text-gray-900 font-medium">
												{b.agentCompanyName}
											</td>
											<td className="px-3 py-2 font-mono text-xs text-gray-600 whitespace-nowrap">
												{b.agentBookingRef || "—"}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{!isLoading && rows.length > 0 && (
				<p className="text-xs text-gray-500">
					Showing {filtered.length} of {rows.length} loaded
					{data?.total != null && data.total > rows.length
						? ` (${data.total} total)`
						: ""}
					.
				</p>
			)}
		</div>
	);
};
