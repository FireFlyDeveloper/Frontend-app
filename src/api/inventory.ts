import api from './client'
import {
  Item,
  ItemLot,
  CheckoutResult,
  CheckoutDetailResult,
  ReturnResult,
  ScanResult,
  CreateItemInput,
  UpdateItemInput,
  CreateLotInput,
  CheckoutInput,
  ReturnInput,
  CheckoutTransaction,
} from '@/types/inventory'

export const inventoryApi = {
  // Items
  getItems: (params?: { type?: string; category?: string; status?: string; search?: string }) =>
    api.get<{ items: Item[] }>('/items', { params }),

  getItem: (id: string) => api.get<{ item: Item }>(`/items/${id}`),

  createItem: (data: CreateItemInput) => api.post<{ item: Item }>('/items', data),

  updateItem: (id: string, data: UpdateItemInput) =>
    api.patch<{ item: Item }>(`/items/${id}`, data),

  deleteItem: (id: string) => api.delete(`/items/${id}`),

  // Lots
  getLots: (itemId: string) => api.get<{ lots: ItemLot[] }>(`/items/${itemId}/lots`),

  createLot: (itemId: string, data: CreateLotInput) =>
    api.post<{ lot: ItemLot }>(`/items/${itemId}/lots`, data),

  // Checkout
  getCheckouts: (params?: { status?: string; user_id?: string }) =>
    api.get<{ transactions: CheckoutTransaction[] }>('/checkout', { params }),

  getCheckout: (id: string) => api.get<CheckoutDetailResult>(`/checkout/${id}`),

  createCheckout: (data: CheckoutInput) => api.post<CheckoutResult>('/checkout', data),

  returnCheckout: (id: string, data: ReturnInput) =>
    api.post<ReturnResult>(`/checkout/${id}/return`, data),

  cancelCheckout: (id: string) =>
    api.post<{ transaction: CheckoutTransaction }>(`/checkout/${id}/cancel`),

  // Scan
  scanCode: (code: string) => api.post<ScanResult>('/checkout/scan', { code }),
}
