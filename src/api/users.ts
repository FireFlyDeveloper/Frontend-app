import api from './client'
import { User } from '@/types/auth'

export const usersApi = {
  getUsers: () => api.get<{ users: User[] }>('/users').then(r => ({ data: r.data.users })),
  getUser: (id: string) => api.get<{ user: User }>(`/users/${id}`).then(r => ({ data: r.data.user })),
  createUser: (data: Partial<User>) => api.post<{ user: User }>('/users', data).then(r => ({ data: r.data.user })),
  updateUser: (id: string, data: Partial<User>) => api.patch<{ user: User }>(`/users/${id}`, data).then(r => ({ data: r.data.user })),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
}
