import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Loader2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { branchesApi, type Branch } from "../../api/branches";
import { fleetsApi, type SourceFleet } from "../../api/fleets";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ManualImportField, XmlTag } from "./ManualImportUi";

export interface ManualImportFleetSectionProps {
	selectedFleetId: string | null;
	onFleetChange: (fleetId: string | null, fleet: SourceFleet | null) => void;
	pickupLoc: string;
	returnLoc: string;
	onPickupLoc: (v: string) => void;
	onReturnLoc: (v: string) => void;
	acriss: string;
	onAcriss?: (v: string) => void;
	isOpen: boolean;
}

function branchCodeOptions(branches: Branch[]): { value: string; label: string }[] {
	return branches.map((b) => ({
		value: b.branchCode.toUpperCase(),
		label: `${b.branchCode} — ${b.name}`,
	}));
}

export const ManualImportFleetSection: React.FC<ManualImportFleetSectionProps> = ({
	selectedFleetId,
	onFleetChange,
	pickupLoc,
	returnLoc,
	onPickupLoc,
	onReturnLoc,
	acriss,
	onAcriss,
	isOpen,
}) => {
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<"select" | "create">("select");
	const [draftCode, setDraftCode] = useState("");
	const [draftName, setDraftName] = useState("");
	const [draftDescription, setDraftDescription] = useState("");
	const [draftAcriss, setDraftAcriss] = useState("");
	const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const fleetsQuery = useQuery({
		queryKey: ["source-fleets"],
		queryFn: () => fleetsApi.listFleets(),
		enabled: isOpen,
	});

	const branchesQuery = useQuery({
		queryKey: ["source-branches-fleet-picker"],
		queryFn: () => branchesApi.listBranches({ limit: 100 }),
		enabled: isOpen,
	});

	const allBranches = branchesQuery.data?.items ?? [];
	const fleets = fleetsQuery.data?.items ?? [];

	const selectedFleet = useMemo(
		() => fleets.find((f) => f.id === selectedFleetId) ?? null,
		[fleets, selectedFleetId],
	);

	const fleetBranchCodes = useMemo(
		() => selectedFleet?.branches.map((b) => b.branchCode.toUpperCase()) ?? [],
		[selectedFleet],
	);

	const branchOptions = useMemo(() => {
		if (selectedFleet && fleetBranchCodes.length > 0) {
			const allowed = new Set(fleetBranchCodes);
			return branchCodeOptions(
				allBranches.filter((b) => allowed.has(b.branchCode.toUpperCase())),
			);
		}
		return branchCodeOptions(allBranches);
	}, [allBranches, fleetBranchCodes, selectedFleet]);

	useEffect(() => {
		if (!selectedFleet) {
			setSelectedBranchIds([]);
			return;
		}
		setSelectedBranchIds(selectedFleet.branches.map((b) => b.id));
		setDraftCode(selectedFleet.fleetCode);
		setDraftName(selectedFleet.name);
		setDraftDescription(selectedFleet.description ?? "");
		setDraftAcriss(selectedFleet.acrissCodes.join(", "));
	}, [selectedFleet?.id]);

	const fleetChecks = useMemo(() => {
		const hasFleet = Boolean(selectedFleet);
		const hasBranches = fleetBranchCodes.length > 0;
		const pickupOk =
			!hasFleet || !pickupLoc || fleetBranchCodes.includes(pickupLoc.toUpperCase());
		const returnOk =
			!hasFleet || !returnLoc || fleetBranchCodes.includes(returnLoc.toUpperCase());
		const acrissOk =
			!hasFleet ||
			!acriss ||
			selectedFleet!.acrissCodes.length === 0 ||
			selectedFleet!.acrissCodes.includes(acriss.toUpperCase());
		return { hasFleet, hasBranches, pickupOk, returnOk, acrissOk };
	}, [selectedFleet, fleetBranchCodes, pickupLoc, returnLoc, acriss]);

	const toggleBranch = (branchId: string) => {
		setSelectedBranchIds((prev) =>
			prev.includes(branchId)
				? prev.filter((id) => id !== branchId)
				: [...prev, branchId],
		);
	};

	const saveFleet = async () => {
		const code = draftCode.trim().toUpperCase();
		const name = draftName.trim();
		if (!code || !name) {
			toast.error("Fleet code and name are required");
			return;
		}
		const acrissCodes = draftAcriss
			.split(/[,;\s]+/)
			.map((c) => c.trim().toUpperCase())
			.filter(Boolean);
		setIsSaving(true);
		try {
			if (selectedFleet && mode === "select") {
				const updated = await fleetsApi.updateFleet(selectedFleet.id, {
					name,
					description: draftDescription.trim() || undefined,
					acrissCodes,
					branchIds: selectedBranchIds,
				});
				toast.success("Fleet updated");
				onFleetChange(updated.id, updated);
			} else {
				const created = await fleetsApi.createFleet({
					fleetCode: code,
					name,
					description: draftDescription.trim() || undefined,
					acrissCodes,
					branchIds: selectedBranchIds,
				});
				toast.success("Fleet created");
				onFleetChange(created.id, created);
				setMode("select");
			}
			await queryClient.invalidateQueries({ queryKey: ["source-fleets"] });
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? "Could not save fleet";
			toast.error(msg);
		} finally {
			setIsSaving(false);
		}
	};

	const startCreate = () => {
		setMode("create");
		onFleetChange(null, null);
		setDraftCode("");
		setDraftName("");
		setDraftDescription("");
		setDraftAcriss("");
		setSelectedBranchIds([]);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-xs text-indigo-950">
				<Truck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
				<div>
					<p className="font-semibold">Fleet & branches</p>
					<p className="mt-1 leading-relaxed">
						A <strong>fleet</strong> is your vehicle pool (e.g. airport cars, economy
						line). Attach <strong>branches</strong> where that fleet is rented. Gloria
						still sends one <XmlTag>collectionbranch</XmlTag> /{" "}
						<XmlTag>returnbranch</XmlTag> per search — pick them from the fleet below.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant={mode === "select" ? "primary" : "secondary"}
					onClick={() => setMode("select")}
				>
					Use existing fleet
				</Button>
				<Button type="button" size="sm" variant="secondary" onClick={startCreate}>
					+ New fleet
				</Button>
				{selectedFleetId && (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="text-slate-600"
						onClick={() => {
							onFleetChange(null, null);
							setMode("select");
						}}
					>
						Clear fleet
					</Button>
				)}
			</div>

			{mode === "select" && (
				<ManualImportField
					label="Fleet"
					helper="Optional — constrains pick-up/return to branches on this fleet."
				>
					{fleetsQuery.isLoading ? (
						<p className="flex items-center gap-2 text-xs text-slate-500">
							<Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading fleets…
						</p>
					) : (
						<select
							value={selectedFleetId ?? ""}
							onChange={(e) => {
								const id = e.target.value || null;
								const fleet = fleets.find((f) => f.id === id) ?? null;
								onFleetChange(id, fleet);
								if (fleet?.branches.length === 1) {
									const code = fleet.branches[0].branchCode.toUpperCase();
									if (!pickupLoc) onPickupLoc(code);
									if (!returnLoc) onReturnLoc(code);
								}
								if (
									fleet?.acrissCodes.length &&
									onAcriss &&
									!acriss.trim()
								) {
									onAcriss(fleet.acrissCodes[0]);
								}
							}}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">— No fleet (all branches) —</option>
							{fleets.map((f) => (
								<option key={f.id} value={f.id}>
									{f.fleetCode} — {f.name} ({f.branches.length} branches)
								</option>
							))}
						</select>
					)}
				</ManualImportField>
			)}

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<ManualImportField label="Fleet code" xmlAttr="internal @fleetCode" required>
					<Input
						value={draftCode}
						onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
						placeholder="AIRPORT"
						disabled={mode === "select" && Boolean(selectedFleet)}
					/>
				</ManualImportField>
				<ManualImportField label="Fleet name" required>
					<Input
						value={draftName}
						onChange={(e) => setDraftName(e.target.value)}
						placeholder="Airport fleet"
					/>
				</ManualImportField>
			</div>
			<ManualImportField label="Description">
				<Input
					value={draftDescription}
					onChange={(e) => setDraftDescription(e.target.value)}
					placeholder="Vehicles offered at airport branches"
				/>
			</ManualImportField>
			<ManualImportField
				label="Typical ACRISS on this fleet"
				xmlAttr="availcars @ACRISS (hint)"
				helper="Comma-separated — used as a checklist for section 2 (e.g. CDAR, ECMR)."
			>
				<Input
					value={draftAcriss}
					onChange={(e) => setDraftAcriss(e.target.value.toUpperCase())}
					placeholder="CDAR, ECMR, IFAR"
				/>
			</ManualImportField>

			<div>
				<p className="mb-2 text-sm font-medium text-slate-800">
					Branches on this fleet
					<span className="font-normal text-slate-500">
						{" "}
						— select all locations where these vehicles are offered
					</span>
				</p>
				{branchesQuery.isLoading ? (
					<p className="text-xs text-slate-500">Loading branches…</p>
				) : allBranches.length === 0 ? (
					<p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
						No branches yet. Add branches under <strong>Location & branches</strong>{" "}
						first, then attach them here.
					</p>
				) : (
					<div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
						<div className="grid gap-1 sm:grid-cols-2">
							{allBranches.map((b) => (
								<label
									key={b.id}
									className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-50"
								>
									<input
										type="checkbox"
										checked={selectedBranchIds.includes(b.id)}
										onChange={() => toggleBranch(b.id)}
										className="rounded border-slate-300"
									/>
									<span>
										<strong>{b.branchCode}</strong>
										<span className="text-slate-500"> — {b.name}</span>
									</span>
								</label>
							))}
						</div>
					</div>
				)}
				<div className="mt-2 flex justify-end">
					<Button
						type="button"
						size="sm"
						variant="secondary"
						loading={isSaving}
						onClick={saveFleet}
					>
						{mode === "create" ? "Create fleet" : "Save fleet & branches"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
				<ManualImportField
					label="Pick-up branch"
					xmlAttr="collectionbranch @LocationCode"
					required
					helper={
						selectedFleet
							? `Must be on fleet ${selectedFleet.fleetCode}`
							: "Branch code from your directory"
					}
				>
					{branchOptions.length > 0 ? (
						<select
							value={pickupLoc}
							onChange={(e) => onPickupLoc(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Select branch…</option>
							{branchOptions.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					) : (
						<Input
							value={pickupLoc}
							onChange={(e) => onPickupLoc(e.target.value.toUpperCase())}
							placeholder="TIAA01"
						/>
					)}
				</ManualImportField>
				<ManualImportField
					label="Return branch"
					xmlAttr="returnbranch @LocationCode"
					required
				>
					{branchOptions.length > 0 ? (
						<select
							value={returnLoc}
							onChange={(e) => onReturnLoc(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Select branch…</option>
							{branchOptions.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					) : (
						<Input
							value={returnLoc}
							onChange={(e) => onReturnLoc(e.target.value.toUpperCase())}
							placeholder="TIAA01"
						/>
					)}
				</ManualImportField>
			</div>

			<ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
				<li className="font-semibold text-slate-700">Fleet checklist</li>
				<CheckItem ok={fleetChecks.hasFleet} label="Fleet selected (optional)" />
				<CheckItem
					ok={!fleetChecks.hasFleet || fleetChecks.hasBranches}
					label="At least one branch attached to fleet"
				/>
				<CheckItem ok={fleetChecks.pickupOk} label="Pick-up branch on selected fleet" />
				<CheckItem ok={fleetChecks.returnOk} label="Return branch on selected fleet" />
				<CheckItem
					ok={fleetChecks.acrissOk}
					label="ACRISS matches fleet typical codes (if set)"
				/>
			</ul>
		</div>
	);
};

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
	return (
		<li className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-slate-500"}`}>
			{ok ? (
				<CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
			) : (
				<Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
			)}
			{label}
		</li>
	);
}
