export const BRANCH_DAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

export type BranchDay = (typeof BRANCH_DAYS)[number];

export const BRANCH_DAY_LABELS: Record<BranchDay, string> = {
	monday: "Mon",
	tuesday: "Tue",
	wednesday: "Wed",
	thursday: "Thu",
	friday: "Fri",
	saturday: "Sat",
	sunday: "Sun",
};

export const BRANCH_DAY_CAPITALIZED: Record<BranchDay, string> = {
	monday: "Monday",
	tuesday: "Tuesday",
	wednesday: "Wednesday",
	thursday: "Thursday",
	friday: "Friday",
	saturday: "Saturday",
	sunday: "Sunday",
};

export type DayOpeningHours = {
	open: string;
	close: string;
	closesNextDay: boolean;
	closed: boolean;
};

export function emptyDayOpeningHours(): DayOpeningHours {
	return { open: "", close: "", closesNextDay: false, closed: false };
}

export function emptyWeekOpeningHours(): Record<BranchDay, DayOpeningHours> {
	return BRANCH_DAYS.reduce(
		(acc, day) => {
			acc[day] = emptyDayOpeningHours();
			return acc;
		},
		{} as Record<BranchDay, DayOpeningHours>,
	);
}

export function parseTimeToMinutes(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;
	const hours = Number.parseInt(match[1], 10);
	const minutes = Number.parseInt(match[2], 10);
	if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
	if (hours === 24 && minutes !== 0) return null;
	return hours * 60 + minutes;
}

export function normalizeTimeInput(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "";
	const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return trimmed;
	const hours = Math.min(24, Math.max(0, Number.parseInt(match[1], 10)));
	const minutes = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
	if (hours === 24) return "24:00";
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** True only for all-day 00:00 → 24:00 (not “open until midnight” with close 24:00). */
export function is24HourDay(hours: DayOpeningHours): boolean {
	if (hours.closed || !hours.open) return false;
	return hours.open === "00:00" && hours.close === "24:00";
}

/** Same calendar day, open until end of day (close stored as 24:00). */
export function isUntilMidnightSameDay(hours: DayOpeningHours): boolean {
	if (hours.closed || !hours.open || hours.open === "00:00") return false;
	return hours.close === "24:00";
}

export function inferClosesNextDay(open: string, close: string): boolean {
	if (!open || !close || close === "24:00") return false;
	const openMin = parseTimeToMinutes(open);
	const closeMin = parseTimeToMinutes(close);
	if (openMin == null || closeMin == null) return false;
	return closeMin < openMin;
}

export function isOvernightDay(hours: DayOpeningHours): boolean {
	if (hours.closed || !hours.open || !hours.close || is24HourDay(hours)) return false;
	if (isUntilMidnightSameDay(hours)) return false;
	return hours.closesNextDay || inferClosesNextDay(hours.open, hours.close);
}

export function resolveClosesNextDay(
	open: string,
	close: string,
	explicit?: boolean,
): boolean {
	if (explicit !== undefined) return explicit;
	if (!close || close === "24:00") return false;
	return inferClosesNextDay(open, close);
}

export function effectiveClose(hours: DayOpeningHours): string {
	if (hours.closed || !hours.open) return "";
	if (hours.close) return hours.close;
	return "24:00";
}

export const MINUTES_PER_DAY = 24 * 60;
export const TIMELINE_SNAP_MINUTES = 15;
export const TIMELINE_HOUR_MARKS = [0, 6, 12, 18, 24] as const;

export function minutesToTimeString(minutes: number): string {
	const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, minutes));
	if (clamped >= MINUTES_PER_DAY) return "24:00";
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function snapTimelineMinutes(minutes: number): number {
	return Math.round(minutes / TIMELINE_SNAP_MINUTES) * TIMELINE_SNAP_MINUTES;
}

export function percentToTimelineMinutes(percent: number): number {
	const pct = Math.max(0, Math.min(100, percent));
	return snapTimelineMinutes((pct / 100) * MINUTES_PER_DAY);
}

export function timelineMinutesToPercent(minutes: number): number {
	return (minutes / MINUTES_PER_DAY) * 100;
}

export function getAttr(obj: unknown, key: string): string {
	if (!obj || typeof obj !== "object") return "";
	const record = obj as Record<string, unknown>;
	const val =
		(record.attr as Record<string, unknown> | undefined)?.[key] ??
		(record["@attributes"] as Record<string, unknown> | undefined)?.[key] ??
		record[`@_${key}`] ??
		record[key] ??
		record[key.toLowerCase()] ??
		"";
	return typeof val === "object" ? "" : String(val ?? "").trim();
}

export function dayHoursFromLegacyString(value: string): DayOpeningHours {
	const trimmed = value.trim();
	if (!trimmed) return emptyDayOpeningHours();
	if (/^closed$/i.test(trimmed)) {
		return { open: "", close: "", closesNextDay: false, closed: true };
	}
	const parts = trimmed.split(/\s*-\s*/);
	if (parts.length === 2) {
		const open = normalizeTimeInput(parts[0]);
		const close = normalizeTimeInput(parts[1]);
		return {
			open,
			close,
			closesNextDay: inferClosesNextDay(open, close),
			closed: false,
		};
	}
	return { open: normalizeTimeInput(trimmed), close: "", closesNextDay: false, closed: false };
}

