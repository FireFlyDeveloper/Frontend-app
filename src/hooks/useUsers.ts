import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  })
}
