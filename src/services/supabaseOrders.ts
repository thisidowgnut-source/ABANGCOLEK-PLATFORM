/** Optional cloud adapter. Failed writes never become successful local records. */
import { supabase } from './supabaseClient';
export interface SupabaseOrder {
  id:string;order_id:string;customer_name:string;city:string;items:string;amount:number;
  status:'Processing'|'Delivered'|'Delayed'|'Refunded'|'Cancelled';
  refund_reason?:string;created_at:string;delivered_date?:string;
}
const unavailable='Rekod cloud tidak dapat disahkan. Gunakan workspace pesanan platform atau semak sambungan sebenar.';
const statuses=new Set(['Processing','Delivered','Delayed','Refunded','Cancelled']);
function validRow(row:unknown):row is SupabaseOrder {
  if(!row||typeof row!=='object')return false;const value=row as Partial<SupabaseOrder>;
  return typeof value.id==='string'&&typeof value.order_id==='string'&&typeof value.customer_name==='string'&&typeof value.city==='string'&&typeof value.items==='string'&&typeof value.amount==='number'&&Number.isFinite(value.amount)&&value.amount>=0&&typeof value.status==='string'&&statuses.has(value.status)&&typeof value.created_at==='string'&&Number.isFinite(Date.parse(value.created_at));
}
async function authenticated(){const result=await supabase.auth.getSession();if(result.error||!result.data.session)throw new Error('Login cloud sebenar diperlukan.');}
/** Existing imports remain compatible; demo synchronization is unavailable. */
export async function seedInitialOrdersToSupabase():Promise<boolean>{return false;}
export async function fetchSupabaseOrders():Promise<{orders:SupabaseOrder[];isLive:boolean;error?:string}>{
  try{await authenticated();const result=await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
    if(result.error||!Array.isArray(result.data)||!result.data.every(validRow))return {orders:[],isLive:false,error:unavailable};
    return {orders:result.data,isLive:true};
  }catch{return {orders:[],isLive:false,error:unavailable};}
}
export async function insertSupabaseOrder(input:{customer_name:string;city:string;items:string;amount:number}):Promise<{success:boolean;data?:SupabaseOrder;error?:string}>{
  if(![input.customer_name,input.city,input.items].every(value=>typeof value==='string'&&value.trim().length>0&&value.length<=2000)||!Number.isFinite(input.amount)||input.amount<=0)return {success:false,error:'Maklumat pesanan tidak sah.'};
  try{await authenticated();const identifier='ORD-'+crypto.randomUUID();const result=await supabase.from('orders').insert({...input,id:identifier,order_id:identifier,status:'Processing',created_at:new Date().toISOString()}).select().single();
    if(result.error||!validRow(result.data))return {success:false,error:unavailable};
    return {success:true,data:result.data};
  }catch{return {success:false,error:unavailable};}
}
export async function updateSupabaseOrderStatus(orderId:string,status:'Processing'|'Delivered'|'Delayed'|'Refunded',refundReason?:string):Promise<{success:boolean;error?:string}>{
  if(!orderId||orderId.length>150||!statuses.has(status)||(refundReason&&refundReason.length>2000))return {success:false,error:'Status pesanan tidak sah.'};
  if(status==='Refunded')return {success:false,error:'Gunakan semakan refund dalam workspace pembayaran platform.'};
  try{await authenticated();const result=await supabase.from('orders').update({status}).eq('id',orderId).select('id');if(result.error||result.data?.length!==1)return {success:false,error:unavailable};return {success:true};}
  catch{return {success:false,error:unavailable};}
}
export function subscribeSupabaseOrders(onOrderChange:()=>void):()=>void{
  const channel=supabase.channel('public:orders_changes').on('postgres_changes',{event:'*',schema:'public',table:'orders'},onOrderChange).subscribe();
  return()=>{void supabase.removeChannel(channel);};
}
