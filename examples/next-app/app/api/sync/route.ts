// examples/next-app/app/api/sync/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json(); // { mutations: [...] }
    const count = Array.isArray(body?.mutations) ? body.mutations.length : 0;

    // TODO: apply mutations to your DB (Prisma) here.
    // For the demo we just ACK.
    return NextResponse.json({ ok: true, received: count }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
