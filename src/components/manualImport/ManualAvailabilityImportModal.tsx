import React, { useMemo, type RefObject } from "react";
import { Plus, Settings } from "lucide-react";
import type { SourceFleet } from "../../api/fleets";
import { ManualImportFleetSection } from "./ManualImportFleetSection";
import {
	buildManualImportCompleteness,
	requiredCompletenessComplete,
} from "./manualImportCompleteness";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { AcrissCodePicker } from "../AcrissCodePicker";
import { SearchableStringPicker } from "../SearchableStringPicker";
import {
	isRequiredIncludedCode,
	GLORIA_REQUIRED_INCLUDED_CODES,
	missingRequiredIncludedCodes,
} from "./manualImportGloriaTemplates";
import type { ManualImportTermRow } from "./manualImportTerms";
import {
	LineItemColumnHeaders,
	ManualImportField,
	ManualImportSection,
	XmlTag,
} from "./ManualImportUi";

export type ManualImportLineRow = {
	id: string;
	code: string;
	description: string;
	excess: string;
	deposit: string;
	currency: string;
};

export type ManualImportNotRow = ManualImportLineRow & {
	cover_amount: string;
	price: string;
};

export type ManualImportExtraRow = {
	id: string;
	code: string;
	description: string;
	price: string;
	currency: string;
	long_description: string;
};

export interface ManualAvailabilityImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	selectedFleetId: string | null;
	selectedFleet: SourceFleet | null;
	onFleetChange: (fleetId: string | null, fleet: SourceFleet | null) => void;
	isSubmitting: boolean;
	forceRefresh: boolean;
	onForceRefreshChange: (value: boolean) => void;
	pickupLoc: string;
	onPickupLoc: (v: string) => void;
	returnLoc: string;
	onReturnLoc: (v: string) => void;
	pickupDt: string;
	onPickupDt: (v: string) => void;
	returnDt: string;
	onReturnDt: (v: string) => void;
	acriss: string;
	onAcriss: (v: string) => void;
	customAcrissCodes: string[];
	newAcrissDraft: string;
	onNewAcrissDraft: (v: string) => void;
	onAddCustomAcriss: () => void;
	make: string;
	onMake: (v: string) => void;
	onMakeCommit: () => void;
	model: string;
	onModel: (v: string) => void;
	makeOptions: string[];
	modelOptions: string[];
	makeTrimmed: string;
	nhtsaMakesLoading: boolean;
	nhtsaModelsLoading: boolean;
	rentalDuration: string;
	onRentalDuration: (v: string) => void;
	carOrderId: string;
	onCarOrderId: (v: string) => void;
	currency: string;
	onCurrency: (v: string) => void;
	totalGross: string;
	onTotalGross: (v: string) => void;
	metaTimestamp: string;
	onMetaTimestamp: (v: string) => void;
	metaTarget: string;
	onMetaTarget: (v: string) => void;
	metaVersion: string;
	onMetaVersion: (v: string) => void;
	pricingDuration: string;
	onPricingDuration: (v: string) => void;
	pricingDailyNet: string;
	onPricingDailyNet: (v: string) => void;
	pricingDailyTax: string;
	onPricingDailyTax: (v: string) => void;
	pricingDailyGross: string;
	onPricingDailyGross: (v: string) => void;
	pricingTotalNet: string;
	onPricingTotalNet: (v: string) => void;
	pricingTotalTax: string;
	onPricingTotalTax: (v: string) => void;
	pricingTaxRate: string;
	onPricingTaxRate: (v: string) => void;
	includedRows: ManualImportLineRow[];
	setIncludedRows: React.Dispatch<React.SetStateAction<ManualImportLineRow[]>>;
	notIncludedRows: ManualImportNotRow[];
	setNotIncludedRows: React.Dispatch<React.SetStateAction<ManualImportNotRow[]>>;
	extraRows: ManualImportExtraRow[];
	setExtraRows: React.Dispatch<React.SetStateAction<ManualImportExtraRow[]>>;
	newRowId: () => string;
	termRows: ManualImportTermRow[];
	setTermRows: React.Dispatch<React.SetStateAction<ManualImportTermRow[]>>;
	transmission: string;
	onTransmission: (v: string) => void;
	doors: string;
	onDoors: (v: string) => void;
	seats: string;
	onSeats: (v: string) => void;
	bagsS: string;
	onBagsS: (v: string) => void;
	bagsM: string;
	onBagsM: (v: string) => void;
	minLead: string;
	onMinLead: (v: string) => void;
	maxLead: string;
	onMaxLead: (v: string) => void;
	mileage: string;
	onMileage: (v: string) => void;
	imageUrl: string;
	onImageUrl: (v: string) => void;
	imageInputRef: RefObject<HTMLInputElement | null>;
	onImageSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isUploadingImage: boolean;
	displayImageUrl: (url: string) => string;
}

