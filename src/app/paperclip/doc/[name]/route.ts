import { getDoc } from '@/lib/paperclip-auth';

const ALLOWED = new Set(['agentes', 'plano']);

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const html = ALLOWED.has(name) ? await getDoc(name) : null;
  if (!html) return new Response('Não autorizado', { status: 401, headers: { 'cache-control': 'no-store' } });
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' },
  });
}
