export type ManualImportCompletenessInput = {
	pickupLoc: string;
	returnLoc: string;
	pickupDt: string;
	returnDt: string;
	acriss: string;
	make: string;
	model: string;
	currency: string;
	totalGross: string;
	fleetSelected: boolean;
	fleetBranchesOk: boolean;
	fleetPickupOk: boolean;
	fleetReturnOk: boolean;
	missingIncludedCodes?: string[];
};

export type CompletenessItem = {
	id: string;
	label: string;
	ok: boolean;
	required: boolean;
	section: number;
};

export function buildManualImportCompleteness(
	input: ManualImportCompletenessInput,
): CompletenessItem[] {
	return [
		{
			id: "fleet",
			section: 1,
			label: "Fleet configured (optional)",
			ok: input.fleetSelected,
			required: false,
		},
		{
			id: "fleet-branches",
			section: 1,
			label: "Fleet has branches attached",
			ok: !input.fleetSelected || input.fleetBranchesOk,
			required: false,
		},
		{
			id: "pickup",
			section: 1,
			label: "Pick-up branch (collectionbranch)",
			ok: Boolean(input.pickupLoc.trim()) && input.fleetPickupOk,
			required: true,
		},
		{
			id: "return",
			section: 1,
			label: "Return branch (returnbranch)",
			ok: Boolean(input.returnLoc.trim()) && input.fleetReturnOk,
			required: true,
		},
		{
			id: "pickup-dt",
			section: 1,
			label: "Pick-up date/time",
			ok: Boolean(input.pickupDt),
			required: true,
		},
		{
			id: "return-dt",
			section: 1,
			label: "Return date/time",
			ok: Boolean(input.returnDt),
			required: true,
		},
		{
			id: "acriss",
			section: 2,
			label: "ACRISS (availcars)",
			ok: Boolean(input.acriss.trim()),
			required: true,
		},
		{
			id: "make",
			section: 2,
			label: "Make (vehdetails)",
			ok: Boolean(input.make.trim()),
			required: true,
		},
		{
			id: "model",
			section: 2,
			label: "Model (vehdetails)",
			ok: Boolean(input.model.trim()),
			required: true,
		},
		{
			id: "currency",
			section: 3,
			label: "Currency (pricing)",
			ok: Boolean(input.currency.trim()),
			required: true,
		},
		{
			id: "total",
			section: 3,
			label: "Total gross (pricing)",
			ok: Boolean(input.totalGross.trim()) && Number.isFinite(Number(input.totalGross)),
			required: true,
		},
		{
			id: "included-standard",
			section: 5,
			label: "Included lines (AS, CDW, TAX, TPI, TWI, UM)",
			ok: !input.missingIncludedCodes?.length,
			required: true,
		},
	];
}

export function requiredCompletenessComplete(items: CompletenessItem[]): boolean {
	return items.filter((i) => i.required).every((i) => i.ok);
}
