# Cali Calendar AI - Rebuild Plan: Phases 5-7

> **📚 Complete Rebuild Documentation**
> - **Part 1:** REBUILD_PLAN_PHASES_1-4.md - Project setup, database, auth, events
> - **Part 2:** REBUILD_PLAN_PHASES_5-7.md (this file) - SMS, AI messaging, family sharing
> - **Part 3:** REBUILD_PLAN_PHASES_8-11.md - Admin dashboard, settings, scheduler, navigation
> - **Part 4:** REBUILD_PLAN_PHASES_12-15.md - Calendar integrations, polish

## Overview
This document continues the rebuild plan with Phases 5-7, covering SMS notifications, AI messaging, and family sharing features.

---

# Phase 5: SMS Notification System (Twilio Integration)

## Goal
Integrate Twilio SMS API to send calendar summaries to users and family members.

## Step 5.1: Install Twilio SDK

```bash
cd apps/server
npm install twilio
npm install @types/node
```

## Step 5.2: Create Twilio Service

**File: `apps/server/src/services/twilioService.ts`**
```typescript
import twilio from 'twilio'
import { adminHelpers } from '../lib/db-helpers'

let twilioClient: twilio.Twilio | null = null

export const initializeTwilioClient = async () => {
  const accountSid = await adminHelpers.getSetting('twilio_account_sid')
  const authToken = await adminHelpers.getSetting('twilio_auth_token')
  const phoneNumber = await adminHelpers.getSetting('twilio_phone_number')

  if (!accountSid || !authToken) {
    console.warn('⚠️  Twilio credentials not configured')
    return null
  }

  twilioClient = twilio(accountSid, authToken)
  return { client: twilioClient, phoneNumber }
}

export const getTwilioClient = () => {
  return twilioClient
}

export interface SendSMSParams {
  to: string
  message: string
}

export const sendSMS = async ({ to, message }: SendSMSParams) => {
  try {
    const config = await initializeTwilioClient()

    if (!config || !config.client) {
      throw new Error('Twilio not configured')
    }

    if (!config.phoneNumber) {
      throw new Error('Twilio phone number not configured')
    }

    const result = await config.client.messages.create({
      body: message,
      from: config.phoneNumber,
      to: to,
    })

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    }
  } catch (error: any) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      code: error.code,
    }
  }
}

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')

  if (!phone.startsWith('+')) {
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    return `+${cleaned}`
  }

  return phone
}

export const validatePhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/
  const formatted = formatPhoneNumber(phone)
  return e164Regex.test(formatted)
}
```

## Step 5.3: Create SMS Routes

**File: `apps/server/src/routes/sms.ts`**
```typescript
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../lib/validation'
import { sendSMS, formatPhoneNumber, validatePhoneNumber } from '../services/twilioService'
import { smsHelpers, eventHelpers } from '../lib/db-helpers'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)

// Send test SMS
router.post('/test', [
  body('phoneNumber').optional().custom((value) => {
    if (!validatePhoneNumber(value)) {
      throw new Error('Invalid phone number format')
    }
    return true
  }),
], validateRequest, async (req, res) => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const phoneNumber = req.body.phoneNumber || user.phoneNumber

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' })
    }

    const formatted = formatPhoneNumber(phoneNumber)
    const message = `🧪 Test SMS from Cali Calendar AI\n\nThis is a test message to verify your SMS configuration is working correctly.`

    const result = await sendSMS({ to: formatted, message })

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send SMS',
        details: result.error
      })
    }

    await smsHelpers.create({
      phoneNumber: formatted,
      message,
      status: result.status || 'sent',
      messageStyle: 'professional',
      userId,
      twilioSid: result.sid,
    })

    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      sid: result.sid,
    })
  } catch (error) {
    console.error('Test SMS error:', error)
    res.status(500).json({ error: 'Failed to send test SMS' })
  }
})

// Get SMS history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user!.id
    const limit = parseInt(req.query.limit as string) || 50
    const history = await smsHelpers.findByUserId(userId, limit)
    res.json(history)
  } catch (error) {
    console.error('Get SMS history error:', error)
    res.status(500).json({ error: 'Failed to fetch SMS history' })
  }
})

// Send daily summary
router.post('/send-daily-summary', async (req, res) => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: 'Phone number not configured' })
    }

    const events = await eventHelpers.findUpcoming(userId, 24)

    let message = `📅 Good morning! Here's your schedule for today:\n\n`

    if (events.length === 0) {
      message += `No events scheduled. Enjoy your free day!`
    } else {
      events.forEach((event, index) => {
        const start = new Date(event.startTime)
        const timeStr = event.isAllDay
          ? 'All Day'
          : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

        message += `${index + 1}. ${timeStr} - ${event.title}`
        if (event.location) message += ` (${event.location})`
        message += `\n`
      })
    }

    const formatted = formatPhoneNumber(user.phoneNumber)
    const result = await sendSMS({ to: formatted, message })

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send SMS',
        details: result.error
      })
    }

    await smsHelpers.create({
      phoneNumber: formatted,
      message,
      status: result.status || 'sent',
      messageStyle: user.messageStyle,
      userId,
      eventCount: events.length,
      twilioSid: result.sid,
    })

    res.json({
      success: true,
      message: 'Daily summary sent successfully',
      eventCount: events.length,
      sid: result.sid,
    })
  } catch (error) {
    console.error('Send daily summary error:', error)
    res.status(500).json({ error: 'Failed to send daily summary' })
  }
})

