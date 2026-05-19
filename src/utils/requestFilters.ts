// Updated status filters for public borrower workflow
export const ALL_STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'open', label: 'Open' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_returned', label: 'Partially Returned' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
] as const

export const PUBLIC_BORROWER_DEFAULT_STATUS = 'approved'

// Check if a request is from a public borrower
export function isPublicBorrowerRequest(request: any): boolean {
  return request?.checked_out_by?.startsWith('public_') || 
         request?.user_type === 'public' ||
         request?.srcode || request?.email // Public borrower identifiers
}

// Filter requests by status with public borrower handling
export function filterRequestsByStatus(
  requests: any[],
  statusFilter: string,
  includePublicBorrowerMapping: boolean = true
): any[] {
  return requests.filter(request => {
    const isPublic = isPublicBorrowerRequest(request)
    let displayStatus = request.status
    
    // Map public borrower 'open' to 'approved' for filtering
    if (includePublicBorrowerMapping && isPublic && request.status === 'open') {
      displayStatus = 'approved'
    }
    
    if (statusFilter === 'all') return true
    return displayStatus === statusFilter
  })
}