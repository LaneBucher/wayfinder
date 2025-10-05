import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    await req.text(); // drain
  } catch {}
  return NextResponse.json({ ok: true }, { status: 200 });
}