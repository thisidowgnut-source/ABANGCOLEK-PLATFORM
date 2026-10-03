import { useId,useState,type FormEvent } from 'react';
import type { FlowDefinition,FlowSession,OrderRecord,PublicProduct } from '../../../shared/platform-contracts';
import { lineAnswers } from './flow-answers';

export function FlowForm({definition,flow,products,orders,busy,onReview}:{definition:FlowDefinition;flow:FlowSession;products:PublicProduct[];orders:OrderRecord[];busy:boolean;onReview:(answers:Record<string,unknown>)=>Promise<void>}){
  const formId=useId(),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');
    const values=new FormData(event.currentTarget),answers:Record<string,unknown>={};
    try{
      for(const node of definition.nodes)if(node.field){
        if(node.field==='lines'){
          const product=products.find(item=>item.id===values.get('productId'));
          if(!product)throw new Error('Pilih produk diterbitkan.');
          Object.assign(answers,lineAnswers(definition.intent,product,Number(values.get('quantity'))));
        }else answers[node.field]=node.field==='expectedRevision'?Number(values.get(node.field)):String(values.get(node.field)??'').trim();
      }
      await onReview(answers);
    }catch(reason){setError(reason instanceof Error?reason.message:'Borang tidak sah.');}
  }
  const first=Array.isArray(flow.answers.lines)?flow.answers.lines[0] as {productId?:string;quantity?:number}:undefined;
  return <section className="flow-card flow-form-mode"><h2>Borang lengkap</h2><p className="flow-muted">Semua jawapan disemak oleh server yang sama sebelum submit.</p><form onSubmit={submit}>
    {definition.nodes.filter(node=>node.field).map(node=>{
      const field=node.field!,controlId=`${formId}-${field}`,value=typeof flow.answers[field]==='string'||typeof flow.answers[field]==='number'?String(flow.answers[field]):'';
      if(field==='lines')return <div key={node.id}><label htmlFor={controlId}>Produk</label><select id={controlId} name="productId" defaultValue={first?.productId??''} required><option value="">Pilih produk</option>{products.map(product=><option key={product.id} value={product.id} disabled={definition.intent!=='stock_receipt'&&product.availableQuantity<1}>{product.name}</option>)}</select><label htmlFor={`${controlId}-qty`}>Kuantiti</label><input id={`${controlId}-qty`} name="quantity" type="number" step={1} min={1} required defaultValue={first?.quantity??1}/></div>;
      return <div key={node.id}><label htmlFor={controlId}>{node.label??field}</label>{field==='orderId'?<select id={controlId} name={field} defaultValue={value} required><option value="">Pilih pesanan</option>{orders.map(order=><option key={order.id} value={order.id}>{order.id} · {order.fulfilmentStatus}</option>)}</select>:node.kind==='choice'?<select id={controlId} name={field} defaultValue={value} required={node.required}><option value="">Pilih…</option>{node.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:field==='description'||field==='contactRef'?<textarea id={controlId} name={field} rows={4} defaultValue={value} maxLength={node.maxLength??6000} required={node.required}/>:<input id={controlId} name={field} type={field==='expectedRevision'?'number':'text'} min={field==='expectedRevision'?1:undefined} step={field==='expectedRevision'?1:undefined} defaultValue={value} maxLength={node.maxLength??6000} required={node.required}/>}</div>;
    })}
    {error&&<p role="alert" className="platform-alert">{error}</p>}<button className="platform-primary" disabled={busy}>{busy?'Menyemak…':'Semak borang dengan server'}</button>
  </form></section>;
}
