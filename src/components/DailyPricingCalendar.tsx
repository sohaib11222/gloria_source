import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	endOfMonth,
	format,
	getMonth,
	getYear,
	parseISO,
	startOfMonth,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Loader } from "./ui/Loader";
import { Modal } from "./ui/Modal";
import toast from "react-hot-toast";
import {
	CalendarDays,
	Check,
	Copy,
	Database,
	Info,
	Plus,
	Settings2,
} from "lucide-react";
import { branchesApi } from "../api/branches";
import {
	endpointsApi,
	type DailyPricingCellUpdate,
	type StoredAvailabilitySample,
} from "../api/endpoints";
import { AcrissCodePicker } from "./AcrissCodePicker";
import { SearchableStringPicker } from "./SearchableStringPicker";
import { fetchNhtsaMakes, fetchNhtsaModelsForMake } from "../lib/nhtsaVehicles";
import { cn } from "../lib/utils";

function formatDateInput(d: Date): string {
	return d.toISOString().slice(0, 10);
}

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function formatPickupDateDisplay(isoDate: string): string {
	const iso = isoDateOnly(isoDate);
	if (!iso) return isoDate;
	try {
		return format(parseISO(`${iso}T12:00:00`), "dd-MM-yyyy");
	} catch {
		return iso;
	}
}

function formatViewingMonthLabel(startIso: string): string {
	try {
		return format(parseISO(`${isoDateOnly(startIso)}T12:00:00`), "MMMM yyyy");
	} catch {
		return startIso;
	}
}

function isoDateOnly(iso: string | undefined | null): string {
	if (!iso || typeof iso !== "string") return "";
	const s = iso.trim();
	if (s.length >= 10) return s.slice(0, 10);
	return "";
}

type DailyOfferSummary = NonNullable<
	StoredAvailabilitySample["offersSummary"]
>[number];

const FALLBACK_MAKE_TO_MODELS: Record<string, string[]> = {
	SKODA: ["FABIA", "OCTAVIA", "SCALA", "KAMIQ", "KAROQ", "SUPERB"],
	TOYOTA: ["YARIS", "COROLLA", "RAV4", "AYGO", "CH-R"],
	VOLKSWAGEN: ["GOLF", "POLO", "PASSAT", "TIGUAN", "T-ROC"],
	FORD: ["FIESTA", "FOCUS", "KUGA", "PUMA"],
	BMW: ["1 SERIES", "3 SERIES", "X1", "X3"],
	MERCEDES: ["A CLASS", "C CLASS", "VITO", "SPRINTER"],
	NISSAN: ["MICRA", "JUKE", "QASHQAI"],
};

const FALLBACK_MAKES = Object.keys(FALLBACK_MAKE_TO_MODELS).sort();

function normalizeAcrissCode(raw: string | undefined | null): string {
	return String(raw ?? "")
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 8);
}

function getFallbackModelsForMake(make: string): string[] {
	const t = make.trim();
	if (!t) return [];
	const u = t.toUpperCase();
	if (FALLBACK_MAKE_TO_MODELS[u]) return [...FALLBACK_MAKE_TO_MODELS[u]];
	const k = FALLBACK_MAKES.find((key) => key.toUpperCase() === u);
	return k ? [...FALLBACK_MAKE_TO_MODELS[k]] : [];
}

function getOfferVehicleAttr(
	offer: DailyOfferSummary | undefined | null,
	key: string,
): string {
	const attrs = offer?.gloria_vehdetails_attributes ?? {};
	return String(
		attrs[key] ?? attrs[key.toUpperCase()] ?? attrs[key.toLowerCase()] ?? "",
	).trim();
}

function splitVehicleName(name: string | undefined | null): {
	make: string;
	model: string;
} {
	const clean = String(name ?? "")
		.trim()
		.replace(/\s+/g, " ");
	if (!clean) return { make: "", model: "" };
	const upper = clean.toUpperCase();
	const knownMake = FALLBACK_MAKES.find(
		(make) => upper === make || upper.startsWith(`${make} `),
	);
	if (knownMake) {
		return {
			make: knownMake,
			model: clean.slice(knownMake.length).trim(),
		};
	}
	const parts = clean.split(" ");
	if (parts.length === 1) return { make: parts[0], model: "" };
	return { make: parts[0], model: parts.slice(1).join(" ") };
}

function extractVehicleDefinition(offer: DailyOfferSummary | undefined | null) {
	const fallback = splitVehicleName(offer?.vehicle_make_model);
	const rules = offer?.manual_business_rules ?? {};
	const ruleSeats = rules.Seats ?? rules.seats;
	return {
		make: getOfferVehicleAttr(offer, "Make") || fallback.make,
		model: getOfferVehicleAttr(offer, "Model") || fallback.model,
		transmission:
			getOfferVehicleAttr(offer, "Transmission") ||
			String(offer?.transmission_type ?? "").trim(),
		doors:
			getOfferVehicleAttr(offer, "Doors") ||
			String(offer?.door_count ?? "").trim(),
		seats:
			getOfferVehicleAttr(offer, "Seats") || String(ruleSeats ?? "").trim(),
		baggage: String(offer?.baggage ?? "").trim(),
	};
}

