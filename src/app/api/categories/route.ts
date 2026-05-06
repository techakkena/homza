export default function handler() { return new Response('API route disabled for static export', { status: 404 }); }
function apiDisabledResponse() {
  return new Response('API route disabled for static export', { status: 404 })
}

export async function GET() {
  return apiDisabledResponse()
}

export async function POST() {
  return apiDisabledResponse()
}

export async function PUT() {
  return apiDisabledResponse()
}

export async function PATCH() {
  return apiDisabledResponse()
}

export async function DELETE() {
  return apiDisabledResponse()
}

export async function HEAD() {
  return new Response(null, { status: 404 })
}