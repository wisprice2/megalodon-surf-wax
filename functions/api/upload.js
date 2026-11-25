import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return Response.json({ error: 'Método no permitido' }, { status: 405 });
  if (!env.DATABASE_URL || !env.IMAGES) return Response.json({ error: 'Almacenamiento no disponible' }, { status: 503 });
  try {
    const sql = neon(env.DATABASE_URL);
    const [admin] = await sql('SELECT password_hash FROM admin_settings WHERE id = 1');
    if (!admin?.password_hash) return Response.json({ error: 'No autorizado' }, { status: 401 });
    const expected = createHmac('sha256', admin.password_hash).update('Admin').digest('hex');
    const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
    if (token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (Number(request.headers.get('content-length') || 0) > 11 * 1024 * 1024) {
      return Response.json({ error: 'La imagen no puede superar 10 MB' }, { status: 413 });
    }
    const form = await request.formData();
    const file = form.get('image');
    if (!file || typeof file === 'string') return Response.json({ error: 'Selecciona una imagen' }, { status: 400 });
    const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const extension = formats[file.type];
    if (!extension) return Response.json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' }, { status: 400 });
    if (!file.size || file.size > 10 * 1024 * 1024) return Response.json({ error: 'La imagen debe pesar entre 1 byte y 10 MB' }, { status: 413 });
    const key = `${crypto.randomUUID()}.${extension}`;
    await env.IMAGES.put(key, await file.arrayBuffer(), { metadata: { contentType: file.type } });
    return Response.json({ url: `/media/${key}` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'No se pudo guardar la imagen. Intenta nuevamente.' }, { status: 500 });
  }
}
