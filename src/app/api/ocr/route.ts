import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'OCR not configured. Add ANTHROPIC_API_KEY to .env' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) return Response.json({ error: 'No image provided' }, { status: 400 });

  // mode=bill extracts all items from a receipt; default extracts a single item
  const mode = (formData.get('mode') as string) ?? 'single';

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = (file.type || 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  const client = new Anthropic({ apiKey });

  const prompt =
    mode === 'bill'
      ? `Extract ALL grocery/household items from this receipt or bill image.
Return ONLY a JSON array — one object per line item:
[
  { "name": "item name", "qty": "numeric quantity", "unit": "kg|liter|piece|pack|box|bottle|bag|dozen", "price": "numeric price per unit" }
]
If a field is unclear use null. No explanation, just the JSON array.`
      : `Extract grocery/household item details from this image.
Return ONLY a JSON object (use null if not found):
{ "name": "item name", "qty": "numeric quantity", "unit": "kg|liter|piece|pack|box|bottle", "price": "numeric price per unit" }
No explanation, just JSON.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: mode === 'bill' ? 1024 : 512,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    if (mode === 'bill') {
      const match = text.match(/\[[\s\S]*\]/);
      const items = match ? JSON.parse(match[0]) : [];
      return Response.json({ items });
    } else {
      const match = text.match(/\{[\s\S]*\}/);
      const data = match ? JSON.parse(match[0]) : {};
      return Response.json(data);
    }
  } catch {
    return Response.json({ error: 'Could not parse image data', raw: text }, { status: 422 });
  }
}
