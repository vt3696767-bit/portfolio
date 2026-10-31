import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/videos/projects/short-drama-xingjuguanghe-web.mp4.js';
const bytes = Uint8Array.from({length: 100}, (_, index) => index);
let fetches = 0;
function context(range, method='GET', extra={}) {
  return { request: new Request('https://example.test/videos/projects/short-drama-xingjuguanghe-web.mp4', {method, headers:{...(range ? {Range:range}:{}),...extra}}),
    env:{ASSETS:{fetch:async()=>{fetches++;return new Response(bytes,{headers:{'Content-Type':'video/mp4',ETag:'"video"'}});}}},
    next:()=>new Response('static fallback') };
}
test('video range adapter serves exact first, middle, suffix and open-ended bytes', async()=>{
  for(const [range,start,end] of [['bytes=0-9',0,9],['bytes=50-59',50,59],['bytes=-10',90,99],['bytes=98-',98,99],['bytes=90-999',90,99]]) {
    const result=await onRequest(context(range));assert.equal(result.status,206);
    assert.equal(result.headers.get('Content-Range'),`bytes ${start}-${end}/100`);
    assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes.slice(start,end+1));
  }
  assert.equal(fetches,1);
});
test('invalid and unsatisfiable ranges return 416; HEAD and validators remain correct',async()=>{
  for(const range of ['bytes=','bytes=100-','bytes=5-2','bytes=-0','bytes=0-2,6-9']) assert.equal((await onRequest(context(range))).status,416);
  const head=await onRequest(context(null,'HEAD'));assert.equal(head.headers.get('Content-Length'),'100');assert.equal((await head.arrayBuffer()).byteLength,0);
  const mismatch=await onRequest(context('bytes=0-9','GET',{'If-Range':'"old"'}));assert.equal(mismatch.status,200);assert.equal((await mismatch.arrayBuffer()).byteLength,100);
  assert.equal(await (await onRequest(context(null))).text(),'static fallback');
});
