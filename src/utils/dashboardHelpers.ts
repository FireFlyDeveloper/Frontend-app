// Dashboard updates for public borrower approved status
import { CheckoutTransaction } from '@/types/inventory'
import { isPublicBorrowerRequest } from './requestFilters'

export function updateDashboardMetrics(
  requests: CheckoutTransaction[],
  existingMetrics: any
) {
  const publicBorrowerRequests = requests.filter(isPublicBorrowerRequest)
  const regularRequests = requests.filter(r => !isPublicBorrowerRequest(r))
  
  // Count requests by status with public borrower mapping
  const statusCounts = {
    pending_approval: 0,
    open: 0,
    approved: 0,
    partially_returned: 0,
    closed: 0,
    cancelled: 0,
    rejected: 0
  }
  
  requests.forEach(request => {
    const isPublic = isPublicBorrowerRequest(request)
    let displayStatus = request.status
    
    // Map public borrower 'open' to 'approved' for counting
    if (isPublic && request.status === 'open') {
      displayStatus = 'approved'
    }
    
    if (displayStatus in statusCounts) {
      statusCounts[displayStatus as keyof typeof statusCounts]++
    }
  })
  
  return {
    ...existingMetrics,
    totalRequests: requests.length,
    publicBorrowerRequests: publicBorrowerRequests.length,
    regularRequests: regularRequests.length,
    statusCounts,
    approvalRate: publicBorrowerRequests.length > 0 
      ? 100 // Public borrowers have 100% approval rate (auto-approved)
      : (statusCounts.approved + statusCounts.closed) / requests.length * 100 || 0
  }
}

// Widget data for public borrower analytics
export function getPublicBorrowerWidgets(requests: CheckoutTransaction[]) {
  const publicRequests = requests.filter(isPublicBorrowerRequest)
  
  return {
    totalPublicRequests: publicRequests.length,
    autoApprovedCount: publicRequests.filter(r => r.status === 'open').length,
    itemsBorrowed: publicRequests.reduce((sum, r) => sum + (r as any).items?.length || 0, 0),
    averageProcessingTime: '0h' // Public requests are instant
  }
}