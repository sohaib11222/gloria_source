import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Loader } from "./ui/Loader";
import { supportApi, SupportTicketStatus } from "../api/support";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
	MessageCircle,
	Send,
	Image as ImageIcon,
	X,
	Plus,
	Clock,
	Headphones,
	Inbox,
	ShieldCheck,
} from "lucide-react";

export const Support: React.FC = () => {
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newTicketTitle, setNewTicketTitle] = useState("");
	const [newTicketMessage, setNewTicketMessage] = useState("");
	const [messageContent, setMessageContent] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
		queryKey: ["support-tickets"],
		queryFn: () => supportApi.getTickets(),
		refetchInterval: 5000, // Poll every 5 seconds
	});

	const { data: selectedTicket, isLoading: ticketLoading } = useQuery({
		queryKey: ["support-ticket", selectedTicketId],
		queryFn: () => supportApi.getTicket(selectedTicketId!),
		enabled: !!selectedTicketId,
		refetchInterval: 5000, // Poll every 5 seconds
	});

	const { data: messagesData, isLoading: messagesLoading } = useQuery({
		queryKey: ["support-messages", selectedTicketId],
		queryFn: () => supportApi.getMessages(selectedTicketId!),
		enabled: !!selectedTicketId,
		refetchInterval: 5000, // Poll every 5 seconds
	});

	useEffect(() => {
		// Scroll to bottom when new messages arrive
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messagesData]);

	const createTicketMutation = useMutation({
		mutationFn: (data: { title: string; initialMessage?: string }) =>
			supportApi.createTicket(data),
		onSuccess: (ticket) => {
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			setSelectedTicketId(ticket.id);
			setShowCreateForm(false);
			setNewTicketTitle("");
			setNewTicketMessage("");
			toast.success("Ticket created successfully");
		},
	});

	const sendMessageMutation = useMutation({
		mutationFn: ({
			ticketId,
			content,
			image,
		}: {
			ticketId: string;
			content?: string;
			image?: File;
		}) => supportApi.sendMessage(ticketId, { content, image }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["support-messages", selectedTicketId],
			});
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			setMessageContent("");
			setSelectedImage(null);
			setImagePreview(null);
			toast.success("Message sent");
		},
	});

	const markReadMutation = useMutation({
		mutationFn: ({
			ticketId,
			messageId,
		}: {
			ticketId: string;
			messageId: string;
		}) => supportApi.markMessageRead(ticketId, messageId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["support-messages", selectedTicketId],
			});
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
		},
	});

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			const allowedTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
			];
			if (!allowedTypes.includes(file.type)) {
				toast.error(
					"Invalid file type. Please select an image (JPG, PNG, GIF, or WEBP)",
				);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				return;
			}

			// Validate file size
			if (file.size > 5 * 1024 * 1024) {
				toast.error("Image size must be less than 5MB");
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				return;
			}

			setSelectedImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.onerror = () => {
				toast.error("Failed to read image file");
				setSelectedImage(null);
				setImagePreview(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleImageButtonClick = () => {
		fileInputRef.current?.click();
	};

	const handleCreateTicket = () => {
		if (!newTicketTitle.trim()) {
			toast.error("Please enter a title");
			return;
		}
		createTicketMutation.mutate({
			title: newTicketTitle.trim(),
			initialMessage: newTicketMessage.trim() || undefined,
		});
	};

	const handleSendMessage = () => {
		if (!selectedTicketId) return;
		if (!messageContent.trim() && !selectedImage) {
			toast.error("Please enter a message or select an image");
			return;
		}

		// Ensure we send content as empty string if no text, but only if we have an image
		// If we have both, send both. If only image, send empty string for content.
		// If only content, send content.
		const contentToSend =
			messageContent.trim() || (selectedImage ? "" : undefined);

		sendMessageMutation.mutate({
			ticketId: selectedTicketId,
			content: contentToSend,
			image: selectedImage || undefined,
		});
	};

	const tickets = ticketsData?.items || [];
	const messages = messagesData?.items || [];

	// Mark unread messages as read when viewing
	useEffect(() => {
		if (selectedTicketId && messages.length > 0) {
			const unreadMessages = messages.filter(
				(msg) => !msg.readAt && msg.senderType === "ADMIN",
			);
			unreadMessages.forEach((msg) => {
				markReadMutation.mutate({
					ticketId: selectedTicketId,
					messageId: msg.id,
				});
			});
		}
	}, [selectedTicketId, messages]);

	const getStatusColor = (status: SupportTicketStatus) => {
		switch (status) {
			case "OPEN":
				return "bg-blue-100 text-blue-800";
			case "IN_PROGRESS":
				return "bg-yellow-100 text-yellow-800";
			case "RESOLVED":
				return "bg-green-100 text-green-800";
			case "CLOSED":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const openTickets = tickets.filter(
		(ticket) => ticket.status === "OPEN",
	).length;
	const inProgressTickets = tickets.filter(
		(ticket) => ticket.status === "IN_PROGRESS",
	).length;
	const resolvedTickets = tickets.filter(
		(ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
	).length;
	const unreadTotal = tickets.reduce(
		(sum, ticket) => sum + (ticket.unreadCount || 0),
		0,
	);

	return (
		<div className="space-y-6 pb-8">
			<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-8 text-white sm:px-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
						<div className="max-w-4xl">
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
								<Headphones className="h-3.5 w-3.5" /> Help desk
							</div>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Support
							</h1>
							<p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
								Open a ticket when you need help with endpoint payloads,
								location mapping, pricing samples, billing, or approval. Keep
								the conversation and screenshots in one place.
							</p>
						</div>
						{!showCreateForm && (
							<Button
								onClick={() => setShowCreateForm(true)}
								className="border-white/20 bg-white/10 text-white hover:bg-white/20 shrink-0 w-full sm:w-auto"
							>
								<Plus className="h-5 w-5 mr-2" />
								New Ticket
							</Button>
						)}
					</div>
				</div>
				<div className="grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Total tickets
						</p>
						<p className="mt-2 text-lg font-bold text-blue-950">
							{tickets.length}
						</p>
						<p className="mt-1 text-xs text-blue-700">
							All support conversations
						</p>
					</div>
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
							Open
						</p>
						<p className="mt-2 text-lg font-bold text-amber-950">
							{openTickets + inProgressTickets}
						</p>
						<p className="mt-1 text-xs text-amber-700">
							Waiting or in progress
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Resolved
						</p>
						<p className="mt-2 text-lg font-bold text-emerald-950">
							{resolvedTickets}
						</p>
						<p className="mt-1 text-xs text-emerald-700">
							Completed conversations
						</p>
					</div>
					<div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
							Unread
						</p>
						<p className="mt-2 text-lg font-bold text-violet-950">
							{unreadTotal}
						</p>
						<p className="mt-1 text-xs text-violet-700">New support replies</p>
					</div>
				</div>
			</div>

			{showCreateForm && (
				<Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
					<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-blue-50">
						<div className="flex items-start gap-3">
							<div className="rounded-xl bg-blue-100 p-2 text-blue-700">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-xl font-bold text-slate-950">
									Create support ticket
								</CardTitle>
								<p className="mt-1 text-sm leading-6 text-slate-600">
									Include the endpoint, tab, booking reference, or screenshot
									that helps the team reproduce the issue.
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 p-5">
						<div>
							<label className="block text-sm font-medium text-gray-800 mb-1">
								Title *
							</label>
							<Input
								placeholder="Brief description of your issue..."
								value={newTicketTitle}
								onChange={(e) => setNewTicketTitle(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 mb-1">
								Message
							</label>
							<textarea
								className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
								rows={4}
								placeholder="Describe your issue in detail..."
								value={newTicketMessage}
								onChange={(e) => setNewTicketMessage(e.target.value)}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleCreateTicket}
								disabled={
									createTicketMutation.isPending || !newTicketTitle.trim()
								}
							>
								Create Ticket
							</Button>
							<Button
								variant="secondary"
								onClick={() => setShowCreateForm(false)}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-300px)] min-h-0">
				{/* Ticket List */}
				<Card className="lg:col-span-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
					<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-100 p-2 text-slate-700">
								<Inbox className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-lg font-bold text-slate-950">
									My Tickets
								</CardTitle>
								<p className="mt-1 text-xs text-slate-500">
									Select a conversation to view replies.
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex-1 overflow-y-auto min-h-0 p-4">
						{ticketsLoading ? (
							<div className="flex justify-center py-8">
								<Loader />
							</div>
						) : tickets.length === 0 ? (
							<div className="text-center py-8 text-gray-600">
								<MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
								<p className="font-medium text-gray-900">No tickets yet</p>
								<p className="text-sm text-gray-500 mt-1">
									Open a ticket to reach the support team.
								</p>
								<Button
									variant="secondary"
									className="mt-4"
									onClick={() => setShowCreateForm(true)}
								>
									Create your first ticket
								</Button>
							</div>
						) : (
							<div className="space-y-2">
								{tickets.map((ticket) => (
									<button
										key={ticket.id}
										onClick={() => {
											setSelectedTicketId(ticket.id);
											setShowCreateForm(false);
										}}
										className={`w-full text-left p-4 rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-sm ${
											selectedTicketId === ticket.id
												? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
												: "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
										}`}
									>
										<div className="flex items-start justify-between mb-1">
											<h3 className="font-medium text-sm text-gray-900 truncate flex-1">
												{ticket.title}
											</h3>
											{ticket.unreadCount && ticket.unreadCount > 0 && (
												<Badge className="bg-blue-500 text-white text-xs ml-2">
													{ticket.unreadCount}
												</Badge>
											)}
										</div>
										<div className="flex items-center justify-between mt-2">
											<Badge
												className={`text-xs ${getStatusColor(ticket.status)}`}
											>
												{ticket.status}
											</Badge>
											{ticket.lastMessage && (
												<span className="text-xs text-gray-500">
													{formatDistanceToNow(
														new Date(ticket.lastMessage.createdAt),
														{ addSuffix: true },
													)}
												</span>
											)}
										</div>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Ticket Detail */}
				<Card className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
					{!selectedTicketId ? (
						<CardContent className="flex-1 flex items-center justify-center min-h-[280px] lg:min-h-0">
							<div className="text-center text-gray-600 px-4">
								<MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
								<p className="font-medium text-gray-900">
									Select a ticket to view messages
								</p>
								<p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
									Choose a conversation from the list or create a new ticket.
								</p>
							</div>
						</CardContent>
					) : ticketLoading || messagesLoading ? (
						<CardContent className="flex-1 flex items-center justify-center min-h-[200px]">
							<Loader />
						</CardContent>
					) : !selectedTicket ? (
						<CardContent className="flex-1 flex items-center justify-center">
							<div className="text-center text-gray-600">
								<p className="font-medium text-gray-900">Ticket not found</p>
							</div>
						</CardContent>
					) : (
						<>
							<CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50">
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0 pr-2">
										<CardTitle className="mb-2 break-words text-xl font-bold text-slate-950">
											{selectedTicket.title}
										</CardTitle>
										<div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
											<div className="flex items-center gap-1">
												<Clock className="h-4 w-4" />
												<span>
													{formatDistanceToNow(
														new Date(selectedTicket.createdAt),
														{ addSuffix: true },
													)}
												</span>
											</div>
											<Badge className={getStatusColor(selectedTicket.status)}>
												{selectedTicket.status}
											</Badge>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col overflow-hidden min-h-0 p-0">
								{/* Messages */}
								<div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0 bg-gray-50/80">
									{messages.length === 0 ? (
										<div className="text-center py-8 text-gray-600">
											<p className="font-medium text-gray-900">
												No messages yet
											</p>
											<p className="text-sm text-gray-500 mt-1">
												Send a message below to start the thread.
											</p>
										</div>
									) : (
										messages.map((message) => (
											<div
												key={message.id}
												className={`flex ${message.senderType === "ADMIN" ? "justify-start" : "justify-end"}`}
											>
												<div
													className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm border ${
														message.senderType === "ADMIN"
															? "bg-white text-slate-900 border-slate-200"
															: "bg-blue-600 text-white border-blue-700"
													}`}
												>
													{message.senderType === "ADMIN" && (
														<div className="text-xs font-semibold mb-1 text-blue-700">
															Support Team
														</div>
													)}
													{message.content && (
														<p className="text-sm whitespace-pre-wrap leading-relaxed">
															{message.content}
														</p>
													)}
													{message.imageUrl && (
														<div className="mt-2">
															<img
																src={message.imageUrl}
																alt="Attachment"
																className="rounded-lg max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 shadow-sm"
																onClick={() => {
																	// Open image in new window for full view
																	const newWindow = window.open("", "_blank");
																	if (newWindow) {
																		newWindow.document.write(`
                                      <html>
                                        <head><title>Image</title></head>
                                        <body style="margin:0;padding:20px;background:#1a1a1a;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                          <img src="${message.imageUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;border-radius:8px;" />
                                        </body>
                                      </html>
                                    `);
																	}
																}}
																onError={(e) => {
																	// Fallback if image fails to load
																	const target = e.target as HTMLImageElement;
																	target.style.display = "none";
																	const errorDiv =
																		document.createElement("div");
																	errorDiv.className =
																		"text-xs text-red-300 bg-red-900/20 p-2 rounded";
																	errorDiv.textContent = "Failed to load image";
																	target.parentElement?.appendChild(errorDiv);
																}}
															/>
														</div>
													)}
													<div
														className={`text-xs mt-2 ${
															message.senderType === "ADMIN"
																? "text-gray-500"
																: "text-blue-100"
														}`}
													>
														{formatDistanceToNow(new Date(message.createdAt), {
															addSuffix: true,
														})}
													</div>
												</div>
											</div>
										))
									)}
									<div ref={messagesEndRef} />
								</div>

								{/* Message Input */}
								<div className="border-t border-gray-200 bg-white p-4 space-y-3 shrink-0">
									{imagePreview && (
										<div className="relative inline-block group">
											<img
												src={imagePreview}
												alt="Preview"
												className="h-32 rounded-lg border-2 border-blue-400 shadow-sm object-cover"
											/>
											<button
												onClick={() => {
													setSelectedImage(null);
													setImagePreview(null);
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
												className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
												title="Remove image"
											>
												<X className="h-4 w-4" />
											</button>
											<div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
												{selectedImage?.name || "Image"}
											</div>
										</div>
									)}
									<div className="flex gap-2">
										<Input
											placeholder="Type your message..."
											value={messageContent}
											onChange={(e) => setMessageContent(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleSendMessage();
												}
											}}
											className="flex-1"
										/>
										<input
											ref={fileInputRef}
											type="file"
											accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
											onChange={handleImageSelect}
											className="hidden"
										/>
										<Button
											type="button"
											variant="secondary"
											className="px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shrink-0"
											onClick={handleImageButtonClick}
											title="Attach image"
										>
											<ImageIcon className="h-5 w-5" />
										</Button>
										<Button
											onClick={handleSendMessage}
											disabled={
												sendMessageMutation.isPending ||
												(!messageContent.trim() && !selectedImage)
											}
											loading={sendMessageMutation.isPending}
											className="px-4"
										>
											<Send className="h-5 w-5" />
										</Button>
									</div>
								</div>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</div>
	);
};
