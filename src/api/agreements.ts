import api from "../lib/api";

export interface Agreement {
	id: string;
	agent_id?: string;
	source_id?: string;
	agreement_ref?: string;
	agentId?: string;
	sourceId?: string;
	agreementRef?: string;
	accountNumber?: string | null;
	marginPercent?: number;
	contactName?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	status:
		| "DRAFT"
		| "OFFERED"
		| "ACCEPTED"
		| "ACTIVE"
		| "SUSPENDED"
		| "EXPIRED"
		| "REJECTED";
	valid_from?: string | null;
	valid_to?: string | null;
	validFrom?: string | null;
	validTo?: string | null;
}

export interface AgentAgreement {
	id: string;
	agreementRef: string;
	accountNumber?: string | null;
	marginPercent?: number;
	contactName?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	status:
		| "DRAFT"
		| "OFFERED"
		| "ACCEPTED"
		| "ACTIVE"
		| "SUSPENDED"
		| "REJECTED"
		| "EXPIRED";
	validFrom?: string | null;
	validTo?: string | null;
	sourceId: string;
	source: {
		id: string;
		companyName: string;
		email?: string;
		status: string;
		companyCode?: string | null;
		companyAddress?: string | null;
		companyWebsiteUrl?: string | null;
		registrationBranchName?: string | null;
	};
}

export interface Agent {
	id: string;
	companyName: string;
	email: string;
	status: string;
	companyCode?: string | null;
	companyAddress?: string | null;
	companyWebsiteUrl?: string | null;
	registrationBranchName?: string | null;
	createdAt: string;
	updatedAt: string;
	adapterType: string;
	grpcEndpoint: string | null;
	_count: {
		users: number;
		agentAgreements: number;
	};
	agentAgreements: AgentAgreement[];
}

export interface AgreementsAllResponse {
	items: Agent[];
	total: number;
	filters: {
		status: string;
		type: string;
	};
}

export interface CreateAgreementRequest {
	agent_id: string;
	source_id: string;
	agreement_ref?: string;
	account_number: string;
	margin_percent: number;
	contact_name: string;
	contact_email: string;
	contact_phone?: string;
	valid_from?: string;
	valid_to?: string;
}

export interface CreateAgreementResponse {
	id: string;
	agentId?: string;
	sourceId?: string;
	agreementRef?: string;
	accountNumber?: string | null;
	marginPercent?: number;
	contactName?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	status: string;
	validFrom?: string | null;
	validTo?: string | null;
	message?: string;
}

export interface AgreementError {
	error: string;
	message: string;
	agent_id: string;
	source_id: string;
	agreement_ref: string;
	requestId: string;
}

export const agreementsApi = {
	getAllAgents: async (): Promise<AgreementsAllResponse> => {
		const response = await api.get("/agreements/all");
		return response.data;
	},

	createAgreement: async (
		data: CreateAgreementRequest,
	): Promise<CreateAgreementResponse> => {
		const response = await api.post("/agreements", data);
		return response.data;
	},

	checkDuplicate: async (payload: {
		agreementRef: string;
		agentId: string;
		sourceId: string;
	}): Promise<{ duplicate: boolean; existingId?: string }> => {
		const response = await api.post("/agreements/check-duplicate", payload);
		return response.data;
	},

	getAgreement: async (
		id: string,
	): Promise<Agreement & { agent?: any; source?: any }> => {
		const response = await api.get(`/agreements/${id}`);
		return response.data;
	},
};
