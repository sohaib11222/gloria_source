import api from "../lib/api";

export type BranchEndpointFormat = "XML" | "JSON" | "PHP" | "CSV" | "EXCEL";

export interface EndpointConfig {
	companyId: string;
	companyName: string;
	type: string;
	httpEndpoint: string;
	grpcEndpoint: string;
	branchEndpointUrl?: string;
	branchEndpointFormat?: BranchEndpointFormat | null;
	branchDefaultCountryCode?: string | null;
	locationEndpointUrl?: string;
	locationListEndpointUrl?: string | null;
	locationListRequestRoot?: string | null;
	locationListAccountId?: string | null;
	locationListTransport?: "http" | "grpc" | null;
	availabilityEndpointUrl?: string;
	adapterType: string;
	description: string;
	status: string;
	updatedAt: string;
	lastGrpcTestResult?: any;
	lastGrpcTestAt?: string;
	lastLocationSyncAt?: string;
}

export interface UpdateEndpointRequest {
	httpEndpoint: string;
	grpcEndpoint: string;
	branchEndpointUrl?: string;
	branchEndpointFormat?: BranchEndpointFormat | null;
	branchDefaultCountryCode?: string | null;
	locationEndpointUrl?: string;
	locationListEndpointUrl?: string;
	locationListRequestRoot?: string;
	locationListAccountId?: string;
	locationListTransport?: "http" | "grpc";
	availabilityEndpointUrl?: string;
}

export interface UpdateEndpointResponse {
	message: string;
	companyId: string;
	httpEndpoint: string;
	grpcEndpoint: string;
	adapterType: string;
	updatedAt: string;
}

export interface Location {
	unlocode: string;
	country: string;
	place: string;
	iata_code: string;
	latitude: number;
	longitude: number;
	/** Coverage row synced from mock adapter */
	isMock?: boolean;
	/** UN/LOCODE exists in Gloria master table (nested `location` from coverage API) */
	hasMasterRecord?: boolean;
	/** When present (alternate coverage API), last link time */
	synced_at?: string | null;
	/** True when master row exists but lat/lon not set */
	coordinatesMissing?: boolean;
	/** Display fields filled from imported Branch when Gloria UN/LOCODE master is missing */
	enrichedFromBranch?: boolean;
}

/** Normalize GET /api/coverage/source/:id rows (nested `location`) or flat rows into Location. */
function mapCoverageApiItemToLocation(row: Record<string, unknown>): Location {
	const provenance = row.locationProvenance as string | undefined;
	const enrichedFromBranch = provenance === "BRANCH";
	const loc = row.location as Record<string, unknown> | null | undefined;
	if (loc && typeof loc === "object") {
		const latRaw = loc.latitude != null ? Number(loc.latitude) : NaN;
		const lonRaw = loc.longitude != null ? Number(loc.longitude) : NaN;
		const hasCoords = !Number.isNaN(latRaw) && !Number.isNaN(lonRaw);
		const unlocode = String(row.unlocode || loc.unlocode || "")
			.toUpperCase()
			.trim();
		return {
			unlocode,
			country: String(loc.country ?? ""),
			place: String(loc.place ?? "").trim() || "—",
			iata_code: String(loc.iataCode ?? loc.iata_code ?? ""),
			latitude: hasCoords ? latRaw : 0,
			longitude: hasCoords ? lonRaw : 0,
			isMock: Boolean(row.isMock),
			hasMasterRecord: true,
			coordinatesMissing: !hasCoords,
			enrichedFromBranch,
			synced_at: (row.synced_at as string) || null,
		};
	}
	if (row.unlocode) {
		return {
			unlocode: String(row.unlocode).toUpperCase().trim(),
			country: "",
			place: "—",
			iata_code: "",
			latitude: 0,
			longitude: 0,
			isMock: Boolean(row.isMock),
			hasMasterRecord: false,
			coordinatesMissing: true,
			synced_at: (row.synced_at as string) || null,
		};
	}
	const lat = row.latitude != null ? Number(row.latitude) : NaN;
	const lon = row.longitude != null ? Number(row.longitude) : NaN;
	const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);
	return {
		unlocode: String(row.unlocode || "")
			.toUpperCase()
			.trim(),
		country: String(row.country ?? ""),
		place: String(row.place ?? "").trim() || "—",
		iata_code: String(row.iata_code ?? row.iataCode ?? ""),
		latitude: hasCoords ? lat : 0,
		longitude: hasCoords ? lon : 0,
		isMock: Boolean(row.isMock),
		hasMasterRecord: true,
		coordinatesMissing: !hasCoords,
		synced_at: (row.synced_at as string) || null,
	};
}

