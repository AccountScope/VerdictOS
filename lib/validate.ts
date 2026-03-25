import { z } from 'zod'

// Maximum payload size: 1MB (1,048,576 bytes)
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024

// Action schema
const actionSchema = z.object({
  action_type: z.string().min(1).max(100),
  requested_by: z.string().email().optional(),
  approver_email: z.string().email().optional(),
  payload: z.record(z.any()).refine(
    (data) => {
      const size = JSON.stringify(data).length
      return size <= MAX_PAYLOAD_SIZE
    },
    {
      message: `Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE} bytes (1MB)`
    }
  ),
  metadata: z.record(z.any()).optional()
})

export function validateAction(data: any) {
  try {
    const result = actionSchema.parse(data)
    return { success: true, data: result }
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return {
        success: false,
        errors,
        message: errors[0]?.message || 'Validation failed'
      }
    }
    return {
      success: false,
      message: 'Validation failed'
    }
  }
}

// Rule schema
const ruleSchema = z.object({
  name: z.string().min(1).max(200),
  definition: z.record(z.any())
})

export function validateRule(data: any) {
  try {
    const result = ruleSchema.parse(data)
    return { success: true, data: result }
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return {
        success: false,
        errors,
        message: errors[0]?.message || 'Validation failed'
      }
    }
    return {
      success: false,
      message: 'Validation failed'
    }
  }
}

// Webhook schema
const webhookSchema = z.object({
  url: z.string().url().refine(
    (url) => url.startsWith('https://'),
    {
      message: 'Webhook URL must use HTTPS'
    }
  )
})

export function validateWebhook(data: any) {
  try {
    const result = webhookSchema.parse(data)
    return { success: true, data: result }
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return {
        success: false,
        errors,
        message: errors[0]?.message || 'Validation failed'
      }
    }
    return {
      success: false,
      message: 'Validation failed'
    }
  }
}
