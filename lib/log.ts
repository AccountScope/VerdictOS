// Lightweight example. Expand for correlation IDs.
export function logRequest(req: any, extra: object = {}) {
  console.log({
    method: req.method,
    url: req.url,
    ...extra
    // Add: request_id, timestamp, etc.
  })
}
