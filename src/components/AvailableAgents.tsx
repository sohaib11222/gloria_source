import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Loader } from "./ui/Loader";
import { Badge } from "./ui/Badge";
import {
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Eye,
	FileText,
	Mail,
	ShieldCheck,
	Users,
} from "lucide-react";
import { Agent } from "../api/agreements";

interface AvailableAgentsProps {
	agents: Agent[];
	isLoadingAgents: boolean;
	onViewAgreement?: (agreementId: string) => void;
}

function statusVariant(
	status?: string,
): "default" | "success" | "warning" | "danger" | "info" {
	switch ((status || "").toUpperCase()) {
		case "ACTIVE":
		case "ACCEPTED":
			return "success";
		case "OFFERED":
		case "DRAFT":
			return "warning";
		case "SUSPENDED":
		case "EXPIRED":
		case "REJECTED":
			return "danger";
		default:
			return "info";
	}
}

function formatDate(value?: string) {
	if (!value) return "Not set";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Not set";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function isLiveStatus(status?: string) {
	const upper = (status || "").toUpperCase();
	return upper === "ACTIVE" || upper === "ACCEPTED";
}

export const AvailableAgents: React.FC<AvailableAgentsProps> = ({
	agents,
	isLoadingAgents,
	onViewAgreement,
}) => {
	const activeAgents = agents.filter(
		(agent) => agent.status === "ACTIVE",
	).length;
	const agreementCount = agents.reduce(
		(total, agent) => total + (agent.agentAgreements?.length || 0),
		0,
	);
	const liveAgreementCount = agents.reduce(
		(total, agent) =>
			total +
			(agent.agentAgreements || []).filter((agreement) =>
				isLiveStatus(agreement.status),
			).length,
		0,
	);

	return (
		<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
			<CardHeader className="border-b border-slate-200 bg-white">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex items-start gap-3">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
							<Users className="h-5 w-5" />
						</div>
						<div>
							<CardTitle className="text-xl font-bold text-slate-950">
								Agent directory
							</CardTitle>
							<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
								See which agents are registered, how to contact them, and which
								agreement references already connect them to your supply.
							</p>
						</div>
					</div>
					<div className="grid min-w-full gap-2 sm:grid-cols-3 lg:min-w-[420px]">
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
								Agents
							</p>
							<p className="mt-1 text-2xl font-bold text-slate-950">
								{agents.length}
							</p>
						</div>
						<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
							<p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
								Active
							</p>
							<p className="mt-1 text-2xl font-bold text-emerald-950">
								{activeAgents}
							</p>
						</div>
						<div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
							<p className="text-xs font-bold uppercase tracking-wide text-blue-700">
								Live refs
							</p>
							<p className="mt-1 text-2xl font-bold text-blue-950">
								{liveAgreementCount}
							</p>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-5">
				{isLoadingAgents ? (
					<div className="flex justify-center py-16">
						<Loader size="lg" />
					</div>
				) : agents.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
							<Users className="h-8 w-8 text-slate-400" />
						</div>
						<h3 className="text-lg font-bold text-slate-950">
							No agents available yet
						</h3>
						<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
							Once agent companies are active in Gloria, they appear here with
							contact details and any existing agreement references.
						</p>
					</div>
				) : (
					<div className="grid gap-4 xl:grid-cols-2">
						{agents.map((agent) => {
							const agreements = agent.agentAgreements || [];
							const liveForAgent = agreements.filter((agreement) =>
								isLiveStatus(agreement.status),
							).length;
							return (
								<div
									key={agent.id}
									className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
								>
									<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
										<div className="flex min-w-0 items-start gap-3">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
												<Building2 className="h-5 w-5" />
											</div>
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<h4 className="truncate text-lg font-bold text-slate-950">
														{agent.companyName}
													</h4>
													<Badge
														variant={
															agent.status === "ACTIVE" ? "success" : "info"
														}
														size="sm"
													>
														{agent.status}
													</Badge>
												</div>
												<a
													href={`mailto:${agent.email}`}
													className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-sm font-medium text-blue-700 hover:text-blue-900"
												>
													<Mail className="h-4 w-4 shrink-0" />
													<span className="truncate">{agent.email}</span>
												</a>
											</div>
										</div>
										<div className="flex gap-2 sm:justify-end">
											<div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
												<p className="text-lg font-bold text-slate-950">
													{agreements.length}
												</p>
												<p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
													Refs
												</p>
											</div>
											<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
												<p className="text-lg font-bold text-emerald-950">
													{liveForAgent}
												</p>
												<p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
													Live
												</p>
											</div>
										</div>
									</div>

									<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<div className="mb-3 flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 text-sm font-bold text-slate-950">
												<FileText className="h-4 w-4 text-indigo-600" />{" "}
												Agreement references
											</div>
											<Badge variant="info" size="sm">
												{agreementCount === 0
													? "Directory"
													: `${agreements.length} linked`}
											</Badge>
										</div>

										{agreements.length > 0 ? (
											<div className="space-y-2">
												{agreements.map((agreement) => (
													<div
														key={agreement.id}
														className="rounded-2xl border border-slate-200 bg-white p-3"
													>
														<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
															<div className="min-w-0">
																<div className="flex flex-wrap items-center gap-2">
																	{onViewAgreement ? (
																		<button
																			type="button"
																			onClick={() =>
																				onViewAgreement(agreement.id)
																			}
																			className="truncate text-left text-sm font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
																		>
																			{agreement.agreementRef}
																		</button>
																	) : (
																		<span className="truncate text-sm font-bold text-slate-950">
																			{agreement.agreementRef}
																		</span>
																	)}
																	<Badge
																		variant={statusVariant(agreement.status)}
																		size="sm"
																	>
																		{agreement.status}
																	</Badge>
																</div>
																<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
																	<span className="inline-flex items-center gap-1">
																		<Calendar className="h-3.5 w-3.5" />
																		{formatDate(agreement.validFrom)} →{" "}
																		{formatDate(agreement.validTo)}
																	</span>
																	{agreement.source?.companyName && (
																		<span className="inline-flex items-center gap-1">
																			<ShieldCheck className="h-3.5 w-3.5" />
																			Source: {agreement.source.companyName}
																		</span>
																	)}
																</div>
															</div>
															{onViewAgreement && (
																<button
																	type="button"
																	onClick={() => onViewAgreement(agreement.id)}
																	className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
																>
																	<Eye className="h-3.5 w-3.5" /> Details
																</button>
															)}
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
												<Clock className="mx-auto h-6 w-6 text-slate-400" />
												<p className="mt-2 text-sm font-semibold text-slate-700">
													No agreement reference with this agent yet
												</p>
												<p className="mt-1 text-xs leading-5 text-slate-500">
													Coordinate externally with the agent/admin team; once
													provisioned, it will appear here.
												</p>
											</div>
										)}
									</div>

									<div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
										<span className="inline-flex items-center gap-1">
											<Calendar className="h-3.5 w-3.5" /> Created{" "}
											{formatDate(agent.createdAt)}
										</span>
										{agent.status === "ACTIVE" && (
											<span className="inline-flex items-center gap-1 text-emerald-700">
												<CheckCircle2 className="h-3.5 w-3.5" /> Ready for
												agreements
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
