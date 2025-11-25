# Cali Calendar AI - Rebuild Plan: Phases 8-11

> **📚 Complete Rebuild Documentation**
> - **Part 1:** REBUILD_PLAN_PHASES_1-4.md - Project setup, database, auth, events
> - **Part 2:** REBUILD_PLAN_PHASES_5-7.md - SMS, AI messaging, family sharing
> - **Part 3:** REBUILD_PLAN_PHASES_8-11.md (this file) - Admin dashboard, settings, scheduler, navigation
> - **Part 4:** REBUILD_PLAN_PHASES_12-15.md - Calendar integrations, polish

## Overview
This document covers Phases 8-11, focusing on admin features, settings management, user preferences, and scheduler implementation.

---

# Phase 8: Admin Dashboard

## Goal
Create an admin dashboard for managing system settings, viewing users, and monitoring the application.

## Step 8.1: Create Admin Routes (Server)

**File: `apps/server/src/routes/admin.ts`**
```typescript
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../lib/validation'
import { adminHelpers } from '../lib/db-helpers'
import prisma from '../lib/prisma'
import { testClaudeConnection } from '../services/claudeService'
import { initializeTwilioClient } from '../services/twilioService'

const router = Router()

// All admin routes require authentication and admin privileges
router.use(authenticate, requireAdmin)

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalSms,
      activeFamilyMembers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.calendarEvent.count(),
      prisma.smsHistory.count(),
      prisma.familyMember.count({ where: { isActive: true } }),
    ])

    res.json({
      totalUsers,
      totalEvents,
      totalSms,
      activeFamilyMembers,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            calendarEvents: true,
            familyMembers: true,
            smsHistory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Toggle user active status
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const userId = req.params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    })

    res.json({ isActive: updated.isActive })
  } catch (error) {
    console.error('Toggle user active error:', error)
    res.status(500).json({ error: 'Failed to toggle user status' })
  }
})

// Get all settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.adminSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })

    // Don't send secret values to client
    const sanitized = settings.map((setting) => ({
      ...setting,
      value: setting.isSecret ? '••••••••' : setting.value,
    }))

    res.json(sanitized)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update setting
router.put('/settings/:key', [
  body('value').notEmpty().withMessage('Value is required'),
], validateRequest, async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body

    // Determine if this is a secret based on key name
    const isSecret = key.includes('key') || key.includes('token') || key.includes('secret')

    const setting = await adminHelpers.setSetting(
      key,
      value,
      'system',
      isSecret
    )

    res.json({
      ...setting,
      value: isSecret ? '••••••••' : setting.value,
    })
  } catch (error) {
    console.error('Update setting error:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

// Test Anthropic connection
router.post('/test-claude', async (req, res) => {
  try {
    const result = await testClaudeConnection()
    res.json({ success: result })
  } catch (error) {
    console.error('Test Claude error:', error)
    res.status(500).json({ success: false, error: 'Connection failed' })
  }
})

// Test Twilio connection
router.post('/test-twilio', async (req, res) => {
  try {
    const config = await initializeTwilioClient()
    res.json({ success: !!config })
  } catch (error) {
    console.error('Test Twilio error:', error)
    res.status(500).json({ success: false, error: 'Connection failed' })
  }
})

// Get recent SMS history (all users)
router.get('/sms-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50

    const history = await prisma.smsHistory.findMany({
      take: limit,
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    res.json(history)
  } catch (error) {
    console.error('Get SMS history error:', error)
    res.status(500).json({ error: 'Failed to fetch SMS history' })
  }
})

export default router
```

## Step 8.2: Update Server with Admin Routes

Add to `apps/server/src/index.ts`:
```typescript
import adminRouter from './routes/admin'
app.use('/api/admin', adminRouter)
```

## Step 8.3: Create Admin Dashboard Page (Client)

**File: `apps/client/src/pages/AdminDashboard.tsx`**
```typescript
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/stats', { withCredentials: true })
      return response.data
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Events</div>
          <div className="text-3xl font-bold text-green-600">{stats?.totalEvents || 0}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">SMS Sent</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.totalSms || 0}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Active Family Members</div>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.activeFamilyMembers || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-gray-600">View and manage all users</p>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold mb-2">System Settings</h3>
          <p className="text-gray-600">Configure API keys and system settings</p>
        </Link>

        <Link
          to="/admin/sms-history"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold mb-2">SMS History</h3>
          <p className="text-gray-600">View all sent SMS messages</p>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">System Health</h3>
          <p className="text-gray-600">All systems operational</p>
        </div>
      </div>
    </div>
  )
}
```

## Step 8.4: Create Admin Users Page