export default router
```

## Step 5.4: Update Server with SMS Routes

**File: `apps/server/src/index.ts`** (add import and route)
```typescript
import smsRouter from './routes/sms'
// ...
app.use('/api/sms', smsRouter)
```

## Step 5.5: Create SMS History Page (Client)

**File: `apps/client/src/pages/SmsHistory.tsx`**
```typescript
import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'

export const SmsHistory: React.FC = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['sms-history'],
    queryFn: async () => {
      const response = await axios.get('/api/sms/history', { withCredentials: true })
      return response.data
    },
  })

  const sendTest = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/sms/test', {}, { withCredentials: true })
      return response.data
    },
  })

  const sendDailySummary = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/sms/send-daily-summary', {}, {
        withCredentials: true
      })
      return response.data
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">SMS History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => sendTest.mutate()}
            disabled={sendTest.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {sendTest.isPending ? 'Sending...' : 'Send Test SMS'}
          </button>
          <button
            onClick={() => sendDailySummary.mutate()}
            disabled={sendDailySummary.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {sendDailySummary.isPending ? 'Sending...' : 'Send Daily Summary'}
          </button>
        </div>
      </div>

      {sendTest.isSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
          Test SMS sent successfully!
        </div>
      )}

      {sendDailySummary.isSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
          Daily summary sent successfully!
        </div>
      )}

      <div className="space-y-4">
        {!history || history.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            No SMS messages sent yet.
          </div>
        ) : (
          history.map((sms: any) => (
            <div key={sms.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(sms.sentAt), 'PPpp')}
                  </div>
                  <div className="text-sm text-gray-600">
                    To: {sms.phoneNumber}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    sms.status === 'sent' || sms.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : sms.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {sms.status}
                </span>
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {sms.message}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>Style: {sms.messageStyle}</span>
                <span>Events: {sms.eventCount}</span>
                {sms.twilioSid && <span>SID: {sms.twilioSid}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

## Phase 5 Checklist

- [ ] Installed Twilio SDK
- [ ] Created Twilio service with SMS sending functionality
- [ ] Created SMS routes (test, history, daily summary)
- [ ] Integrated SMS routes into server
- [ ] Created SMS History page
- [ ] Tested sending test SMS
- [ ] Tested sending daily summary
- [ ] Verified SMS delivery and history logging

## Next Steps

Proceed to **Phase 6: AI Messaging with Claude** to add AI-powered message personalization.

---

# Phase 6: AI Messaging with Claude (Anthropic API)

## Goal
Integrate Anthropic's Claude API to generate personalized calendar summaries in different personality styles.

## Step 6.1: Install Anthropic SDK

```bash
cd apps/server
npm install @anthropic-ai/sdk
```

## Step 6.2: Create Claude Service

**File: `apps/server/src/services/claudeService.ts`**
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { adminHelpers } from '../lib/db-helpers'

let anthropicClient: Anthropic | null = null

export const initializeClaudeClient = async () => {
  const apiKey = await adminHelpers.getSetting('anthropic_api_key')

  if (!apiKey) {
    console.warn('⚠️  Anthropic API key not configured')
    return null
  }

  anthropicClient = new Anthropic({ apiKey })
  return anthropicClient
}

export const getClaudeClient = () => {
  return anthropicClient
}

interface CalendarEvent {
  title: string
  startTime: Date
  endTime: Date
  location?: string
  description?: string
  isAllDay: boolean
}

const PERSONALITY_PROMPTS = {
  professional: `You are a professional executive assistant. Format the calendar summary in a clear, concise, and business-appropriate manner. Be respectful and straightforward.`,

  witty: `You are a clever and humorous assistant. Format the calendar summary with wit and clever wordplay, but keep it tasteful and appropriate. Add some fun without being too silly.`,

  sarcastic: `You are a playfully sarcastic assistant. Format the calendar summary with gentle sarcasm and dry humor. Be playful but not mean-spirited.`,

  mission: `You are a military briefing officer. Format the calendar summary as a mission briefing with tactical language. Use terms like "mission objectives," "deployment times," and "operational zones." Be concise and action-oriented.`,

  irwin: `You are Steve Irwin, the enthusiastic wildlife expert! Format the calendar summary as if each event is an exciting wildlife encounter. Use phrases like "Crikey!" and "Beauty!" Express genuine enthusiasm for every event.`,

  tanda: `You are a helpful assistant with a focus on workforce management and scheduling. Format the calendar summary with references to shifts, rosters, and team coordination. Be professional but friendly.`,
}

export const generateCalendarMessage = async (
  events: CalendarEvent[],
  userName: string,
  personality: string = 'professional'
): Promise<string> => {
  try {
    const client = await initializeClaudeClient()

    if (!client) {
      return generateFallbackMessage(events, userName)
    }

    const personalityPrompt = PERSONALITY_PROMPTS[personality as keyof typeof PERSONALITY_PROMPTS]
      || PERSONALITY_PROMPTS.professional

    const eventsText = events.map((event, index) => {
      const start = new Date(event.startTime)
      const timeStr = event.isAllDay
        ? 'All Day'
        : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

      return `${index + 1}. ${timeStr} - ${event.title}${event.location ? ` at ${event.location}` : ''}${event.description ? ` (${event.description})` : ''}`
    }).join('\n')

    const prompt = `${personalityPrompt}

Format the following calendar events for ${userName} into a friendly SMS message (max 160 characters per segment, aim for 2-3 segments total).

Events for today:
${eventsText}

${events.length === 0 ? 'No events scheduled.' : ''}

Create a personalized message that includes:
1. A greeting appropriate to the personality
2. A summary of the events
3. A closing remark

Keep the message concise and SMS-friendly.`

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const messageContent = response.content[0]
    if (messageContent.type === 'text') {
      return messageContent.text
    }

    return generateFallbackMessage(events, userName)
  } catch (error) {
    console.error('Claude API error:', error)
    return generateFallbackMessage(events, userName)
  }
}

const generateFallbackMessage = (events: CalendarEvent[], userName: string): string => {
  let message = `📅 Good morning ${userName}!\n\n`

  if (events.length === 0) {
    message += `No events scheduled for today. Enjoy your free day!`
  } else {
    message += `You have ${events.length} event${events.length > 1 ? 's' : ''} today:\n\n`

    events.forEach((event, index) => {
      const start = new Date(event.startTime)
      const timeStr = event.isAllDay
        ? 'All Day'
        : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

      message += `${index + 1}. ${timeStr} - ${event.title}`
      if (event.location) message += ` @ ${event.location}`
      message += `\n`
    })

    message += `\nHave a great day!`
  }

  return message
}

export const testClaudeConnection = async (): Promise<boolean> => {
  try {
    const client = await initializeClaudeClient()
    if (!client) return false

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Say "Hello" if you can hear me.'
      }]
    })

    return response.content.length > 0
  } catch (error) {
    console.error('Claude connection test failed:', error)
    return false
  }
}
```

## Step 6.3: Update SMS Routes to Use Claude

Update the `/send-daily-summary` route in `apps/server/src/routes/sms.ts`:

```typescript
import { generateCalendarMessage } from '../services/claudeService'

