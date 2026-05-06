export default function handler() { return new Response('API route disabled for static export', { status: 404 }); }
import { NextResponse } from 'next/server'

const DISABLED_MESSAGE = 'API route disabled for static export'

export async function GET() {
  return NextResponse.json({ error: DISABLED_MESSAGE }, { status: 404 })
}