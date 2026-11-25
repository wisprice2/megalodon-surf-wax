export async function onRequest({ request, env, params }) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método no permitido', { status: 405 });
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(params.name)) return new Response('No encontrado', { status: 404 });
  const item = await env.IMAGES.getWithMetadata(params.name, { type: 'arrayBuffer' });
  if (!item.value) return new Response('No encontrado', { status: 404 });
  return new Response(request.method === 'HEAD' ? null : item.value, { headers: {
    'Content-Type': item.metadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff'
  } });
}
