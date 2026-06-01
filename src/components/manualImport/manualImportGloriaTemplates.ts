/** Standard Gloria “included in price” line codes (one row each; values entered by user). */
export const GLORIA_REQUIRED_INCLUDED_CODES = [
	"AS",
	"CDW",
	"TAX",
	"TPI",
	"TWI",
	"UM",
] as const;

export function isRequiredIncludedCode(code: string): boolean {
	const normalized = code.trim().toUpperCase();
	return (GLORIA_REQUIRED_INCLUDED_CODES as readonly string[]).includes(
		normalized,
	);
}

export function missingRequiredIncludedCodes(
	rows: Array<{ code: string }>,
): string[] {
	const present = new Set(
		rows
			.map((r) => r.code.trim().toUpperCase())
			.filter((c) => c.length > 0),
	);
	return GLORIA_REQUIRED_INCLUDED_CODES.filter((c) => !present.has(c));
}

export function buildDefaultIncludedRows(newRowId: () => string): Array<{
	id: string;
	code: string;
	description: string;
	excess: string;
	deposit: string;
	currency: string;
}> {
	return GLORIA_REQUIRED_INCLUDED_CODES.map((code) => ({
		id: newRowId(),
		code,
		description: "",
		excess: "",
		deposit: "",
		currency: "",
	}));
}