**File: `apps/client/src/pages/AdminUsers.tsx`**
```typescript
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/users', { withCredentials: true })
      return response.data
    },
  })

  const toggleActive = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.put(
        `/api/admin/users/${userId}/toggle-active`,
        {},
        { withCredentials: true }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Events
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SMS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user: any) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  {user.isAdmin && (
                    <span className="text-xs text-blue-600">Admin</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phoneNumber || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.calendarEvents}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.familyMembers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.smsHistory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleActive.mutate(user.id)}
                    disabled={toggleActive.isPending}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## Phase 8 Checklist

- [ ] Created admin routes with stats and user management
- [ ] Integrated admin routes into server
- [ ] Created Admin Dashboard page
- [ ] Created Admin Users page
- [ ] Tested viewing system stats
- [ ] Tested viewing and managing users
- [ ] Verified admin-only access protection

## Next Steps

Proceed to **Phase 9: Admin Settings UI** to create the settings management interface.

---

# Phase 9: Admin Settings UI

## Goal
Create an admin interface for managing API keys and system configuration.

## Step 9.1: Create Admin Settings Page

**File: `apps/client/src/pages/AdminSettings.tsx`**
```typescript
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/settings', { withCredentials: true })
      return response.data
    },
  })

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await axios.put(
        `/api/admin/settings/${key}`,
        { value },
        { withCredentials: true }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setEditingKey(null)
      setEditValue('')
    },
  })

  const testClaude = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/admin/test-claude', {}, {
        withCredentials: true,
      })
      return response.data
    },
  })

  const testTwilio = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/admin/test-twilio', {}, {
        withCredentials: true,
      })
      return response.data
    },
  })

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key)
    setEditValue(currentValue === '••••••••' ? '' : currentValue)
  }

  const handleSave = (key: string) => {
    if (editValue.trim()) {
      updateSetting.mutate({ key, value: editValue })
    }
  }

  const handleCancel = () => {
    setEditingKey(null)
    setEditValue('')
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  const groupedSettings = settings?.reduce((acc: any, setting: any) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {}) || {}

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => testClaude.mutate()}
            disabled={testClaude.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {testClaude.isPending ? 'Testing...' : 'Test Claude'}
          </button>
          <button
            onClick={() => testTwilio.mutate()}
            disabled={testTwilio.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {testTwilio.isPending ? 'Testing...' : 'Test Twilio'}
          </button>
        </div>
      </div>

      {testClaude.isSuccess && (
        <div
          className={`mb-4 p-4 rounded-md ${
            testClaude.data.success
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          Claude connection: {testClaude.data.success ? 'Success!' : 'Failed'}
        </div>
      )}

      {testTwilio.isSuccess && (
        <div
          className={`mb-4 p-4 rounded-md ${
            testTwilio.data.success
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          Twilio connection: {testTwilio.data.success ? 'Success!' : 'Failed'}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]: any) => (
          <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h2 className="text-lg font-semibold capitalize">{category}</h2>
            </div>

            <div className="divide-y">
              {categorySettings.map((setting: any) => (
                <div key={setting.key} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{setting.key}</div>
                      {editingKey === setting.key ? (
                        <div className="mt-2">
                          <input
                            type={setting.isSecret ? 'password' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={
                              setting.isSecret
                                ? 'Enter new value'
                                : 'Enter value'
                            }
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleSave(setting.key)}
                              disabled={updateSetting.isPending}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-gray-600">
                          {setting.value || '(not set)'}
                        </div>
                      )}
                    </div>
                    {editingKey !== setting.key && (
                      <button
                        onClick={() => handleEdit(setting.key, setting.value)}
                        className="ml-4 text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Add New Setting</h3>
          <p className="text-sm text-blue-800">
            New settings can be added by updating the code to call{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              adminHelpers.setSetting()
            </code>{' '}
            with the desired key name.
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Step 9.2: Initialize Default Settings (Server)

**File: `apps/server/src/lib/initializeSettings.ts`**
```typescript
import { adminHelpers } from './db-helpers'

export const initializeDefaultSettings = async () => {
  const defaults = [
    {
      key: 'anthropic_api_key',
      value: '',
      category: 'api_keys',
      isSecret: true,
    },
    {
      key: 'twilio_account_sid',
      value: '',
      category: 'api_keys',
      isSecret: true,
    },
    {
      key: 'twilio_auth_token',
      value: '',
      category: 'api_keys',
      isSecret: true,
    },
    {
      key: 'twilio_phone_number',
      value: '',
      category: 'api_keys',
      isSecret: false,
    },
    {
      key: 'system_email',
      value: 'noreply@localhost',
      category: 'system',
      isSecret: false,
    },
  ]

  for (const setting of defaults) {
    const existing = await adminHelpers.getSetting(setting.key)
    if (!existing) {
      await adminHelpers.setSetting(
        setting.key,
        setting.value,
        setting.category,
        setting.isSecret
      )
    }
  }

  console.log('✅ Default settings initialized')
}
```

Call this during server startup in `apps/server/src/index.ts`:
```typescript
import { initializeDefaultSettings } from './lib/initializeSettings'

// After database connection, before starting server
initializeDefaultSettings().catch(console.error)
```

## Phase 9 Checklist

- [ ] Created Admin Settings page with editing capability
- [ ] Added connection test buttons for Claude and Twilio
- [ ] Created settings initialization script
- [ ] Integrated settings initialization into server startup
- [ ] Tested editing API keys
- [ ] Tested connection tests
- [ ] Verified secret masking in UI

## Next Steps

Proceed to **Phase 10: Scheduler Service** to implement automated daily SMS sending.

---

# Phase 10: Scheduler Service (Automated Daily SMS)

## Goal
Implement a scheduler that automatically sends daily SMS summaries to all active users at their preferred time.

## Step 10.1: Install node-cron

```bash
cd apps/server
npm install node-cron
npm install @types/node-cron -D
```

## Step 10.2: Create Scheduler Service

**File: `apps/server/src/services/schedulerService.ts`**
```typescript
import cron from 'node-cron'
import prisma from '../lib/prisma'
import { eventHelpers, smsHelpers, familyHelpers } from '../lib/db-helpers'
import { sendSMS, formatPhoneNumber } from './twilioService'
import { generateCalendarMessage } from './claudeService'

let cronJob: cron.ScheduledTask | null = null

export const startScheduler = () => {
  // Run every hour to check if any users need their daily SMS
  cronJob = cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running SMS scheduler check...')

    try {
      await processDailySMS()
    } catch (error) {
      console.error('Scheduler error:', error)
    }
  })

  console.log('✅ SMS scheduler started (runs every hour)')
}

export const stopScheduler = () => {
  if (cronJob) {
    cronJob.stop()
    console.log('⏹️  SMS scheduler stopped')
  }
}

const processDailySMS = async () => {
  // Get all active users
  const users = await prisma.user.findMany({
    where: { isActive: true, phoneNumber: { not: null } },
  })

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const todayDate = now.toISOString().split('T')[0]

  for (const user of users) {
    try {
      // Parse user's preferred SMS time (format: "HH:MM")
      const [smsHour, smsMinute] = user.smsTime.split(':').map(Number)

      // Check if current time matches user's SMS time (within the same hour)
      const isTimeToSend = currentHour === smsHour && currentMinute < 60

      if (!isTimeToSend) {
        continue
      }

      // Check if SMS already sent today
      const lastSms = await prisma.smsHistory.findFirst({
        where: {
          userId: user.id,
          sentAt: {
            gte: new Date(`${todayDate}T00:00:00Z`),
          },
          status: { in: ['sent', 'delivered', 'queued'] },
        },
        orderBy: { sentAt: 'desc' },
      })

      if (lastSms) {
        console.log(`⏭️  Already sent to ${user.email} today`)
        continue
      }

      // Send daily summary
      await sendDailySummaryForUser(user)
    } catch (error) {
      console.error(`Failed to send daily SMS to ${user.email}:`, error)
    }
  }
}

const sendDailySummaryForUser = async (user: any) => {
  console.log(`📤 Sending daily summary to ${user.email}`)

  // Get upcoming events (next 24 hours)
  const events = await eventHelpers.findUpcoming(user.id, 24)

  // Generate personalized message with Claude
  const message = await generateCalendarMessage(
    events,
    user.firstName,
    user.messageStyle
  )

  // Get list of recipients (user + active family members)
  const recipients: Array<{ phoneNumber: string; name: string }> = [
    {
      phoneNumber: user.phoneNumber,
      name: `${user.firstName} ${user.lastName}`,
    },
  ]

  const familyMembers = await familyHelpers.findActive(user.id)
  familyMembers.forEach((member) => {
    recipients.push({
      phoneNumber: member.phoneNumber,
      name: member.name,
    })
  })

  // Send SMS to all recipients
  for (const recipient of recipients) {
    try {
      const formatted = formatPhoneNumber(recipient.phoneNumber)
      const result = await sendSMS({
        to: formatted,
        message,
      })

      // Log in SMS history
      await smsHelpers.create({
        phoneNumber: formatted,
        message,
        status: result.success ? result.status || 'sent' : 'failed',
        messageStyle: user.messageStyle,
        userId: user.id,
        eventCount: events.length,
        twilioSid: result.sid,
        errorMessage: result.success ? undefined : result.error,
      })

      console.log(`  ✅ Sent to ${recipient.name} (${formatted})`)
    } catch (error) {
      console.error(`  ❌ Failed to send to ${recipient.name}:`, error)
    }
  }
}

// Manual trigger for testing
export const triggerDailySMSForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  await sendDailySummaryForUser(user)
}

// Trigger for all users (admin function)
export const triggerDailySMSForAll = async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true, phoneNumber: { not: null } },
  })

  for (const user of users) {
    try {
      await sendDailySummaryForUser(user)
    } catch (error) {
      console.error(`Failed to send to ${user.email}:`, error)
    }
  }
}
```

## Step 10.3: Start Scheduler on Server Startup

**File: `apps/server/src/index.ts`** (add to startup)
```typescript
import { startScheduler } from './services/schedulerService'

// After database initialization
startScheduler()

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping scheduler...')
  stopScheduler()
  process.exit(0)
})
```

## Step 10.4: Add Manual Trigger Routes

Add to `apps/server/src/routes/admin.ts`:
```typescript
import { triggerDailySMSForAll } from '../services/schedulerService'

// Trigger SMS for all users (admin only)
router.post('/trigger-all-sms', async (req, res) => {
  try {
    await triggerDailySMSForAll()
    res.json({ success: true, message: 'SMS triggered for all users' })
  } catch (error) {
    console.error('Trigger all SMS error:', error)
    res.status(500).json({ error: 'Failed to trigger SMS' })
  }
})
```

## Step 10.5: Update Error Logging in DB Helper

Add `errorMessage` field support to `smsHelpers.create` in `apps/server/src/lib/db-helpers.ts`:

```typescript
export const smsHelpers = {
  create: (data: {
    phoneNumber: string
    message: string
    status: string
    messageStyle: string
    userId: string
    eventCount?: number
    twilioSid?: string
    errorMessage?: string
  }) => prisma.smsHistory.create({ data }),
  // ... rest of helpers
}
```

## Phase 10 Checklist

- [ ] Installed node-cron
- [ ] Created scheduler service with hourly checks
- [ ] Integrated scheduler into server startup
- [ ] Added manual trigger for admin
- [ ] Tested automatic daily SMS sending
- [ ] Tested sending to family members
- [ ] Verified SMS not sent twice in same day
- [ ] Tested graceful shutdown

## Next Steps

Proceed to **Phase 11: Navigation and Layout** to create a cohesive UI with navigation.

---

# Phase 11: Navigation and Layout

## Goal
Create a consistent navigation system and layout for the application.

## Step 11.1: Create Layout Component

**File: `apps/client/src/components/Layout.tsx`**
```typescript
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { path: '/sms', label: 'SMS History', icon: '💬' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const adminLinks = [
    { path: '/admin', label: 'Admin Dashboard', icon: '🔧' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/settings', label: 'System Settings', icon: '🔐' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-xl font-bold text-gray-900"
              >
                📅 Cali Calendar AI
              </Link>

              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      isActive(link.path)
                        ? 'border-b-2 border-blue-500 text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                {user?.isAdmin && (
                  <>
                    <div className="border-l border-gray-200 mx-2" />
                    {adminLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                          isActive(link.path)
                            ? 'border-b-2 border-purple-500 text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="mr-2">{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
```

## Step 11.2: Create Mobile Navigation

**File: `apps/client/src/components/MobileNav.tsx`**
```typescript
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { path: '/sms', label: 'SMS', icon: '💬' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6">
            <div className="grid grid-cols-3 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex flex-col items-center p-4 rounded-lg ${
                    isActive(link.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <span className="text-2xl mb-2">{link.icon}</span>
                  <span className="text-xs">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

## Step 11.3: Update App with Layout

**File: `apps/client/src/App.tsx`** (wrap protected routes with Layout)
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Events } from './pages/Events'
import { Settings } from './pages/Settings'
import { SmsHistory } from './pages/SmsHistory'
import { Family } from './pages/Family'
import { FamilyJoin } from './pages/FamilyJoin'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminUsers } from './pages/AdminUsers'
import { AdminSettings } from './pages/AdminSettings'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { MobileNav } from './components/MobileNav'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/family/join/:code" element={<FamilyJoin />} />

          {/* Protected routes with layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <MobileNav />
                  <Routes>
                    <Route path="/dashboard" element={<Events />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/sms" element={<SmsHistory />} />
                    <Route path="/family" element={<Family />} />

                    {/* Admin routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminSettings />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

## Phase 11 Checklist

- [ ] Created Layout component with navigation
- [ ] Created Mobile navigation component
- [ ] Updated App with consistent layout
- [ ] Tested navigation between all pages
- [ ] Tested mobile navigation
- [ ] Tested admin navigation visibility
- [ ] Verified active link highlighting

## Phases 8-11 Complete!

You now have:
- Admin dashboard with user management
- System settings UI with API key management
- Automated daily SMS scheduler
- Consistent navigation and layout

## Next Steps

Proceed to **REBUILD_PLAN_PHASES_12-15.md** for calendar integrations (TimeTree, Google Calendar, Microsoft Graph) and final polish features.

---
