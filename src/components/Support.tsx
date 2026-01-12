import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { Loader } from './ui/Loader'
import { supportApi, SupportTicket, SupportMessage, SupportTicketStatus } from '../api/support'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { MessageCircle, Send, Image as ImageIcon, X, Plus, Clock } from 'lucide-react'

export const Support: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTicketTitle, setNewTicketTitle] = useState('')
  const [newTicketMessage, setNewTicketMessage] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportApi.getTickets(),
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const { data: selectedTicket, isLoading: ticketLoading } = useQuery({
    queryKey: ['support-ticket', selectedTicketId],
    queryFn: () => supportApi.getTicket(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', selectedTicketId],
    queryFn: () => supportApi.getMessages(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messagesData])

  const createTicketMutation = useMutation({
    mutationFn: (data: { title: string; initialMessage?: string }) => supportApi.createTicket(data),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setSelectedTicketId(ticket.id)
      setShowCreateForm(false)
      setNewTicketTitle('')
      setNewTicketMessage('')
      toast.success('Ticket created successfully')
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, content, image }: { ticketId: string; content?: string; image?: File }) =>
      supportApi.sendMessage(ticketId, { content, image }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setMessageContent('')
      setSelectedImage(null)
      setImagePreview(null)
      toast.success('Message sent')
    },
  })

  const markReadMutation = useMutation({
    mutationFn: ({ ticketId, messageId }: { ticketId: string; messageId: string }) =>
      supportApi.markMessageRead(ticketId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateTicket = () => {
    if (!newTicketTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    createTicketMutation.mutate({
      title: newTicketTitle.trim(),
      initialMessage: newTicketMessage.trim() || undefined,
    })
  }

  const handleSendMessage = () => {
    if (!selectedTicketId) return
    if (!messageContent.trim() && !selectedImage) {
      toast.error('Please enter a message or select an image')
      return
    }

    sendMessageMutation.mutate({
      ticketId: selectedTicketId,
      content: messageContent.trim() || undefined,
      image: selectedImage || undefined,
    })
  }

  const tickets = ticketsData?.items || []
  const messages = messagesData?.items || []

  // Mark unread messages as read when viewing
  useEffect(() => {
    if (selectedTicketId && messages.length > 0) {
      const unreadMessages = messages.filter((msg) => !msg.readAt && msg.senderType === 'ADMIN')
      unreadMessages.forEach((msg) => {
        markReadMutation.mutate({ ticketId: selectedTicketId, messageId: msg.id })
      })
    }
  }, [selectedTicketId, messages])

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support</h1>
          <p className="text-slate-300 mt-1">Get help from our support team</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Title *</label>
              <Input
                placeholder="Brief description of your issue..."
                value={newTicketTitle}
                onChange={(e) => setNewTicketTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Message</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe your issue in detail..."
                value={newTicketMessage}
                onChange={(e) => setNewTicketMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending || !newTicketTitle.trim()}
              >
                Create Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Ticket List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-slate-600" />
                <p>No tickets yet</p>
                <Button
                  variant="outline"
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
                      setSelectedTicketId(ticket.id)
                      setShowCreateForm(false)
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTicketId === ticket.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm text-white truncate flex-1">{ticket.title}</h3>
                      {ticket.unreadCount && ticket.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs ml-2">{ticket.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                      {ticket.lastMessage && (
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(ticket.lastMessage.createdAt), { addSuffix: true })}
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
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedTicketId ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p>Select a ticket to view messages</p>
              </div>
            </CardContent>
          ) : ticketLoading || messagesLoading ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <Loader />
            </CardContent>
          ) : !selectedTicket ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <p>Ticket not found</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{selectedTicket.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}</span>
                      </div>
                      <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'ADMIN' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderType === 'ADMIN'
                              ? 'bg-slate-700 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {message.senderType === 'ADMIN' && (
                            <div className="text-xs font-medium mb-1 opacity-75">Support Team</div>
                          )}
                          {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Attachment"
                              className="mt-2 rounded max-w-full h-auto max-h-64 object-contain"
                            />
                          )}
                          <div
                            className={`text-xs mt-2 ${
                              message.senderType === 'ADMIN' ? 'text-slate-300' : 'text-blue-100'
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-slate-700 p-4 space-y-3">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-32 rounded border border-slate-600" />
                      <button
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" className="px-3">
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </label>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || (!messageContent.trim() && !selectedImage)}
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
  )
}