function mapAgreementApiItemToLocation(row: Record<string, unknown>): Location {
	const lat = row.latitude != null ? Number(row.latitude) : NaN;
	const lon = row.longitude != null ? Number(row.longitude) : NaN;
	const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);
	return {
		unlocode: String(row.unlocode || "")
			.toUpperCase()
			.trim(),
		country: String(row.country ?? ""),
		place: String(row.place ?? "").trim() || "—",
		iata_code: String(row.iataCode ?? row.iata_code ?? ""),
		latitude: hasCoords ? lat : 0,
		longitude: hasCoords ? lon : 0,
		isMock: Boolean(row.isMock),
		hasMasterRecord:
			row.hasMasterRecord !== undefined ? Boolean(row.hasMasterRecord) : true,
		coordinatesMissing: !hasCoords,
	};
}

export interface LocationsResponse {
	items: Location[];
	next_cursor: string;
	/** Present on GET /agreements/:id/locations */
	inherited?: boolean;
	hasMockData?: boolean;
}

export interface SourceGrpcTestRequest {
	addr: string;
	grpcEndpoints?: {
		health?: string;
		locations?: string;
		availability?: string;
		bookings?: string;
	};
}

export interface SourceGrpcTestResponse {
	ok: boolean;
	addr: string;
	totalMs: number;
	endpoints: {
		health: {
			ok: boolean;
			result?: {
				status: string;
			};
			error?: string;
			ms: number;
		} | null;
		locations: any | null;
		availability: any | null;
		bookings: any | null;
	};
	tested: string[];
}

export interface ImportLocationsResponse {
	message: string;
	imported: number;
	updated: number;
	skipped: number;
	total: number;
	errors?: Array<{
		index: number;
		unlocode?: string;
		error: string;
	}>;
}

export interface ImportBranchesResponse {
	message?: string;
	imported?: number;
	updated?: number;
	total?: number;
	skipped?: number;
	summary?: {
		total: number;
		valid: number;
		invalid: number;
		imported: number;
		updated: number;
		skipped: number;
	};
	validationErrors?: any[];
	warnings?: string[];
	error?: string;
	invalidDetails?: any[];
}

