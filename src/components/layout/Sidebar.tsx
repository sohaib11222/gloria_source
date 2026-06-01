import React, { useState } from "react";
import {
	LayoutDashboard,
	FileText,
	Store,
	DollarSign,
	CalendarRange,
	Ban,
	Receipt,
	HeartPulse,
	CheckCircle,
	Settings,
	BookOpen,
	Menu,
	X,
	LogOut,
	MessageCircle,
	Sparkles,
} from "lucide-react";
import { User } from "../../types/api";
import { CAR_RENTAL_PORTAL, PORTAL_LOGO_SRC } from "../../lib/portalBranding";

interface SidebarProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
	user: User;
	onLogout: () => void;
	/** Keeps the drawer visible on small screens while a spotlight tour runs */
	keepOpenForTour?: boolean;
	onRequestPanelTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
	activeTab,
	onTabChange,
	user,
	onLogout,
	keepOpenForTour,
	onRequestPanelTour,
}) => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const showDrawer = mobileOpen || !!keepOpenForTour;

	const navItems = [
		{ key: "dashboard", label: "Overview", icon: LayoutDashboard },
		{ key: "agreements", label: "Agreements", icon: FileText },
		{ key: "location-branches", label: "Location & Branches", icon: Store },
		{ key: "pricing", label: "Vehicle & Pricing", icon: DollarSign },
		{ key: "transactions", label: "Transactions", icon: Receipt },
		{ key: "reservations", label: "Reservations", icon: CalendarRange },
		{ key: "cancellations", label: "Cancellations", icon: Ban },
		{ key: "health", label: "Health", icon: HeartPulse },
		{ key: "verification", label: "Verification", icon: CheckCircle },
		{ key: "support", label: "Support", icon: MessageCircle },
		{ key: "settings", label: "Settings", icon: Settings },
		{ key: "docs", label: "Docs", icon: BookOpen },
	];

	const handleTabChange = (key: string) => {
		onTabChange(key);
		setMobileOpen(false);
	};

	const userInitial = (user?.email || "S")[0].toUpperCase();
	const companyName = user?.company?.companyName || "Source";
	const userEmail = user?.email || "";

	return (
		<>
			{/* Mobile menu button */}
			<div className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur lg:hidden">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-2">
						<img
							src={PORTAL_LOGO_SRC}
							alt={CAR_RENTAL_PORTAL.logoAlt}
							className="h-8 w-8 shrink-0 object-contain"
						/>
						<h1 className="text-lg font-bold tracking-tight text-slate-950">
							Gloria Connect
						</h1>
					</div>
					<div className="flex items-center gap-1">
						{onRequestPanelTour && (
							<button
								type="button"
								onClick={() => {
									onRequestPanelTour();
									setMobileOpen(true);
								}}
								className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
								aria-label="Start panel tour"
								title="Panel tour"
							>
								<Sparkles className="h-5 w-5 text-blue-600" />
							</button>
						)}
						<button
							onClick={() => setMobileOpen(!mobileOpen)}
							className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
							aria-label="Toggle menu"
						>
							{showDrawer ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile overlay */}
			{showDrawer && !keepOpenForTour && (
				<div
					className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 border-r border-white/10 bg-slate-950
          shadow-2xl shadow-slate-950/20
          transform transition-transform duration-200
          ${showDrawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col h-screen lg:h-auto
        `}
			>
				{/* Header */}
				<div className="border-b border-white/10 p-4">
					<div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-lg shadow-black/10 backdrop-blur">
						<div className="flex items-center gap-3">
							<img
								src={PORTAL_LOGO_SRC}
								alt={CAR_RENTAL_PORTAL.logoAlt}
								className="h-12 w-12 rounded-2xl object-contain bg-white/10 p-1 ring-1 ring-white/15"
							/>
							<div className="min-w-0">
								<h1 className="truncate text-base font-bold text-white">
									Gloria Connect
								</h1>
								<p className="truncate text-xs text-slate-400">
									{CAR_RENTAL_PORTAL.shortName}
								</p>
							</div>
						</div>
						<div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100">
							{CAR_RENTAL_PORTAL.workspaceLabel}
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
					<p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
						Menu
					</p>
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeTab === item.key;

						if (item.key === "docs") {
							// Get base path for production
							const basePath = import.meta.env.PROD ? "/source" : "";
							const docsPath = `${basePath}/docs-fullscreen`;
							return (
								<a
									key={item.key}
									data-tour="nav-docs"
									href={docsPath}
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => setMobileOpen(false)}
									className="group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
								>
									<div className="flex items-center">
										<span className="mr-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 group-hover:bg-white/10 group-hover:text-white">
											<Icon className="h-4 w-4" />
										</span>
										<span>{item.label}</span>
									</div>
									<svg
										className="h-3 w-3 text-slate-500 transition-colors group-hover:text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</a>
							);
						}

						return (
							<button
								key={item.key}
								type="button"
								data-tour={`nav-${item.key}`}
								onClick={() => handleTabChange(item.key)}
								className={`
                  group relative flex w-full items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors
                  ${
										isActive
											? "bg-white text-slate-950 shadow-lg shadow-black/10"
											: "text-slate-300 hover:bg-white/10 hover:text-white"
									}
                `}
							>
								{isActive && (
									<span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />
								)}
								<span
									className={`mr-3 flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
										isActive
											? "bg-slate-950 text-white"
											: "bg-white/[0.06] text-slate-400 group-hover:bg-white/10 group-hover:text-white"
									}`}
								>
									<Icon className="h-4 w-4" />
								</span>
								<span className="truncate">{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* User section */}
				<div className="border-t border-white/10 bg-white/[0.03] p-4">
					<div className="mb-3 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.06] px-3 py-3 shadow-lg shadow-black/10">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white shadow-md shadow-cyan-950/30">
							{userInitial}
						</div>
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-bold text-white">
								{companyName}
							</div>
							<div className="truncate text-xs text-slate-400">{userEmail}</div>
						</div>
					</div>
					<button
						onClick={() => {
							onLogout();
							setMobileOpen(false);
						}}
						className="flex w-full items-center justify-center rounded-2xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
					>
						<LogOut className="mr-2 h-4 w-4" />
						<span>Logout</span>
					</button>
				</div>
			</aside>
		</>
	);
};
