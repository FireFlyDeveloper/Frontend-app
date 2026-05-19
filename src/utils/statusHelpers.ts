// Status badge helper for public borrowers
import { CheckoutStatus } from '@/types/inventory'

export function getPublicBorrowerStatus(status: CheckoutStatus, isPublicBorrower: boolean): CheckoutStatus {
  // For public borrowers, treat 'open' as 'approved' for display purposes
  if (isPublicBorrower && status === 'open') {
    return 'approved' as CheckoutStatus
  }
  return status
}

export function getStatusBadgeVariant(status: CheckoutStatus, isPublicBorrower: boolean = false) {
  const displayStatus = getPublicBorrowerStatus(status, isPublicBorrower)
  
  switch (displayStatus) {
    case 'pending_approval':
      return 'warning'
    case 'open':
      return 'default'
    case 'approved' as CheckoutStatus:
      return 'success'
    case 'partially_returned':
      return 'warning'
    case 'closed':
      return 'success'
    case 'cancelled':
      return 'destructive'
    case 'rejected':
      return 'destructive'
    default:
      return 'default'
  }
}

export function getStatusDisplayText(status: CheckoutStatus, isPublicBorrower: boolean = false) {
  const displayStatus = getPublicBorrowerStatus(status, isPublicBorrower)
  
  switch (displayStatus) {
    case 'pending_approval':
      return 'Pending Approval'
    case 'open':
      return 'Open'
    case 'approved' as CheckoutStatus:
      return 'Approved'
    case 'partially_returned':
      return 'Partially Returned'
    case 'closed':
      return 'Closed'
    case 'cancelled':
      return 'Cancelled'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}