// In the send-daily-summary route, replace message generation:
const message = await generateCalendarMessage(
  events,
  user.firstName,
  user.messageStyle
)
```

## Step 6.4: Create User Settings Page

**File: `apps/client/src/pages/Settings.tsx`**
```typescript
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const MESSAGE_STYLES = [
  { value: 'professional', label: 'Professional', description: 'Clear and business-appropriate' },
  { value: 'witty', label: 'Witty', description: 'Clever and humorous' },
  { value: 'sarcastic', label: 'Sarcastic', description: 'Playfully sarcastic' },
  { value: 'mission', label: 'Mission Briefing', description: 'Military-style tactical' },
  { value: 'irwin', label: 'Steve Irwin', description: 'Enthusiastic wildlife expert' },
  { value: 'tanda', label: 'Tanda', description: 'Workforce management focused' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export const Settings: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    timezone: 'America/Los_Angeles',
    smsTime: '07:00',
    messageStyle: 'professional',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true })
      setFormData({
        phoneNumber: response.data.phoneNumber || '',
        timezone: response.data.timezone || 'America/Los_Angeles',
        smsTime: response.data.smsTime || '07:00',
        messageStyle: response.data.messageStyle || 'professional',
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      await axios.put('/api/users/settings', formData, { withCredentials: true })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (E.164 format)
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+1234567890"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="mt-1 text-sm text-gray-500">
            Include country code (e.g., +1 for US)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily SMS Time
          </label>
          <input
            type="time"
            value={formData.smsTime}
            onChange={(e) => setFormData({ ...formData, smsTime: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="mt-1 text-sm text-gray-500">
            What time should we send your daily calendar summary?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Message Personality
          </label>
          <div className="space-y-2">
            {MESSAGE_STYLES.map((style) => (
              <label
                key={style.value}
                className="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="messageStyle"
                  value={style.value}
                  checked={formData.messageStyle === style.value}
                  onChange={(e) =>
                    setFormData({ ...formData, messageStyle: e.target.value })
                  }
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">{style.label}</div>
                  <div className="text-sm text-gray-500">{style.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
```

## Step 6.5: Create User Settings Route (Server)

**File: `apps/server/src/routes/users.ts`**
```typescript
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../lib/validation'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)

router.put('/settings', [
  body('phoneNumber').optional().trim(),
  body('timezone').optional().trim(),
  body('smsTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('messageStyle').optional().isIn([
    'professional', 'witty', 'sarcastic', 'mission', 'irwin', 'tanda'
  ]),
], validateRequest, async (req, res) => {
  try {
    const userId = req.user!.id
    const { phoneNumber, timezone, smsTime, messageStyle } = req.body

    const updateData: any = {}
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (timezone) updateData.timezone = timezone
    if (smsTime) updateData.smsTime = smsTime
    if (messageStyle) updateData.messageStyle = messageStyle

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    res.json({
      phoneNumber: user.phoneNumber,
      timezone: user.timezone,
      smsTime: user.smsTime,
      messageStyle: user.messageStyle,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
```

Add to `apps/server/src/index.ts`:
```typescript
import usersRouter from './routes/users'
app.use('/api/users', usersRouter)
```

## Phase 6 Checklist

- [ ] Installed Anthropic SDK
- [ ] Created Claude service with personality prompts
- [ ] Updated SMS service to use Claude for message generation
- [ ] Created Settings page for message personality selection
- [ ] Created user settings API route
- [ ] Tested Claude message generation with different personalities
- [ ] Verified fallback to simple formatting if Claude unavailable

## Next Steps

Proceed to **Phase 7: Family Sharing Features** to implement invite codes and family member management.

---

# Phase 7: Family Sharing Features (Invite Codes & Family Members)

## Goal
Implement family sharing functionality with invite codes, QR codes, and family member management.

## Step 7.1: Create Join Code Service

**File: `apps/server/src/services/joinCodeService.ts`**
```typescript
import prisma from '../lib/prisma'
import { customAlphabet } from 'nanoid'

// Generate 6-character alphanumeric code
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export const createJoinCode = async (userId: string): Promise<string> => {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.joinCode.create({
    data: {
      code,
      userId,
      expiresAt,
    },
  })

  return code
}

export const validateJoinCode = async (code: string) => {
  const joinCode = await prisma.joinCode.findUnique({
    where: { code },
    include: { user: true },
  })

  if (!joinCode) {
    return { valid: false, error: 'Invalid code' }
  }

  if (joinCode.isUsed) {
    return { valid: false, error: 'Code already used' }
  }

  if (new Date() > joinCode.expiresAt) {
    return { valid: false, error: 'Code expired' }
  }

  return { valid: true, joinCode }
}

export const markCodeAsUsed = async (code: string, usedBy: string) => {
  await prisma.joinCode.update({
    where: { code },
    data: {
      isUsed: true,
      usedBy,
      usedAt: new Date(),
    },
  })
}
```

## Step 7.2: Install nanoid for code generation

```bash
cd apps/server
npm install nanoid
```

## Step 7.3: Create Family Member Routes

**File: `apps/server/src/routes/family.ts`**
```typescript
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../lib/validation'
import { familyHelpers } from '../lib/db-helpers'
import { createJoinCode, validateJoinCode, markCodeAsUsed } from '../services/joinCodeService'
import { formatPhoneNumber, validatePhoneNumber } from '../services/twilioService'
import prisma from '../lib/prisma'

const router = Router()

// Get all family members (authenticated)
router.get('/members', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id
    const members = await familyHelpers.findByUserId(userId)
    res.json(members)
  } catch (error) {
    console.error('Get family members error:', error)
    res.status(500).json({ error: 'Failed to fetch family members' })
  }
})

// Generate join code (authenticated)
router.post('/invite', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id
    const code = await createJoinCode(userId)

    // Generate QR code URL (client will handle QR generation)
    const joinUrl = `${process.env.CLIENT_URL}/family/join/${code}`

    res.json({ code, joinUrl })
  } catch (error) {
    console.error('Generate join code error:', error)
    res.status(500).json({ error: 'Failed to generate join code' })
  }
})

// Join family via code (no auth required)
router.post('/join/:code', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phoneNumber').custom((value) => {
    if (!validatePhoneNumber(value)) {
      throw new Error('Invalid phone number format')
    }
    return true
  }),
  body('relationship').optional().trim(),
], validateRequest, async (req, res) => {
  try {
    const { code } = req.params
    const { name, phoneNumber, relationship } = req.body

    // Validate join code
    const validation = await validateJoinCode(code)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const formatted = formatPhoneNumber(phoneNumber)

    // Create family member
    const member = await familyHelpers.create({
      name,
      phoneNumber: formatted,
      relationship,
      userId: validation.joinCode.userId,
    })

    // Mark code as used
    await markCodeAsUsed(code, name)

    res.status(201).json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
      },
    })
  } catch (error) {
    console.error('Join family error:', error)
    res.status(500).json({ error: 'Failed to join family' })
  }
})

// Add family member manually (authenticated)
router.post('/members', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phoneNumber').custom((value) => {
    if (!validatePhoneNumber(value)) {
      throw new Error('Invalid phone number format')
    }
    return true
  }),
  body('relationship').optional().trim(),
], validateRequest, async (req, res) => {
  try {
    const userId = req.user!.id
    const { name, phoneNumber, relationship } = req.body

    const formatted = formatPhoneNumber(phoneNumber)

    const member = await familyHelpers.create({
      name,
      phoneNumber: formatted,
      relationship,
      userId,
    })

    res.status(201).json(member)
  } catch (error) {
    console.error('Add family member error:', error)
    res.status(500).json({ error: 'Failed to add family member' })
  }
})

