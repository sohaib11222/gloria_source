export type ManualImportTermRow = {
	id: string;
	code: string;
	name: string;
};

/** Gloria Terms.Item[] — each row becomes `{ "@attributes": { Code, Name } }`. */
export function buildGloriaTermsFromRows(rows: ManualImportTermRow[]): unknown[] {
	return rows
		.filter((r) => r.code.trim() || r.name.trim())
		.map((r) => ({
			"@attributes": {
				Code: r.code.trim().toUpperCase(),
				Name: r.name.trim(),
			},
		}));
}

export function createEmptyTermRow(newRowId: () => string): ManualImportTermRow {
	return { id: newRowId(), code: "", name: "" };
}