export function dayHoursFromOpeningEntry(entry: unknown): DayOpeningHours {
	if (!entry) return emptyDayOpeningHours();
	if (typeof entry === "string") return dayHoursFromLegacyString(entry);

	const openTime = normalizeTimeInput(getAttr(entry, "Open"));
	let closeTime = normalizeTimeInput(
		getAttr(entry, "Closed") || getAttr(entry, "Close"),
	);

	if (openTime && !closeTime && openTime.includes("-")) {
		return dayHoursFromLegacyString(openTime);
	}

	if (!openTime && !closeTime) return emptyDayOpeningHours();
	if (/^closed$/i.test(openTime)) {
		return { open: "", close: "", closesNextDay: false, closed: true };
	}

	const closesNextDay = inferClosesNextDay(openTime, closeTime);
	return {
		open: openTime,
		close: closeTime,
		closesNextDay,
		closed: false,
	};
}

export function extractWeekOpeningHours(
	rawJson: Record<string, unknown> | null | undefined,
): Record<BranchDay, DayOpeningHours> {
	const week = emptyWeekOpeningHours();
	if (!rawJson || typeof rawJson !== "object") return week;

	const opening = (rawJson.Opening ?? rawJson.opening) as
		| Record<string, unknown>
		| undefined;
	if (!opening || typeof opening !== "object") return week;

	for (const day of BRANCH_DAYS) {
		const cap = BRANCH_DAY_CAPITALIZED[day];
		const entry = opening[day] ?? opening[cap];
		if (entry) week[day] = dayHoursFromOpeningEntry(entry);
	}
	return week;
}

export function buildOpeningPayload(
	week: Record<BranchDay, DayOpeningHours>,
): Record<string, { attr: { Open: string; Closed: string } }> | null {
	const opening: Record<string, { attr: { Open: string; Closed: string } }> =
		{};

	for (const day of BRANCH_DAYS) {
		const hours = week[day];
		if (!hours || hours.closed) continue;
		const open = normalizeTimeInput(hours.open);
		const close = normalizeTimeInput(hours.close);
		if (!open) continue;

		const cap = BRANCH_DAY_CAPITALIZED[day];
		if (close) {
			opening[cap] = { attr: { Open: open, Closed: close } };
		} else {
			opening[cap] = { attr: { Open: open, Closed: "24:00" } };
		}
	}

	return Object.keys(opening).length > 0 ? opening : null;
}

export function formatDayHoursLabelForDay(
	day: BranchDay,
	hours: DayOpeningHours,
): string {
	if (hours.closed) return "Closed";
	if (!hours.open) return "—";
	if (is24HourDay(hours)) return "24 hours";
	if (isUntilMidnightSameDay(hours)) {
		return `${hours.open} – midnight`;
	}
	const close = hours.close || "";
	if (isOvernightDay(hours)) {
		const dayIndex = BRANCH_DAYS.indexOf(day);
		const nextLabel = BRANCH_DAY_LABELS[BRANCH_DAYS[(dayIndex + 1) % 7]];
		return `${hours.open} → ${nextLabel} ${close}`;
	}
	if (close) return `${hours.open} – ${close}`;
	return hours.open;
}

export function weekHasOpeningHours(week: Record<BranchDay, DayOpeningHours>): boolean {
	return BRANCH_DAYS.some((day) => {
		const h = week[day];
		return h.closed || Boolean(h.open?.trim());
	});
}

export function legacyStringFromDayHours(hours: DayOpeningHours): string {
	if (hours.closed) return "Closed";
	if (!hours.open) return "";
	const close = hours.close || "24:00";
	return `${hours.open} - ${close}`;
}

/** Timeline segments as percentages of a 24h day (0–100). */
export function timelineSegments(hours: DayOpeningHours): Array<{
	left: number;
	width: number;
	overnight?: boolean;
}> {
	if (hours.closed || !hours.open) return [];
	const openMin = parseTimeToMinutes(hours.open);
	if (openMin == null) return [];

	if (is24HourDay(hours)) {
		return [{ left: 0, width: 100 }];
	}

	if (!hours.close) {
		return [{ left: (openMin / MINUTES_PER_DAY) * 100, width: 1.5 }];
	}

	const closeMin = parseTimeToMinutes(hours.close);
	if (closeMin == null) return [];

	if (isUntilMidnightSameDay(hours)) {
		return [
			{
				left: (openMin / MINUTES_PER_DAY) * 100,
				width: Math.max(0, ((MINUTES_PER_DAY - openMin) / MINUTES_PER_DAY) * 100),
			},
		];
	}

	const overnight = isOvernightDay(hours);

	if (!overnight) {
		const end = closeMin === 0 ? MINUTES_PER_DAY : closeMin;
		return [
			{
				left: (openMin / MINUTES_PER_DAY) * 100,
				width: Math.max(0, ((end - openMin) / MINUTES_PER_DAY) * 100),
			},
		];
	}

	return [
		{
			left: (openMin / MINUTES_PER_DAY) * 100,
			width: ((MINUTES_PER_DAY - openMin) / MINUTES_PER_DAY) * 100,
			overnight: true,
		},
		{
			left: 0,
			width: (closeMin / MINUTES_PER_DAY) * 100,
			overnight: true,
		},
	];
}
