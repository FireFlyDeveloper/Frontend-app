// Notification updates for public borrower approved status
export function getPublicBorrowerNotificationMessage(
  request: any,
  notificationType: 'created' | 'updated' | 'approved' | 'rejected'
): string {
  const isPublic = request?.checked_out_by?.startsWith('public_') || 
                   request?.user_type === 'public'
  
  const userName = request?.checked_out_by_name || 'Public Borrower'
  const itemCount = request?.items?.length || 0
  
  switch (notificationType) {
    case 'created':
      return isPublic 
        ? `✅ Public borrower ${userName} has created an approved request for ${itemCount} item(s)`
        : `📋 New request created by ${userName} for ${itemCount} item(s)`
    
    case 'approved':
      return isPublic
        ? `✅ Public borrower ${userName}'s request is approved (default) for ${itemCount} item(s)`
        : `✅ Request approved for ${userName} (${itemCount} items)`
    
    case 'updated':
      return `✏️ Request updated for ${userName} (${itemCount} items)`
    
    case 'rejected':
      return `❌ Request rejected for ${userName} (${itemCount} items)`
    
    default:
      return `Request notification for ${userName}`
  }
}

// Update notification templates for public borrowers
export const PUBLIC_BORROWER_NOTIFICATION_TEMPLATES = {
  request_created: {
    title: 'Public Borrower Request Created',
    message: 'A public borrower has created a new request that is automatically approved.',
    type: 'success' as const
  },
  request_approved: {
    title: 'Public Borrower Request Approved',
    message: 'Public borrower request is approved by default.',
    type: 'info' as const
  }
}