import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Tooltip } from "./ui/Tooltip";
import { Hash, Mail, Percent, Phone, Plus, User } from "lucide-react";
import { Agent } from "../api/agreements";

interface CreateAgreementFormProps {
	agents: Agent[];
	selectedAgentId: string;
	accountNumber: string;
	marginPercent: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	isCreatingAgreement: boolean;
	setSelectedAgentId: (value: string) => void;
	setAccountNumber: (value: string) => void;
	setMarginPercent: (value: string) => void;
	setContactName: (value: string) => void;
	setContactEmail: (value: string) => void;
	setContactPhone: (value: string) => void;
	createAgreement: () => void;
	user?: {
		company: {
			status: string;
		};
	} | null;
}

export const CreateAgreementForm: React.FC<CreateAgreementFormProps> = ({
	agents,
	selectedAgentId,
	accountNumber,
	marginPercent,
	contactName,
	contactEmail,
	contactPhone,
	isCreatingAgreement,
	setSelectedAgentId,
	setAccountNumber,
	setMarginPercent,
	setContactName,
	setContactEmail,
	setContactPhone,
	createAgreement,
	user,
}) => {
	const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

	const getCreateButtonState = () => {
		if (!selectedAgentId.trim()) {
			return {
				disabled: true,
				reason: "Select the agent company that should receive supplier access.",
			};
		}
		if (!accountNumber.trim()) {
			return {
				disabled: true,
				reason:
					"Enter the supplier account/requester number assigned in the offline agreement.",
			};
		}
		const margin = Number(marginPercent);
		if (!Number.isFinite(margin) || margin < 0) {
			return {
				disabled: true,
				reason: "Enter a valid margin percentage (0 or higher).",
			};
		}
		if (!contactName.trim()) {
			return {
				disabled: true,
				reason:
					"Enter the commercial contact name for offline agreement follow-up.",
			};
		}
		if (!contactEmail.trim()) {
			return {
				disabled: true,
				reason:
					"Enter the commercial contact email for offline agreement follow-up.",
			};
		}
		if (!contactPhone.trim()) {
			return {
				disabled: true,
				reason:
					"Enter the commercial contact telephone for offline agreement follow-up.",
			};
		}
		if (user?.company.status !== "ACTIVE") {
			return {
				disabled: true,
				reason: `Company status is ${user?.company.status}. Company must be ACTIVE to register agreements.`,
			};
		}
		return { disabled: false, reason: "" };
	};

	return (
		<Card className="mb-8 transform transition-all duration-300 hover:shadow-xl border-2 border-blue-100 overflow-hidden">
			<CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-b border-blue-100">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-white rounded-lg shadow-sm">
						<Plus className="w-5 h-5 text-blue-600" />
					</div>
					<div>
						<CardTitle className="text-xl font-bold text-gray-900">
							Register supplier access
						</CardTitle>
						<p className="text-sm text-gray-600 mt-1">
							Legal paperwork stays offline. Save only the operational account
							number, margin, and contact details needed for pricing.
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-6 space-y-5">
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
					<strong>Offline agreement workflow:</strong> sign legal documents by
					email/local process, then enter the supplier-assigned account number
					here. Gloria sends that account number as the availability RequestorID
					and applies the margin percentage to returned prices.
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
						<div className="flex items-center gap-2 mb-3">
							<User className="w-5 h-5 text-blue-600" />
							<label className="text-sm font-bold text-gray-700">
								Agent receiving access
							</label>
						</div>
						<Select
							value={selectedAgentId || ""}
							onChange={(e) => setSelectedAgentId(e.target.value)}
							options={[
								{ value: "", label: "-- Select an agent --" },
								...agents
									.filter((agent) => agent.status === "ACTIVE")
									.map((agent) => ({
										value: agent.id,
										label: `${agent.companyName} (${agent.email})`,
									})),
							]}
						/>
						{selectedAgent && (
							<p className="mt-2 text-xs text-blue-800">
								Contact:{" "}
								<a
									className="font-semibold underline"
									href={`mailto:${selectedAgent.email}`}
								>
									{selectedAgent.email}
								</a>
							</p>
						)}
					</div>

					<div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
						<div className="flex items-center gap-2 mb-3">
							<Hash className="w-5 h-5 text-emerald-600" />
							<label className="text-sm font-bold text-gray-700">
								Account / Requestor ID
							</label>
						</div>
						<Input
							value={accountNumber}
							onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
							placeholder="e.g., 1000097 or AGENT123"
						/>
						<p className="mt-2 text-xs text-emerald-800">
							This is sent to the supplier availability API as the
							requester/account number.
						</p>
					</div>

					<div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
						<div className="flex items-center gap-2 mb-3">
							<Percent className="w-5 h-5 text-amber-600" />
							<label className="text-sm font-bold text-gray-700">
								Margin percentage
							</label>
						</div>
						<Input
							type="number"
							min={0}
							step="0.01"
							value={marginPercent}
							onChange={(e) => setMarginPercent(e.target.value)}
							placeholder="e.g., 12.5"
						/>
						<p className="mt-2 text-xs text-amber-800">
							Added to supplier total price before offers are shown to
							agents/customers.
						</p>
					</div>

					<div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
						<div className="flex items-center gap-2 mb-3">
							<User className="w-5 h-5 text-slate-600" />
							<label className="text-sm font-bold text-gray-700">
								Commercial contact name
							</label>
						</div>
						<Input
							value={contactName}
							onChange={(e) => setContactName(e.target.value)}
							placeholder="Name for email/legal follow-up"
						/>
					</div>

					<div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
						<div className="flex items-center gap-2 mb-3">
							<Mail className="w-5 h-5 text-slate-600" />
							<label className="text-sm font-bold text-gray-700">
								Commercial contact email
							</label>
						</div>
						<Input
							type="email"
							value={contactEmail}
							onChange={(e) => setContactEmail(e.target.value)}
							placeholder="contact@example.com"
						/>
					</div>

					<div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
						<div className="flex items-center gap-2 mb-3">
							<Phone className="w-5 h-5 text-slate-600" />
							<label className="text-sm font-bold text-gray-700">
								Commercial contact telephone
							</label>
						</div>
						<Input
							type="tel"
							value={contactPhone}
							onChange={(e) => setContactPhone(e.target.value)}
							placeholder="e.g., +1 555 0100"
							helperText="Shown to agents for offline commercial/legal follow-up."
						/>
					</div>
				</div>

				<div>
					{(() => {
						const buttonState = getCreateButtonState();
						const button = (
							<Button
								onClick={createAgreement}
								loading={isCreatingAgreement}
								disabled={buttonState.disabled}
								title={buttonState.disabled ? buttonState.reason : undefined}
								variant="primary"
								className="flex items-center gap-2 shadow-lg hover:shadow-xl"
							>
								<Plus className="w-4 h-4" />
								Save supplier access
							</Button>
						);

						return buttonState.disabled ? (
							<div className="space-y-2">
								<Tooltip content={buttonState.reason} position="top">
									{button}
								</Tooltip>
								<p className="text-xs text-amber-600 flex items-center gap-1">
									<span>⚠️</span>
									<span>{buttonState.reason}</span>
								</p>
							</div>
						) : (
							button
						);
					})()}
				</div>
			</CardContent>
		</Card>
	);
};
