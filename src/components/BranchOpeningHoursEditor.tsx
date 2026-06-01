import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, X } from "lucide-react";
import { Button } from "./ui/Button";
import {
	BRANCH_DAYS,
	BRANCH_DAY_LABELS,
	type BranchDay,
	type DayOpeningHours,
	emptyDayOpeningHours,
	formatDayHoursLabelForDay,
	is24HourDay,
	isOvernightDay,
	isUntilMidnightSameDay,
	resolveClosesNextDay,
	MINUTES_PER_DAY,
	minutesToTimeString,
	normalizeTimeInput,
	parseTimeToMinutes,
	percentToTimelineMinutes,
	TIMELINE_HOUR_MARKS,
	TIMELINE_SNAP_MINUTES,
	timelineMinutesToPercent,
	timelineSegments,
} from "../lib/branchOpeningHours";

type CopySource = BranchDay;
type DragMode = "open" | "close" | "range" | "create";

const PRESETS = {
	"9-5": { open: "09:00", close: "17:00", closesNextDay: false },
	"8-8": { open: "08:00", close: "20:00", closesNextDay: false },
	"20-2": { open: "20:00", close: "02:00", closesNextDay: true },
	"24h": { open: "00:00", close: "24:00", closesNextDay: false },
} as const;

const DEFAULT_RANGE_MINUTES = 8 * 60;
const MIN_RANGE_MINUTES = 30;

interface BranchOpeningHoursEditorProps {
	value: Record<BranchDay, DayOpeningHours>;
	onChange: (next: Record<BranchDay, DayOpeningHours>) => void;
}

function updateDay(
	value: Record<BranchDay, DayOpeningHours>,
	day: BranchDay,
	patch: Partial<DayOpeningHours>,
): Record<BranchDay, DayOpeningHours> {
	const current = value[day] ?? emptyDayOpeningHours();
	const merged = { ...current, ...patch, closed: patch.closed ?? current.closed };

	if (merged.closed) {
		return {
			...value,
			[day]: { open: "", close: "", closesNextDay: false, closed: true },
		};
	}

	if (patch.closesNextDay !== undefined) {
		merged.closesNextDay = patch.closesNextDay;
	} else if (patch.open !== undefined || patch.close !== undefined) {
		merged.closesNextDay = resolveClosesNextDay(merged.open, merged.close || "");
	}

	return { ...value, [day]: merged };
}

function TimeField({
	value,
	onChange,
	disabled,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
	placeholder?: string;
}) {
	return (
		<input
			type="text"
			inputMode="numeric"
			disabled={disabled}
			value={value}
			placeholder={placeholder ?? "08:00"}
			maxLength={5}
			onChange={(e) => onChange(e.target.value)}
			onBlur={(e) => {
				const n = normalizeTimeInput(e.target.value);
				if (n) onChange(n);
			}}
			className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-mono text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
		/>
	);
}

function clientXToPercent(clientX: number, rect: DOMRect): number {
	return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
}

