// Pages' static server can ignore Range. Adapt this one public video for seeking.
// One immutable asset buffer is shared within an isolate, not copied per request.
let asset;
let pending;
async function loadAsset(context) {
  if (asset) return asset;
  if (!pending) pending = (async () => {
    const response = await context.env.ASSETS.fetch(new Request(context.request.url));
    if (!response.ok || !response.headers.get('Content-Type')?.includes('video/mp4')) throw new Error('Video asset unavailable');
    return asset = { bytes: new Uint8Array(await response.arrayBuffer()), etag: response.headers.get('ETag') };
  })().finally(() => { pending = null; });
  return pending;
}

export async function onRequest(context) {
  const { request } = context;
  if (!['GET', 'HEAD'].includes(request.method)) return context.next();
  const range = request.headers.get('Range');
  if (!range && request.method !== 'HEAD') return context.next();
  const file = await loadAsset(context);
  const size = file.bytes.byteLength;
  const headers = new Headers({ 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=0, must-revalidate, no-transform',
    'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' });
  if (file.etag) headers.set('ETag', file.etag);
  if (request.method === 'HEAD') {
    headers.set('Content-Length', String(size));
    return new Response(null, { headers });
  }
  if (request.headers.has('If-Range') && request.headers.get('If-Range') !== file.etag) {
    headers.set('Content-Length', String(size));
    return new Response(file.bytes, { headers });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start, end;
  if (match && (match[1] || match[2])) {
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start || (!match[1] && Number(match[2]) === 0)) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(file.bytes.subarray(start, end + 1), { status: 206, headers });
}
