import React from "react";

export function RequiredMark() {
	return <span className="text-red-600 font-semibold" aria-hidden="true"> *</span>;
}

export function XmlTag({ children }: { children: React.ReactNode }) {
	return (
		<code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-mono text-slate-800">
			{children}
		</code>
	);
}

export function ManualImportSection({
	step,
	title,
	xmlPath,
	description,
	variant = "required",
	children,
}: {
	step?: number;
	title: string;
	xmlPath?: string;
	description?: string;
	variant?: "required" | "optional";
	children: React.ReactNode;
}) {
	const isRequired = variant === "required";
	return (
		<section
			className={`rounded-xl border p-4 sm:p-5 ${
				isRequired
					? "border-blue-200 bg-gradient-to-br from-blue-50/80 to-white"
					: "border-slate-200 bg-slate-50/50"
			}`}
		>
			<header className="mb-4 border-b border-slate-200/80 pb-3">
				<div className="flex flex-wrap items-center gap-2">
					{step != null && (
						<span
							className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold ${
								isRequired
									? "bg-blue-600 text-white"
									: "bg-slate-300 text-slate-800"
							}`}
						>
							{step}
						</span>
					)}
					<span
						className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
							isRequired
								? "bg-blue-100 text-blue-800"
								: "bg-slate-200 text-slate-600"
						}`}
					>
						{isRequired ? "Required" : "Optional"}
					</span>
					<h3 className="text-sm font-bold text-slate-900">{title}</h3>
				</div>
				{xmlPath && (
					<p className="mt-1.5 text-xs text-slate-600">
						GLORIA XML path: <XmlTag>{xmlPath}</XmlTag>
					</p>
				)}
				{description && (
					<p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
				)}
			</header>
			{children}
		</section>
	);
}

export function ManualImportField({
	label,
	xmlAttr,
	required,
	helper,
	className,
	children,
}: {
	label: string;
	xmlAttr?: string;
	required?: boolean;
	helper?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={className}>
			<label className="mb-1 block text-sm font-medium text-slate-800">
				{label}
				{required && <RequiredMark />}
				{xmlAttr && (
					<span className="mt-0.5 block text-[11px] font-normal text-slate-500">
						<XmlTag>{xmlAttr}</XmlTag>
					</span>
				)}
			</label>
			{children}
			{helper && (
				<p className="mt-1 text-[11px] leading-snug text-slate-500">{helper}</p>
			)}
		</div>
	);
}

export function LineItemColumnHeaders({ columns }: { columns: string[] }) {
	return (
		<div
			className="hidden sm:grid gap-2 px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500"
			style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
		>
			{columns.map((col) => (
				<span key={col}>{col}</span>
			))}
			<span className="text-right">Actions</span>
		</div>
	);
}
