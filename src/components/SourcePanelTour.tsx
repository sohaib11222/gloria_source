import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Compass,
	MapPinned,
	MousePointerClick,
	Sparkles,
	X,
} from "lucide-react";
import "./SourcePanelTour.css";

export type SourcePanelTab =
	| "dashboard"
	| "agreements"
	| "locations"
	| "branches"
	| "location-branches"
	| "pricing"
	| "daily-pricing"
	| "transactions"
	| "reservations"
	| "cancellations"
	| "location-requests"
	| "health"
	| "verification"
	| "support"
	| "docs"
	| "settings";

export type PanelTourStep = {
	/** `data-tour` on a visible element, or `_…` for intro/summary steps with no spotlight target */
	target: string;
	title: string;
	description: string;
	tab?: SourcePanelTab;
	/** When tab is `location-branches`, open supplier endpoint vs manual tools */
	branchImport?: "endpoint" | "manual";
	eyebrow?: string;
	targetLabel?: string;
	bullets?: string[];
	outcome?: string;
};

type SpotlightBox = {
	top: number;
	left: number;
	width: number;
	height: number;
};

type TooltipStyle = React.CSSProperties & {
	"--tour-caret-left"?: string;
	"--tour-caret-top"?: string;
};

function isMetaStepTarget(target: string) {
	return target.startsWith("_");
}

