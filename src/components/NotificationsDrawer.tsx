import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Bell,
	BellRing,
	Building2,
	Check,
	CheckCheck,
	ChevronRight,
	ClipboardList,
	Clock3,
	Inbox,
	Loader2,
	Settings,
	X,
	type LucideIcon,
} from "lucide-react";
import api from "../lib/api";

const cn = (...classes: (string | undefined | null | false)[]): string =>
	classes.filter(Boolean).join(" ");

interface Notification {
	id: string;
	type: "agreement" | "health" | "company" | "system";
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	actionUrl?: string;
}

interface NotificationsDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	endpoint: string;
	markReadEndpoint: (id: string) => string;
}

const notificationStyles: Record<
	Notification["type"],
	{ Icon: LucideIcon; iconClass: string; label: string }
> = {
	agreement: {
		Icon: ClipboardList,
		iconClass: "bg-blue-50 text-blue-700 ring-blue-100",
		label: "Agreement",
	},
	health: {
		Icon: AlertTriangle,
		iconClass: "bg-amber-50 text-amber-700 ring-amber-100",
		label: "Health",
	},
	company: {
		Icon: Building2,
		iconClass: "bg-violet-50 text-violet-700 ring-violet-100",
		label: "Company",
	},
	system: {
		Icon: Settings,
		iconClass: "bg-slate-100 text-slate-700 ring-slate-200",
		label: "System",
	},
};

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
	isOpen,
	onClose,
	endpoint,
	markReadEndpoint,
}) => {
	const queryClient = useQueryClient();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isMarkingAll, setIsMarkingAll] = useState(false);

	useEffect(() => {
		if (isOpen) {
			loadNotifications();
		}
	}, [isOpen]);

	const loadNotifications = async () => {
		setIsLoading(true);
		try {
			const response = await api.get(endpoint, {
				params: { limit: 50 },
			});

			const items =
				response.data?.items ||
				response.data?.data?.items ||
				response.data ||
				[];

			const formattedNotifications = items.map((notif: any) => ({
				id: notif.id || `notif-${Date.now()}-${Math.random()}`,
				type: notif.type || "system",
				title: notif.title || "Notification",
				message: notif.message || "",
				timestamp:
					notif.timestamp || notif.createdAt || new Date().toISOString(),
				read: notif.read !== undefined ? notif.read : !!notif.readAt,
				actionUrl: notif.actionUrl || notif.action_url,
			}));

			setNotifications(formattedNotifications);
		} catch (error: any) {
			console.error("Error loading notifications:", error);
			setNotifications([]);
		} finally {
			setIsLoading(false);
		}
	};

	const markAsRead = async (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);

		try {
			await api.post(markReadEndpoint(id));
			queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
		} catch (error) {
			console.error("Error marking notification as read:", error);
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
			);
		}
	};

	const markAllAsRead = async () => {
		const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
		if (unreadIds.length === 0) return;

		setIsMarkingAll(true);
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

		try {
			await Promise.all(
				unreadIds.map((id) => api.post(markReadEndpoint(id)).catch(() => {})),
			);
			queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		} finally {
			setIsMarkingAll(false);
		}
	};

	const unreadCount = notifications.filter((n) => !n.read).length;
	const latestTimestamp = useMemo(
		() => notifications[0]?.timestamp,
		[notifications],
	);

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return "Recently";

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
		});
	};

	const openNotification = (notification: Notification) => {
		if (!notification.read) {
			markAsRead(notification.id);
		}

		if (notification.actionUrl) {
			const path = notification.actionUrl.startsWith("/")
				? notification.actionUrl
				: `/${notification.actionUrl}`;
			window.location.hash = path;
			onClose();
		}
	};

	if (!isOpen) return null;

	const drawerContent = (
		<>
			<div
				className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			/>

			<aside
				className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-slate-50 shadow-2xl ring-1 ring-slate-900/10 sm:rounded-l-3xl"
				aria-label="Notifications"
			>
				<div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 pb-6 pt-5 text-white">
					<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
					<div className="absolute -bottom-16 left-12 h-36 w-36 rounded-full bg-fuchsia-500/10 blur-3xl" />

					<div className="relative flex items-start justify-between gap-4">
						<div className="flex min-w-0 items-start gap-3">
							<div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
								<BellRing className="h-6 w-6 text-cyan-100" />
								{unreadCount > 0 && (
									<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-slate-950">
										{unreadCount > 99 ? "99+" : unreadCount}
									</span>
								)}
							</div>
							<div className="min-w-0">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
									Inbox
								</p>
								<h2 className="mt-1 text-2xl font-bold tracking-tight">
									Notifications
								</h2>
								<p className="mt-1 text-sm text-slate-300">
									{unreadCount > 0
										? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
										: "You are all caught up"}
									{latestTimestamp
										? ` • Latest ${formatDate(latestTimestamp)}`
										: ""}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="rounded-xl p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
							aria-label="Close notifications"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="relative mt-5 flex items-center gap-3">
						<button
							type="button"
							onClick={markAllAsRead}
							disabled={unreadCount === 0 || isMarkingAll}
							className="inline-flex items-center rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isMarkingAll ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<CheckCheck className="mr-2 h-4 w-4 text-emerald-600" />
							)}
							Mark all as read
						</button>
						<button
							type="button"
							onClick={loadNotifications}
							disabled={isLoading}
							className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-70"
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Bell className="mr-2 h-4 w-4" />
							)}
							Refresh
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-4">
					{isLoading && notifications.length === 0 ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
							<Loader2 className="mb-4 h-9 w-9 animate-spin text-slate-500" />
							<p className="font-semibold text-slate-900">
								Loading notifications
							</p>
							<p className="mt-1 text-sm text-slate-500">
								Fetching your latest source updates…
							</p>
						</div>
					) : notifications.length === 0 ? (
						<div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
							<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
								<Inbox className="h-8 w-8" />
							</div>
							<p className="text-lg font-bold text-slate-900">
								No notifications
							</p>
							<p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
								New agreement, health, company, and system updates will appear
								here.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{notifications.map((notification) => {
								const style =
									notificationStyles[notification.type] ||
									notificationStyles.system;
								const Icon = style.Icon;

								return (
									<button
										key={notification.id}
										type="button"
										onClick={() => openNotification(notification)}
										className={cn(
											"group w-full rounded-2xl border p-4 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400",
											notification.read
												? "border-slate-200 bg-white"
												: "border-cyan-200 bg-gradient-to-br from-white to-cyan-50/80 ring-1 ring-cyan-100",
										)}
									>
										<div className="flex gap-3">
											<div
												className={cn(
													"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1",
													style.iconClass,
												)}
											>
												<Icon className="h-5 w-5" />
											</div>

											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
																{style.label}
															</span>
															{!notification.read && (
																<span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-800">
																	New
																</span>
															)}
														</div>
														<p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-slate-950">
															{notification.title}
														</p>
													</div>

													<div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
														{!notification.read && (
															<span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
														)}
														<ChevronRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
													</div>
												</div>

												{notification.message && (
													<p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
														{notification.message}
													</p>
												)}

												<div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
													<Clock3 className="h-3.5 w-3.5" />
													{formatDate(notification.timestamp)}
													{notification.read && (
														<span className="ml-auto inline-flex items-center gap-1 text-emerald-700">
															<Check className="h-3.5 w-3.5" /> Read
														</span>
													)}
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</aside>
		</>
	);

	return createPortal(drawerContent, document.body);
};