export const endpointsApi = {
	getConfig: async (): Promise<EndpointConfig> => {
		const response = await api.get("/endpoints/config");
		return response.data;
	},

	updateConfig: async (
		data: UpdateEndpointRequest,
	): Promise<UpdateEndpointResponse> => {
		const response = await api.put("/endpoints/config", data);
		return response.data;
	},

	getLocations: async (): Promise<LocationsResponse> => {
		const response = await api.get("/locations");
		return response.data;
	},

	getLocationsByAgreement: async (
		agreementId: string,
	): Promise<LocationsResponse> => {
		const response = await api.get(`/agreements/${agreementId}/locations`);
		const data = response.data;
		const items = (data?.items || []).map((i: Record<string, unknown>) =>
			mapAgreementApiItemToLocation(i),
		);
		return {
			items,
			next_cursor: "",
			inherited: Boolean(data?.inherited),
			hasMockData: Boolean(data?.hasMockData),
		};
	},

	testSourceGrpc: async (
		data: SourceGrpcTestRequest,
	): Promise<SourceGrpcTestResponse> => {
		const response = await api.post("/test/source-grpc", data);
		return response.data;
	},

	syncLocations: async (sourceId: string): Promise<any> => {
		const response = await api.post(`/coverage/source/${sourceId}/sync`);
		return response.data;
	},

	getSyncedLocations: async (sourceId: string): Promise<LocationsResponse> => {
		const response = await api.get(`/coverage/source/${sourceId}`);
		const data = response.data || {};
		const raw = Array.isArray(data.items) ? data.items : [];
		const items: Location[] = raw.map((row: Record<string, unknown>) =>
			mapCoverageApiItemToLocation(row),
		);
		return {
			items,
			next_cursor: typeof data.next_cursor === "string" ? data.next_cursor : "",
		};
	},

	importBranches: async (): Promise<ImportBranchesResponse> => {
		const response = await api.post("/sources/import-branches");
		return response.data;
	},

	importLocations: async (): Promise<ImportLocationsResponse> => {
		const response = await api.post("/sources/import-locations");
		return response.data;
	},

	importLocationList: async (): Promise<
		ImportLocationsResponse & {
			branchesImported?: number;
			branchesUpdated?: number;
		}
	> => {
		const response = await api.post("/sources/import-location-list");
		return response.data;
	},

	uploadBranches: async (
		branchesData: any,
	): Promise<ImportBranchesResponse> => {
		// If branchesData is a string (PHP var_dump or XML), wrap it in an object
		// to ensure it's sent correctly
		const payload =
			typeof branchesData === "string"
				? { rawContent: branchesData }
				: branchesData;

		const response = await api.post("/sources/upload-branches", payload);
		return response.data;
	},

	searchLocations: async (
		query: string,
		limit = 25,
		cursor = "",
	): Promise<{ items: Location[]; next_cursor: string; has_more: boolean }> => {
		const response = await api.get("/sources/locations/search", {
			params: { query, limit, cursor },
		});
		return response.data;
	},

	addLocation: async (
		unlocode: string,
	): Promise<{ message: string; location: Location }> => {
		const response = await api.post("/sources/locations", { unlocode });
		return response.data;
	},

	removeLocation: async (
		unlocode: string,
	): Promise<{ message: string; unlocode: string }> => {
		const response = await api.delete(`/sources/locations/${unlocode}`);
		return response.data;
	},

	fetchAvailability: async (params?: {
		url?: string;
		adapterType?: "xml" | "json" | "grpc";
		pickupDateTime?: string;
		returnDateTime?: string;
		pickupLoc?: string;
		returnLoc?: string;
		requestorId?: string;
		driverAge?: number;
		citizenCountry?: string;
		force?: boolean;
	}): Promise<FetchAvailabilityResponse> => {
		// Supplier pricing bodies can take 30–120s (large Gloria/PHP responses); must outlive backend supplier fetch + parse.
		const response = await api.post(
			"/sources/fetch-availability",
			params ?? {},
			{ timeout: 180_000 },
		);
		return response.data;
	},

	getAvailabilitySamples: async (): Promise<{
		samples: StoredAvailabilitySample[];
	}> => {
		const response = await api.get("/sources/availability-samples");
		return response.data;
	},

	postManualAvailabilitySample: async (
		payload: ManualAvailabilitySamplePayload,
	): Promise<FetchAvailabilityResponse> => {
		const response = await api.post(
			"/sources/manual-availability-sample",
			payload,
		);
		return response.data;
	},

	uploadManualAvailabilityVehicleImage: async (
		file: File,
	): Promise<{ url: string }> => {
		const form = new FormData();
		form.append("image", file);
		const response = await api.post("/sources/manual-availability-image", form);
		return response.data;
	},

	getDailyPricing: async (
		params: DailyPricingQuery,
	): Promise<{ items: DailyPricingRow[]; meta: any }> => {
		const response = await api.get("/sources/daily-pricing", { params });
		return response.data;
	},

	applyDailyPricingDefault: async (payload: {
		startDate: string;
		endDate: string;
		pickupLoc: string;
		returnLoc: string;
		acrissCode: string;
		defaultPrice: number;
		dayStart: number;
		dayEnd: number;
		currency?: string;
	}): Promise<{ message: string; upserted: number }> => {
		const response = await api.put("/sources/daily-pricing/default", payload);
		return response.data;
	},

	updateDailyPricingCell: async (
		payload: DailyPricingCellUpdate,
	): Promise<{ message: string; item: any }> => {
		const response = await api.patch("/sources/daily-pricing/cell", payload);
		return response.data;
	},

	bulkUpdateDailyPricing: async (payload: {
		cells: DailyPricingCellUpdate[];
	}): Promise<{ message: string; upserted: number }> => {
		const response = await api.put("/sources/daily-pricing/bulk", payload);
		return response.data;
	},
};

export interface IncludedTerm {
	code?: string;
	mandatory?: string;
	header?: string;
	price?: string;
	excess?: string;
	deposit?: string;
	details?: string;
	currency?: string;
	cover_amount?: string;
}

export interface PricedEquip {
	description?: string;
	equip_type?: string;
	vendor_equip_id?: string;
	currency?: string;
	long_description?: string;
	charge?: {
		Amount?: string | number;
		UnitCharge?: string | number;
		Quantity?: string | number;
		TaxInclusive?: string;
	};
}