const DEFAULT_STEPS: PanelTourStep[] = [
	{
		target: "_welcome",
		eyebrow: "Welcome tour",
		title: "Let’s set up your Source Portal confidently",
		description:
			"This guided tour highlights the panels you use to publish coverage, import branches, test prices, monitor bookings, and keep your integration healthy.",
		bullets: [
			"Use Next and Back to move at your own pace.",
			"The portal will switch tabs automatically when a step belongs to another panel.",
			"Highlighted areas are the exact controls or sections you should understand.",
		],
		outcome:
			"You can restart this anytime from the Panel tour button in the header/sidebar.",
	},
	{
		target: "nav-dashboard",
		eyebrow: "Sidebar",
		title: "Overview dashboard",
		description:
			"Your command center for readiness, branch/location/sample metrics, company identity, and quick actions. Start here whenever you want to understand if the source is ready for agents.",
		bullets: [
			"Review profile and plan status first.",
			"Use dashboard shortcuts to finish setup quickly.",
			"Refresh metrics after imports or endpoint tests.",
		],
		targetLabel: "Overview tab",
	},
	{
		target: "nav-agreements",
		eyebrow: "Commercial access",
		title: "Agreements",
		description:
			"Agreements define which agents may search and book your supply. An active agreement reference is passed through availability and booking requests.",
		bullets: [
			"Create or offer agreements to agents.",
			"Track whether offers are pending, accepted, or active.",
			"Use agreement references to align supplier pricing rules.",
		],
		targetLabel: "Agreements tab",
	},
	{
		target: "nav-locations",
		eyebrow: "Coverage",
		title: "Locations",
		description:
			"Locations are your UN/LOCODE coverage. Gloria uses them to decide where an agent can pick up or return a vehicle before asking your pricing endpoint.",
		tab: "locations",
		bullets: [
			"Sync or import coverage from supplier systems.",
			"Request missing locations for admin review when the master list is incomplete.",
			"Filter coverage by agreement to review overrides.",
		],
		targetLabel: "Locations tab",
	},
	{
		target: "locations-sync-status",
		eyebrow: "Locations panel",
		title: "Location Sync Status",
		description:
			"This panel shows when coverage was last synced, how many locations are loaded, and the available actions for syncing coverage or importing location/branch data.",
		tab: "locations",
		bullets: [
			"Sync Locations pulls coverage from your configured source adapter.",
			"Import Branches imports detailed branch records from the saved branch endpoint.",
			"Configure Endpoint and Import Locations handle location-list endpoint imports.",
		],
		targetLabel: "Sync status card",
	},
	{
		target: "locations-sync-actions",
		eyebrow: "Locations panel",
		title: "Coverage action buttons",
		description:
			"These buttons are the operational controls for the Locations panel. Explore them freely; write actions such as sync/import will ask for an active plan before saving data.",
		tab: "locations",
		bullets: [
			"Use Sync Locations for adapter/gRPC coverage refreshes.",
			"Use Import Locations after configuring a location-list endpoint.",
			"Use Import Branches when your branch endpoint is the source of detailed branch data.",
		],
		outcome:
			"If you need detailed desk/address rows, prefer Location & Branches or branch imports rather than coverage-only syncs.",
		targetLabel: "Location action buttons",
	},
	{
		target: "locations-request-card",
		eyebrow: "Locations panel",
		title: "Request a missing location",
		description:
			"Use this card when the place you need is not available in Gloria’s location master. The request goes to the admin team instead of trying to add incomplete coverage directly.",
		tab: "locations",
		bullets: [
			"Submit the location name, country, city/IATA code, address, and business reason.",
			"Admins review, normalize codes, and approve or reject with notes.",
			"Approved locations can then be used for coverage and future imports.",
		],
		targetLabel: "Missing location request card",
	},
	{
		target: "locations-requests-list",
		eyebrow: "Locations panel",
		title: "Track submitted location requests",
		description:
			"This section shows every missing-location request you already sent, including pending, approved, rejected, review date, reason, and admin notes.",
		tab: "locations",
		bullets: [
			"Filter by status when you have many requests.",
			"Open a request to view full details and admin notes.",
			"Use this instead of the old separate Location Requests page.",
		],
		targetLabel: "Request history",
	},
	{
		target: "locations-filter-card",
		eyebrow: "Locations panel",
		title: "Filter and load locations",
		description:
			"Use this card to view all source coverage or restrict the list to an agreement. Agreement filtering helps you confirm overrides before agents test supply.",
		tab: "locations",
		bullets: [
			"All locations shows source-level coverage.",
			"Agreement filtering shows allowed locations for that agreement.",
			"Load Locations refreshes the table with the selected scope.",
		],
		targetLabel: "Filter card",
	},
	{
		target: "locations-table",
		eyebrow: "Locations panel",
		title: "Available Locations table",
		description:
			"This table is the coverage truth used by search routing. It shows each UN/LOCODE, the display name/country/IATA data, master source, mock/live state, and removal controls when allowed.",
		tab: "locations",
		bullets: [
			"Gloria means the row was enriched from the master UN/LOCODE record.",
			"Branch means display details came from an imported branch.",
			"Pending means a valid master/branch detail is not yet linked.",
		],
		targetLabel: "Coverage table",
	},
	{
		target: "nav-location-branches",
		eyebrow: "Branch onboarding",
		title: "Location & Branches",
		description:
			"This is the main onboarding area for supplier location-list imports and detailed branch records. Use it when coverage needs desk, address, phone, email, pickup instructions, or opening-hour details.",
		tab: "location-branches",
		branchImport: "endpoint",
		bullets: [
			"HTTP/XML imports can create/update branch rows and coverage.",
			"gRPC GetLocations is coverage-only.",
			"Manual upload follows the same schema as the manual branch form.",
		],
		targetLabel: "Location & Branches tab",
	},
	{
		target: "location-branches-import-mode",
		eyebrow: "Branch onboarding",
		title: "Choose endpoint or manual branch tools",
		description:
			"This card explains the two branch onboarding paths: supplier endpoint import or manual upload/add/edit tools. Pick the mode that matches how your supplier system exports data.",
		tab: "location-branches",
		branchImport: "manual",
		bullets: [
			"Endpoint mode is best for repeatable supplier feeds.",
			"Manual mode is best for file uploads or direct branch edits.",
			"Both paths normalize into the same branch fields.",
		],
		targetLabel: "Import mode card",
	},
	{
		target: "branches-upload-file",
		eyebrow: "Manual branch tools",
		title: "Upload branch files",
		description:
			"Upload JSON, XML, CSV, or Excel branch files. Use manual-form field names such as branchCode, name, addressLine, city, countryCode, natoLocode, email, phone, and opening hours.",
		tab: "location-branches",
		branchImport: "manual",
		bullets: [
			"Upload is ideal for batch updates.",
			"Default country code can fill missing country columns.",
			"Rows are validated before import.",
		],
		targetLabel: "Upload File button",
	},
	{
		target: "branches-add-branch",
		eyebrow: "Manual branch tools",
		title: "Create or fix one branch",
		description:
			"Create a branch directly when you need a quick fix. This form is the source of truth for the upload/import schema.",
		tab: "location-branches",
		branchImport: "manual",
		bullets: [
			"Use a stable branchCode.",
			"Map to natoLocode/UNLocode where possible.",
			"Add contact and pickup details for agents.",
		],
		targetLabel: "Add Branch button",
	},
	{
		target: "location-branches-configure-endpoint",
		eyebrow: "Supplier endpoint import",
		title: "Configure location-list endpoint",
		description:
			"Set the endpoint URL and transport for location-list imports. HTTP/XML can create full branch rows; gRPC GetLocations updates coverage only.",
		tab: "location-branches",
		branchImport: "endpoint",
		bullets: [
			"Use Sample & Validate before importing.",
			"Keep endpoint responses stable and repeatable.",
			"Save settings before running import/sync.",
		],
		targetLabel: "Configure Endpoint button",
	},
	{
		target: "location-branches-import-endpoint",
		eyebrow: "Supplier endpoint import",
		title: "Import from endpoint",
		description:
			"Run a full import from the configured supplier endpoint. Gloria parses, validates, and upserts coverage/branches depending on the response format.",
		tab: "location-branches",
		branchImport: "endpoint",
		bullets: [
			"HTTP/XML GLORIA_locationlistrs supports detailed rows.",
			"gRPC GetLocations imports coverage only.",
			"Import result summaries show created, updated, skipped, and errors.",
		],
		targetLabel: "Import from endpoint button",
	},
	{
		target: "nav-pricing",
		eyebrow: "Availability & pricing",
		title: "Pricing",
		description:
			"Configure how Gloria tests availability and stores sample offers. This is where suppliers prove their pricing endpoint returns parseable vehicles and terms.",
		tab: "pricing",
		bullets: [
			"Choose XML, JSON, or gRPC.",
			"Save endpoint settings.",
			"Fetch & Store a sample so agents can see offer details.",
		],
		targetLabel: "Pricing tab",
	},
	{
		target: "pricing-format-xml",
		eyebrow: "Availability & pricing",
		title: "Choose pricing format",
		description:
			"Select how Gloria calls your source. XML sends GLORIA_availabilityrq, JSON sends Gloria field names, and gRPC calls SourceProviderService.GetAvailability.",
		tab: "pricing",
		bullets: [
			"XML accepts OTA_VehAvailRateRS or GLORIA_availabilityrs responses.",
			"JSON expects vehicles/offers arrays.",
			"gRPC uses source_provider.proto VehicleOffer fields.",
		],
		targetLabel: "Pricing format selector",
	},
	{
		target: "pricing-save-endpoint",
		eyebrow: "Availability & pricing",
		title: "Save pricing endpoint",
		description:
			"Save the endpoint URL/transport before running fetch tests. Saved settings are reused by verification and future portal sessions.",
		tab: "pricing",
		targetLabel: "Save endpoint button",
	},
	{
		target: "pricing-fetch-store",
		eyebrow: "Availability & pricing",
		title: "Fetch and store availability",
		description:
			"This sends a test request, parses the supplier response, and stores a sample. Stored samples are used for visibility, debugging, and operational readiness.",
		tab: "pricing",
		bullets: [
			"Use realistic pickup/return dates.",
			"Review parsed vehicle, price, currency, terms, extras, and images.",
			"Failed/slow calls also affect health samples.",
		],
		targetLabel: "Fetch & Store button",
	},
	{
		target: "nav-daily-pricing",
		eyebrow: "Rates",
		title: "Daily Prices",
		description:
			"Use this calendar-style panel to review or manage daily-rate visibility tied to your pricing samples.",
		tab: "daily-pricing",
		targetLabel: "Daily Prices tab",
	},
	{
		target: "nav-transactions",
		eyebrow: "Billing",
		title: "Transactions",
		description:
			"Track subscription and billing movements for the source. Use this when reconciling plan activity or branch-limit events.",
		tab: "transactions",
		targetLabel: "Transactions tab",
	},
	{
		target: "nav-reservations",
		eyebrow: "Operations",
		title: "Reservations",
		description:
			"Reservations shows booking traffic routed through Gloria. Use it to confirm supplier booking references and current status.",
		tab: "reservations",
		targetLabel: "Reservations tab",
	},
	{
		target: "nav-cancellations",
		eyebrow: "Operations",
		title: "Cancellations",
		description:
			"Cancellations shows cancelled reservations and related details so operations teams can reconcile supplier state.",
		tab: "cancellations",
		targetLabel: "Cancellations tab",
	},
	{
		target: "nav-health",
		eyebrow: "Monitoring",
		title: "Health",
		description:
			"Health turns endpoint call samples into operational status. Watch healthy rate, slow rate, failures, strikes, backoff, and exclusion state here.",
		tab: "health",
		bullets: [
			"Target under 3 seconds.",
			"Failed and slow calls count as unhealthy.",
			"Backoff prevents poor supplier responses from hurting agent searches.",
		],
		targetLabel: "Health tab",
	},
	{
		target: "nav-verification",
		eyebrow: "Go-live testing",
		title: "Verification",
		description:
			"Verification is the structured playground for location-list and availability endpoint testing. Run this before go-live and after endpoint changes.",
		tab: "verification",
		bullets: [
			"Test HTTP/XML location lists.",
			"Test gRPC GetLocations and GetAvailability.",
			"Review automated verification history.",
		],
		targetLabel: "Verification tab",
	},
	{
		target: "nav-support",
		eyebrow: "Help",
		title: "Support",
		description:
			"Open support conversations with Gloria when endpoint payloads, location mapping, billing, or approval needs human review.",
		tab: "support",
		targetLabel: "Support tab",
	},
	{
		target: "nav-settings",
		eyebrow: "Configuration",
		title: "Settings",
		description:
			"Settings contains your company profile/logo, endpoint whitelist, security details, and password management.",
		tab: "settings",
		bullets: [
			"Keep company profile data accurate.",
			"Whitelist domains/IPs that Gloria may call.",
			"Use password tools for account security.",
		],
		targetLabel: "Settings tab",
	},
	{
		target: "nav-docs",
		eyebrow: "Reference",
		title: "Docs",
		description:
			"Docs opens the full-screen Source guide, API reference, and SDK guide. Use it alongside Verification when building supplier endpoints.",
		targetLabel: "Docs link",
	},
	{
		target: "_summary",
		eyebrow: "Recap",
		title: "You are ready to operate the portal",
		description:
			"A strong go-live path is: finish Settings and plan, confirm Overview, create Agreements, build Locations and Branches, test Pricing, run Verification, then monitor Health and Reservations.",
		bullets: [
			"Use Locations for coverage and Location & Branches for detailed branch rows.",
			"Use Pricing and Verification before agents search live supply.",
			"Use Health, Reservations, Cancellations, and Transactions for daily operations.",
		],
		outcome: "Tour complete. You can restart it anytime from Panel tour.",
	},
];