const dtClass =
	"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export const ManualAvailabilityImportModal: React.FC<
	ManualAvailabilityImportModalProps
> = (props) => {
	const {
		isOpen,
		onClose,
		onSubmit,
		isSubmitting,
		forceRefresh,
		onForceRefreshChange,
		selectedFleetId,
		selectedFleet,
		onFleetChange,
		newRowId,
		displayImageUrl,
		imageInputRef,
		onImageSelected,
		isUploadingImage,
	} = props;

	const fleetBranchCodes = useMemo(
		() => selectedFleet?.branches.map((b) => b.branchCode.toUpperCase()) ?? [],
		[selectedFleet],
	);

	const missingIncluded = useMemo(
		() => missingRequiredIncludedCodes(props.includedRows),
		[props.includedRows],
	);

	const completeness = useMemo(
		() =>
			buildManualImportCompleteness({
				pickupLoc: props.pickupLoc,
				returnLoc: props.returnLoc,
				pickupDt: props.pickupDt,
				returnDt: props.returnDt,
				acriss: props.acriss,
				make: props.make,
				model: props.model,
				currency: props.currency,
				totalGross: props.totalGross,
				fleetSelected: Boolean(selectedFleetId),
				fleetBranchesOk: !selectedFleetId || fleetBranchCodes.length > 0,
				fleetPickupOk:
					!selectedFleetId ||
					!props.pickupLoc ||
					fleetBranchCodes.includes(props.pickupLoc.toUpperCase()),
				fleetReturnOk:
					!selectedFleetId ||
					!props.returnLoc ||
					fleetBranchCodes.includes(props.returnLoc.toUpperCase()),
				missingIncludedCodes: missingIncluded,
			}),
		[
			selectedFleetId,
			fleetBranchCodes,
			missingIncluded,
			props.pickupLoc,
			props.returnLoc,
			props.pickupDt,
			props.returnDt,
			props.acriss,
			props.make,
			props.model,
			props.currency,
			props.totalGross,
		],
	);

	const canStore = requiredCompletenessComplete(completeness);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Manual availability import" size="xl">
			<div className="-mx-2 max-h-[85vh] space-y-5 overflow-y-auto pr-1 text-sm text-gray-800 sm:mx-0">
				<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
					<p className="font-semibold text-slate-900">Maps to GLORIA_availabilityrs</p>
					<p className="mt-1">
						Stored samples use the same shape Gloria expects from your pricing endpoint:{" "}
						<XmlTag>VehAvairsdetails</XmlTag> (search context), one{" "}
						<XmlTag>availcars</XmlTag> vehicle, <XmlTag>pricing</XmlTag> attributes, and
						optional line items. Fields marked{" "}
						<span className="font-semibold text-red-600">*</span> are required to store a
						sample.
					</p>
				</div>

				<div className="rounded-lg border border-slate-200 bg-white p-3">
					<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
						Ready to store
					</p>
					<ul className="grid gap-1 sm:grid-cols-2">
						{completeness.map((item) => (
							<li
								key={item.id}
								className={`text-xs ${item.ok ? "text-emerald-700" : item.required ? "text-amber-800" : "text-slate-500"}`}
							>
								{item.required ? "●" : "○"} {item.label}
								{item.ok ? " ✓" : item.required ? " — required" : ""}
							</li>
						))}
					</ul>
				</div>

				<ManualImportSection
					step={1}
					title="Fleet, branches & rental window"
					xmlPath="VehAvailbody / Vehmain"
					description="Define which vehicle pool and branches this offer applies to, then set pick-up/return times."
					variant="required"
				>
					<ManualImportFleetSection
						isOpen={isOpen}
						selectedFleetId={selectedFleetId}
						onFleetChange={onFleetChange}
						pickupLoc={props.pickupLoc}
						returnLoc={props.returnLoc}
						onPickupLoc={props.onPickupLoc}
						onReturnLoc={props.onReturnLoc}
						acriss={props.acriss}
						onAcriss={props.onAcriss}
					/>
					<div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
						<ManualImportField
							label="Pick-up date & time"
							xmlAttr="Vehmain @PickUpDateTime"
							required
						>
							<input
								type="datetime-local"
								value={props.pickupDt}
								onChange={(e) => props.onPickupDt(e.target.value)}
								className={dtClass}
							/>
						</ManualImportField>
						<ManualImportField
							label="Return date & time"
							xmlAttr="Vehmain @ReturnDateTime"
							required
						>
							<input
								type="datetime-local"
								value={props.returnDt}
								onChange={(e) => props.onReturnDt(e.target.value)}
								className={dtClass}
							/>
						</ManualImportField>
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={2}
					title="Vehicle (availcars / vehdetails)"
					xmlPath="availcars[] / vehdetails @attributes"
					description="One vehicle offer per stored sample."
					variant="required"
				>
					<div className="space-y-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
							<ManualImportField
								label="ACRISS code"
								xmlAttr="availcars @ACRISS"
								required
								className="min-w-0 flex-1"
							>
								<AcrissCodePicker
									id="manual-acriss-picker"
									value={props.acriss}
									onChange={props.onAcriss}
									customCodes={props.customAcrissCodes}
								/>
							</ManualImportField>
							<div className="flex min-w-0 flex-1 items-end gap-2">
								<Input
									value={props.newAcrissDraft}
									onChange={(e) =>
										props.onNewAcrissDraft(e.target.value.toUpperCase())
									}
									placeholder="Custom ACRISS…"
									maxLength={8}
								/>
								<Button
									type="button"
									variant="secondary"
									className="shrink-0"
									onClick={props.onAddCustomAcriss}
								>
									<Plus className="mr-1 inline h-4 w-4" aria-hidden />
									Add code
								</Button>
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<ManualImportField label="Make" xmlAttr="vehdetails @Make" required>
								<SearchableStringPicker
									id="manual-import-make"
									value={props.make}
									onChange={props.onMake}
									onCommit={props.onMakeCommit}
									options={props.makeOptions}
									loading={props.nhtsaMakesLoading}
									placeholder="e.g. Toyota"
									helperText="NHTSA suggestions optional — any make is accepted."
									initialVisible={50}
								/>
							</ManualImportField>
							<ManualImportField label="Model" xmlAttr="vehdetails @Model" required>
								<SearchableStringPicker
									id="manual-import-model"
									value={props.model}
									onChange={props.onModel}
									options={props.modelOptions}
									loading={props.nhtsaModelsLoading}
									disabled={!props.makeTrimmed}
									placeholder={
										props.makeTrimmed ? "e.g. Corolla" : "Select make first"
									}
									emptyListHint="Type any model name."
									initialVisible={50}
								/>
							</ManualImportField>
						</div>
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={3}
					title="Pricing"
					xmlPath="availcars / pricing @attributes"
					description="TotalGross and Currency are required. CarOrderID is generated when empty but should match your live API for booking."
					variant="required"
				>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<ManualImportField
							label="Car order ID"
							xmlAttr="pricing @CarOrderID"
							helper="Unique offer reference for booking (auto-generated on open if blank)."
						>
							<Input
								value={props.carOrderId}
								onChange={(e) => props.onCarOrderId(e.target.value)}
								placeholder="CDAR65505909190226"
							/>
						</ManualImportField>
						<ManualImportField
							label="Currency"
							xmlAttr="pricing @Currency"
							required
						>
							<Input
								value={props.currency}
								onChange={(e) => props.onCurrency(e.target.value.toUpperCase())}
								maxLength={3}
								placeholder="EUR"
							/>
						</ManualImportField>
						<ManualImportField
							label="Total gross"
							xmlAttr="pricing @TotalGross"
							required
							helper="Total rental price including tax."
						>
							<Input
								value={props.totalGross}
								onChange={(e) => props.onTotalGross(e.target.value)}
								inputMode="decimal"
								placeholder="150.00"
							/>
						</ManualImportField>
					</div>
					<p className="mt-3 text-xs font-medium text-slate-600">
						Optional pricing breakdown
					</p>
					<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						<ManualImportField label="Duration (days)" xmlAttr="pricing @Duration">
							<Input
								value={props.rentalDuration || props.pricingDuration}
								onChange={(e) => {
									props.onRentalDuration(e.target.value);
									props.onPricingDuration(e.target.value);
								}}
								inputMode="numeric"
								placeholder="4"
							/>
						</ManualImportField>
						<ManualImportField label="Daily net" xmlAttr="pricing @DailyNet">
							<Input
								value={props.pricingDailyNet}
								onChange={(e) => props.onPricingDailyNet(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
						<ManualImportField label="Daily tax" xmlAttr="pricing @DailyTax">
							<Input
								value={props.pricingDailyTax}
								onChange={(e) => props.onPricingDailyTax(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
						<ManualImportField label="Daily gross" xmlAttr="pricing @DailyGross">
							<Input
								value={props.pricingDailyGross}
								onChange={(e) => props.onPricingDailyGross(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
						<ManualImportField label="Total net" xmlAttr="pricing @TotalNet">
							<Input
								value={props.pricingTotalNet}
								onChange={(e) => props.onPricingTotalNet(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
						<ManualImportField label="Total tax" xmlAttr="pricing @TotalTax">
							<Input
								value={props.pricingTotalTax}
								onChange={(e) => props.onPricingTotalTax(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
						<ManualImportField label="Tax rate" xmlAttr="pricing @TaxRate">
							<Input
								value={props.pricingTaxRate}
								onChange={(e) => props.onPricingTaxRate(e.target.value)}
								inputMode="decimal"
							/>
						</ManualImportField>
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={4}
					title="Response envelope"
					xmlPath="GLORIA_availabilityrs @attributes"
					variant="required"
					description="These map to the outer GLORIA_availabilityrs attributes (TimeStamp, Target, Version). Most integrations provide them, so keep them filled."
				>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<ManualImportField label="TimeStamp" xmlAttr="@TimeStamp">
							<Input
								value={props.metaTimestamp}
								onChange={(e) => props.onMetaTimestamp(e.target.value)}
								placeholder="2026-06-23T09:00:00"
							/>
						</ManualImportField>
						<ManualImportField label="Target" xmlAttr="@Target">
							<Input
								value={props.metaTarget}
								onChange={(e) => props.onMetaTarget(e.target.value)}
								placeholder="Production"
							/>
						</ManualImportField>
						<ManualImportField label="Version" xmlAttr="@Version">
							<Input
								value={props.metaVersion}
								onChange={(e) => props.onMetaVersion(e.target.value)}
								placeholder="1.00"
							/>
						</ManualImportField>
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={5}
					title="Included in price"
					xmlPath="includedinprice / Item"
					variant="required"
					description={`One row per standard code (${GLORIA_REQUIRED_INCLUDED_CODES.join(", ")}). Enter ItemDescription, Excess, Deposit, and Currency from your endpoint — no sample amounts are inserted. Use + Add item for extra included lines.`}
				>
					<div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-900">
						<p className="font-semibold">Standard included codes</p>
						<p className="mt-0.5">
							{GLORIA_REQUIRED_INCLUDED_CODES.map((c) => (
								<span
									key={c}
									className="mr-1.5 inline-flex rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200"
								>
									{c}
								</span>
							))}
							— fill in each row; these code rows cannot be removed.
						</p>
					</div>
					<div className="mb-2 flex justify-end">
						<Button
							type="button"
							variant="ghost"
							className="h-8 text-xs"
							onClick={() =>
								props.setIncludedRows((r) => [
									...r,
									{
										id: newRowId(),
										code: "",
										description: "",
										excess: "",
										deposit: "",
										currency: "",
									},
								])
							}
						>
							+ Add item
						</Button>
					</div>
					<LineItemColumnHeaders
						columns={["Code", "ItemDescription", "Excess", "Deposit", "Currency"]}
					/>
					<div className="space-y-2">
						{props.includedRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-100 bg-white p-2 sm:grid-cols-6"
							>
								<Input
									value={row.code}
									onChange={(e) =>
										props.setIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, code: e.target.value } : x,
											),
										)
									}
									readOnly={isRequiredIncludedCode(row.code)}
									className={
										isRequiredIncludedCode(row.code)
											? "bg-slate-50 font-mono font-semibold"
											: undefined
									}
									aria-readonly={isRequiredIncludedCode(row.code)}
								/>
								<div className="sm:col-span-2">
									<Input
										value={row.description}
										onChange={(e) =>
											props.setIncludedRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? { ...x, description: e.target.value }
														: x,
												),
											)
										}
										placeholder="ItemDescription from your API"
									/>
								</div>
								<Input
									value={row.excess}
									onChange={(e) =>
										props.setIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, excess: e.target.value } : x,
											),
										)
									}
									placeholder="Excess"
									inputMode="decimal"
								/>
								<Input
									value={row.deposit}
									onChange={(e) =>
										props.setIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, deposit: e.target.value } : x,
											),
										)
									}
									placeholder="Deposit"
									inputMode="decimal"
								/>
								<div className="flex gap-1">
									<Input
										value={row.currency}
										onChange={(e) =>
											props.setIncludedRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? { ...x, currency: e.target.value }
														: x,
												),
											)
										}
										placeholder="EUR"
										maxLength={3}
									/>
									<Button
										type="button"
										variant="ghost"
										className="shrink-0 text-xs"
										onClick={() =>
											props.setIncludedRows((rows) =>
												rows.filter((x) => x.id !== row.id),
											)
										}
										disabled={isRequiredIncludedCode(row.code)}
										title={
											isRequiredIncludedCode(row.code)
												? `${row.code.trim().toUpperCase()} is a standard included line — edit fields instead of removing`
												: undefined
										}
									>
										Remove
									</Button>
								</div>
							</div>
						))}
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={6}
					title="Not included in price"
					xmlPath="notincludedinprice / Item"
					variant="required"
					description="Upsells and add-ons quoted separately (optional cover lines). Add one row per line shown by your pricing endpoint. If you use a row, set its Price (and Currency)."
				>
					<div className="mb-2 flex justify-end">
						<Button
							type="button"
							variant="ghost"
							className="h-8 text-xs"
							onClick={() =>
								props.setNotIncludedRows((r) => [
									...r,
									{
										id: newRowId(),
										code: "",
										description: "",
										excess: "",
										deposit: "",
										currency: "",
										cover_amount: "",
										price: "",
									},
								])
							}
						>
							+ Add item
						</Button>
					</div>
					<LineItemColumnHeaders
						columns={[
							"Code",
							"ItemDescription",
							"Excess",
							"Deposit",
							"Cover",
							"Price",
							"Currency",
						]}
					/>
					<div className="space-y-2">
						{props.notIncludedRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-100 bg-white p-2 sm:grid-cols-12"
							>
								<Input
									className="sm:col-span-1"
									value={row.code}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, code: e.target.value } : x,
											),
										)
									}
									placeholder="PCDW"
								/>
								<div className="sm:col-span-3">
									<Input
										value={row.description}
										onChange={(e) =>
											props.setNotIncludedRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? { ...x, description: e.target.value }
														: x,
												),
											)
										}
										placeholder="Premium insurance"
									/>
								</div>
								<Input
									className="sm:col-span-1"
									value={row.excess}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, excess: e.target.value } : x,
											),
										)
									}
									placeholder="0.00"
								/>
								<Input
									className="sm:col-span-1"
									value={row.deposit}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, deposit: e.target.value } : x,
											),
										)
									}
								/>
								<Input
									className="sm:col-span-1"
									value={row.cover_amount}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id
													? { ...x, cover_amount: e.target.value }
													: x,
											),
										)
									}
									placeholder="Cover"
								/>
								<Input
									className="sm:col-span-1"
									value={row.price}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, price: e.target.value } : x,
											),
										)
									}
									placeholder="60.00"
								/>
								<Input
									className="sm:col-span-1"
									value={row.currency}
									onChange={(e) =>
										props.setNotIncludedRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, currency: e.target.value } : x,
											),
										)
									}
									maxLength={3}
								/>
								<Button
									type="button"
									variant="ghost"
									className="text-xs sm:col-span-2"
									onClick={() =>
										props.setNotIncludedRows((rows) =>
											rows.filter((x) => x.id !== row.id),
										)
									}
									disabled={props.notIncludedRows.length <= 1}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={7}
					title="Optional extras"
					xmlPath="OptionalExtras / Item"
					variant="optional"
					description="Equipment add-ons (Price required when Description is set)."
				>
					<div className="mb-2 flex justify-end">
						<Button
							type="button"
							variant="ghost"
							className="h-8 text-xs"
							onClick={() =>
								props.setExtraRows((r) => [
									...r,
									{
										id: newRowId(),
										code: "",
										description: "",
										price: "",
										currency: "",
										long_description: "",
									},
								])
							}
						>
							+ Add extra
						</Button>
					</div>
					<LineItemColumnHeaders
						columns={[
							"Code",
							"ItemDescription",
							"Price",
							"Currency",
							"Long description",
						]}
					/>
					<div className="space-y-2">
						{props.extraRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-100 bg-white p-2 sm:grid-cols-12"
							>
								<Input
									className="sm:col-span-1"
									value={row.code}
									onChange={(e) =>
										props.setExtraRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, code: e.target.value } : x,
											),
										)
									}
									placeholder="GPS"
								/>
								<div className="sm:col-span-3">
									<Input
										value={row.description}
										onChange={(e) =>
											props.setExtraRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? { ...x, description: e.target.value }
														: x,
												),
											)
										}
										placeholder="GPS navigation"
									/>
								</div>
								<Input
									className="sm:col-span-2"
									value={row.price}
									onChange={(e) =>
										props.setExtraRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, price: e.target.value } : x,
											),
										)
									}
									inputMode="decimal"
									placeholder="32.00"
								/>
								<Input
									className="sm:col-span-1"
									value={row.currency}
									onChange={(e) =>
										props.setExtraRows((rows) =>
											rows.map((x) =>
												x.id === row.id ? { ...x, currency: e.target.value } : x,
											),
										)
									}
									maxLength={3}
								/>
								<div className="sm:col-span-3">
									<Input
										value={row.long_description}
										onChange={(e) =>
											props.setExtraRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? { ...x, long_description: e.target.value }
														: x,
												),
											)
										}
										placeholder="Long description (optional)"
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									className="text-xs sm:col-span-2"
									onClick={() =>
										props.setExtraRows((rows) => rows.filter((x) => x.id !== row.id))
									}
									disabled={props.extraRows.length <= 1}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</ManualImportSection>

				<ManualImportSection
					step={8}
					title="Terms & policies"
					xmlPath="Terms.Item[]"
					variant="optional"
					description="Rental policy lines (fuel, mileage rules, age, etc.). One row per Term — matches Code and Name on your Gloria response. Skip if your sample has no Terms block."
				>
					<div className="mb-2 flex justify-end">
						<Button
							type="button"
							variant="ghost"
							className="h-8 text-xs"
							onClick={() =>
								props.setTermRows((r) => [
									...r,
									{ id: newRowId(), code: "", name: "" },
								])
							}
						>
							+ Add term
						</Button>
					</div>
					<LineItemColumnHeaders columns={["Code", "Name (policy text)"]} />
					<div className="space-y-2">
						{props.termRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-100 bg-white p-2 sm:grid-cols-[minmax(5rem,7rem)_1fr_auto]"
							>
								<ManualImportField label="Code" xmlAttr="@Code" className="sm:mb-0">
									<Input
										value={row.code}
										onChange={(e) =>
											props.setTermRows((rows) =>
												rows.map((x) =>
													x.id === row.id
														? {
																...x,
																code: e.target.value.toUpperCase(),
															}
														: x,
												),
											)
										}
										placeholder="FUEL"
										maxLength={16}
									/>
								</ManualImportField>
								<ManualImportField
									label="Name"
									xmlAttr="@Name"
									className="sm:mb-0"
								>
									<Input
										value={row.name}
										onChange={(e) =>
											props.setTermRows((rows) =>
												rows.map((x) =>
													x.id === row.id ? { ...x, name: e.target.value } : x,
												),
											)
										}
										placeholder="Full to full"
									/>
								</ManualImportField>
								<Button
									type="button"
									variant="ghost"
									className="mb-0.5 shrink-0 text-xs sm:mb-1"
									onClick={() =>
										props.setTermRows((rows) =>
											rows.filter((x) => x.id !== row.id),
										)
									}
									disabled={props.termRows.length <= 1}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
					<p className="mt-2 text-[11px] text-slate-500">
						Example: Code <XmlTag>FUEL</XmlTag>, Name{" "}
						<XmlTag>Full to full</XmlTag>. Empty rows are ignored when you store.
					</p>
				</ManualImportSection>

				<ManualImportSection
					step={9}
					title="Vehicle details & image"
					xmlPath="vehdetails @attributes"
					variant="optional"
					description="Extra vehicle fields shown on stored samples (Transmission, Doors, Seats, Bags, ImageURL). Matches the Vehicle attributes block on your pricing card."
				>
					<div className="space-y-5">
						<div>
							<p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
								Vehicle attributes
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<ManualImportField
									label="Transmission"
									xmlAttr="@Transmission"
									helper="e.g. Automatic"
								>
									<Select
										value={props.transmission}
										onChange={(e) => props.onTransmission(e.target.value)}
										options={[
											{ value: "", label: "— Select —" },
											{ value: "Automatic", label: "Automatic" },
											{ value: "Manual", label: "Manual" },
										]}
									/>
								</ManualImportField>
								<ManualImportField label="Doors" xmlAttr="@Doors">
									<Input
										value={props.doors}
										onChange={(e) => props.onDoors(e.target.value)}
										inputMode="numeric"
										placeholder="4"
									/>
								</ManualImportField>
								<ManualImportField label="Seats" xmlAttr="@Seats">
									<Input
										value={props.seats}
										onChange={(e) => props.onSeats(e.target.value)}
										inputMode="numeric"
										placeholder="5"
									/>
								</ManualImportField>
								<ManualImportField
									label="Bags (small)"
									xmlAttr="@BagsSmall"
									helper="Small bags capacity"
								>
									<Input
										value={props.bagsS}
										onChange={(e) => props.onBagsS(e.target.value)}
										inputMode="numeric"
										placeholder="5"
									/>
								</ManualImportField>
								<ManualImportField
									label="Bags (medium)"
									xmlAttr="@BagsMedium"
									helper="Medium bags capacity"
								>
									<Input
										value={props.bagsM}
										onChange={(e) => props.onBagsM(e.target.value)}
										inputMode="numeric"
										placeholder="3"
									/>
								</ManualImportField>
							</div>
						</div>

						<div className="border-t border-slate-200 pt-4">
							<p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
								Booking rules (optional)
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<ManualImportField
									label="Min lead time (hours)"
									helper="Minimum hours before pick-up"
								>
									<Input
										value={props.minLead}
										onChange={(e) => props.onMinLead(e.target.value)}
										inputMode="numeric"
										placeholder="2"
									/>
								</ManualImportField>
								<ManualImportField
									label="Max lead time (days)"
									helper="How far ahead bookings are allowed"
								>
									<Input
										value={props.maxLead}
										onChange={(e) => props.onMaxLead(e.target.value)}
										inputMode="numeric"
										placeholder="365"
									/>
								</ManualImportField>
								<ManualImportField
									label="Mileage"
									helper="0 = unlimited if applicable"
								>
									<Input
										value={props.mileage}
										onChange={(e) => props.onMileage(e.target.value)}
										inputMode="numeric"
										placeholder="0"
									/>
								</ManualImportField>
							</div>
						</div>

						<div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
							<p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
								<Settings className="h-4 w-4" aria-hidden />
								Vehicle image
							</p>
							<ManualImportField
								label="Image URL"
								xmlAttr="@ImageURL"
								helper="Paste a URL or upload — shown on stored sample cards."
							>
								<Input
									value={props.imageUrl}
									onChange={(e) => props.onImageUrl(e.target.value)}
									placeholder="https://…"
								/>
							</ManualImportField>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<input
									ref={imageInputRef}
									type="file"
									accept="image/jpeg,image/png,image/gif,image/webp"
									onChange={onImageSelected}
									disabled={isUploadingImage}
									className="block max-w-xs text-xs text-gray-600 file:mr-2 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:px-2 file:py-1"
								/>
								{isUploadingImage && (
									<span className="text-xs text-gray-500">Uploading…</span>
								)}
								{props.imageUrl.trim() && (
									<Button
										type="button"
										variant="ghost"
										className="h-8 shrink-0 text-xs"
										onClick={() => props.onImageUrl("")}
									>
										Clear URL
									</Button>
								)}
							</div>
							{props.imageUrl.trim() !== "" && (
								<img
									src={displayImageUrl(props.imageUrl)}
									alt="Vehicle preview"
									className="mt-2 max-h-28 max-w-full rounded border border-gray-200 bg-gray-50 object-contain p-2"
								/>
							)}
						</div>
					</div>
				</ManualImportSection>

				<label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-gray-600">
					<input
						type="checkbox"
						checked={forceRefresh}
						onChange={(e) => onForceRefreshChange(e.target.checked)}
						className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					Force re-store (overwrite duplicate guard)
				</label>

				<div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						variant="primary"
						onClick={onSubmit}
						loading={isSubmitting}
						disabled={!canStore}
						title={
							canStore
								? undefined
								: "Complete all required fields above (marked ●)"
						}
					>
						Store sample
					</Button>
				</div>
			</div>
		</Modal>
	);
};