export interface OfferSummaryItem {
	vehicle_class: string;
	vehicle_make_model: string;
	total_price: number;
	currency: string;
	availability_status: string;
	picture_url?: string;
	transmission_type?: string;
	vehicle_category?: string;
	air_condition_ind?: string;
	veh_id?: string;
	door_count?: string;
	baggage?: string;
	included?: IncludedTerm[];
	not_included?: IncludedTerm[];
	priced_equips?: PricedEquip[];
	/** Present on manually imported samples (lead times, mileage, seats). */
	manual_business_rules?: Record<string, string | number | undefined>;
	/** GLORIA pricing @attributes (manual import or fetched GLORIA XML). */
	gloria_pricing_attributes?: Record<string, string>;
	/** GLORIA vehdetails @attributes (fetched GLORIA XML / manual). */
	gloria_vehdetails_attributes?: Record<string, string>;
	/** GLORIA Terms.Item[] snapshot (manual import). */
	gloria_terms?: unknown[];
	/** GLORIA root @attributes (manual import). */
	gloria_response_meta?: {
		TimeStamp?: string;
		Target?: string;
		Version?: string;
	};
}

export interface StoredAvailabilitySample {
	id: string;
	criteriaHash: string;
	pickupLoc: string;
	returnLoc: string;
	pickupIso: string;
	returnIso: string;
	offersCount: number;
	adapterType?: "xml" | "json" | "grpc" | "manual";
	offersSummary?: OfferSummaryItem[] | null;
	criteria?: {
		pickupLoc: string;
		returnLoc: string;
		pickupIso: string;
		returnIso: string;
		requestorId?: string;
		driverAge?: number;
		citizenCountry?: string;
		adapterType?: "xml" | "json" | "grpc" | "manual";
	} | null;
	fetchedAt: string;
	updatedAt: string;
}

export interface ManualGloriaLineItemPayload {
	code?: string;
	description?: string;
	excess?: string;
	deposit?: string;
	price?: string;
	currency?: string;
	cover_amount?: string;
}

export interface ManualGloriaExtraPayload {
	code?: string;
	description?: string;
	name?: string;
	price: number;
	currency?: string;
	long_description?: string;
}

export interface ManualGloriaPricingPayload {
	car_order_id?: string;
	currency?: string;
	duration?: string | number;
	daily_net?: string | number;
	daily_tax?: string | number;
	daily_gross?: string | number;
	total_net?: string | number;
	total_tax?: string | number;
	total_gross?: string | number;
	tax_rate?: string | number;
}

export interface ManualAvailabilitySamplePayload {
	pickupLoc: string;
	returnLoc: string;
	pickupIso: string;
	returnIso: string;
	rental_duration?: number;
	requestorId?: string;
	driverAge?: number;
	citizenCountry?: string;
	force?: boolean;
	response_meta?: { timestamp?: string; target?: string; version?: string };
	pricing?: ManualGloriaPricingPayload;
	vehicle: {
		acriss: string;
		make: string;
		model: string;
		currency?: string;
		total_price?: number;
		daily_gross?: number;
		transmission?: string;
		doors?: string | number;
		seats?: string | number;
		bags_small?: string | number;
		bags_medium?: string | number;
		image_url?: string;
		car_order_id?: string;
		min_lead_hours?: number;
		max_lead_days?: number;
		mileage?: number;
	};
	included?: ManualGloriaLineItemPayload[];
	not_included?: ManualGloriaLineItemPayload[];
	extras?: ManualGloriaExtraPayload[];
	terms?: unknown[];
}

export interface FetchAvailabilityResponse {
	message: string;
	offersCount: number;
	stored: boolean;
	isNew: boolean;
	duplicate?: boolean;
	adapterType?: "xml" | "json" | "grpc" | "manual";
	offersSummary?: OfferSummaryItem[];
	criteria?: {
		pickupLoc: string;
		returnLoc: string;
		pickupIso: string;
		returnIso: string;
		requestorId?: string;
		driverAge?: number;
		citizenCountry?: string;
		adapterType?: "xml" | "json" | "grpc" | "manual";
	};
	rawResponsePreview?: string;
	parsedPreview?: any;
	error?: string;
	details?: any;
}

export interface DailyPricingQuery {
	startDate: string;
	endDate: string;
	pickupLoc: string;
	returnLoc: string;
	acrissCode: string;
	maxDays?: number;
}

export interface DailyPricingRow {
	pickupDate: string;
	acrissCode: string;
	[key: string]: string | number | null;
}

export interface DailyPricingCellUpdate {
	pickupDate: string;
	pickupLoc: string;
	returnLoc: string;
	acrissCode: string;
	dayOffset: number;
	price: number;
	currency?: string;
}
