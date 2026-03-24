export function validateAction(data: any) {
  if (!data.action_type) {
    throw new Error('action_type is required')
  }
  if (!data.payload) {
    throw new Error('payload is required')
  }
  return true
}

export function validateRule(data: any) {
  if (!data.name) {
    throw new Error('name is required')
  }
  if (!data.definition) {
    throw new Error('definition is required')
  }
  return true
}

export function validateWebhook(data: any) {
  if (!data.url) {
    throw new Error('url is required')
  }
  if (!/^https?:\/\/.+/.test(data.url)) {
    throw new Error('url must be a valid HTTP/HTTPS URL')
  }
  return true
}