const TOUR_TAB_LABELS: Partial<Record<SourcePanelTab, string>> = {
	dashboard: "Overview",
	agreements: "Agreements",
	locations: "Locations",
	"location-branches": "Location & Branches",
	pricing: "Pricing",
	"daily-pricing": "Daily Prices",
	transactions: "Transactions",
	reservations: "Reservations",
	cancellations: "Cancellations",
	health: "Health",
	verification: "Verification",
	support: "Support",
	settings: "Settings",
	docs: "Docs",
};

function buildContextualSteps(tab?: SourcePanelTab): PanelTourStep[] {
	if (!tab || tab === "dashboard") return DEFAULT_STEPS;

	const label = TOUR_TAB_LABELS[tab] || "Current page";
	const navTarget = `nav-${tab}`;
	const navStep = DEFAULT_STEPS.find((item) => item.target === navTarget);
	const panelSteps = DEFAULT_STEPS.filter(
		(item) => item.tab === tab && item.target !== navTarget,
	);

	return [
		{
			target: "_page_welcome",
			eyebrow: `${label} page tour`,
			title: `${label} walkthrough`,
			description: `You are on the ${label} page, so this tour will focus only on the controls and decisions that matter here instead of walking through the full portal.`,
			bullets: [
				"The highlighted area stays readable while the rest of the page dims.",
				"Use the floating focus label to see exactly which control the step is explaining.",
				"Use Back, Next, or Escape at any time.",
			],
			outcome:
				"Go to Overview and start Panel tour there whenever you want the complete portal-wide tour.",
		},
		...(navStep ? [{ ...navStep, tab }] : []),
		...panelSteps,
		{
			target: "_page_summary",
			eyebrow: `${label} recap`,
			title: `${label} tour complete`,
			description: `You have seen the important ${label} controls. Repeat this page tour anytime from the Panel tour button while staying on this tab.`,
			bullets: [
				"If a highlighted button is disabled, check subscription, approval, or required endpoint settings.",
				"Use the Docs and Verification pages when you need payload examples or endpoint tests.",
			],
		},
	];
}

