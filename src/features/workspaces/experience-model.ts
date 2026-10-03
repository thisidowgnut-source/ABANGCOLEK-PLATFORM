import type { FulfilmentStatus,PaymentState,WorkspaceRole } from '../../../shared/platform-contracts';

export function amountToSen(value: string): number {
  if(!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Masukkan amaun RM yang sah, maksimum 2 tempat perpuluhan.');
  const [whole,fraction='']=value.split('.');
  const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(amount)||amount<1) throw new Error('Amaun mesti lebih daripada RM0.00.');
  return amount;
}
export function positiveQuantity(value: string): number {
  const quantity=Number(value);
  if(!/^\d+$/.test(value)||!Number.isSafeInteger(quantity)||quantity<1) throw new Error('Kuantiti mesti nombor bulat positif.');
  return quantity;
}
export function malaysiaDateTime(value: string): string {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Pilih tarikh dan masa MYT yang sah.');
  const date=new Date(`${value}:00+08:00`);
  if(!Number.isFinite(date.getTime())||new Date(date.getTime()+8*3600000).toISOString().slice(0,16)!==value) throw new Error('Tarikh atau masa tidak sah.');
  return date.toISOString();
}
export function escapeCsvCell(value: unknown): string {
  let text=String(value??'');
  if(/^\s*[=+\-@]/.test(text)) text=`'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}
export function nextFulfilment(status: FulfilmentStatus,payment: PaymentState,role: WorkspaceRole): FulfilmentStatus|null {
  if(role==='customer') return status==='dispatched'? 'received':null;
  if(role!=='staff'&&role!=='founder') return null;
  if(status==='requested') return 'review';
  if(status==='review') return payment==='verified'? 'accepted':null;
  return ({ accepted: 'packing',packing: 'packed',packed: 'dispatched' } as Partial<Record<FulfilmentStatus,FulfilmentStatus>>)[status]??null;
}
export function campaignApprovalIssues(campaign: { copy: string; assets: { rights: string; consent: string; }[]; }): string[] {
  const issues: string[]=[];
  if(!campaign.copy.trim()) issues.push('Copy kempen diperlukan.');
  if(campaign.assets.some(asset => !asset.rights.trim()||!asset.consent.trim())) issues.push('Sahkan hak penggunaan dan consent bagi setiap aset.');
  return issues;
}
export const money=(sen: number) => new Intl.NumberFormat('ms-MY',{ style: 'currency',currency: 'MYR' }).format(sen/100);
export const dateLabel=(value: string) => new Intl.DateTimeFormat('ms-MY',{ dateStyle: 'medium',timeStyle: 'short',timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(value));
export function downloadText(name: string,content: string,type='text/plain') {
  const url=URL.createObjectURL(new Blob([content],{ type }));
  const anchor=document.createElement('a'); anchor.href=url; anchor.download=name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
