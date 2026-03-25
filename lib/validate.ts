// Validation utility (simplified for deployment)
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024 // 1MB

export function validateAction(data: any) {
  const errors = []
  
  if (!data.action_type) {
    errors.push({ field: 'action_type', message: 'action_type is required' })
  } else if (typeof data.action_type !== 'string' || data.action_type.length > 100) {
    errors.push({ field: 'action_type', message: 'action_type must be a string (max 100 chars)' })
  }
  
  if (data.requested_by && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.requested_by)) {
    errors.push({ field: 'requested_by', message: 'requested_by must be a valid email' })
  }
  
  if (data.approver_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.approver_email)) {
    errors.push({ field: 'approver_email', message: 'approver_email must be a valid email' })
  }
  
  if (!data.payload) {
    errors.push({ field: 'payload', message: 'payload is required' })
  } else {
    const payloadSize = JSON.stringify(data.payload).length
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      errors.push({ field: 'payload', message: `Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE} bytes (1MB)` })
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      message: errors[0].message
    }
  }
  
  return { success: true, data }
}

export function validateRule(data: any) {
  if (!data.name) {
    return {
      success: false,
      message: 'name is required',
      errors: [{ field: 'name', message: 'name is required' }]
    }
  }
  if (!data.definition) {
    return {
      success: false,
      message: 'definition is required',
      errors: [{ field: 'definition', message: 'definition is required' }]
    }
  }
  return { success: true, data }
}

export function validateWebhook(data: any) {
  if (!data.url) {
    return {
      success: false,
      message: 'url is required',
      errors: [{ field: 'url', message: 'url is required' }]
    }
  }
  if (!/^https:\/\/.+/.test(data.url)) {
    return {
      success: false,
      message: 'url must use HTTPS',
      errors: [{ field: 'url', message: 'url must use HTTPS' }]
    }
  }
  return { success: true, data }
}
