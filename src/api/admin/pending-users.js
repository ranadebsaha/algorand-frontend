// For Vercel: /api/admin/pending-users.js
// For Netlify: /netlify/functions/pending-users.js

import { clerkClient } from '@clerk/clerk-sdk-node'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify the user is authenticated and is admin
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Decode the Clerk session token
    const decoded = jwt.decode(token)
    const userId = decoded.sub

    // Check if user is admin
    const user = await clerkClient.users.getUser(userId)
    if (user.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get pending users
    const userList = await clerkClient.users.getUserList({ limit: 100 })
    const pendingUsers = userList.data.filter(user => 
      user.unsafeMetadata?.status === 'pending' &&
      (user.unsafeMetadata?.role === 'organizer' || user.unsafeMetadata?.role === 'institute')
    )

    res.status(200).json({ users: pendingUsers })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
