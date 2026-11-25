import handler from '../../api/products.js';
import imageMap from '../../migration-image-map.js';
import { createHash } from 'node:crypto';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  let status = 200;
  let response;
  const res = {
    setHeader(key, value) { headers.set(key, value); },
    status(code) { status = code; return this; },
    json(value) {
      if (request.method === 'GET' && Array.isArray(value)) {
        value = value.map(item => item && typeof item === 'object'
          ? { ...item, images: (item.images || []).map(src => imageMap[createHash('sha256').update(src).digest('hex')] || src) }
          : item);
      }
      headers.set('Content-Type', 'application/json; charset=utf-8');
      response = new Response(JSON.stringify(status >= 500 ? { error: 'Servicio no disponible temporalmente' } : value), { status, headers });
      return response;
    },
    end() { response = new Response(null, { status, headers }); return response; }
  };

  try {
    let body;
    if (request.method === 'POST') {
      try { body = await request.json(); }
      catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }); }
      if (body === null || typeof body !== 'object') {
        return Response.json({ error: 'Solicitud inválida' }, { status: 400 });
      }
    }
    await handler({ method: request.method, query: Object.fromEntries(url.searchParams),
      headers: { authorization: request.headers.get('authorization') || '' }, body }, res, env);
    return response || Response.json({ error: 'Respuesta no disponible' }, { status: 500 });
  } catch {
    return Response.json({ error: 'No se pudo procesar la solicitud' }, { status: 500 });
  }
}
