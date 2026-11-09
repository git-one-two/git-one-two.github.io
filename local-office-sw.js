/* Optional, first-party static cache. No API, user document, certificate or request body is cached. */
const CACHE='veyneo-office-static-v1',LIMIT=150*1024*1024;
let writeQueue=Promise.resolve();
const allowed=value=>{const url=new URL(value,self.location.origin);return url.origin===self.location.origin&&!url.search&&(/^\/assets\/[A-Za-z0-9_.-]+$/.test(url.pathname)||/^\/fonts\/[A-Za-z0-9_.-]+$/.test(url.pathname)||/^\/ocr\/(?:models\/[a-z_]+\.traineddata\.gz|core\/[A-Za-z0-9_.-]+|worker.min.js)$/.test(url.pathname)||/^\/vendor\/heif\/libheif-bundle\.mjs$/.test(url.pathname)||['/index.html','/office.webmanifest','/office-icon.svg'].includes(url.pathname));};
async function inventory(){const cache=await caches.open(CACHE),keys=await cache.keys();return Promise.all(keys.map(async request=>{const response=await cache.match(request);return {url:new URL(request.url).pathname,bytes:Number(response.headers.get('X-Office-Cache-Bytes')||0)};}));}
function remember(url,response){const operation=writeQueue.then(async()=>{if(!response.ok||!allowed(url))throw Error('不是可缓存的本机静态资源');const type=response.headers.get('content-type')||'';if(!new URL(url,self.location.origin).pathname.endsWith('.html')&&type.includes('text/html'))throw Error('资源缺失，不能将错误页缓存为工具');const blob=await response.arrayBuffer();if(blob.byteLength>40*1024*1024)throw Error('单份静态资源超过40MB');const cache=await caches.open(CACHE),existing=await inventory(),path=new URL(url,self.location.origin).pathname;if(existing.filter(item=>item.url!==path).reduce((sum,item)=>sum+item.bytes,0)+blob.byteLength>LIMIT)throw Error('离线缓存达到150MB，请先清理');const headers=new Headers(response.headers);for(const key of ['content-encoding','content-length','vary','transfer-encoding','connection','keep-alive'])headers.delete(key);headers.set('X-Office-Cache-Bytes',String(blob.byteLength));await cache.put(new URL(url,self.location.origin).href,new Response(blob,{status:200,headers}));});writeQueue=operation.catch(()=>{});return operation;}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  if(/^\/(?:zh\/)?(?:account|admin|api)(?:\/|$)/.test(url.pathname))return;
  event.respondWith(fetch(request).catch(async()=>{if(!await caches.has(CACHE))return Response.error();const shell=await (await caches.open(CACHE)).match(new URL('/index.html',self.location.origin).href,{ignoreVary:true});return shell||Response.error();}));return;
 }
 if(!allowed(url.href))return;
 if(url.pathname==='/assets/offline-model-sizes.json'){event.respondWith((async()=>{if(!await caches.has(CACHE))return fetch(request);try{const response=await fetch(request);if(response.ok)event.waitUntil(remember(url.href,response.clone()).catch(()=>{}));return response;}catch{return await(await caches.open(CACHE)).match(request)||Response.error();}})());return;}
 event.respondWith((async()=>{if(!await caches.has(CACHE))return fetch(request);const cache=await caches.open(CACHE),found=await cache.match(request,{ignoreVary:true});if(found)return found;const response=await fetch(request);if(response.ok)event.waitUntil(remember(url.href,response.clone()).catch(()=>{}));return response;})());
});
self.addEventListener('message',event=>{const port=event.ports?.[0];if(!port)return;event.waitUntil((async()=>{try{
 if(event.data.type==='list')port.postMessage({entries:await inventory()});
 else if(event.data.type==='cache'){
  const urls=event.data.urls;if(!Array.isArray(urls)||urls.length>300||urls.some(url=>typeof url!=='string'||!allowed(url)))throw Error('离线资源列表无效');
  for(const url of [...new Set(urls)])await remember(url,await fetch(url,{credentials:'omit',cache:'reload'}));port.postMessage({entries:await inventory()});
 }else if(event.data.type==='clear'){await writeQueue;await caches.delete(CACHE);port.postMessage({entries:[]});}
 else throw Error('不支持的缓存操作');
 }catch(e){port.postMessage({error:String(e.message||e)});}})());});