function getTargetEl(target: string): HTMLElement | null {
	return document.querySelector(
		`[data-tour="${target}"]`,
	) as HTMLElement | null;
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, max));
}

function getTooltipStyle(box: SpotlightBox | null): TooltipStyle | undefined {
	if (!box || typeof window === "undefined") return undefined;

	const margin = 18;
	const width = Math.min(460, window.innerWidth - margin * 2);
	const estimatedHeight = 430;
	const rightSpace = window.innerWidth - (box.left + box.width);
	const leftSpace = box.left;
	let left = margin;
	let top = clamp(
		box.top - 4,
		margin,
		Math.max(margin, window.innerHeight - estimatedHeight - margin),
	);
	let caretLeft = "22px";
	let caretTop = "28px";

	if (window.innerWidth < 760) {
		return {
			left: margin,
			right: margin,
			bottom: margin,
			"--tour-caret-left": "32px",
			"--tour-caret-top": "-8px",
		};
	}

	if (rightSpace >= width + margin * 1.5) {
		left = box.left + box.width + margin;
		caretLeft = "-8px";
		caretTop = `${clamp(box.top + box.height / 2 - top, 28, estimatedHeight - 28)}px`;
	} else if (leftSpace >= width + margin * 1.5) {
		left = box.left - width - margin;
		caretLeft = `${width - 2}px`;
		caretTop = `${clamp(box.top + box.height / 2 - top, 28, estimatedHeight - 28)}px`;
	} else if (box.top > estimatedHeight + margin * 2) {
		left = clamp(
			box.left + box.width / 2 - width / 2,
			margin,
			window.innerWidth - width - margin,
		);
		top = box.top - estimatedHeight - margin;
		caretLeft = `${clamp(box.left + box.width / 2 - left, 28, width - 28)}px`;
		caretTop = `${estimatedHeight - 2}px`;
	} else {
		left = clamp(
			box.left + box.width / 2 - width / 2,
			margin,
			window.innerWidth - width - margin,
		);
		top = Math.min(
			box.top + box.height + margin,
			window.innerHeight - estimatedHeight - margin,
		);
		caretLeft = `${clamp(box.left + box.width / 2 - left, 28, width - 28)}px`;
		caretTop = "-8px";
	}

	return {
		left,
		top,
		width,
		"--tour-caret-left": caretLeft,
		"--tour-caret-top": caretTop,
	};
}

