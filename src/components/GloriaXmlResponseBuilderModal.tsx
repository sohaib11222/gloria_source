import React, { useEffect, useMemo, useState } from "react";
import { Copy, FileCode2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
	buildGloriaAvailabilityRsXml,
	buildOtaVehAvailRateRsXml,
	defaultGloriaXmlResponseForm,
	type GloriaXmlResponseForm,
	type XmlLineItem,
} from "../lib/gloriaXmlResponseTemplates";

type ResponseFormat = "gloria" | "ota";

interface GloriaXmlResponseBuilderModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function LineItemsEditor({
	label,
	rows,
	onChange,
	showExcess,
	showPrice,
}: {
	label: string;
	rows: XmlLineItem[];
	onChange: (rows: XmlLineItem[]) => void;
	showExcess?: boolean;
	showPrice?: boolean;
}) {
	const updateRow = (index: number, patch: Partial<XmlLineItem>) => {
		const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
		onChange(next);
	};

	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
				<button
					type="button"
					className="text-xs font-semibold text-blue-700 hover:underline"
					onClick={() =>
						onChange([
							...rows,
							{ code: "", description: "", excess: "", deposit: "", price: "" },
						])
					}
				>
					+ Add line
				</button>
			</div>
			<div className="space-y-2">
				{rows.map((row, index) => (
					<div
						key={index}
						className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6"
					>
						<Input
							value={row.code}
							onChange={(e) => updateRow(index, { code: e.target.value })}
							placeholder="Code"
							className="text-xs"
						/>
						<Input
							value={row.description}
							onChange={(e) => updateRow(index, { description: e.target.value })}
							placeholder="Description"
							className="col-span-2 text-xs sm:col-span-2 lg:col-span-2"
						/>
						{showExcess && (
							<Input
								value={row.excess ?? ""}
								onChange={(e) => updateRow(index, { excess: e.target.value })}
								placeholder="Excess"
								className="text-xs"
							/>
						)}
						{showExcess && (
							<Input
								value={row.deposit ?? ""}
								onChange={(e) => updateRow(index, { deposit: e.target.value })}
								placeholder="Deposit"
								className="text-xs"
							/>
						)}
						{showPrice && (
							<Input
								value={row.price ?? ""}
								onChange={(e) => updateRow(index, { price: e.target.value })}
								placeholder="Price"
								className="text-xs"
							/>
						)}
						{rows.length > 1 && (
							<button
								type="button"
								className="text-xs text-slate-500 hover:text-red-600"
								onClick={() => onChange(rows.filter((_, i) => i !== index))}
							>
								Remove
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export const GloriaXmlResponseBuilderModal: React.FC<
	GloriaXmlResponseBuilderModalProps
> = ({ isOpen, onClose }) => {
	const [format, setFormat] = useState<ResponseFormat>("gloria");
	const [form, setForm] = useState<GloriaXmlResponseForm>(defaultGloriaXmlResponseForm);

	useEffect(() => {
		if (isOpen) {
			setForm(defaultGloriaXmlResponseForm());
			setFormat("gloria");
		}
	}, [isOpen]);

	const xmlPreview = useMemo(
		() =>
			format === "gloria"
				? buildGloriaAvailabilityRsXml(form)
				: buildOtaVehAvailRateRsXml(form),
		[form, format],
	);

	const patch = (partial: Partial<GloriaXmlResponseForm>) =>
		setForm((prev) => ({ ...prev, ...partial }));

	const copyXml = async () => {
		try {
			await navigator.clipboard.writeText(xmlPreview);
			toast.success("XML copied to clipboard");
		} catch {
			toast.error("Could not copy — select the preview and copy manually");
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Expected Gloria XML response"
			size="xl"
		>
			<div className="max-h-[85vh] space-y-5 overflow-y-auto pr-1">
				<p className="text-sm leading-relaxed text-slate-600">
					Build a sample response your pricing endpoint should return. Gloria accepts{" "}
					<strong>GLORIA_availabilityrs</strong> or <strong>OTA_VehAvailRateRS</strong>.
					The preview updates as you edit fields.
				</p>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setFormat("gloria")}
						className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
							format === "gloria"
								? "border-blue-300 bg-blue-50 text-blue-800"
								: "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
						}`}
					>
						GLORIA_availabilityrs
					</button>
					<button
						type="button"
						onClick={() => setFormat("ota")}
						className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
							format === "ota"
								? "border-emerald-300 bg-emerald-50 text-emerald-800"
								: "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
						}`}
					>
						OTA_VehAvailRateRS
					</button>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1 block text-xs font-medium text-slate-700">
									TimeStamp
								</label>
								<Input
									value={form.timestamp}
									onChange={(e) => patch({ timestamp: e.target.value })}
									placeholder="2026-05-15T10:30:46"
								/>
							</div>
							<div>
								<label className="mb-1 block text-xs font-medium text-slate-700">
									Target / Version
								</label>
								<div className="flex gap-2">
									<Input
										value={form.target}
										onChange={(e) => patch({ target: e.target.value })}
										placeholder="Production"
									/>
									<Input
										value={form.version}
										onChange={(e) => patch({ version: e.target.value })}
										placeholder="1.00"
									/>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-slate-200 p-3">
							<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
								Vehicle
							</p>
							<div className="grid grid-cols-2 gap-2">
								<Input
									value={form.acriss}
									onChange={(e) =>
										patch({ acriss: e.target.value.toUpperCase() })
									}
									placeholder="ACRISS"
								/>
								<Input
									value={form.transmission}
									onChange={(e) => patch({ transmission: e.target.value })}
									placeholder="Transmission"
								/>
								<Input
									value={form.make}
									onChange={(e) => patch({ make: e.target.value })}
									placeholder="Make"
								/>
								<Input
									value={form.model}
									onChange={(e) => patch({ model: e.target.value })}
									placeholder="Model"
								/>
								<Input
									value={form.doors}
									onChange={(e) => patch({ doors: e.target.value })}
									placeholder="Doors"
								/>
								<Input
									value={form.seats}
									onChange={(e) => patch({ seats: e.target.value })}
									placeholder="Seats"
								/>
								<Input
									value={form.imageUrl}
									onChange={(e) => patch({ imageUrl: e.target.value })}
									placeholder="Image URL"
									className="col-span-2"
								/>
								{format === "ota" && (
									<Input
										value={form.status}
										onChange={(e) => patch({ status: e.target.value })}
										placeholder="Status (Available)"
										className="col-span-2"
									/>
								)}
							</div>
						</div>

						<div className="rounded-xl border border-slate-200 p-3">
							<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
								Pricing
							</p>
							<div className="grid grid-cols-2 gap-2">
								<Input
									value={form.carOrderId}
									onChange={(e) => patch({ carOrderId: e.target.value })}
									placeholder="CarOrderID / VehID"
								/>
								<Input
									value={form.currency}
									onChange={(e) =>
										patch({ currency: e.target.value.toUpperCase() })
									}
									placeholder="EUR"
								/>
								<Input
									value={form.dailyGross}
									onChange={(e) => patch({ dailyGross: e.target.value })}
									placeholder="Daily gross"
								/>
								<Input
									value={form.totalGross}
									onChange={(e) => patch({ totalGross: e.target.value })}
									placeholder="Total gross"
								/>
							</div>
						</div>

						<LineItemsEditor
							label="Included in price"
							rows={form.included}
							onChange={(included) => patch({ included })}
							showExcess
						/>
						<LineItemsEditor
							label="Not included"
							rows={form.notIncluded}
							onChange={(notIncluded) => patch({ notIncluded })}
							showPrice
						/>
						<LineItemsEditor
							label="Optional extras"
							rows={form.extras}
							onChange={(extras) => patch({ extras })}
							showPrice
						/>
					</div>

					<div className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200 bg-slate-950 shadow-inner lg:sticky lg:top-0 lg:max-h-[70vh]">
						<div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
							<div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
								<FileCode2 className="h-4 w-4 text-cyan-400" />
								{format === "gloria"
									? "GLORIA_availabilityrs preview"
									: "OTA_VehAvailRateRS preview"}
							</div>
							<Button
								type="button"
								size="sm"
								variant="secondary"
								className="h-8 gap-1.5 border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
								onClick={copyXml}
							>
								<Copy className="h-3.5 w-3.5" />
								Copy XML
							</Button>
						</div>
						<pre className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-100">
							{xmlPreview}
						</pre>
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
					<Button type="button" variant="secondary" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</Modal>
	);
};
