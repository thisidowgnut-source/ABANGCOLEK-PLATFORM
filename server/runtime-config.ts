export function runtimeConfig(env:Record<string,string|undefined>){
  const hostname=env.PLATFORM_HOST??'127.0.0.1',portText=env.PLATFORM_PORT??'3010';
  if(!/^[0-9]+$/.test(portText)||Number(portText)<1024||Number(portText)>65535)throw new Error('PLATFORM_PORT mesti integer antara 1024 dan 65535.');
  if(!['127.0.0.1','localhost','0.0.0.0','::1'].includes(hostname))throw new Error('PLATFORM_HOST tidak disokong.');
  const allowedOrigins=env.PLATFORM_ALLOWED_ORIGINS?.split(',').map(origin=>origin.trim())??['http://localhost:3000','http://127.0.0.1:3000'];
  if(!allowedOrigins.length||allowedOrigins.length>10)throw new Error('Gunakan 1–10 origin yang tepat.');
  for(const origin of allowedOrigins){
    let url:URL;try{url=new URL(origin);}catch{throw new Error('PLATFORM_ALLOWED_ORIGINS mengandungi origin tidak sah.');}
    if(url.origin!==origin||url.username||url.password||url.hash||url.search||url.pathname!=='/'||!['https:','http:'].includes(url.protocol))throw new Error('Origin mesti tepat tanpa path, credential atau wildcard.');
    if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('Origin awam memerlukan HTTPS.');
  }
  if(hostname==='0.0.0.0'&&(!env.PLATFORM_ALLOWED_ORIGINS||allowedOrigins.some(origin=>!origin.startsWith('https://'))))throw new Error('Public binding memerlukan allowlist HTTPS yang eksplisit.');
  return {hostname,port:Number(portText),allowedOrigins:[...new Set(allowedOrigins)]};
}