// Update family member (authenticated)
router.put('/members/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('phoneNumber').optional().custom((value) => {
    if (!validatePhoneNumber(value)) {
      throw new Error('Invalid phone number format')
    }
    return true
  }),
  body('relationship').optional().trim(),
  body('isActive').optional().isBoolean(),
], validateRequest, async (req, res) => {
  try {
    const userId = req.user!.id
    const memberId = req.params.id

    // Check if member belongs to user
    const existing = await prisma.familyMember.findFirst({
      where: { id: memberId, userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Family member not found' })
    }

    const updateData: any = {}
    if (req.body.name) updateData.name = req.body.name
    if (req.body.phoneNumber) updateData.phoneNumber = formatPhoneNumber(req.body.phoneNumber)
    if (req.body.relationship !== undefined) updateData.relationship = req.body.relationship
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive

    const member = await prisma.familyMember.update({
      where: { id: memberId },
      data: updateData,
    })

    res.json(member)
  } catch (error) {
    console.error('Update family member error:', error)
    res.status(500).json({ error: 'Failed to update family member' })
  }
})

// Delete family member (authenticated)
router.delete('/members/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id
    const memberId = req.params.id

    const existing = await prisma.familyMember.findFirst({
      where: { id: memberId, userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Family member not found' })
    }

    await prisma.familyMember.delete({
      where: { id: memberId },
    })

    res.json({ message: 'Family member deleted' })
  } catch (error) {
    console.error('Delete family member error:', error)
    res.status(500).json({ error: 'Failed to delete family member' })
  }
})

export default router
```

## Step 7.4: Update Server with Family Routes

Add to `apps/server/src/index.ts`:
```typescript
import familyRouter from './routes/family'
app.use('/api/family', familyRouter)
```

## Step 7.5: Create Family Management Page (Client)

**File: `apps/client/src/pages/Family.tsx`**
```typescript
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import QRCode from 'qrcode.react'

export const Family: React.FC = () => {
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState<{ code: string; joinUrl: string } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  })

  const { data: members, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const response = await axios.get('/api/family/members', { withCredentials: true })
      return response.data
    },
  })

  const generateInvite = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/family/invite', {}, { withCredentials: true })
      return response.data
    },
    onSuccess: (data) => {
      setInviteCode(data)
      setShowInvite(true)
    },
  })

  const addMember = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/family/members', data, { withCredentials: true })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      setShowAddForm(false)
      setFormData({ name: '', phoneNumber: '', relationship: '' })
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axios.put(`/api/family/members/${id}`, { isActive }, {
        withCredentials: true,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
    },
  })

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/family/members/${id}`, { withCredentials: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addMember.mutateAsync(formData)
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Family Members</h1>
        <div className="flex gap-2">
          <button
            onClick={() => generateInvite.mutate()}
            disabled={generateInvite.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Generate Invite Code
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>
      </div>

      {showInvite && inviteCode && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Invite Code Generated</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Share this code:</p>
              <div className="text-3xl font-mono font-bold text-blue-600 mb-4">
                {inviteCode.code}
              </div>
              <p className="text-sm text-gray-600 mb-2">Or scan this QR code:</p>
              <div className="bg-gray-50 p-4 inline-block rounded">
                <QRCode value={inviteCode.joinUrl} size={200} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Direct link:</p>
              <a
                href={inviteCode.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {inviteCode.joinUrl}
              </a>
              <p className="mt-4 text-sm text-gray-500">
                This code expires in 24 hours and can only be used once.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInvite(false)}
            className="mt-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add Family Member</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1234567890"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Relationship
              </label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                placeholder="e.g., spouse, child, parent"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={addMember.isPending}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {addMember.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {!members || members.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            No family members yet. Add someone or generate an invite code!
          </div>
        ) : (
          members.map((member: any) => (
            <div key={member.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-gray-600">{member.phoneNumber}</p>
                  {member.relationship && (
                    <p className="text-sm text-gray-500">{member.relationship}</p>
                  )}
                  <span
                    className={`mt-2 inline-block px-2 py-1 text-xs rounded ${
                      member.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleActive.mutate({ id: member.id, isActive: !member.isActive })
                    }
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${member.name}?`)) {
                        deleteMember.mutate(member.id)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

## Step 7.6: Install QR Code Library

```bash
cd apps/client
npm install qrcode.react
npm install @types/qrcode.react -D
```

## Step 7.7: Create Family Join Page

**File: `apps/client/src/pages/FamilyJoin.tsx`**
```typescript
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

