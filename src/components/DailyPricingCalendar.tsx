import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Loader } from "./ui/Loader";
import toast from "react-hot-toast";
import { CalendarDays, Database } from "lucide-react";
import { endpointsApi, StoredAvailabilitySample } from "../api/endpoints";

function formatDateInput(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function isoDateOnly(iso: string | undefined | null): string {
	if (!iso || typeof iso !== "string") return "";
	const s = iso.trim();
	if (s.length >= 10) return s.slice(0, 10);
	return "";
}

function buildSampleLabel(s: StoredAvailabilitySample, index: number): string {
	const n = s.offersSummary?.length ?? 0;
	const offer = s.offersSummary?.[0];
	const ac = offer?.vehicle_class || "—";
	const price =
		offer != null && offer.total_price != null
			? `${offer.total_price} ${offer.currency || ""}`.trim()
			: "";
	const when = s.fetchedAt
		? format(parseISO(s.fetchedAt), "dd/MM/yyyy HH:mm")
		: "";
	const multi = n > 1 ? ` · ${n} vehicles` : "";
	const short = `${s.pickupLoc}→${s.returnLoc} · ${ac}${price ? ` · ${price}` : ""}${multi}`;
	return `${index + 1}. ${short}${when ? ` · ${when}` : ""}`;
}

function rentalLengthDays(
	pPickup: string,
	pReturn: string,
): number | undefined {
	if (!pPickup?.trim() || !pReturn?.trim()) return undefined;
	try {
		const sd = isoDateOnly(pPickup);
		const rd = isoDateOnly(pReturn);
		const dPickup = parseISO(
			pPickup.includes("T") ? pPickup : `${sd}T12:00:00`,
		);
		const dReturn = parseISO(
			pReturn.includes("T") ? pReturn : `${rd}T12:00:00`,
		);
		if (isNaN(dPickup.getTime()) || isNaN(dReturn.getTime())) return undefined;
		const diff = Math.ceil((dReturn.getTime() - dPickup.getTime()) / 86400000);
		if (!Number.isFinite(diff)) return undefined;
		return Math.max(1, diff);
	} catch {
		return undefined;
	}
}

export type DailyPricingCalendarProps = {
	/** `sample` query param — select this stored fetch and optional offer row */
	deeplinkSampleId?: string | null;
	/** `offer` query param — index into offersSummary (same order as Pricing tab) */
	deeplinkOfferIndex?: number;
};

export function DailyPricingCalendar({
	deeplinkSampleId = null,
	deeplinkOfferIndex = 0,
}: DailyPricingCalendarProps) {
	const today = new Date();
	const [startDate, setStartDate] = useState(formatDateInput(today));
	const endDefault = new Date(today);
	endDefault.setDate(endDefault.getDate() + 6);
	const [endDate, setEndDate] = useState(formatDateInput(endDefault));
	const [pickupLoc, setPickupLoc] = useState("TIAA01");
	const [returnLoc, setReturnLoc] = useState("TIAA01");
	const [acrissCode, setAcrissCode] = useState("CDAR");
	const [maxDays, setMaxDays] = useState(17);
	const [currency, setCurrency] = useState("EUR");
	const [defaultPrice, setDefaultPrice] = useState(25);
	const [dayStart, setDayStart] = useState(1);
	const [dayEnd, setDayEnd] = useState(17);

	/** `custom` = manual filters only; otherwise stored availability sample id from Pricing tab API */
	const [pricingBaseId, setPricingBaseId] = useState<string>("custom");
	/** Index into offersSummary — same ordering as Pricing → stored sample vehicle rows */
	const [pricingOfferIdx, setPricingOfferIdx] = useState(0);
	const didAutoPickSampleRef = useRef(false);

	const samplesQuery = useQuery({
		queryKey: ["availability-samples"],
		queryFn: async () => {
			const { samples } = await endpointsApi.getAvailabilitySamples();
			return samples;
		},
		staleTime: 60_000,
	});

	const samples = samplesQuery.data ?? [];

	const applySampleToFilters = useCallback(
		(s: StoredAvailabilitySample, offerIdx: number) => {
			const crit = (s.criteria ?? {}) as Partial<
				NonNullable<StoredAvailabilitySample["criteria"]>
			>;
			const critAny = crit as { rental_duration?: number };
			const pLoc = (s.pickupLoc || crit.pickupLoc || "")
				.toString()
				.toUpperCase()
				.trim();
			const rLoc = (s.returnLoc || crit.returnLoc || "")
				.toString()
				.toUpperCase()
				.trim();
			const pIso = s.pickupIso || crit.pickupIso || "";
			const rIso = s.returnIso || crit.returnIso || "";
			const offers = s.offersSummary ?? [];
			const idx = offers.length
				? Math.max(0, Math.min(offers.length - 1, offerIdx))
				: 0;
			const offer = offers[idx];

			if (pLoc) setPickupLoc(pLoc);
			if (rLoc) setReturnLoc(rLoc);
			if (offer?.vehicle_class)
				setAcrissCode(String(offer.vehicle_class).toUpperCase().slice(0, 5));
			if (offer?.currency)
				setCurrency(String(offer.currency).toUpperCase().slice(0, 3));
			if (offer?.total_price != null && typeof offer.total_price === "number") {
				setDefaultPrice(Math.max(0, offer.total_price));
			}

			let rentalDays = rentalLengthDays(pIso, rIso);
			if (
				rentalDays == null &&
				typeof critAny.rental_duration === "number" &&
				critAny.rental_duration > 0
			) {
				rentalDays = Math.min(
					31,
					Math.max(1, Math.floor(critAny.rental_duration)),
				);
			}
			if (rentalDays != null) {
				const md = Math.min(31, Math.max(1, rentalDays));
				setMaxDays(md);
				setDayStart(1);
				setDayEnd(md);
			}

			const sd = isoDateOnly(pIso);
			if (sd) {
				setStartDate(sd);
				let ed = "";
				try {
					const dPickup = parseISO(
						pIso.includes("T") ? pIso : `${sd}T12:00:00`,
					);
					const dReturn = rIso
						? parseISO(
								rIso.includes("T") ? rIso : `${isoDateOnly(rIso)}T12:00:00`,
							)
						: null;
					if (dReturn && !isNaN(dReturn.getTime())) {
						const diffDays = Math.max(
							1,
							Math.ceil((dReturn.getTime() - dPickup.getTime()) / 86400000),
						);
						const span = Math.min(21, Math.max(6, diffDays + 2));
						const end = new Date(dPickup);
						end.setDate(end.getDate() + span);
						ed = formatDateInput(end);
					}
				} catch {
					/* ignore */
				}
				if (!ed) {
					const end = new Date(sd);
					end.setDate(end.getDate() + 6);
					ed = formatDateInput(end);
				}
				setEndDate(ed);
			}
		},
		[],
	);

	useEffect(() => {
		if (!samples.length) return;

		if (deeplinkSampleId && samples.some((s) => s.id === deeplinkSampleId)) {
			const s = samples.find((x) => x.id === deeplinkSampleId)!;
			const n = s.offersSummary?.length ?? 0;
			const idx = n > 0 ? Math.max(0, Math.min(n - 1, deeplinkOfferIndex)) : 0;
			setPricingBaseId(deeplinkSampleId);
			setPricingOfferIdx(idx);
			applySampleToFilters(s, idx);
			return;
		}

		if (!didAutoPickSampleRef.current) {
			didAutoPickSampleRef.current = true;
			setPricingBaseId(samples[0].id);
			setPricingOfferIdx(0);
			applySampleToFilters(samples[0], 0);
		}
	}, [samples, deeplinkSampleId, deeplinkOfferIndex, applySampleToFilters]);

	useEffect(() => {
		if (pricingBaseId === "custom" || !samples.length) return;
		if (!samples.some((s) => s.id === pricingBaseId)) {
			setPricingBaseId(samples[0].id);
			setPricingOfferIdx(0);
			applySampleToFilters(samples[0], 0);
		}
	}, [samples, pricingBaseId, applySampleToFilters]);

	useEffect(() => {
		if (pricingBaseId === "custom") return;
		const s = samples.find((x) => x.id === pricingBaseId);
		const n = s?.offersSummary?.length ?? 0;
		if (n === 0) return;
		if (pricingOfferIdx >= n) {
			const ni = n - 1;
			setPricingOfferIdx(ni);
			applySampleToFilters(s!, ni);
		}
	}, [samples, pricingBaseId, pricingOfferIdx, applySampleToFilters]);

	const selectedSample = useMemo(
		() =>
			pricingBaseId === "custom"
				? null
				: (samples.find((s) => s.id === pricingBaseId) ?? null),
		[pricingBaseId, samples],
	);

	const baseSelectOptions = useMemo(() => {
		const opts: { value: string; label: string }[] = [
			{
				value: "custom",
				label:
					"Manual only (pickup / return / ACRISS below — not tied to a stored Pricing fetch)",
			},
		];
		samples.forEach((s, i) => {
			opts.push({ value: s.id, label: buildSampleLabel(s, i) });
		});
		return opts;
	}, [samples]);

	const onPricingBaseChange = (id: string) => {
		setPricingBaseId(id);
		if (id === "custom") return;
		const s = samples.find((x) => x.id === id);
		if (s) {
			setPricingOfferIdx(0);
			applySampleToFilters(s, 0);
		}
	};

	const offerSelectOptions = useMemo(() => {
		if (!selectedSample?.offersSummary?.length) return [];
		return selectedSample.offersSummary.map((o: any, i: number) => {
			const mm = String(o.vehicle_make_model || "—");
			const mmShort = mm.length > 40 ? `${mm.slice(0, 40)}…` : mm;
			return {
				value: String(i),
				label:
					`${i + 1}. ${o.vehicle_class || "—"} · ${mmShort} · ${o.total_price ?? "—"} ${o.currency || ""}`.trim(),
			};
		});
	}, [selectedSample]);

	const query = useQuery({
		queryKey: [
			"source",
			"daily-pricing",
			startDate,
			endDate,
			pickupLoc,
			returnLoc,
			acrissCode,
			maxDays,
		],
		queryFn: () =>
			endpointsApi.getDailyPricing({
				startDate,
				endDate,
				pickupLoc,
				returnLoc,
				acrissCode,
				maxDays,
			}),
	});

	const applyDefaultMutation = useMutation({
		mutationFn: () =>
			endpointsApi.applyDailyPricingDefault({
				startDate,
				endDate,
				pickupLoc,
				returnLoc,
				acrissCode,
				defaultPrice,
				dayStart,
				dayEnd,
				currency,
			}),
		onSuccess: () => {
			toast.success("Default prices applied");
			query.refetch();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.message || "Failed to apply default pricing",
			),
	});

	const [pendingEdits, setPendingEdits] = useState<Record<string, number>>({});
	const saveCellMutation = useMutation({
		mutationFn: async ({
			pickupDate,
			dayOffset,
			price,
		}: {
			pickupDate: string;
			dayOffset: number;
			price: number;
		}) =>
			endpointsApi.updateDailyPricingCell({
				pickupDate,
				pickupLoc,
				returnLoc,
				acrissCode,
				dayOffset,
				price,
				currency,
			}),
		onSuccess: () => {
			toast.success("Cell updated");
			query.refetch();
		},
		onError: (e: any) =>
			toast.error(e?.response?.data?.message || "Failed to update cell"),
	});

	const rows = query.data?.items ?? [];
	const dayColumns = useMemo(
		() => Array.from({ length: maxDays }, (_, i) => i + 1),
		[maxDays],
	);

	return (
		<div className="space-y-6">
			<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 px-6 py-8 text-white sm:px-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
						<div className="max-w-4xl">
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
								<CalendarDays className="h-3.5 w-3.5" />
								Pricing calendar
							</div>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Daily Prices
							</h1>
							<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
								Manage day-by-day rate overrides per pickup date and rental
								length. Start from a stored Pricing sample so location, ACRISS,
								currency, and rental duration match the supplier response.
							</p>
						</div>
						<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur">
							<p className="font-bold text-white">How to use</p>
							<ol className="mt-2 space-y-1 text-xs leading-5 text-blue-100">
								<li>1. Select a stored availability sample.</li>
								<li>2. Confirm matrix filters and date range.</li>
								<li>3. Fill defaults or edit individual cells.</li>
							</ol>
						</div>
					</div>
				</div>
				<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Stored samples
						</p>
						<p className="mt-2 text-lg font-bold text-blue-950">
							{samples.length}
						</p>
						<p className="mt-1 text-xs text-blue-700">
							From Pricing Fetch & Store
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Selected ACRISS
						</p>
						<p className="mt-2 text-lg font-bold text-emerald-950">
							{acrissCode || "—"}
						</p>
						<p className="mt-1 text-xs text-emerald-700">
							Vehicle class for matrix
						</p>
					</div>
					<div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
							Day columns
						</p>
						<p className="mt-2 text-lg font-bold text-violet-950">
							Day 1–{maxDays}
						</p>
						<p className="mt-1 text-xs text-violet-700">
							Rental length pricing
						</p>
					</div>
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
							Currency
						</p>
						<p className="mt-2 text-lg font-bold text-amber-950">
							{currency || "—"}
						</p>
						<p className="mt-1 text-xs text-amber-700">
							Applied to saved cells
						</p>
					</div>
				</div>
			</div>

			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-blue-50">
					<div className="flex items-start gap-3">
						<div className="rounded-xl bg-blue-100 p-2 text-blue-700">
							<Database className="h-5 w-5" />
						</div>
						<div>
							<CardTitle className="text-xl font-bold text-slate-950">
								Base context from Pricing samples
							</CardTitle>
							<p className="mt-1 text-sm leading-6 text-slate-600">
								Pick a stored availability sample to prefill locations, vehicle
								class, currency, date window, and rental duration.
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{samplesQuery.isLoading ? (
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Loader
								size="sm"
								className="inline-flex w-auto min-h-0 py-0 justify-start"
							/>
							Loading stored availability samples…
						</div>
					) : samples.length === 0 ? (
						<p className="text-sm text-gray-700">
							No stored samples yet. Open the <strong>Pricing</strong> tab, run{" "}
							<strong>Fetch &amp; Store</strong> on your availability endpoint,
							then return here — samples will appear in the dropdown
							automatically.
						</p>
					) : (
						<>
							<Select
								label="Stored availability sample"
								value={pricingBaseId}
								onChange={(e) => onPricingBaseChange(e.target.value)}
								options={baseSelectOptions}
								helperText="Samples are the same records listed under Pricing → stored results. Selecting one fills pickup/return, ACRISS, currency, rental-length columns (Day1…DayN), and date range."
							/>
							{selectedSample && offerSelectOptions.length > 1 ? (
								<Select
									label="Vehicle row (same order as Pricing tab)"
									value={String(pricingOfferIdx)}
									onChange={(e) => {
										const i = Number(e.target.value) || 0;
										setPricingOfferIdx(i);
										applySampleToFilters(selectedSample, i);
									}}
									options={offerSelectOptions}
									helperText="Mirrors each vehicle card under Stored availability samples — pick which ACRISS drives the matrix, or open Daily Prices from a vehicle’s link on the Pricing tab."
								/>
							) : null}
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => samplesQuery.refetch()}
									disabled={samplesQuery.isFetching}
								>
									Reload samples
								</Button>
							</div>
						</>
					)}

					{selectedSample && (
						<div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
							<p className="font-semibold text-gray-800 mb-2">
								Selected API snapshot
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-gray-700">
								<div>
									<span className="text-gray-500">Pickup / return</span>{" "}
									<span className="font-mono">
										{selectedSample.pickupLoc} → {selectedSample.returnLoc}
									</span>
								</div>
								<div>
									<span className="text-gray-500">Fetched</span>{" "}
									{selectedSample.fetchedAt
										? format(
												parseISO(selectedSample.fetchedAt),
												"dd/MM/yyyy HH:mm",
											)
										: "—"}
								</div>
								<div className="sm:col-span-2">
									<span className="text-gray-500">Criteria window</span>{" "}
									<span className="font-mono text-xs">
										{selectedSample.pickupIso} → {selectedSample.returnIso}
									</span>
								</div>
							</div>
							{selectedSample.offersSummary &&
								selectedSample.offersSummary.length > 0 && (
									<div className="mt-3 border-t border-gray-100 pt-3">
										<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
											Selected vehicle row (reference pricing)
										</p>
										<ul className="space-y-1">
											{(() => {
												const os = selectedSample.offersSummary!;
												const o = os[pricingOfferIdx] ?? os[0];
												return (
													<li
														key={pricingOfferIdx}
														className="text-xs text-gray-800 flex flex-wrap gap-x-3"
													>
														<span className="font-mono font-semibold">
															{o.vehicle_class}
														</span>
														<span>{o.vehicle_make_model}</span>
														<span>
															{o.total_price} {o.currency}
														</span>
														<span className="text-gray-500">
															{o.availability_status}
														</span>
													</li>
												);
											})()}
										</ul>
										{selectedSample.offersSummary.length > 1 && (
											<p className="text-xs text-gray-500 mt-2">
												{selectedSample.offersSummary.length} vehicles in this
												sample — switch rows with the dropdown above to match
												another line on the Pricing tab.
											</p>
										)}
									</div>
								)}
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
					<CardTitle className="text-xl font-bold text-slate-950">
						Matrix filters
					</CardTitle>
					<p className="mt-1 text-sm text-slate-600">
						Confirm the operational criteria before loading the matrix.
					</p>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-gray-500 mb-3">
						These fields drive the daily-pricing API. They are filled from the
						dropdown above when you pick a sample; you can still edit them
						before refresh.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Input
							label="Start date"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
						/>
						<Input
							label="End date"
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
						/>
						<Input
							label="Pickup location"
							value={pickupLoc}
							onChange={(e) => setPickupLoc(e.target.value.toUpperCase())}
						/>
						<Input
							label="Return location"
							value={returnLoc}
							onChange={(e) => setReturnLoc(e.target.value.toUpperCase())}
						/>
						<Input
							label="ACRISS code"
							value={acrissCode}
							onChange={(e) => setAcrissCode(e.target.value.toUpperCase())}
						/>
						<Input
							label="Currency"
							value={currency}
							onChange={(e) =>
								setCurrency(e.target.value.toUpperCase().slice(0, 3))
							}
						/>
						<Input
							label="Day columns"
							type="number"
							min={1}
							max={31}
							value={maxDays}
							onChange={(e) =>
								setMaxDays(
									Math.max(1, Math.min(31, Number(e.target.value) || 1)),
								)
							}
						/>
						<div className="flex items-end">
							<Button
								variant="secondary"
								onClick={() => query.refetch()}
								disabled={query.isFetching}
							>
								Refresh matrix
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-emerald-50">
					<CardTitle className="text-xl font-bold text-slate-950">
						Default fill
					</CardTitle>
					<p className="mt-1 text-sm text-slate-600">
						Apply a baseline price across a day range, then fine-tune individual
						cells below.
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
						<Input
							label="Default price"
							type="number"
							min={0}
							step="0.01"
							value={defaultPrice}
							onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
						/>
						<Input
							label="From day"
							type="number"
							min={1}
							max={31}
							value={dayStart}
							onChange={(e) => setDayStart(Number(e.target.value) || 1)}
						/>
						<Input
							label="To day"
							type="number"
							min={1}
							max={31}
							value={dayEnd}
							onChange={(e) => setDayEnd(Number(e.target.value) || 1)}
						/>
						<div className="md:col-span-2 flex items-end">
							<Button
								onClick={() => applyDefaultMutation.mutate()}
								loading={applyDefaultMutation.isPending}
							>
								Apply to date range
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-violet-50">
					<CardTitle className="text-xl font-bold text-slate-950">
						Daily price matrix
					</CardTitle>
					<p className="mt-1 text-sm text-slate-600">
						Edit custom overrides per pickup date and rental day. Each cell can
						be saved independently.
					</p>
				</CardHeader>
				<CardContent className="p-0">
					{query.isLoading ? (
						<Loader />
					) : (
						<div className="overflow-auto">
							<table className="min-w-[1200px] w-full text-sm">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
										<th className="text-left px-3 py-3">Pickup Date</th>
										<th className="text-left px-3 py-3">ACRISS</th>
										{dayColumns.map((d) => (
											<th
												key={d}
												className="text-left px-3 py-3"
											>{`Day ${d}`}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rows.map((r: any) => (
										<tr
											key={r.pickupDate}
											className="border-b border-slate-100 hover:bg-blue-50/40"
										>
											<td className="px-2 py-2 whitespace-nowrap">
												{r.pickupDate}
											</td>
											<td className="px-2 py-2">
												{r.acrissCode || acrissCode}
											</td>
											{dayColumns.map((d) => {
												const key = `${r.pickupDate}:${d}`;
												const current =
													pendingEdits[key] ??
													(r[`day${d}`] as number | null) ??
													0;
												return (
													<td key={d} className="px-2 py-2">
														<div className="flex gap-1">
															<input
																type="number"
																step="0.01"
																className="w-20 rounded border border-gray-300 px-1.5 py-1 text-xs"
																value={current}
																onChange={(e) => {
																	const value = Number(e.target.value) || 0;
																	setPendingEdits((prev) => ({
																		...prev,
																		[key]: value,
																	}));
																}}
															/>
															<button
																type="button"
																className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
																onClick={() => {
																	const price = pendingEdits[key] ?? current;
																	saveCellMutation.mutate({
																		pickupDate: r.pickupDate,
																		dayOffset: d,
																		price,
																	});
																}}
															>
																Save
															</button>
														</div>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
							{rows.length === 0 && (
								<p className="text-gray-500 py-4">
									No rows for these filters. Adjust dates or refresh.
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