function InteractiveDayTimeline({
	day,
	hours,
	disabled,
	onUpdate,
}: {
	day: BranchDay;
	hours: DayOpeningHours;
	disabled?: boolean;
	onUpdate: (patch: Partial<DayOpeningHours>) => void;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		mode: DragMode;
		anchorMin: number;
		startOpenMin: number;
		startCloseMin: number;
	} | null>(null);
	const [dragging, setDragging] = useState<DragMode | null>(null);
	const [hoverPct, setHoverPct] = useState<number | null>(null);

	const is24 = is24HourDay(hours);
	const overnight = isOvernightDay(hours);

	const openMin = parseTimeToMinutes(hours.open);
	const closeMin = parseTimeToMinutes(hours.close || "");

	const segments = useMemo(() => timelineSegments(hours), [hours]);
	const summary = formatDayHoursLabelForDay(day, hours);

	const openPct = openMin != null ? timelineMinutesToPercent(openMin) : null;
	const closePct =
		closeMin != null && hours.close
			? timelineMinutesToPercent(closeMin === 0 && !overnight ? MINUTES_PER_DAY : closeMin)
			: null;

	const applyOpen = useCallback(
		(min: number) => {
			if (is24) return;
			let nextOpen = min;
			const closeStr = hours.close || "";

			if (!overnight && closeMin != null && nextOpen >= closeMin) {
				nextOpen = Math.max(0, closeMin - MIN_RANGE_MINUTES);
			}

			const nextClose =
				closeStr ||
				minutesToTimeString(Math.min(MINUTES_PER_DAY, nextOpen + DEFAULT_RANGE_MINUTES));

			onUpdate({
				open: minutesToTimeString(nextOpen),
				close: nextClose,
				closesNextDay: resolveClosesNextDay(
					minutesToTimeString(nextOpen),
					nextClose,
				),
				closed: false,
			});
		},
		[closeMin, hours.close, is24, onUpdate, overnight],
	);

	const applyClose = useCallback(
		(min: number) => {
			if (is24 || openMin == null) return;
			const nextClose = min;
			const closesNextDay = nextClose < openMin;

			onUpdate({
				close: minutesToTimeString(nextClose),
				closesNextDay,
				closed: false,
			});
		},
		[hours.open, is24, onUpdate, openMin],
	);

	const applyRange = useCallback(
		(open: number, close: string, closesNextDay: boolean) => {
			onUpdate({
				open: minutesToTimeString(open),
				close,
				closesNextDay,
				closed: false,
			});
		},
		[onUpdate],
	);

	const handlePointerMove = useCallback(
		(clientX: number) => {
			const track = trackRef.current;
			const drag = dragRef.current;
			if (!track || !drag) return;

			const pct = clientXToPercent(clientX, track.getBoundingClientRect());
			const min = percentToTimelineMinutes(pct);

			if (drag.mode === "open") {
				applyOpen(min);
				return;
			}

			if (drag.mode === "close") {
				applyClose(min);
				return;
			}

			if (drag.mode === "create") {
				const anchor = drag.anchorMin;
				if (min < anchor && anchor - min >= MIN_RANGE_MINUTES) {
					applyRange(anchor, minutesToTimeString(min), true);
					return;
				}
				const lo = Math.min(anchor, min);
				const hi = Math.max(anchor, min);
				if (hi - lo < MIN_RANGE_MINUTES) return;
				applyRange(lo, minutesToTimeString(hi), false);
				return;
			}

			if (drag.mode === "range") {
				const moved = min - drag.anchorMin;
				let nextOpen = drag.startOpenMin + moved;
				let nextClose = drag.startCloseMin + moved;
				const wasOvernight = drag.startCloseMin < drag.startOpenMin;

				if (nextOpen < 0) {
					nextClose -= nextOpen;
					nextOpen = 0;
				}
				if (!wasOvernight && nextClose > MINUTES_PER_DAY) {
					const overflow = nextClose - MINUTES_PER_DAY;
					nextOpen -= overflow;
					nextClose = MINUTES_PER_DAY;
				}
				if (nextOpen < 0) nextOpen = 0;
				if (wasOvernight) {
					if (nextClose < 0) nextClose = 0;
					if (nextOpen >= MINUTES_PER_DAY) {
						nextOpen = MINUTES_PER_DAY - TIMELINE_SNAP_MINUTES;
					}
					applyRange(nextOpen, minutesToTimeString(nextClose), true);
					return;
				}
				if (nextClose - nextOpen < MIN_RANGE_MINUTES) return;

				applyRange(nextOpen, minutesToTimeString(nextClose), false);
			}
		},
		[applyClose, applyOpen, applyRange],
	);

	const startDrag = (mode: DragMode, clientX: number, anchorMin?: number) => {
		if (disabled || is24) return;
		const track = trackRef.current;
		if (!track) return;

		const pct = clientXToPercent(clientX, track.getBoundingClientRect());
		const min = percentToTimelineMinutes(pct);

		const startClose =
			overnight && closeMin != null
				? closeMin
				: closeMin ?? (openMin ?? min) + DEFAULT_RANGE_MINUTES;

		dragRef.current = {
			mode,
			anchorMin: anchorMin ?? min,
			startOpenMin: openMin ?? min,
			startCloseMin: startClose,
		};
		setDragging(mode);
		if (mode === "open" || mode === "close") {
			handlePointerMove(clientX);
		}
	};

	useEffect(() => {
		if (!dragging) return;

		const onMove = (e: PointerEvent) => {
			e.preventDefault();
			handlePointerMove(e.clientX);
		};
		const onUp = (e: PointerEvent) => {
			if (dragging === "create" && dragRef.current && !hours.open) {
				const track = trackRef.current;
				if (track) {
					const pct = clientXToPercent(e.clientX, track.getBoundingClientRect());
					const min = percentToTimelineMinutes(pct);
					const a = dragRef.current.anchorMin;
					const lo = Math.min(a, min);
					const hi = Math.max(a, min);
					if (hi - lo < MIN_RANGE_MINUTES) {
						const center = a;
						applyRange(
							Math.max(0, center - DEFAULT_RANGE_MINUTES / 2),
							minutesToTimeString(
								Math.min(MINUTES_PER_DAY, center + DEFAULT_RANGE_MINUTES / 2),
							),
							false,
						);
					}
				}
			}
			dragRef.current = null;
			setDragging(null);
			setHoverPct(null);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [applyRange, dragging, handlePointerMove, hours.open]);

	const onTrackPointerDown = (e: React.PointerEvent) => {
		if (disabled || is24) return;
		if ((e.target as HTMLElement).dataset.handle) return;

		const track = trackRef.current;
		if (!track) return;

		e.preventDefault();
		const pct = clientXToPercent(e.clientX, track.getBoundingClientRect());
		const min = percentToTimelineMinutes(pct);

		if (!hours.open) {
			track.setPointerCapture(e.pointerId);
			startDrag("create", e.clientX, min);
			return;
		}

		if (openMin != null && closeMin != null && hours.close && !is24) {
			const openP = timelineMinutesToPercent(openMin);
			const endMin =
				overnight || isUntilMidnightSameDay(hours)
					? closeMin === 0
						? MINUTES_PER_DAY
						: closeMin
					: closeMin === 0
						? MINUTES_PER_DAY
						: closeMin;
			const closeP = timelineMinutesToPercent(
				overnight ? closeMin : endMin,
			);
			const rangeStart = overnight ? closeP : openP;
			const rangeEnd = overnight ? openP : closeP;
			if (pct >= Math.min(rangeStart, rangeEnd) + 3 && pct <= Math.max(rangeStart, rangeEnd) - 3) {
				dragRef.current = {
					mode: "range",
					anchorMin: min,
					startOpenMin: openMin,
					startCloseMin: endMin,
				};
				setDragging("range");
				(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
			}
		}
	};

	const showOpenHandle = !disabled && !is24 && openPct != null;
	const defaultClosePct =
		openPct != null
			? timelineMinutesToPercent(
					Math.min(MINUTES_PER_DAY, (openMin ?? 0) + DEFAULT_RANGE_MINUTES),
				)
			: null;
	const showCloseHandle = showOpenHandle;
	const closeHandlePct =
		overnight && closeMin != null
			? timelineMinutesToPercent(closeMin)
			: closePct ?? defaultClosePct;

	return (
		<div className="space-y-0.5">
			<div
				ref={trackRef}
				role="group"
				aria-label={`${BRANCH_DAY_LABELS[day]} hours: ${summary}`}
				className={`relative h-9 w-full min-w-0 touch-none select-none rounded-lg border border-slate-200/80 bg-slate-100 ${
					disabled ? "cursor-not-allowed opacity-50" : is24 ? "cursor-default" : "cursor-crosshair"
				} ${dragging ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
				onPointerDown={onTrackPointerDown}
				onPointerMove={(e) => {
					if (disabled || dragging) return;
					const track = trackRef.current;
					if (!track) return;
					setHoverPct(clientXToPercent(e.clientX, track.getBoundingClientRect()));
				}}
				onPointerLeave={() => {
					if (!dragging) setHoverPct(null);
				}}
			>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 top-2 flex justify-between px-0.5">
					{TIMELINE_HOUR_MARKS.map((h) => (
						<span
							key={h}
							className="text-[9px] font-medium leading-none text-slate-400"
							style={{
								position: "absolute",
								left: h === 24 ? undefined : `${timelineMinutesToPercent(h * 60)}%`,
								right: h === 24 ? "2px" : undefined,
								transform: h > 0 && h < 24 ? "translateX(-50%)" : undefined,
							}}
						>
							{h === 24 ? "24" : String(h).padStart(2, "0")}
						</span>
					))}
				</div>

				<div className="absolute inset-x-0 bottom-3 top-4 overflow-hidden rounded-[4px]">
					{segments.map((seg, i) => (
						<div
							key={i}
							className={`pointer-events-none absolute inset-y-0 rounded-sm ${
								seg.overnight ? "bg-violet-500/90" : "bg-blue-500/90"
							}`}
							style={{
								left: `${seg.left}%`,
								width: `${Math.max(seg.width, 0.5)}%`,
							}}
						/>
					))}
					{!disabled && !is24 && hoverPct != null && !hours.open && (
						<div
							className="pointer-events-none absolute inset-y-0 w-0.5 bg-blue-400/70"
							style={{ left: `${hoverPct}%` }}
						/>
					)}
				</div>

				{showOpenHandle && (
					<button
						type="button"
						data-handle="open"
						aria-label="Drag to set opening time"
						className={`absolute top-3 z-10 h-6 w-3 -translate-x-1/2 cursor-ew-resize rounded-sm border-2 border-white bg-blue-600 shadow-md transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
							dragging === "open" ? "scale-110 ring-2 ring-blue-300" : ""
						}`}
						style={{ left: `${openPct}%` }}
						onPointerDown={(e) => {
							e.stopPropagation();
							e.preventDefault();
							(e.target as HTMLElement).setPointerCapture(e.pointerId);
							startDrag("open", e.clientX);
						}}
					/>
				)}
				{showCloseHandle && (
					<button
						type="button"
						data-handle="close"
						aria-label="Drag to set closing time"
						className={`absolute top-3 z-10 h-6 w-3 -translate-x-1/2 cursor-ew-resize rounded-sm border-2 border-white shadow-md transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
							overnight ? "bg-violet-600" : "bg-blue-600"
						} ${dragging === "close" ? "scale-110 ring-2 ring-violet-300" : ""}`}
						style={{ left: `${closeHandlePct ?? 50}%` }}
						onPointerDown={(e) => {
							e.stopPropagation();
							e.preventDefault();
							(e.target as HTMLElement).setPointerCapture(e.pointerId);
							startDrag("close", e.clientX);
						}}
					/>
				)}
			</div>
		</div>
	);
}

export const BranchOpeningHoursEditor: React.FC<BranchOpeningHoursEditorProps> = ({
	value,
	onChange,
}) => {
	const [copyFrom, setCopyFrom] = useState<CopySource>("monday");

	const applyPreset = (days: BranchDay[], preset: keyof typeof PRESETS) => {
		const p = PRESETS[preset];
		const next = { ...value };
		for (const day of days) {
			next[day] = {
				open: p.open,
				close: p.close,
				closesNextDay: p.closesNextDay,
				closed: false,
			};
		}
		onChange(next);
	};

	const copyToDays = (targetDays: BranchDay[]) => {
		const source = value[copyFrom] ?? emptyDayOpeningHours();
		const next = { ...value };
		for (const day of targetDays) {
			next[day] = { ...source };
		}
		onChange(next);
	};

	const configuredCount = useMemo(
		() => BRANCH_DAYS.filter((d) => value[d]?.closed || value[d]?.open).length,
		[value],
	);

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-3 py-3 sm:px-4">
				<p className="text-sm font-semibold text-slate-900">Weekly schedule</p>
				<p className="mt-0.5 text-xs text-slate-600">
					Drag the bar on each day to set times, or type below. Use{" "}
					<span className="inline-flex items-center gap-0.5 font-medium text-violet-700">
						<Moon className="h-3 w-3" aria-hidden /> +1
					</span>{" "}
					when closing after midnight.
				</p>
				<div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-medium text-slate-600">Copy</span>
						<select
							value={copyFrom}
							onChange={(e) => setCopyFrom(e.target.value as CopySource)}
							className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800"
						>
							{BRANCH_DAYS.map((day) => (
								<option key={day} value={day}>
									{BRANCH_DAY_LABELS[day]}
								</option>
							))}
						</select>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() => copyToDays([...BRANCH_DAYS])}
						>
							All days
						</Button>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() =>
								copyToDays([
									"monday",
									"tuesday",
									"wednesday",
									"thursday",
									"friday",
								])
							}
						>
							Weekdays
						</Button>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="mr-1 text-xs text-slate-500">Quick fill all:</span>
						{(["9-5", "8-8", "20-2", "24h"] as const).map((preset) => (
							<button
								key={preset}
								type="button"
								onClick={() => applyPreset([...BRANCH_DAYS], preset)}
								className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
								title={
									preset === "20-2"
										? "Mon 20:00 → Tue 02:00 (overnight)"
										: undefined
								}
							>
								{preset}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:px-4">
				<span>{configuredCount} of 7 days set</span>
				<span className="hidden sm:inline">Drag bar · blue = open · violet = after midnight</span>
			</div>

			<div className="hidden sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)_4.25rem_4.25rem_2.25rem_2.25rem_1.75rem] sm:gap-x-2 sm:gap-y-0 sm:border-b sm:border-slate-100 sm:px-4 sm:py-2 sm:text-[10px] sm:font-bold sm:uppercase sm:tracking-wide sm:text-slate-400">
				<span>Day</span>
				<span>Hours</span>
				<span className="text-center">Open</span>
				<span className="text-center">Close</span>
				<span className="text-center" title="Closes next day">
					+1
				</span>
				<span className="text-center">Off</span>
				<span />
			</div>

			<ul className="divide-y divide-slate-100">
				{BRANCH_DAYS.map((day) => {
					const hours = value[day] ?? emptyDayOpeningHours();
					const closeVal = hours.close || "";
					const overnight = isOvernightDay(hours);
					const summary = formatDayHoursLabelForDay(day, hours);
					const hasConfig = hours.closed || Boolean(hours.open);

					return (
						<li
							key={day}
							className={`px-3 py-2.5 sm:px-4 sm:py-2 ${
								hasConfig ? "bg-white" : "bg-slate-50/40"
							}`}
						>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-[2.75rem_minmax(0,1fr)_4.25rem_4.25rem_2.25rem_2.25rem_1.75rem] sm:items-center sm:gap-x-2">
								<div className="flex items-center justify-between sm:block">
									<span className="text-sm font-bold text-slate-800 sm:text-xs">
										{BRANCH_DAY_LABELS[day]}
									</span>
									<span
										className={`text-xs font-medium sm:hidden ${
											hours.closed
												? "text-slate-400"
												: hasConfig
													? "text-blue-700"
													: "text-slate-400"
										}`}
									>
										{summary}
									</span>
								</div>

								<div className="min-w-0">
									<InteractiveDayTimeline
										day={day}
										hours={hours}
										disabled={hours.closed}
										onUpdate={(patch) => onChange(updateDay(value, day, patch))}
									/>
									<p
										className={`mt-0.5 hidden text-[11px] font-medium sm:block ${
											hours.closed
												? "text-slate-400"
												: overnight
													? "text-violet-700"
													: "text-blue-700"
										}`}
									>
										{summary}
									</p>
								</div>

								<TimeField
									value={hours.closed ? "" : hours.open}
									disabled={hours.closed}
									placeholder="08:00"
									onChange={(open) =>
										onChange(
											updateDay(value, day, {
												open,
												closed: false,
											}),
										)
									}
								/>

								<TimeField
									value={
										hours.closed
											? ""
											: is24HourDay(hours)
												? "24:00"
												: closeVal
									}
									disabled={hours.closed || is24HourDay(hours)}
									placeholder={
										overnight ? "02:00 (next day)" : hours.open ? "22:00" : "—"
									}
									onChange={(close) =>
										onChange(
											updateDay(value, day, {
												close: close || "",
												closed: false,
											}),
										)
									}
								/>

								<div className="flex justify-center">
									<button
										type="button"
										disabled={
											hours.closed || !hours.open || is24HourDay(hours)
										}
										title="Closes after midnight (e.g. Mon 20:00 → Tue 02:00)"
										onClick={() => {
											if (overnight) {
												const openMin = parseTimeToMinutes(hours.open);
												const patch: Partial<DayOpeningHours> = {
													closesNextDay: false,
												};
												const closeMin = parseTimeToMinutes(hours.close);
												if (
													openMin != null &&
													closeMin != null &&
													closeMin < openMin
												) {
													patch.close = "23:59";
												}
												onChange(updateDay(value, day, patch));
												return;
											}
											const openMin = parseTimeToMinutes(hours.open);
											let close = hours.close;
											if (!close && openMin != null) {
												close =
													openMin >= 17 * 60
														? "02:00"
														: minutesToTimeString(
																Math.min(
																	MINUTES_PER_DAY,
																	openMin + 6 * 60,
																),
															);
												if (
													parseTimeToMinutes(close)! >= openMin
												) {
													close = "02:00";
												}
											}
											onChange(
												updateDay(value, day, {
													closesNextDay: true,
													close: close || "02:00",
												}),
											);
										}}
										className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
											overnight
												? "border-violet-300 bg-violet-100 text-violet-700"
												: "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
										} disabled:cursor-not-allowed disabled:opacity-40`}
									>
										<Moon className="h-3.5 w-3.5" />
									</button>
								</div>

								<div className="flex justify-center">
									<input
										type="checkbox"
										checked={hours.closed}
										onChange={(e) =>
											onChange(
												updateDay(value, day, {
													closed: e.target.checked,
												}),
											)
										}
										className="h-4 w-4 rounded border-slate-300"
										aria-label={`${BRANCH_DAY_LABELS[day]} closed`}
									/>
								</div>

								<div className="flex justify-end gap-1 sm:justify-center">
									{(["9-5", "8-8", "20-2", "24h"] as const).map((preset) => (
										<button
											key={preset}
											type="button"
											onClick={() => applyPreset([day], preset)}
											className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 hover:bg-white"
										>
											{preset}
										</button>
									))}
									<button
										type="button"
										onClick={() =>
											onChange(updateDay(value, day, emptyDayOpeningHours()))
										}
										className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
										aria-label="Clear day"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};