export const FamilyJoin: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post(`/api/family/join/${code}`, formData)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join family')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-4">Successfully Joined!</h2>
          <p className="text-gray-600">
            You will now receive daily calendar summaries. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Join Family Calendar
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          You've been invited to join a family calendar. Enter your details to start
          receiving daily SMS summaries.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="+1234567890"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="mt-1 text-sm text-gray-500">Include country code (e.g., +1)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship (optional)
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) =>
                setFormData({ ...formData, relationship: e.target.value })
              }
              placeholder="e.g., spouse, child, friend"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Family'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

## Step 7.8: Update App with Family Routes

**File: `apps/client/src/App.tsx`**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Events } from './pages/Events'
import { Settings } from './pages/Settings'
import { SmsHistory } from './pages/SmsHistory'
import { Family } from './pages/Family'
import { FamilyJoin } from './pages/FamilyJoin'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/family/join/:code" element={<FamilyJoin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms"
            element={
              <ProtectedRoute>
                <SmsHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute>
                <Family />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

## Phase 7 Checklist

- [ ] Installed nanoid for code generation
- [ ] Created join code service
- [ ] Created family member routes
- [ ] Integrated family routes into server
- [ ] Created Family Management page
- [ ] Created Family Join page
- [ ] Installed QR code library
- [ ] Tested generating invite codes
- [ ] Tested QR code scanning
- [ ] Tested joining via code
- [ ] Tested adding/editing/deleting family members
- [ ] Tested activating/deactivating family members

## Phases 4-7 Complete!

You now have a fully functional calendar system with:
- Manual event CRUD operations
- SMS notifications via Twilio
- AI-powered message personalization with Claude
- Family sharing with invite codes and QR codes

## Next Steps

Proceed to **REBUILD_PLAN_PHASES_8-11.md** for admin features, settings management, and advanced user customization.

---
