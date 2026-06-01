import api from "../lib/api";

export interface FleetBranchRef {
	id: string;
	branchCode: string;
	name: string;
	status?: string | null;
}

export interface SourceFleet {
	id: string;
	fleetCode: string;
	name: string;
	description?: string | null;
	status: string;
	acrissCodes: string[];
	branches: FleetBranchRef[];
	createdAt: string;
	updatedAt: string;
}

export interface FleetListResponse {
	items: SourceFleet[];
	total: number;
}

export interface CreateFleetRequest {
	fleetCode: string;
	name: string;
	description?: string;
	acrissCodes?: string[];
	branchIds?: string[];
}

export interface UpdateFleetRequest {
	name?: string;
	description?: string;
	status?: string;
	acrissCodes?: string[];
	branchIds?: string[];
}

export const fleetsApi = {
	listFleets: async (): Promise<FleetListResponse> => {
		const response = await api.get("/sources/fleets");
		return response.data;
	},

	createFleet: async (data: CreateFleetRequest): Promise<SourceFleet> => {
		const response = await api.post("/sources/fleets", data);
		return response.data;
	},

	updateFleet: async (id: string, data: UpdateFleetRequest): Promise<SourceFleet> => {
		const response = await api.patch(`/sources/fleets/${id}`, data);
		return response.data;
	},

	deleteFleet: async (id: string): Promise<void> => {
		await api.delete(`/sources/fleets/${id}`);
	},
};