export interface SourcePanelTourProps {
	open: boolean;
	onClose: () => void;
	/** Called when user finishes last step or skips (for persisting “seen”) */
	onComplete?: () => void;
	/** Dashboard starts the complete tour; other tabs start a focused page tour. */
	currentTab?: SourcePanelTab;
	steps?: PanelTourStep[];
	onStepChangeTab?: (
		tab: SourcePanelTab,
		opts?: { branchImport?: "endpoint" | "manual" },
	) => void;
}

export const SourcePanelTour: React.FC<SourcePanelTourProps> = ({
	open,
	onClose,
	onComplete,
	currentTab,
	steps,
	onStepChangeTab,
}) => {
	const effectiveSteps = useMemo(
		() => steps ?? buildContextualSteps(currentTab),
		[steps, currentTab],
	);
	const [index, setIndex] = useState(0);
	const [box, setBox] = useState<SpotlightBox | null>(null);
	const [missing, setMissing] = useState(false);
	const step = effectiveSteps[index];
	const progress = ((index + 1) / effectiveSteps.length) * 100;
	const tooltipStyle = useMemo(() => getTooltipStyle(box), [box]);

	const finish = useCallback(() => {
		onComplete?.();
		onClose();
	}, [onComplete, onClose]);

	const handleSkip = useCallback(() => finish(), [finish]);

	const measureTarget = useCallback(() => {
		if (!open || !step || isMetaStepTarget(step.target)) {
			setBox(null);
			setMissing(false);
			return true;
		}

		const el = getTargetEl(step.target);
		if (!el) {
			setBox(null);
			setMissing(true);
			return false;
		}

		el.scrollIntoView({
			block: "center",
			inline: "center",
			behavior: "smooth",
		});

		const applyRect = () => {
			const r = el.getBoundingClientRect();
			const pad = 10;
			setBox({
				top: Math.max(8, r.top - pad),
				left: Math.max(8, r.left - pad),
				width: Math.min(window.innerWidth - 16, r.width + pad * 2),
				height: Math.min(window.innerHeight - 16, r.height + pad * 2),
			});
			setMissing(false);
		};

		applyRect();
		window.setTimeout(applyRect, 280);
		return true;
	}, [open, step]);

	useEffect(() => {
		if (!open || !step?.tab || !onStepChangeTab) return;
		onStepChangeTab(
			step.tab,
			step.branchImport ? { branchImport: step.branchImport } : undefined,
		);
	}, [open, step, onStepChangeTab]);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		let attempts = 0;

		const run = () => {
			if (cancelled) return;
			const found = measureTarget();
			attempts += 1;
			if (!found && attempts < 12) {
				window.setTimeout(run, 160);
			}
		};

		const timer = window.setTimeout(run, step?.tab ? 260 : 60);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [open, index, step, measureTarget]);

	useEffect(() => {
		if (!open) return;
		const onResize = () => measureTarget();
		window.addEventListener("resize", onResize);
		window.addEventListener("scroll", onResize, true);
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("scroll", onResize, true);
		};
	}, [open, measureTarget]);

	useEffect(() => {
		if (open) setIndex(0);
	}, [open, effectiveSteps]);

	useEffect(() => {
		if (index >= effectiveSteps.length) setIndex(0);
	}, [index, effectiveSteps.length]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleSkip();
			if (e.key === "ArrowRight") handleNext();
			if (e.key === "ArrowLeft") handleBack();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, index, handleSkip]);

	const handleNext = () => {
		if (index >= effectiveSteps.length - 1) {
			finish();
			return;
		}
		setIndex((current) => Math.min(current + 1, effectiveSteps.length - 1));
	};

	const handleBack = () => {
		setIndex((current) => Math.max(current - 1, 0));
	};

	if (!open || !step) return null;

	const isMeta = isMetaStepTarget(step.target);
	const hasBox = !!box && !isMeta;
	const cardClass = hasBox
		? "source-tour-card source-tour-card--anchored"
		: "source-tour-card source-tour-card--center";

	return (
		<div
			className="source-tour-root"
			role="dialog"
			aria-modal="true"
			aria-labelledby="panel-tour-title"
		>
			{hasBox && box ? (
				<>
					<div
						className="source-tour-dim source-tour-dim--top"
						style={{ height: box.top }}
						aria-hidden
					/>
					<div
						className="source-tour-dim source-tour-dim--bottom"
						style={{ top: box.top + box.height }}
						aria-hidden
					/>
					<div
						className="source-tour-dim source-tour-dim--left"
						style={{ top: box.top, width: box.left, height: box.height }}
						aria-hidden
					/>
					<div
						className="source-tour-dim source-tour-dim--right"
						style={{
							top: box.top,
							left: box.left + box.width,
							height: box.height,
						}}
						aria-hidden
					/>
				</>
			) : (
				<div className="source-tour-backdrop" aria-hidden />
			)}

			{hasBox && box && (
				<>
					<div
						className="source-tour-spotlight"
						style={{
							top: box.top,
							left: box.left,
							width: box.width,
							height: box.height,
						}}
					/>
					<div
						className="source-tour-beacon"
						style={{ top: box.top - 7, left: box.left + box.width - 9 }}
						aria-hidden
					/>
					{step.targetLabel && (
						<div
							className="source-tour-focus-label"
							style={{
								top: Math.max(12, box.top - 42),
								left: Math.min(Math.max(12, box.left), window.innerWidth - 260),
							}}
						>
							<MousePointerClick className="h-4 w-4" />
							<span>{step.targetLabel}</span>
						</div>
					)}
				</>
			)}

			<div className={cardClass} style={tooltipStyle}>
				<div className="source-tour-card__glow" aria-hidden />
				<div className="source-tour-progress" aria-hidden>
					<span style={{ width: `${progress}%` }} />
				</div>

				<div className="source-tour-header">
					<div className="source-tour-icon" aria-hidden>
						{isMeta ? (
							<Sparkles className="h-5 w-5" />
						) : step.target.includes("locations") ? (
							<MapPinned className="h-5 w-5" />
						) : (
							<Compass className="h-5 w-5" />
						)}
					</div>
					<div className="source-tour-heading">
						<p>{step.eyebrow || "Source Portal tour"}</p>
						<h2 id="panel-tour-title">{step.title}</h2>
					</div>
					<button
						type="button"
						onClick={handleSkip}
						className="source-tour-close"
						aria-label="Close tour"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="source-tour-step-meta">
					<span>
						Step {index + 1} of {effectiveSteps.length}
					</span>
					{step.targetLabel && <span>{step.targetLabel}</span>}
				</div>

				{missing ? (
					<div className="source-tour-warning">
						<MousePointerClick className="h-4 w-4" />
						<p>
							The target for this step is not visible yet. The portal may still
							be loading or the screen may be too narrow. Open the menu or use
							Next to continue.
						</p>
					</div>
				) : (
					<p className="source-tour-description">{step.description}</p>
				)}

				{step.bullets?.length ? (
					<ul className="source-tour-bullets">
						{step.bullets.map((bullet) => (
							<li key={bullet}>
								<CheckCircle2 className="h-4 w-4" />
								<span>{bullet}</span>
							</li>
						))}
					</ul>
				) : null}

				{step.outcome ? (
					<div className="source-tour-outcome">{step.outcome}</div>
				) : null}

				<div className="source-tour-footer">
					<button
						type="button"
						className="source-tour-skip"
						onClick={handleSkip}
					>
						Skip tour
					</button>
					<div className="source-tour-actions">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={handleBack}
							disabled={index <= 0}
							className="source-tour-action-btn"
						>
							<ArrowLeft className="h-4 w-4 mr-1.5" />
							Back
						</Button>
						<Button
							type="button"
							variant="primary"
							size="sm"
							onClick={handleNext}
							className="source-tour-action-btn source-tour-next-btn"
						>
							{index >= effectiveSteps.length - 1 ? "Done" : "Next"}
							{index < effectiveSteps.length - 1 && (
								<ArrowRight className="h-4 w-4 ml-1.5" />
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export const SOURCE_PANEL_TOUR_STORAGE_KEY = (companyId: string) =>
	`source_panel_tour_done_v2_${companyId}`;
