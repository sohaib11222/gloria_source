import api from '../lib/api'

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type MessageSenderType = 'ADMIN' | 'AGENT' | 'SOURCE'

export interface SupportTicket {
  id: string
  title: string
  status: SupportTicketStatus
  createdById: string
  createdBy: {
    id: string
    companyName: string
    type: 'AGENT' | 'SOURCE'
    email: string
  }
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  unreadCount?: number
  lastMessage?: SupportMessage | null
  messageCount?: number
}

export interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderType: MessageSenderType
  content?: string | null
  imageUrl?: string | null
  readAt?: string | null
  createdAt: string
}

export interface CreateTicketRequest {
  title: string
  initialMessage?: string
}

export interface SendMessageRequest {
  content?: string
  image?: File
}

export interface TicketsResponse {
  items: SupportTicket[]
  total: number
}

export interface MessagesResponse {
  items: SupportMessage[]
  total: number
}

export const supportApi = {
  getTickets: async (params?: { status?: SupportTicketStatus }): Promise<TicketsResponse> => {
    const response = await api.get('/api/support/tickets', { params })
    return response.data
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const response = await api.get(`/api/support/tickets/${id}`)
    return response.data
  },

  createTicket: async (data: CreateTicketRequest): Promise<SupportTicket> => {
    const response = await api.post('/api/support/tickets', data)
    return response.data
  },

  getMessages: async (ticketId: string): Promise<MessagesResponse> => {
    const response = await api.get(`/api/support/tickets/${ticketId}/messages`)
    return response.data
  },

  sendMessage: async (ticketId: string, data: SendMessageRequest): Promise<SupportMessage> => {
    const formData = new FormData()
    
    if (data.content) {
      formData.append('content', data.content)
    }
    
    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await api.post(`/api/support/tickets/${ticketId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  markMessageRead: async (ticketId: string, messageId: string): Promise<void> => {
    await api.post(`/api/support/tickets/${ticketId}/messages/${messageId}/read`)
  },
}