function parseDateInput(value: string): Date | null {
	const iso = isoDateOnly(value);
	if (!iso) return null;
	const d = parseISO(`${iso}T10:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysToDate(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
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
	/** Optional plan guard from SourcePage for write actions. */
	requireActivePlan?: (action?: string, description?: string) => boolean;
};

type BranchCopyAdjustmentMode = "same" | "percent" | "amount";

type AppliedMatrixFilters = {
	startDate: string;
	endDate: string;
	pickupLoc: string;
	returnLoc: string;
	acrissCode: string;
	maxDays: number;
	currency: string;
};

function buildAppliedMatrixFilters(
	startDate: string,
	endDate: string,
	pickupLoc: string,
	returnLoc: string,
	acrissCode: string,
	maxDays: number,
	currency: string,
): AppliedMatrixFilters | null {
	if (!startDate?.trim() || !endDate?.trim()) return null;
	if (!pickupLoc.trim() || !returnLoc.trim()) return null;
	const code = normalizeAcrissCode(acrissCode);
	if (code.length < 2) return null;
	if (startDate > endDate) return null;
	return {
		startDate: startDate.trim(),
		endDate: endDate.trim(),
		pickupLoc: pickupLoc.trim().toUpperCase(),
		returnLoc: returnLoc.trim().toUpperCase(),
		acrissCode: code,
		maxDays: Math.max(1, Math.min(31, maxDays || 1)),
		currency: currency.trim().toUpperCase().slice(0, 3) || "EUR",
	};
}

function matrixFiltersEqual(
	a: AppliedMatrixFilters | null,
	b: AppliedMatrixFilters | null,
): boolean {
	if (!a || !b) return a === b;
	return (
		a.startDate === b.startDate &&
		a.endDate === b.endDate &&
		a.pickupLoc === b.pickupLoc &&
		a.returnLoc === b.returnLoc &&
		a.acrissCode === b.acrissCode &&
		a.maxDays === b.maxDays &&
		a.currency === b.currency
	);
}

export function DailyPricingCalendar({
	deeplinkSampleId = null,
	deeplinkOfferIndex = 0,
	requireActivePlan,
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
	const [customAcrissCodes, setCustomAcrissCodes] = useState<string[]>([]);
	const [newAcrissDraft, setNewAcrissDraft] = useState("");
	const [vehicleMake, setVehicleMake] = useState("");
	const [vehicleModel, setVehicleModel] = useState("");
	const [vehicleTransmission, setVehicleTransmission] = useState("Automatic");
	const [vehicleDoors, setVehicleDoors] = useState("4");
	const [vehicleSeats, setVehicleSeats] = useState("5");
	const [vehicleBaggage, setVehicleBaggage] = useState("1/2");
	const [showVehicleDefinitionEditor, setShowVehicleDefinitionEditor] =
		useState(false);
	const [copyTargetPickupLoc, setCopyTargetPickupLoc] = useState("");
	const [copyTargetReturnLoc, setCopyTargetReturnLoc] = useState("");
	const [copyAdjustmentMode, setCopyAdjustmentMode] =
		useState<BranchCopyAdjustmentMode>("same");
	const [copyAdjustmentValue, setCopyAdjustmentValue] = useState(0);
	const [copySwitchAfter, setCopySwitchAfter] = useState(true);

	/** `custom` = manual filters only; otherwise stored availability sample id from Pricing tab API */
	const [pricingBaseId, setPricingBaseId] = useState<string>("custom");
	/** Index into offersSummary — same ordering as Pricing → stored sample vehicle rows */
	const [pricingOfferIdx, setPricingOfferIdx] = useState(0);
	const [appliedMatrix, setAppliedMatrix] =
		useState<AppliedMatrixFilters | null>(null);
	const [isMatrixSetupOpen, setIsMatrixSetupOpen] = useState(false);
	const [matrixSaveStatus, setMatrixSaveStatus] = useState<
		"idle" | "saving" | "saved"
	>("idle");
	const matrixSaveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const samplesQuery = useQuery({
		queryKey: ["availability-samples"],
		queryFn: async () => {
			const { samples } = await endpointsApi.getAvailabilitySamples();
			return samples;
		},
		staleTime: 30_000,
		refetchOnMount: "always",
	});

	const branchesQuery = useQuery({
		queryKey: ["branches-list-daily-pricing"],
		queryFn: () => branchesApi.listBranches({ limit: 200 }),
		staleTime: 60_000,
	});

	const samples = samplesQuery.data ?? [];

	const samplesFingerprint = useMemo(
		() =>
			samples
				.map((s) => `${s.id}:${s.updatedAt ?? s.fetchedAt ?? ""}`)
				.join("|"),
		[samples],
	);
	const vehicleMakeTrimmed = vehicleMake.trim();
	const [vpicMakeDebounced, setVpicMakeDebounced] = useState("");

	useEffect(() => {
		const t = window.setTimeout(
			() => setVpicMakeDebounced(vehicleMake.trim()),
			450,
		);
		return () => window.clearTimeout(t);
	}, [vehicleMake]);

	const nhtsaMakesQuery = useQuery({
		queryKey: ["nhtsa-vpic", "makes"],
		queryFn: fetchNhtsaMakes,
		staleTime: 1000 * 60 * 60 * 24,
		retry: 1,
	});

	const nhtsaModelsQuery = useQuery({
		queryKey: ["nhtsa-vpic", "models", vpicMakeDebounced.toLowerCase()],
		queryFn: () => fetchNhtsaModelsForMake(vpicMakeDebounced),
		enabled: vpicMakeDebounced.length > 0,
		staleTime: 1000 * 60 * 60 * 6,
		retry: 1,
	});

	const vehicleMakeOptions = useMemo(() => {
		const set = new Set<string>(FALLBACK_MAKES);
		const api = nhtsaMakesQuery.data;
		if (api?.length) for (const make of api) set.add(make);
		return [...set].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" }),
		);
	}, [nhtsaMakesQuery.data]);

	const vehicleModelOptions = useMemo(() => {
		if (!vehicleMakeTrimmed) return [];
		const set = new Set<string>();
		for (const model of getFallbackModelsForMake(vehicleMake)) set.add(model);
		const api = nhtsaModelsQuery.data;
		const apiMatches =
			api?.length &&
			vpicMakeDebounced.length > 0 &&
			vpicMakeDebounced.trim().toLowerCase() ===
				vehicleMakeTrimmed.toLowerCase();
		if (apiMatches) for (const model of api) set.add(model);
		return [...set].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" }),
		);
	}, [
		vehicleMake,
		vehicleMakeTrimmed,
		vpicMakeDebounced,
		nhtsaModelsQuery.data,
	]);

	const sampleAcrissCodes = useMemo(() => {
		const set = new Set<string>();
		for (const sample of samples) {
			for (const offer of sample.offersSummary ?? []) {
				const code = normalizeAcrissCode(offer.vehicle_class);
				if (code) set.add(code);
			}
		}
		return [...set];
	}, [samples]);

	const acrissPickerCustomCodes = useMemo(() => {
		const set = new Set<string>();
		for (const code of [...customAcrissCodes, ...sampleAcrissCodes]) {
			const normalized = normalizeAcrissCode(code);
			if (normalized) set.add(normalized);
		}
		return [...set].sort();
	}, [customAcrissCodes, sampleAcrissCodes]);

	const branchCodeOptions = useMemo(() => {
		const set = new Set<string>();
		for (const code of [
			pickupLoc,
			returnLoc,
			copyTargetPickupLoc,
			copyTargetReturnLoc,
		]) {
			const normalized = String(code ?? "")
				.trim()
				.toUpperCase();
			if (normalized) set.add(normalized);
		}
		for (const sample of samples) {
			const pickup = String(sample.pickupLoc ?? "")
				.trim()
				.toUpperCase();
			const returned = String(sample.returnLoc ?? "")
				.trim()
				.toUpperCase();
			if (pickup) set.add(pickup);
			if (returned) set.add(returned);
		}
		return [...set].sort();
	}, [copyTargetPickupLoc, copyTargetReturnLoc, pickupLoc, returnLoc, samples]);

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
			const sampleAcriss = normalizeAcrissCode(offer?.vehicle_class);
			if (sampleAcriss) setAcrissCode(sampleAcriss);
			if (offer?.currency)
				setCurrency(String(offer.currency).toUpperCase().slice(0, 3));
			if (offer?.total_price != null && typeof offer.total_price === "number") {
				setDefaultPrice(Math.max(0, offer.total_price));
			}

			const vehicle = extractVehicleDefinition(offer);
			if (vehicle.make) setVehicleMake(vehicle.make);
			if (vehicle.model) setVehicleModel(vehicle.model);
			if (vehicle.transmission) setVehicleTransmission(vehicle.transmission);
			if (vehicle.doors) setVehicleDoors(vehicle.doors);
			if (vehicle.seats) setVehicleSeats(vehicle.seats);
			if (vehicle.baggage) setVehicleBaggage(vehicle.baggage);

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

	/** Sync filters from latest stored sample (or deeplink) whenever samples refresh. */
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

		const latest = samples[0];
		setPricingBaseId(latest.id);
		setPricingOfferIdx(0);
		applySampleToFilters(latest, 0);
	}, [
		samplesFingerprint,
		deeplinkSampleId,
		deeplinkOfferIndex,
		samples,
		applySampleToFilters,
	]);

	useEffect(() => {
		if (pricingBaseId === "custom" || !samples.length) return;
		if (!samples.some((s) => s.id === pricingBaseId)) {
			const latest = samples[0];
			setPricingBaseId(latest.id);
			setPricingOfferIdx(0);
			applySampleToFilters(latest, 0);
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

	/** Auto-load matrix whenever filters are valid (visit, sample import, or filter edits). */
	useEffect(() => {
		const next = buildAppliedMatrixFilters(
			startDate,
			endDate,
			pickupLoc,
			returnLoc,
			acrissCode,
			maxDays,
			currency,
		);
		if (!next) return;
		setAppliedMatrix((prev) => {
			if (matrixFiltersEqual(prev, next)) return prev;
			return next;
		});
	}, [
		startDate,
		endDate,
		pickupLoc,
		returnLoc,
		acrissCode,
		maxDays,
		currency,
	]);

	useEffect(() => {
		if (!appliedMatrix) return;
		setPendingEdits({});
	}, [appliedMatrix]);

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

	const switchToManualFilters = () => {
		if (pricingBaseId !== "custom") setPricingBaseId("custom");
	};

	const handleAddCustomAcriss = () => {
		const code = normalizeAcrissCode(newAcrissDraft);
		if (code.length < 2 || code.length > 8) {
			toast.error("ACRISS code must be 2–8 letters or digits");
			return;
		}
		setCustomAcrissCodes((prev) =>
			prev.includes(code) ? prev : [...prev, code],
		);
		setAcrissCode(code);
		setNewAcrissDraft("");
		switchToManualFilters();
		toast.success(`ACRISS ${code} added`);
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

	const saveVehicleDefinitionMutation = useMutation({
		mutationFn: async (code: string) => {
			const pickupDateForSample = parseDateInput(startDate) ?? new Date();
			const sampleRentalDays = Math.max(1, Math.min(3660, Math.floor(maxDays)));
			const returnDateForSample = addDaysToDate(
				pickupDateForSample,
				sampleRentalDays,
			);
			const normalizedCurrency =
				currency.trim().toUpperCase().slice(0, 3) || "EUR";
			const total = Number.isFinite(Number(defaultPrice))
				? Math.max(0, Number(defaultPrice))
				: 0;
			const baggageParts = vehicleBaggage
				.split(/[\/,]/)
				.map((part) => part.trim())
				.filter(Boolean);

			return endpointsApi.postManualAvailabilitySample({
				pickupLoc: pickupLoc.trim().toUpperCase(),
				returnLoc: returnLoc.trim().toUpperCase(),
				pickupIso: `${formatDateInput(pickupDateForSample)}T10:00:00`,
				returnIso: `${formatDateInput(returnDateForSample)}T10:00:00`,
				rental_duration: sampleRentalDays,
				pricing: {
					currency: normalizedCurrency,
					duration: String(sampleRentalDays),
					total_gross: String(total),
				},
				vehicle: {
					acriss: code,
					make: vehicleMake.trim(),
					model: vehicleModel.trim(),
					currency: normalizedCurrency,
					total_price: total,
					transmission: vehicleTransmission.trim() || undefined,
					doors: vehicleDoors.trim() || undefined,
					seats: vehicleSeats.trim() || undefined,
					bags_small: baggageParts[0],
					bags_medium: baggageParts[1],
				},
			});
		},
		onSuccess: async (result, savedAcriss) => {
			setCustomAcrissCodes((prev) =>
				prev.includes(savedAcriss) ? prev : [...prev, savedAcriss],
			);
			toast.success(
				result.duplicate
					? `Vehicle ${savedAcriss} already exists in Pricing samples`
					: result.message || `Vehicle ${savedAcriss} saved`,
			);
			const refreshed = await samplesQuery.refetch();
			const savedSample = refreshed.data?.find((sample) => {
				const sameLocations =
					sample.pickupLoc.toUpperCase() === pickupLoc.trim().toUpperCase() &&
					sample.returnLoc.toUpperCase() === returnLoc.trim().toUpperCase();
				const hasVehicle = (sample.offersSummary ?? []).some(
					(offer) => normalizeAcrissCode(offer.vehicle_class) === savedAcriss,
				);
				return sameLocations && hasVehicle;
			});
			if (savedSample) {
				setPricingBaseId(savedSample.id);
				setPricingOfferIdx(0);
				applySampleToFilters(savedSample, 0);
			}
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.message || "Failed to save vehicle definition",
			),
	});

	const handleSaveVehicleDefinition = () => {
		if (
			requireActivePlan &&
			!requireActivePlan(
				"store manual availability",
				"Daily Prices vehicle definitions are saved as manual Pricing samples so agents can match ACRISS codes to vehicles.",
			)
		) {
			return;
		}
		const code = normalizeAcrissCode(acrissCode);
		if (code.length < 2 || code.length > 8) {
			toast.error("Select or add an ACRISS code (2–8 letters or digits)");
			return;
		}
		if (!pickupLoc.trim() || !returnLoc.trim()) {
			toast.error("Pickup and return location codes are required");
			return;
		}
		if (!startDate || !endDate) {
			toast.error("Start and end dates are required");
			return;
		}
		if (!vehicleMake.trim() || !vehicleModel.trim()) {
			toast.error("Define the vehicle make and model before saving");
			return;
		}
		setAcrissCode(code);
		saveVehicleDefinitionMutation.mutate(code);
	};

	const query = useQuery({
		queryKey: ["source", "daily-pricing", appliedMatrix],
		enabled: appliedMatrix != null,
		queryFn: () =>
			endpointsApi.getDailyPricing({
				startDate: appliedMatrix!.startDate,
				endDate: appliedMatrix!.endDate,
				pickupLoc: appliedMatrix!.pickupLoc,
				returnLoc: appliedMatrix!.returnLoc,
				acrissCode: appliedMatrix!.acrissCode,
				maxDays: appliedMatrix!.maxDays,
			}),
	});

	const applyDefaultMutation = useMutation({
		mutationFn: () => {
			if (!appliedMatrix) throw new Error("Load the matrix first");
			return endpointsApi.applyDailyPricingDefault({
				startDate: appliedMatrix.startDate,
				endDate: appliedMatrix.endDate,
				pickupLoc: appliedMatrix.pickupLoc,
				returnLoc: appliedMatrix.returnLoc,
				acrissCode: appliedMatrix.acrissCode,
				defaultPrice,
				dayStart,
				dayEnd,
				currency: appliedMatrix.currency,
			});
		},
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

	const handleLoadMatrix = (e: React.FormEvent) => {
		e.preventDefault();
		const next = buildAppliedMatrixFilters(
			startDate,
			endDate,
			pickupLoc,
			returnLoc,
			acrissCode,
			maxDays,
			currency,
		);
		if (!next) {
			if (!startDate || !endDate) {
				toast.error("Start and end dates are required");
				return;
			}
			if (!pickupLoc.trim() || !returnLoc.trim()) {
				toast.error("Pickup and return branch codes are required");
				return;
			}
			if (normalizeAcrissCode(acrissCode).length < 2) {
				toast.error("Select or add an ACRISS code (2–8 letters or digits)");
				return;
			}
			if (startDate > endDate) {
				toast.error("Start date must be on or before end date");
				return;
			}
			return;
		}
		setAppliedMatrix(next);
		setPendingEdits({});
		setIsMatrixSetupOpen(false);
		toast.success("Daily price matrix loaded");
	};

	const saveCellMutation = useMutation({
		mutationFn: async ({
			pickupDate,
			dayOffset,
			price,
		}: {
			pickupDate: string;
			dayOffset: number;
			price: number;
		}) => {
			if (!appliedMatrix) throw new Error("Load the matrix first");
			return endpointsApi.updateDailyPricingCell({
				pickupDate,
				pickupLoc: appliedMatrix.pickupLoc,
				returnLoc: appliedMatrix.returnLoc,
				acrissCode: appliedMatrix.acrissCode,
				dayOffset,
				price,
				currency: appliedMatrix.currency,
			});
		},
		onMutate: () => {
			setMatrixSaveStatus("saving");
		},
		onSuccess: () => {
			setMatrixSaveStatus("saved");
			query.refetch();
			if (matrixSaveStatusTimerRef.current) {
				window.clearTimeout(matrixSaveStatusTimerRef.current);
			}
			matrixSaveStatusTimerRef.current = window.setTimeout(
				() => setMatrixSaveStatus("idle"),
				4000,
			);
		},
		onError: (e: any) => {
			setMatrixSaveStatus("idle");
			toast.error(e?.response?.data?.message || "Failed to update cell");
		},
	});

	const rows = query.data?.items ?? [];
	const matrixMaxDays = appliedMatrix?.maxDays ?? maxDays;
	const dayColumns = useMemo(
		() => Array.from({ length: matrixMaxDays }, (_, i) => i + 1),
		[matrixMaxDays],
	);
	const selectedVehicleLabel = [vehicleMake.trim(), vehicleModel.trim()]
		.filter(Boolean)
		.join(" ");
	const vehicleDefinitionEditorOpen =
		showVehicleDefinitionEditor || !selectedVehicleLabel;

	const branchNameByCode = useMemo(() => {
		const map = new Map<string, string>();
		for (const branch of branchesQuery.data?.items ?? []) {
			const code = branch.branchCode?.trim().toUpperCase();
			if (code) map.set(code, branch.name?.trim() || code);
		}
		return map;
	}, [branchesQuery.data?.items]);

	const formatBranchLine = useCallback(
		(pickup: string, ret: string) => {
			const label = (code: string) => {
				const normalized = code.trim().toUpperCase();
				const name = branchNameByCode.get(normalized);
				if (name && name.toUpperCase() !== normalized) {
					return `${name} (${normalized})`;
				}
				return normalized || code;
			};
			return `${label(pickup)} → ${label(ret)}`;
		},
		[branchNameByCode],
	);

	const matrixViewAnchor = useMemo(() => {
		if (!appliedMatrix?.startDate) return new Date();
		try {
			return parseISO(`${isoDateOnly(appliedMatrix.startDate)}T12:00:00`);
		} catch {
			return new Date();
		}
	}, [appliedMatrix?.startDate]);

	const calendarYears = useMemo(() => {
		const y = getYear(matrixViewAnchor);
		return [y - 1, y, y + 1] as const;
	}, [matrixViewAnchor]);

	const activeCalendarYear = getYear(matrixViewAnchor);
	const activeCalendarMonth = getMonth(matrixViewAnchor);
	const todayPickupIso = formatDateInput(new Date());

	const matrixAcrissFilters = useMemo(() => {
		const set = new Set<string>();
		for (const code of sampleAcrissCodes) {
			const normalized = normalizeAcrissCode(code);
			if (normalized) set.add(normalized);
		}
		for (const code of customAcrissCodes) {
			const normalized = normalizeAcrissCode(code);
			if (normalized) set.add(normalized);
		}
		if (appliedMatrix?.acrissCode) set.add(appliedMatrix.acrissCode);
		const current = normalizeAcrissCode(acrissCode);
		if (current) set.add(current);
		return [...set].sort();
	}, [
		sampleAcrissCodes,
		customAcrissCodes,
		appliedMatrix?.acrissCode,
		acrissCode,
	]);

	const applyCalendarMonth = useCallback(
		(year: number, monthIndex: number) => {
			const start = startOfMonth(new Date(year, monthIndex, 1));
			const end = endOfMonth(start);
			const sd = formatDateInput(start);
			const ed = formatDateInput(end);
			setStartDate(sd);
			setEndDate(ed);
			switchToManualFilters();
			const next = buildAppliedMatrixFilters(
				sd,
				ed,
				pickupLoc,
				returnLoc,
				acrissCode,
				maxDays,
				currency,
			);
			if (next) {
				setAppliedMatrix(next);
				setPendingEdits({});
			}
		},
		[pickupLoc, returnLoc, acrissCode, maxDays, currency],
	);

	const applyCalendarYear = useCallback(
		(year: number) => {
			const monthIndex = appliedMatrix
				? activeCalendarMonth
				: getMonth(new Date());
			applyCalendarMonth(year, monthIndex);
		},
		[activeCalendarMonth, appliedMatrix, applyCalendarMonth],
	);

	const selectMatrixAcriss = useCallback(
		(code: string) => {
			const normalized = normalizeAcrissCode(code);
			if (!normalized) return;
			setAcrissCode(normalized);
			switchToManualFilters();
			if (!appliedMatrix) return;
			const next = buildAppliedMatrixFilters(
				appliedMatrix.startDate,
				appliedMatrix.endDate,
				appliedMatrix.pickupLoc,
				appliedMatrix.returnLoc,
				normalized,
				appliedMatrix.maxDays,
				appliedMatrix.currency,
			);
			if (next) {
				setAppliedMatrix(next);
				setPendingEdits({});
			}
		},
		[appliedMatrix],
	);

	const handlePriceCellBlur = useCallback(
		(
			pickupDate: string,
			dayOffset: number,
			editKey: string,
			original: number | null,
			value: number,
		) => {
			const rounded = Math.round(value * 100) / 100;
			const originalRounded =
				original == null ? null : Math.round(original * 100) / 100;
			if (originalRounded != null && rounded === originalRounded) {
				setPendingEdits((prev) => {
					if (!(editKey in prev)) return prev;
					const next = { ...prev };
					delete next[editKey];
					return next;
				});
				return;
			}
			saveCellMutation.mutate(
				{ pickupDate, dayOffset, price: rounded },
				{
					onSuccess: () => {
						setPendingEdits((prev) => {
							const next = { ...prev };
							delete next[editKey];
							return next;
						});
					},
				},
			);
		},
		[saveCellMutation],
	);

	const copyBranchPricesMutation = useMutation({
		mutationFn: async (payload: {
			cells: DailyPricingCellUpdate[];
			targetPickupLoc: string;
			targetReturnLoc: string;
		}) => {
			const result = await endpointsApi.bulkUpdateDailyPricing({
				cells: payload.cells,
			});
			return { ...result, payload };
		},
		onSuccess: (result) => {
			toast.success(
				`Copied ${result.upserted} price cell${result.upserted === 1 ? "" : "s"} to ${result.payload.targetPickupLoc} → ${result.payload.targetReturnLoc}`,
			);
			if (copySwitchAfter) {
				setPickupLoc(result.payload.targetPickupLoc);
				setReturnLoc(result.payload.targetReturnLoc);
				switchToManualFilters();
				const next = buildAppliedMatrixFilters(
					startDate,
					endDate,
					result.payload.targetPickupLoc,
					result.payload.targetReturnLoc,
					acrissCode,
					maxDays,
					currency,
				);
				if (next) setAppliedMatrix(next);
			} else {
				query.refetch();
			}
		},
		onError: (e: any) =>
			toast.error(e?.response?.data?.message || "Failed to copy branch prices"),
	});

	const handleCopyBranchPrices = () => {
		if (!appliedMatrix) {
			toast.error("Load the matrix before copying branch prices");
			return;
		}
		const sourcePickup = appliedMatrix.pickupLoc;
		const sourceReturn = appliedMatrix.returnLoc;
		const targetPickup = copyTargetPickupLoc.trim().toUpperCase();
		const targetReturn = copyTargetReturnLoc.trim().toUpperCase();
		const code = appliedMatrix.acrissCode;
		const normalizedCurrency = appliedMatrix.currency;
		if (!sourcePickup || !sourceReturn || !code) {
			toast.error("Choose a source branch and ACRISS before copying prices");
			return;
		}
		if (!targetPickup || !targetReturn) {
			toast.error("Enter the target pickup and return branch codes");
			return;
		}
		if (query.isLoading || query.isFetching) {
			toast.error("Wait for the current matrix to finish loading first");
			return;
		}
		const adjustment = Math.max(0, Number(copyAdjustmentValue) || 0);
		const cells: DailyPricingCellUpdate[] = [];
		for (const row of rows) {
			const pickupDate = String(row.pickupDate || "").slice(0, 10);
			if (!pickupDate) continue;
			for (const dayOffset of dayColumns) {
				const key = `${pickupDate}:${dayOffset}`;
				const raw = pendingEdits[key] ?? row[`day${dayOffset}`];
				if (raw == null || String(raw).trim() === "") continue;
				const sourcePrice = Number(raw);
				if (!Number.isFinite(sourcePrice) || sourcePrice <= 0) continue;
				let nextPrice = sourcePrice;
				if (copyAdjustmentMode === "percent") {
					nextPrice = sourcePrice * (1 + adjustment / 100);
				} else if (copyAdjustmentMode === "amount") {
					nextPrice = sourcePrice + adjustment;
				}
				const roundedPrice = Math.round(nextPrice * 100) / 100;
				if (roundedPrice <= 0) continue;
				cells.push({
					pickupDate,
					pickupLoc: targetPickup,
					returnLoc: targetReturn,
					acrissCode: code,
					dayOffset,
					price: roundedPrice,
					currency: normalizedCurrency,
				});
			}
		}
		if (cells.length === 0) {
			toast.error("There are no filled source prices to copy in this matrix");
			return;
		}
		copyBranchPricesMutation.mutate({
			cells,
			targetPickupLoc: targetPickup,
			targetReturnLoc: targetReturn,
		});
	};

	const copySourcePreview = useMemo(
		() =>
			appliedMatrix ??
			buildAppliedMatrixFilters(
				startDate,
				endDate,
				pickupLoc,
				returnLoc,
				acrissCode,
				maxDays,
				currency,
			),
		[
			appliedMatrix,
			startDate,
			endDate,
			pickupLoc,
			returnLoc,
			acrissCode,
			maxDays,
			currency,
		],
	);

	return (
		<div className="space-y-6">
			<datalist id="daily-pricing-branch-codes">
				{branchCodeOptions.map((code) => (
					<option key={code} value={code} />
				))}
			</datalist>
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
								length directly inside the Pricing tab. Start from a stored
								sample or add a new ACRISS code and vehicle definition here.
							</p>
						</div>
						<div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur">
							<p className="font-bold text-white">How to use</p>
							<ol className="mt-2 space-y-1 text-xs leading-5 text-blue-100">
								<li>1. Select a sample or add an ACRISS vehicle.</li>
								<li>2. Open matrix setup and click Load matrix.</li>
								<li>3. Edit cells, apply defaults, or copy rates to another branch.</li>
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
							From Pricing Fetch & Store/manual vehicles
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Selected ACRISS
						</p>
						<p className="mt-2 text-lg font-bold text-emerald-950">
							{acrissCode || "—"}
						</p>
						<p className="mt-1 truncate text-xs text-emerald-700">
							{selectedVehicleLabel || "Define vehicle in setup"}
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
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50">
					<div className="flex items-start gap-3">
						<div className="rounded-xl bg-blue-100 p-2 text-blue-700">
							<Copy className="h-5 w-5" aria-hidden />
						</div>
						<div className="min-w-0 flex-1">
							<CardTitle className="text-xl font-bold text-slate-950">
								Copy prices to another branch
							</CardTitle>
							<p className="mt-1 text-sm leading-6 text-slate-600">
								After you load the matrix, copy filled day prices from one
								branch pair to another — with an optional percent or flat
								increase.
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{!appliedMatrix ? (
						<p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
							<strong>Load matrix first.</strong> Pick a sample (optional),
							Open <strong>Set up & load matrix</strong>, configure filters, then
							click <strong>Load matrix</strong>. The summary shows your draft
							until a matrix is loaded.
						</p>
					) : null}
					{copySourcePreview ? (
						<div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm md:grid-cols-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
									Copy from
								</p>
								<p className="mt-1 font-mono font-semibold text-slate-950">
									{copySourcePreview.pickupLoc} → {copySourcePreview.returnLoc}
								</p>
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
									Vehicle
								</p>
								<p className="mt-1 font-semibold text-slate-950">
									{copySourcePreview.acrissCode}{" "}
									{selectedVehicleLabel ? `· ${selectedVehicleLabel}` : ""}
								</p>
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
									Date range
								</p>
								<p className="mt-1 font-semibold text-slate-950">
									{copySourcePreview.startDate} → {copySourcePreview.endDate}
								</p>
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
									Columns copied
								</p>
								<p className="mt-1 font-semibold text-slate-950">
									Day 1–{copySourcePreview.maxDays}
								</p>
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-500">
							Enter branch codes, dates, and ACRISS in matrix filters to preview
							the copy source.
						</p>
					)}

					<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
						<Input
							label="Target pickup branch"
							list="daily-pricing-branch-codes"
							value={copyTargetPickupLoc}
							onChange={(e) =>
								setCopyTargetPickupLoc(e.target.value.toUpperCase())
							}
							placeholder="Branch code"
							helperText="Example: copy current branch prices to another pickup branch."
							disabled={!appliedMatrix}
						/>
						<Input
							label="Target return branch"
							list="daily-pricing-branch-codes"
							value={copyTargetReturnLoc}
							onChange={(e) =>
								setCopyTargetReturnLoc(e.target.value.toUpperCase())
							}
							placeholder="Branch code"
							helperText="Use the same code for same-branch rentals."
							disabled={!appliedMatrix}
						/>
						<Select
							label="Price adjustment"
							value={copyAdjustmentMode}
							onChange={(e) =>
								setCopyAdjustmentMode(
									e.target.value as BranchCopyAdjustmentMode,
								)
							}
							options={[
								{ value: "same", label: "Exact copy" },
								{ value: "percent", label: "Increase by %" },
								{ value: "amount", label: "Increase by amount" },
							]}
							helperText="Use increase when another branch should be more expensive."
							disabled={!appliedMatrix}
						/>
						<Input
							label={
								copyAdjustmentMode === "percent"
									? "Increase percent"
									: "Increase amount"
							}
							type="number"
							min={0}
							step="0.01"
							value={copyAdjustmentValue}
							onChange={(e) =>
								setCopyAdjustmentValue(Number(e.target.value) || 0)
							}
							disabled={!appliedMatrix || copyAdjustmentMode === "same"}
							helperText={
								copyAdjustmentMode === "same"
									? "No price increase."
									: copyAdjustmentMode === "percent"
										? "10 means +10%."
										: "Adds this amount to every copied price."
							}
						/>
						<div className="flex flex-col justify-end gap-2">
							<label className="flex items-center gap-2 text-xs text-slate-600">
								<input
									type="checkbox"
									checked={copySwitchAfter}
									onChange={(e) => setCopySwitchAfter(e.target.checked)}
									disabled={!appliedMatrix}
									className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								Switch matrix to target after copy
							</label>
							<Button
								type="button"
								variant="primary"
								onClick={handleCopyBranchPrices}
								loading={copyBranchPricesMutation.isPending}
								disabled={
									!appliedMatrix || query.isLoading || query.isFetching
								}
							>
								Copy branch prices
							</Button>
						</div>
					</div>
					<p className="text-xs leading-5 text-slate-500">
						Only filled prices are copied. Empty cells stay untouched on the target
						branch.
					</p>
				</CardContent>
			</Card>

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
							No stored samples yet. Run <strong>Fetch &amp; Store</strong>{" "}
							above on your availability endpoint, or add a manual sample, then
							choose it here to manage daily prices.
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
									helperText="Mirrors each vehicle card under Stored availability samples — pick which ACRISS drives the matrix, or use a vehicle card’s Manage daily prices button to preselect it here."
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
				</CardContent>
			</Card>


			<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-violet-50">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 flex-1">
							<CardTitle className="text-xl font-bold text-slate-950">
								Daily price matrix
							</CardTitle>
							<p className="mt-1 text-sm text-slate-600">
								{appliedMatrix
									? "Rates per pickup date and rental day. Branch, vehicle, and ACRISS apply to the whole grid."
									: "Open setup to choose branch, ACRISS, dates, and optional default fill."}
							</p>
							{appliedMatrix ? (
								<div className="mt-3 space-y-2">
									<p className="text-sm font-semibold text-slate-900">
										{formatBranchLine(
											appliedMatrix.pickupLoc,
											appliedMatrix.returnLoc,
										)}
									</p>
									<div className="flex flex-wrap gap-2">
										<span className="inline-flex items-center rounded-md bg-orange-500 px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
											{appliedMatrix.acrissCode}
										</span>
										{selectedVehicleLabel ? (
											<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-200">
												{selectedVehicleLabel}
											</span>
										) : null}
										<span className="rounded-full bg-white/90 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
											{appliedMatrix.currency} · Day 1–{appliedMatrix.maxDays}
										</span>
									</div>
								</div>
							) : null}
						</div>
						<Button
							type="button"
							variant={appliedMatrix ? "secondary" : "primary"}
							className="shrink-0 gap-2"
							onClick={() => setIsMatrixSetupOpen(true)}
						>
							<Settings2 className="h-4 w-4" aria-hidden />
							{appliedMatrix ? "Edit setup" : "Set up & load matrix"}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{!appliedMatrix ? (
						samplesQuery.isLoading || samplesQuery.isFetching ? (
							<div className="px-6 py-14">
								<Loader />
								<p className="mt-3 text-center text-sm text-slate-600">
									Loading latest pricing sample…
								</p>
							</div>
						) : (
							<div className="px-6 py-14 text-center text-sm text-slate-600">
								<p className="font-semibold text-slate-900">Matrix not loaded</p>
								<p className="mx-auto mt-2 max-w-md leading-6">
									Add a stored sample on the Pricing tab (fetch or manual import),
									or open setup to choose branch, ACRISS, and dates.
								</p>
								<Button
									type="button"
									variant="primary"
									className="mt-4"
									onClick={() => setIsMatrixSetupOpen(true)}
								>
									Set up & load matrix
								</Button>
							</div>
						)
					) : (
						<>
							<div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
								<div className="flex flex-wrap items-center gap-2">
									<span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
										Year
									</span>
									{calendarYears.map((year) => (
										<button
											key={year}
											type="button"
											onClick={() => applyCalendarYear(year)}
											className={cn(
												"rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
												year === activeCalendarYear
													? "border-violet-600 bg-violet-600 text-white shadow-sm"
													: "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50",
											)}
										>
											{year}
											{year === getYear(new Date()) ? (
												<span className="ml-1 opacity-80">· current</span>
											) : null}
										</button>
									))}
								</div>
								<div className="mt-3 flex flex-wrap items-center gap-1.5">
									<span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
										Month
									</span>
									{MONTH_SHORT.map((label, monthIndex) => (
										<button
											key={label}
											type="button"
											onClick={() =>
												applyCalendarMonth(activeCalendarYear, monthIndex)
											}
											className={cn(
												"min-w-[2.6rem] rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors",
												monthIndex === activeCalendarMonth
													? "border-amber-400 bg-amber-300 text-amber-950 shadow-sm"
													: "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50",
											)}
										>
											{label}
										</button>
									))}
								</div>
								{matrixAcrissFilters.length > 0 ? (
									<div className="mt-3 flex flex-wrap items-center gap-2">
										<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
											ACRISS
										</span>
										{matrixAcrissFilters.map((code) => {
											const active =
												code ===
												(appliedMatrix.acrissCode ||
													normalizeAcrissCode(acrissCode));
											return (
												<label
													key={code}
													className={cn(
														"inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
														active
															? "border-orange-400 bg-orange-50 text-orange-950"
															: "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
													)}
												>
													<input
														type="checkbox"
														className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
														checked={active}
														onChange={() => selectMatrixAcriss(code)}
													/>
													{code}
												</label>
											);
										})}
									</div>
								) : null}
								<div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
									<span>
										Viewing:{" "}
										<strong className="text-slate-900">
											{formatViewingMonthLabel(appliedMatrix.startDate)}
										</strong>
										{" · ACRISS: "}
										<strong className="font-mono text-orange-700">
											{appliedMatrix.acrissCode}
										</strong>
									</span>
									{matrixSaveStatus === "saving" ? (
										<span className="inline-flex items-center gap-1 text-xs text-slate-500">
											Saving…
										</span>
									) : matrixSaveStatus === "saved" ? (
										<span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
											<Check className="h-3.5 w-3.5" aria-hidden />
											All changes autosaved
										</span>
									) : (
										<span className="inline-flex items-center gap-1 text-xs text-slate-500">
											<Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
											Edit a cell and tab away to save
										</span>
									)}
								</div>
							</div>
							{query.isLoading ? (
								<div className="p-8">
									<Loader />
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[720px] border-collapse text-sm">
										<thead>
											<tr className="bg-slate-800 text-[11px] font-bold uppercase tracking-wide text-white">
												<th className="sticky left-0 z-20 bg-slate-800 px-3 py-2.5 text-left">
													Pickup date
												</th>
												<th className="sticky left-[7.5rem] z-20 bg-slate-800 px-2 py-2.5 text-center">
													ACRISS
												</th>
												{dayColumns.map((d) => (
													<th
														key={d}
														className="min-w-[4.75rem] px-1.5 py-2.5 text-center whitespace-nowrap"
													>
														<span className="inline-flex items-center justify-center gap-0.5">
															Day {d}
															<Info
																className="h-3 w-3 opacity-60"
																aria-hidden
															/>
														</span>
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{rows.map((r) => {
												const pickupIso = isoDateOnly(String(r.pickupDate));
												const rowAcriss =
													normalizeAcrissCode(
														String(r.acrissCode ?? ""),
													) || appliedMatrix.acrissCode;
												const isToday = pickupIso === todayPickupIso;
												return (
													<tr
														key={pickupIso || String(r.pickupDate)}
														className={cn(
															"border-b border-slate-100",
															isToday
																? "bg-amber-50/90"
																: "hover:bg-violet-50/40",
														)}
													>
														<td
															className={cn(
																"sticky left-0 z-10 whitespace-nowrap px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
																isToday ? "bg-amber-50/90" : "bg-white",
															)}
														>
															{formatPickupDateDisplay(pickupIso)}
														</td>
														<td
															className={cn(
																"sticky left-[7.5rem] z-10 px-2 py-1.5 text-center",
																isToday ? "bg-amber-50/90" : "bg-white",
															)}
														>
															<span className="inline-block min-w-[3.25rem] rounded bg-orange-500 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
																{rowAcriss}
															</span>
														</td>
														{dayColumns.map((d) => {
															const editKey = `${pickupIso}:${d}`;
															const stored = r[`day${d}`] as
																| number
																| null;
															const display =
																pendingEdits[editKey] ??
																stored ??
																"";
															return (
																<td
																	key={d}
																	className="px-1 py-1 align-middle"
																>
																	<input
																		type="number"
																		step="0.01"
																		min={0}
																		aria-label={`Day ${d} price for ${formatPickupDateDisplay(pickupIso)}`}
																		className="w-full min-w-[4.25rem] rounded border border-slate-200 bg-white px-1.5 py-1 text-right text-xs tabular-nums text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
																		value={display}
																		onChange={(e) => {
																			const raw = e.target.value;
																			if (raw === "") {
																				setPendingEdits((prev) => ({
																					...prev,
																					[editKey]: 0,
																				}));
																				return;
																			}
																			const value =
																				Number(raw) || 0;
																			setPendingEdits((prev) => ({
																				...prev,
																				[editKey]: value,
																			}));
																		}}
																		onBlur={(e) => {
																			const value =
																				Number(e.target.value) || 0;
																			handlePriceCellBlur(
																				pickupIso,
																				d,
																				editKey,
																				stored,
																				value,
																			);
																		}}
																	/>
																</td>
															);
														})}
													</tr>
												);
											})}
										</tbody>
									</table>
									{rows.length === 0 ? (
										<p className="px-4 py-6 text-center text-sm text-slate-500">
											No rows for this range. Pick another month or open setup
											to adjust dates and reload.
										</p>
									) : null}
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<Modal
				isOpen={isMatrixSetupOpen}
				onClose={() => setIsMatrixSetupOpen(false)}
				title="Matrix setup & default fill"
				size="xl"
			>
				<div className="max-h-[82vh] overflow-y-auto pr-1">
					<form onSubmit={handleLoadMatrix} className="space-y-5">
					<p className="text-xs text-gray-500">
						Set branch, vehicle, date window, and rental-length columns. Nothing
						loads until you click <strong>Load matrix</strong>. Copy rates to
						other branches in the section above once the matrix is loaded.
					</p>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						<Input
							label="Start date"
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								switchToManualFilters();
							}}
						/>
						<Input
							label="End date"
							type="date"
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								switchToManualFilters();
							}}
						/>
						<Input
							label="Pickup branch code"
							list="daily-pricing-branch-codes"
							value={pickupLoc}
							onChange={(e) => {
								setPickupLoc(e.target.value.toUpperCase());
								switchToManualFilters();
							}}
							helperText="The branch you are editing prices for."
						/>
						<Input
							label="Return branch code"
							list="daily-pricing-branch-codes"
							value={returnLoc}
							onChange={(e) => {
								setReturnLoc(e.target.value.toUpperCase());
								switchToManualFilters();
							}}
							helperText="Use the same code for same-branch rentals."
						/>

						<div className="md:col-span-2">
							<label
								htmlFor="daily-acriss-picker"
								className="mb-1 block text-sm font-medium text-gray-700"
							>
								ACRISS code
							</label>
							<AcrissCodePicker
								id="daily-acriss-picker"
								value={acrissCode}
								onChange={(code) => {
									setAcrissCode(code);
									switchToManualFilters();
								}}
								customCodes={acrissPickerCustomCodes}
							/>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end md:col-span-2">
							<Input
								className="font-mono uppercase"
								label="Add custom ACRISS"
								value={newAcrissDraft}
								onChange={(e) =>
									setNewAcrissDraft(
										e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
									)
								}
								placeholder="New code…"
								maxLength={8}
							/>
							<Button
								type="button"
								variant="secondary"
								className="shrink-0"
								onClick={handleAddCustomAcriss}
							>
								<Plus className="mr-1 h-4 w-4" aria-hidden />
								New ACRISS
							</Button>
						</div>

						<Input
							label="Currency"
							value={currency}
							onChange={(e) => {
								setCurrency(e.target.value.toUpperCase().slice(0, 3));
								switchToManualFilters();
							}}
						/>
						<Input
							label="Day columns"
							type="number"
							min={1}
							max={31}
							value={maxDays}
							onChange={(e) => {
								setMaxDays(
									Math.max(1, Math.min(31, Number(e.target.value) || 1)),
								);
								switchToManualFilters();
							}}
						/>
						<div className="flex flex-col gap-2 md:col-span-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsMatrixSetupOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={query.isFetching}
							>
								Load matrix
							</Button>
							{appliedMatrix ? (
								<p className="text-xs text-slate-600">
									Showing{" "}
									<span className="font-mono font-semibold text-slate-900">
										{appliedMatrix.pickupLoc} → {appliedMatrix.returnLoc}
									</span>
									{" · "}
									<span className="font-mono font-semibold text-slate-900">
										{appliedMatrix.acrissCode}
									</span>
									{" · "}
									{appliedMatrix.startDate} → {appliedMatrix.endDate}
									{" · "}
									Day 1–{appliedMatrix.maxDays}
								</p>
							) : (
								<p className="text-xs text-slate-500">
									Matrix data appears after you submit this form.
								</p>
							)}
						</div>
					</div>

					<div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
						<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-bold text-slate-900">
									Vehicle definition
								</p>
								<p className="text-xs text-slate-600">
									Make and model are kept as an editable vehicle profile. Keep
									it collapsed when you only need to update branch prices.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
									{selectedVehicleLabel || "No vehicle defined"}
								</span>
								<button
									type="button"
									onClick={() =>
										setShowVehicleDefinitionEditor((open) => !open)
									}
									className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50"
								>
									{vehicleDefinitionEditorOpen
										? "Hide make/model"
										: "Edit make/model"}
								</button>
							</div>
						</div>

						{!vehicleDefinitionEditorOpen ? (
							<div className="grid gap-3 rounded-xl border border-blue-100 bg-white p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
										Make
									</p>
									<p className="mt-1 font-semibold text-slate-950">
										{vehicleMake || "—"}
									</p>
								</div>
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
										Model
									</p>
									<p className="mt-1 font-semibold text-slate-950">
										{vehicleModel || "—"}
									</p>
								</div>
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
										Specs
									</p>
									<p className="mt-1 font-semibold text-slate-950">
										{vehicleTransmission || "—"} · {vehicleDoors || "—"} doors
									</p>
								</div>
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
										Capacity
									</p>
									<p className="mt-1 font-semibold text-slate-950">
										{vehicleSeats || "—"} seats · bags {vehicleBaggage || "—"}
									</p>
								</div>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
									<div className="lg:col-span-2">
										<label
											htmlFor="daily-vehicle-make"
											className="mb-1 block text-sm font-medium text-gray-700"
										>
											Make
										</label>
										<SearchableStringPicker
											id="daily-vehicle-make"
											value={vehicleMake}
											onChange={(value) => {
												setVehicleMake(value);
												switchToManualFilters();
											}}
											onCommit={() => setVehicleModel("")}
											options={vehicleMakeOptions}
											loading={nhtsaMakesQuery.isLoading}
											placeholder="Search or type make…"
											helperText="Suggestions load from NHTSA vPIC; typed makes are allowed."
											initialVisible={50}
										/>
									</div>
									<div className="lg:col-span-2">
										<label
											htmlFor="daily-vehicle-model"
											className="mb-1 block text-sm font-medium text-gray-700"
										>
											Model
										</label>
										<SearchableStringPicker
											id="daily-vehicle-model"
											value={vehicleModel}
											onChange={(value) => {
												setVehicleModel(value);
												switchToManualFilters();
											}}
											options={vehicleModelOptions}
											loading={
												!!vehicleMakeTrimmed && nhtsaModelsQuery.isLoading
											}
											disabled={!vehicleMakeTrimmed}
											placeholder={
												vehicleMakeTrimmed
													? "Search or type model…"
													: "Choose a make first…"
											}
											emptyListHint="No catalog match — enter the model manually."
											initialVisible={50}
										/>
									</div>
									<Input
										label="Transmission"
										value={vehicleTransmission}
										onChange={(e) => {
											setVehicleTransmission(e.target.value);
											switchToManualFilters();
										}}
										placeholder="Automatic"
									/>
									<Input
										label="Doors"
										value={vehicleDoors}
										onChange={(e) => {
											setVehicleDoors(e.target.value);
											switchToManualFilters();
										}}
										placeholder="4"
									/>
									<Input
										label="Seats"
										value={vehicleSeats}
										onChange={(e) => {
											setVehicleSeats(e.target.value);
											switchToManualFilters();
										}}
										placeholder="5"
									/>
									<Input
										label="Bags (S/M)"
										value={vehicleBaggage}
										onChange={(e) => {
											setVehicleBaggage(e.target.value);
											switchToManualFilters();
										}}
										placeholder="1/2"
									/>
								</div>
								<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
									<Button
										type="button"
										onClick={handleSaveVehicleDefinition}
										loading={saveVehicleDefinitionMutation.isPending}
									>
										Save vehicle definition
									</Button>
									<p className="text-xs leading-5 text-slate-600">
										This creates/updates a manual Pricing sample for{" "}
										{acrissCode || "the code"} and reloads the stored sample
										list.
									</p>
								</div>
							</>
						)}
					</div>
					</form>

					<div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
						<p className="text-sm font-bold text-emerald-950">Default fill (optional)</p>
						<p className="mt-1 text-xs text-emerald-800">
							Apply a baseline price across rental days before editing individual cells.
						</p>
						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
							<div className="flex items-end">
								<Button
									type="button"
									variant="secondary"
									onClick={() => applyDefaultMutation.mutate()}
									loading={applyDefaultMutation.isPending}
									disabled={!appliedMatrix}
								>
									Apply to loaded range
								</Button>
							</div>
						</div>
						{!appliedMatrix ? (
							<p className="mt-2 text-xs text-emerald-800">
								Load the matrix first to apply default fill to the date range.
							</p>
						) : null}
					</div>

				</div>
			</Modal>
		</div>
	);
}
