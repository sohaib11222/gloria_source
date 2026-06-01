import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";
import { Loader } from "./ui/Loader";
import { agreementsApi } from "../api/agreements";
import toast from "react-hot-toast";

interface AgreementDetailModalProps {
	agreementId: string | null;
	isOpen: boolean;
	onClose: () => void;
}

interface AgreementDetail {
	id: string;
	agentId?: string;
	agent_id?: string;
	sourceId?: string;
	source_id?: string;
	agreementRef?: string;
	agreement_ref?: string;
	accountNumber?: string | null;
	marginPercent?: number;
	contactName?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	status: string;
	validFrom?: string | null;
	valid_from?: string | null;
	validTo?: string | null;
	valid_to?: string | null;
	createdAt?: string;
	updatedAt?: string;
	agent?: any;
	source?: any;
}

export const AgreementDetailModal: React.FC<AgreementDetailModalProps> = ({
	agreementId,
	isOpen,
	onClose,
}) => {
	const [agreement, setAgreement] = useState<AgreementDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen && agreementId) {
			loadAgreement();
		} else {
			setAgreement(null);
		}
	}, [isOpen, agreementId]);

	const loadAgreement = async () => {
		if (!agreementId) return;

		setIsLoading(true);
		try {
			const data = await agreementsApi.getAgreement(agreementId);
			setAgreement(data as any);
		} catch (error: any) {
			console.error("Failed to load agreement:", error);
			toast.error(
				error.response?.data?.message || "Failed to load agreement details",
			);
			onClose();
		} finally {
			setIsLoading(false);
		}
	};

	// Helper to get field value (handles both camelCase and snake_case)
	const getField = (obj: any, camelKey: string, snakeKey: string) => {
		return obj?.[camelKey] ?? obj?.[snakeKey] ?? "";
	};

	const formatDate = (value?: string | null) => {
		if (!value) return "Not set";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "Not set";
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (!isOpen) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Supplier access details"
			size="lg"
		>
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader />
				</div>
			) : agreement ? (
				<div className="space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between pb-4 border-b border-gray-200">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">
								{getField(agreement, "agreementRef", "agreement_ref")}
							</h3>
							<p className="text-sm text-gray-500 mt-1">
								Internal record ID: {agreement.id}
							</p>
						</div>
						<Badge
							variant={
								agreement.status === "ACTIVE"
									? "success"
									: agreement.status === "OFFERED"
										? "warning"
										: "default"
							}
						>
							{agreement.status}
						</Badge>
					</div>

					{/* Agent Information */}
					{agreement.agent && (
						<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h4 className="text-sm font-semibold text-gray-900 mb-2">
								Agent Information
							</h4>
							<div className="space-y-1 text-sm">
								<div>
									<span className="font-medium text-gray-700">Company:</span>{" "}
									<span className="text-gray-900">
										{agreement.agent.companyName}
									</span>
								</div>
								<div>
									<span className="font-medium text-gray-700">Email:</span>{" "}
									<span className="text-gray-900">{agreement.agent.email}</span>
								</div>
								{agreement.agent.companyCode && (
									<div>
										<span className="font-medium text-gray-700">
											Company Code:
										</span>{" "}
										<span className="text-gray-900">
											{agreement.agent.companyCode}
										</span>
									</div>
								)}
								{agreement.agent.registrationBranchName && (
									<div>
										<span className="font-medium text-gray-700">Branch:</span>{" "}
										<span className="text-gray-900">
											{agreement.agent.registrationBranchName}
										</span>
									</div>
								)}
								{agreement.agent.companyAddress && (
									<div>
										<span className="font-medium text-gray-700">Address:</span>{" "}
										<span className="text-gray-900">
											{agreement.agent.companyAddress}
										</span>
									</div>
								)}
								{agreement.agent.companyWebsiteUrl && (
									<div>
										<span className="font-medium text-gray-700">Website:</span>{" "}
										<a
											className="text-blue-700 hover:text-blue-900"
											href={agreement.agent.companyWebsiteUrl}
											target="_blank"
											rel="noreferrer"
										>
											{agreement.agent.companyWebsiteUrl}
										</a>
									</div>
								)}
								<div>
									<span className="font-medium text-gray-700">Status:</span>{" "}
									<Badge
										variant={
											agreement.agent.status === "ACTIVE"
												? "success"
												: "default"
										}
										size="sm"
									>
										{agreement.agent.status}
									</Badge>
								</div>
							</div>
						</div>
					)}

					{/* Source Information */}
					{agreement.source && (
						<div className="p-4 bg-green-50 rounded-lg border border-green-200">
							<h4 className="text-sm font-semibold text-gray-900 mb-2">
								Source Information
							</h4>
							<div className="space-y-1 text-sm">
								<div>
									<span className="font-medium text-gray-700">Company:</span>{" "}
									<span className="text-gray-900">
										{agreement.source.companyName}
									</span>
								</div>
								<div>
									<span className="font-medium text-gray-700">Email:</span>{" "}
									<span className="text-gray-900">
										{agreement.source.email}
									</span>
								</div>
								{agreement.source.companyCode && (
									<div>
										<span className="font-medium text-gray-700">
											Company Code:
										</span>{" "}
										<span className="text-gray-900">
											{agreement.source.companyCode}
										</span>
									</div>
								)}
								{agreement.source.registrationBranchName && (
									<div>
										<span className="font-medium text-gray-700">Branch:</span>{" "}
										<span className="text-gray-900">
											{agreement.source.registrationBranchName}
										</span>
									</div>
								)}
								{agreement.source.companyAddress && (
									<div>
										<span className="font-medium text-gray-700">Address:</span>{" "}
										<span className="text-gray-900">
											{agreement.source.companyAddress}
										</span>
									</div>
								)}
								{agreement.source.companyWebsiteUrl && (
									<div>
										<span className="font-medium text-gray-700">Website:</span>{" "}
										<a
											className="text-blue-700 hover:text-blue-900"
											href={agreement.source.companyWebsiteUrl}
											target="_blank"
											rel="noreferrer"
										>
											{agreement.source.companyWebsiteUrl}
										</a>
									</div>
								)}
								<div>
									<span className="font-medium text-gray-700">Status:</span>{" "}
									<Badge
										variant={
											agreement.source.status === "ACTIVE"
												? "success"
												: "default"
										}
										size="sm"
									>
										{agreement.source.status}
									</Badge>
								</div>
							</div>
						</div>
					)}

					{/* Operational commercial terms */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
							<div className="text-sm font-medium text-indigo-700 mb-1">
								Account / Requestor ID
							</div>
							<div className="text-base font-mono font-semibold text-indigo-950">
								{agreement.accountNumber ||
									getField(agreement, "agreementRef", "agreement_ref") ||
									"—"}
							</div>
							<p className="mt-1 text-xs text-indigo-700">
								Sent to supplier availability as RequestorID.
							</p>
						</div>
						<div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
							<div className="text-sm font-medium text-emerald-700 mb-1">
								Margin
							</div>
							<div className="text-base font-semibold text-emerald-950">
								{Number(agreement.marginPercent || 0).toFixed(2)}%
							</div>
							<p className="mt-1 text-xs text-emerald-700">
								Added to supplier prices returned for this agreement.
							</p>
						</div>
						<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 md:col-span-2">
							<div className="text-sm font-medium text-slate-600 mb-1">
								Offline agreement contact
							</div>
							<div className="text-base font-semibold text-slate-950">
								{agreement.contactName || "—"}
							</div>
							<div className="mt-1 flex flex-col gap-1">
								{agreement.contactEmail ? (
									<a
										className="text-sm font-medium text-blue-700 hover:text-blue-900"
										href={`mailto:${agreement.contactEmail}`}
									>
										{agreement.contactEmail}
									</a>
								) : (
									<p className="text-sm text-slate-500">No contact email saved</p>
								)}
								{agreement.contactPhone ? (
									<a
										className="text-sm font-medium text-blue-700 hover:text-blue-900"
										href={`tel:${agreement.contactPhone}`}
									>
										{agreement.contactPhone}
									</a>
								) : (
									<p className="text-sm text-slate-500">No contact telephone saved</p>
								)}
							</div>
						</div>
					</div>

					{/* Optional validity window */}
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 bg-gray-50 rounded-lg">
							<div className="text-sm font-medium text-gray-500 mb-1">
								Valid From
							</div>
							<div className="text-base font-semibold text-gray-900">
								{formatDate(getField(agreement, "validFrom", "valid_from"))}
							</div>
						</div>
						<div className="p-4 bg-gray-50 rounded-lg">
							<div className="text-sm font-medium text-gray-500 mb-1">
								Valid To
							</div>
							<div className="text-base font-semibold text-gray-900">
								{formatDate(getField(agreement, "validTo", "valid_to"))}
							</div>
						</div>
					</div>

					{/* Dates */}
					{(agreement.createdAt || agreement.updatedAt) && (
						<div className="pt-4 border-t border-gray-200">
							<div className="grid grid-cols-2 gap-4 text-sm">
								{agreement.createdAt && (
									<div>
										<span className="font-medium text-gray-500">Created:</span>{" "}
										<span className="text-gray-900">
											{new Date(agreement.createdAt).toLocaleString()}
										</span>
									</div>
								)}
								{agreement.updatedAt && (
									<div>
										<span className="font-medium text-gray-500">
											Last Updated:
										</span>{" "}
										<span className="text-gray-900">
											{new Date(agreement.updatedAt).toLocaleString()}
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="text-center py-8 text-gray-500">
					<p>No agreement data available</p>
				</div>
			)}
		</Modal>
	);
};
