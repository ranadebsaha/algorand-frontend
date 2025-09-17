import { clerkClient } from '@clerk/clerk-sdk-node'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, action } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify admin access
    const decoded = jwt.decode(token)
    const adminUserId = decoded.sub
    const adminUser = await clerkClient.users.getUser(adminUserId)
    
    if (adminUser.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get the user's current metadata
    const targetUser = await clerkClient.users.getUser(userId)
    const currentRole = targetUser.unsafeMetadata?.role

    // Update user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: action === 'approve' ? currentRole : null,
        status: action === 'approve' ? 'approved' : 'rejected',
        approvedAt: action === 'approve' ? new Date().toISOString() : null,
        approvedBy: adminUserId,
        organizationName: targetUser.unsafeMetadata?.organizationName,
        organizationType: targetUser.unsafeMetadata?.organizationType
      }
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
