import type { CatalogueProduct, PublicProduct, InventoryMovement, InventoryReservation, OrderInput, OrderLine, OrderRecord, StockLot, PaymentState, FulfilmentStatus, VersionedQuote, EvidenceRecord } from '../../shared/platform-contracts';
import { Auth, hash, type Principal } from './auth';
import { fields, fail, id, integer, list, now, object, oneOf, PlatformStore, strings, text, date } from './store';

export interface PaymentRecord { id:string; orderId:string; amountSen:number; method:'cash'|'bank'; reference:string; state:'confirmed'|'refunded'; confirmedBy:string; createdAt:string }
export class Commerce {
  constructor(readonly store:PlatformStore, readonly auth:Auth) {}
  idem<T>(actor:Principal,operation:string,key:unknown,input:unknown,command:()=>T): T {
    const safeKey=text(key,'Idempotency key',120,8),inputHash=hash(JSON.stringify(input));
    return this.store.atomic(()=>{
      const row=this.store.db.query<{input_hash:string;data:string},[string,string,string]>('SELECT input_hash,data FROM dedupe WHERE actor_id=? AND operation=? AND key=?').get(actor.user.id,operation,safeKey);
      if (row) { if (row.input_hash!==inputHash) fail('IDEMPOTENCY_CONFLICT',409);return JSON.parse(row.data) as T; }
      const result=command();
      this.store.db.query('INSERT INTO dedupe VALUES(?,?,?,?,?,?)').run(actor.user.id,operation,safeKey,inputHash,JSON.stringify(result),now());
      return result;
    });
  }
  version() { return Number(this.store.metadata('catalogue_version')??'0'); }
  private custodyHeld(lotId: string, consumedOrderId?: string): number {
    return this.store.all<InventoryReservation & { custodyLotId?: string }>('reservations')
      .filter(reservation => reservation.custodyLotId === lotId && reservation.status === 'active' && reservation.expiresAt > now() && reservation.orderId !== consumedOrderId)
      .reduce((total, reservation) => total + reservation.quantity, 0);
  }
  expireReservations() {
    for (const reservation of this.store.all<InventoryReservation>('reservations')) if (reservation.status==='active'&&reservation.expiresAt<=now()) {
      this.store.save('reservations',{...reservation,status:'expired' as const,revision:reservation.revision+1});
      const order=this.store.get<OrderRecord>('orders',reservation.orderId);
      if (order&&['requested','review'].includes(order.fulfilmentStatus)) this.store.save('orders',{...order,fulfilmentStatus:'cancelled' as const,revision:order.revision+1,updatedAt:now()});
    }
  }
  available(productId:string,ownerId='business',locationId='hq') {
    const availableLots=this.store.all<StockLot>('lots').filter(l=>l.productId===productId&&l.ownerId===ownerId&&l.locationId===locationId&&l.status==='available'&&(!l.expiryAt||l.expiryAt>now()));
    const total=availableLots.reduce((n,l)=>n+l.quantity,0);
    // Physical returns also hold quarantined/expired units, which were never included in available stock.
    const reserved=this.store.all<InventoryReservation & {custodyLotId?:string}>('reservations').filter(r=>r.productId===productId&&r.ownerId===ownerId&&r.locationId===locationId&&r.status==='active'&&r.expiresAt>now()&&(!r.custodyLotId||availableLots.some(lot=>lot.id===r.custodyLotId))).reduce((n,r)=>n+r.quantity,0);
    return total-reserved;
  }
  catalogue():PublicProduct[] {
    return this.store.all<CatalogueProduct>('catalogue').filter(p=>p.status==='published').map(p=>({id:p.id,name:p.name,description:p.description,priceSen:p.priceSen,currency:p.currency,packSize:p.packSize,publishedVersion:this.version(),availableQuantity:this.available(p.id)}));
  }
  saveProduct(actor:Principal,raw:unknown) {
    this.auth.founder(actor);const input=object(raw);fields(input,['id','expectedRevision','name','description','priceSen','packSize','publish']);
    const existing=input.id?this.store.require<CatalogueProduct>('catalogue',text(input.id)):null;
    if (existing) this.store.revision(existing.revision,input.expectedRevision);
    if (typeof input.publish!=='boolean') fail('INVALID_INPUT');
    const version=this.version()+1;
    const record:CatalogueProduct={id:existing?.id??id(),name:text(input.name,'Nama produk',120),description:text(input.description,'Penerangan',3000),priceSen:integer(input.priceSen,'Harga',1),packSize:integer(input.packSize,'Saiz pek',1,10000),currency:'MYR',publishedVersion:input.publish?version:0,availableQuantity:0,revision:(existing?.revision??0)+1,status:input.publish?'published':'draft'};
    this.store.save('catalogue',record);this.store.setMetadata('catalogue_version',String(version));this.store.audit(actor.user.id,'catalogue.save',record.id,record.revision);return record;
  }
  lines(raw:unknown):{productId:string;quantity:number}[] {
    const result=list(raw,50).map(line=>{ const value=object(line);fields(value,['productId','quantity']);return {productId:text(value.productId,'Produk',120),quantity:integer(value.quantity,'Kuantiti',1,10000)}; });
    if (!result.length||new Set(result.map(l=>l.productId)).size!==result.length) fail('INVALID_ORDER_LINES');
    return result;
  }
  quote(actor:Principal,raw:unknown):VersionedQuote {
    const input=object(raw);fields(input,['lines','catalogueVersion','fulfilment','contactRef','outletId']);
    if (integer(input.catalogueVersion)!==this.version()) fail('REQUOTE_REQUIRED',409,'Harga katalog berubah. Semak semula pesanan.');
    const lines:OrderLine[]=this.lines(input.lines).map(line=>{
      const product=this.store.require<CatalogueProduct>('catalogue',line.productId);
      if (product.status!=='published') fail('PRODUCT_UNAVAILABLE',409);
      if (line.quantity%product.packSize!==0) fail('INVALID_PACK_QUANTITY',400);
      return {...line,name:product.name,priceSen:product.priceSen,publishedVersion:this.version()};
    });
    const totalSen=lines.reduce((sum,l)=>sum+l.priceSen*l.quantity,0);integer(totalSen,'Jumlah',1,1_000_000_000);
    const quote:VersionedQuote={id:id(),priceVersion:this.version(),catalogueVersion:this.version(),lines,totalSen,expiresAt:new Date(Date.now()+15*60_000).toISOString(),ownerId:actor.user.id};
    return this.store.save('quotes',quote);
  }
  submitOrder(actor:Principal,raw:unknown,key:unknown):OrderRecord {
    return this.idem(actor,'order.submit',key,raw,()=>{
      this.expireReservations();const input=object(raw);
      const quote=this.quote(actor,raw),outletId=input.outletId===undefined?'hq':text(input.outletId,'Lokasi',120);
      const fulfilment=oneOf(input.fulfilment,['pickup','delivery'] as const),contactRef=text(input.contactRef,'Maklumat penerimaan',2000);
      if (outletId!=='hq'&&!this.store.get<import('../../shared/platform-contracts').BusinessSettings>('settings','business')?.approvedPolicies.locations?.some(l=>l.id===outletId)) fail('LOCATION_UNAVAILABLE',409);
      for (const line of quote.lines) if (this.available(line.productId,'business',outletId)<line.quantity) fail('INSUFFICIENT_STOCK',409,'Stok tidak mencukupi.');
      const dealerOrgId=actor.memberships.find(m=>m.role==='customer'&&m.dealerOrgId)?.dealerOrgId;const order:OrderRecord={id:id(),customerId:actor.user.id,...(dealerOrgId?{dealerOrgId}:{}),lines:quote.lines,amountSen:quote.totalSen,fulfilment,contactRef,outletId,fulfilmentStatus:'requested',revision:1,paymentState:'pending',paidAmountSen:0,refundAmountSen:0,createdAt:now(),updatedAt:now()};
      this.store.save('orders',order);
      for (const line of order.lines) this.store.save<InventoryReservation>('reservations',{id:id(),orderId:order.id,productId:line.productId,ownerId:'business',locationId:outletId,quantity:line.quantity,status:'active',expiresAt:new Date(Date.now()+24*3600_000).toISOString(),revision:1});
      this.store.audit(actor.user.id,'order.submit',order.id);return order;
    });
  }
  order(actor:Principal,orderId:string) { const order=this.store.require<OrderRecord>('orders',orderId);this.auth.own(actor,order.customerId,order.outletId);return order; }
  orders(actor:Principal) { return this.store.all<OrderRecord>('orders').filter(o=>o.customerId===actor.user.id||this.auth.has(actor,'founder')||actor.memberships.some(m=>m.role==='staff'&&m.outletIds.includes(o.outletId))); }
  evidence(actor:Principal,evidenceIds:unknown,entityId:string,minimum=0) {
    const ids=strings(evidenceIds??[]);
    if (ids.length<minimum) fail('EVIDENCE_REQUIRED',409,'Bukti diperlukan untuk tindakan ini.');
    for (const evidenceId of ids) { const evidence=this.store.require<EvidenceRecord>('evidence',evidenceId);if (evidence.entityId!==entityId) fail('EVIDENCE_SCOPE',403); }
    return ids;
  }
  consume(order:Pick<OrderRecord,'id'|'lines'>) {
    const allocations: import('../../shared/dealer-contracts').DealerDispatchAllocation[] = [];
    const reservations=this.store.all<InventoryReservation>('reservations').filter(r=>r.orderId===order.id&&r.status==='active');
    if (reservations.length!==order.lines.length) fail('RESERVATION_EXPIRED',409);
    for (const reservation of reservations) {
      let remaining=reservation.quantity;
      if(reservation.expiresAt<=now())fail('RESERVATION_EXPIRED',409);
      for (const lot of this.store.all<StockLot>('lots').filter(l=>l.productId===reservation.productId&&l.ownerId===reservation.ownerId&&l.locationId===reservation.locationId&&l.status==='available'&&(!l.expiryAt||l.expiryAt>now()))) {
        const removed=Math.min(remaining,Math.max(0,lot.quantity-this.custodyHeld(lot.id,order.id)));if (!removed) continue;
        allocations.push({sourceLotId:lot.id,productId:lot.productId,quantity:removed,status:lot.status,...(lot.batchId?{batchId:lot.batchId}:{}),...(lot.expiryAt?{expiryAt:lot.expiryAt}:{})});
        this.store.save('lots',{...lot,quantity:lot.quantity-removed,revision:lot.revision+1});remaining-=removed;
        if (!remaining) break;
      }
      if (remaining) fail('INSUFFICIENT_STOCK',409);
      this.store.save<InventoryMovement>('movements',{id:id(),productId:reservation.productId,ownerId:reservation.ownerId,locationId:reservation.locationId,quantityDelta:-reservation.quantity,operationKey:`consume:${reservation.id}`,sourceEntityId:order.id,createdAt:now()});
      this.store.save('reservations',{...reservation,status:'consumed' as const,revision:reservation.revision+1});
    }
    return allocations;
  }
  transition(actor:Principal,orderId:string,raw:unknown) {
    const input=object(raw);fields(input,['expectedRevision','next','evidenceIds']);
    const order=this.order(actor,orderId);this.store.revision(order.revision,input.expectedRevision);
    const next=oneOf(input.next,['requested','review','accepted','packing','packed','dispatched','received','cancelled'] as const);
    const transitions:Record<FulfilmentStatus,FulfilmentStatus[]>={requested:['review','cancelled'],review:['accepted','cancelled'],accepted:['packing','cancelled'],packing:['packed'],packed:['dispatched'],dispatched:['received'],received:[],cancelled:[]};
    if (!transitions[order.fulfilmentStatus].includes(next)) fail('INVALID_TRANSITION',409,'Perubahan status tidak dibenarkan.');
    if (next==='cancelled'&&order.customerId===actor.user.id&&['requested','review'].includes(order.fulfilmentStatus)) {} else if (next==='received'&&order.customerId===actor.user.id) {} else this.auth.operational(actor,order.outletId);
    if (next==='accepted'&&order.paymentState!=='verified') fail('PAYMENT_NOT_VERIFIED',409);
    if(next==='accepted'){const reservations=this.store.all<InventoryReservation>('reservations').filter(r=>r.orderId===order.id);if(reservations.length!==order.lines.length||reservations.some(r=>r.status!=='active'||r.expiresAt<=now()))fail('RESERVATION_EXPIRED',409);for(const reservation of reservations)this.store.save('reservations',{...reservation,expiresAt:'9999-12-31T23:59:59.999Z',revision:reservation.revision+1});}
    if (['packed','dispatched','received'].includes(next)) this.evidence(actor,input.evidenceIds,order.id,1);
    if (next==='packed') this.consume(order);
    if (next==='cancelled') for (const reservation of this.store.all<InventoryReservation>('reservations').filter(r=>r.orderId===order.id&&r.status==='active')) this.store.save('reservations',{...reservation,status:'released' as const,revision:reservation.revision+1});
    const updated={...order,fulfilmentStatus:next,revision:order.revision+1,updatedAt:now()};this.store.save('orders',updated);this.store.audit(actor.user.id,`order.${next}`,order.id,updated.revision);return updated;
  }
  payment(actor:Principal,orderId:string,raw:unknown,key:unknown) {
    const initial=this.order(actor,orderId),requestedAction=object(raw).action;
    if(requestedAction==='request_refund'){if(initial.customerId!==actor.user.id&&!this.auth.has(actor,'founder'))fail('FORBIDDEN',403);}else this.auth.founder(actor);
    return this.idem(actor,`payment.command:${orderId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedRevision','action','amountSen','reference','evidenceIds','method']);
      const order=this.order(actor,orderId);this.store.revision(order.revision,input.expectedRevision);
      const action=oneOf(input.action,['verify','reject','request_refund','refund'] as const);
      let paymentState:PaymentState=order.paymentState,paidAmountSen=order.paidAmountSen,refundAmountSen=order.refundAmountSen;
      if (action==='request_refund') { if (order.customerId!==actor.user.id&&!this.auth.has(actor,'founder')) fail('FORBIDDEN',403);if (!['verified','part_refunded'].includes(paymentState)) fail('INVALID_TRANSITION',409);paymentState='refund_requested'; }
      else {
        this.auth.founder(actor);
        if (action==='reject') { if (paymentState!=='pending') fail('INVALID_TRANSITION',409);paymentState='rejected'; }
        if (action==='verify') {
          if (!['pending','rejected'].includes(paymentState)) fail('INVALID_TRANSITION',409);
          const amount=integer(input.amountSen,'Amaun diterima',1,1_000_000_000);if (amount!==order.amountSen) fail('PAYMENT_AMOUNT_MISMATCH',409);
          const reference=text(input.reference,'Rujukan bank/terimaan tunai yang diperiksa',200);
          this.evidence(actor,input.evidenceIds,orderId,1);
          if (this.store.all<PaymentRecord>('payments').some(p=>p.reference===reference)||this.store.all<{reference:string}>('dealer_settlement_payments').some(p=>p.reference===reference)) fail('PAYMENT_REFERENCE_USED',409);
          const method=oneOf(input.method,['cash','bank'] as const);
          this.store.save<PaymentRecord>('payments',{id:id(),orderId,amountSen:amount,method,reference,state:'confirmed',confirmedBy:actor.user.id,createdAt:now()});paidAmountSen=amount;paymentState='verified';
        }
        if (action==='refund') {
          if (!['refund_requested','part_refunded','verified'].includes(paymentState)) fail('INVALID_TRANSITION',409);
          const amount=integer(input.amountSen,'Amaun refund',1,paidAmountSen-refundAmountSen),reference=text(input.reference,'Rujukan refund',200);
          this.evidence(actor,input.evidenceIds,orderId,1);
          if (this.store.all<PaymentRecord>('payments').some(p=>p.reference===reference)||this.store.all<{reference:string}>('dealer_settlement_payments').some(p=>p.reference===reference)) fail('PAYMENT_REFERENCE_USED',409);
          this.store.save<PaymentRecord>('payments',{id:id(),orderId,amountSen:amount,method:oneOf(input.method,['cash','bank'] as const),reference,state:'refunded',confirmedBy:actor.user.id,createdAt:now()});refundAmountSen+=amount;paymentState=refundAmountSen===paidAmountSen?'refunded':'part_refunded';
        }
      }
      const updated={...order,paymentState,paidAmountSen,refundAmountSen,revision:order.revision+1,updatedAt:now()};this.store.save('orders',updated);this.store.audit(actor.user.id,`payment.${action}`,orderId,updated.revision);return updated;
    });
  }
  receive(actor:Principal,raw:unknown,key:unknown) {
    const requested=object(raw);this.auth.operational(actor,text(requested.locationId));if(requested.ownerId!=='business')this.auth.founder(actor);
    return this.idem(actor,'inventory.receive',key,raw,()=>{
      const input=object(raw);fields(input,['productId','ownerId','locationId','quantity','reason','status','batchId','expiryAt','custodyId']);
      const productId=text(input.productId),ownerId=text(input.ownerId),locationId=text(input.locationId);this.auth.operational(actor,locationId);
      // Non-business ownership originates in approved dealer receipts, never in arbitrary staff input.
      if (ownerId!=='business') this.auth.founder(actor);
      this.store.require<CatalogueProduct>('catalogue',productId);text(input.reason,'Sebab penerimaan',2000);
      const lot:StockLot={id:id(),productId,ownerId,locationId,custodyId:input.custodyId===undefined?ownerId:text(input.custodyId),quantity:integer(input.quantity,'Kuantiti',1,1_000_000),status:oneOf(input.status,['available','quarantine','damaged'] as const),revision:1,...(input.batchId?{batchId:text(input.batchId)}:{}),...(input.expiryAt?{expiryAt:date(input.expiryAt)}:{})};
      if(lot.status==='available'&&lot.expiryAt&&lot.expiryAt<=now())fail('EXPIRED_STOCK',409);
      this.store.save('lots',lot);this.store.save<InventoryMovement>('movements',{id:id(),productId,ownerId,locationId,quantityDelta:lot.quantity,operationKey:text(key),sourceEntityId:lot.id,createdAt:now()});this.store.audit(actor.user.id,'inventory.receive',lot.id);return lot;
    });
  }
  inventory(actor:Principal) {
    const permitted=(ownerId:string,locationId:string)=>this.auth.has(actor,'founder')||actor.memberships.some(m=>(m.role==='staff'&&m.outletIds.includes(locationId))||(m.role==='customer'&&m.dealerOrgId===ownerId));
    return {lots:this.store.all<StockLot>('lots').filter(l=>permitted(l.ownerId,l.locationId)||actor.memberships.some(m=>m.dealerOrgId===l.custodyId)),movements:this.store.all<InventoryMovement>('movements').filter(l=>permitted(l.ownerId,l.locationId)||actor.memberships.some(m=>m.dealerOrgId===l.locationId)),reservations:this.store.all<InventoryReservation>('reservations').filter(l=>permitted(l.ownerId,l.locationId))};
  }
  quarantine(actor:Principal,lotId:string,raw:unknown) {
    const input=object(raw);fields(input,['expectedRevision','status','reason']);const lot=this.store.require<StockLot>('lots',lotId);this.auth.operational(actor,lot.locationId);this.store.revision(lot.revision,input.expectedRevision);text(input.reason,'Sebab',2000);
    const status=oneOf(input.status,['quarantine','damaged'] as const),updated={...lot,status,revision:lot.revision+1};this.store.save('lots',updated);this.store.audit(actor.user.id,`inventory.${status}`,lotId,updated.revision);return updated;
  }
  adjust(actor:Principal,lotId:string,raw:unknown,key:unknown){this.auth.founder(actor);return this.idem(actor,`inventory.adjust:${lotId}`,key,raw,()=>{const input=object(raw);fields(input,['expectedRevision','quantity','reason']);const lot=this.store.require<StockLot>('lots',lotId);this.store.revision(lot.revision,input.expectedRevision);text(input.reason,'Sebab adjustment',4000);const quantity=integer(input.quantity,'Kiraan fizikal',0,1_000_000),delta=quantity-lot.quantity;if(quantity<this.custodyHeld(lot.id))fail('RESERVED_LOT_ADJUSTMENT',409);if(lot.status==='available'&&delta<0&&this.available(lot.productId,lot.ownerId,lot.locationId)<-delta)fail('RESERVED_STOCK_ADJUSTMENT',409);const updated={...lot,quantity,revision:lot.revision+1};this.store.save('lots',updated);this.store.save<InventoryMovement>('movements',{id:id(),productId:lot.productId,ownerId:lot.ownerId,locationId:lot.locationId,quantityDelta:delta,operationKey:text(key),sourceEntityId:lotId,createdAt:now()});this.store.audit(actor.user.id,'inventory.adjust',lotId,updated.revision);return updated;});}
  transfer(actor:Principal,lotId:string,raw:unknown,key:unknown){const initial=this.store.require<StockLot>('lots',lotId);this.auth.operational(actor,initial.locationId);const target=text(object(raw).locationId);this.auth.operational(actor,target);return this.idem(actor,`inventory.transfer:${lotId}`,key,raw,()=>{const input=object(raw);fields(input,['expectedRevision','locationId','quantity','reason']);const lot=this.store.require<StockLot>('lots',lotId);this.store.revision(lot.revision,input.expectedRevision);text(input.reason,'Sebab transfer',4000);if(target===lot.locationId)fail('INVALID_TRANSFER');const quantity=integer(input.quantity,'Kuantiti',1,lot.quantity);if(quantity>lot.quantity-this.custodyHeld(lot.id))fail('RESERVED_LOT_TRANSFER',409);if(lot.status==='available'&&quantity>this.available(lot.productId,lot.ownerId,lot.locationId))fail('RESERVED_STOCK_TRANSFER',409);this.store.save('lots',{...lot,quantity:lot.quantity-quantity,revision:lot.revision+1});const transferred={...lot,id:id(),quantity,locationId:target,revision:1};this.store.save('lots',transferred);for(const movement of [{locationId:lot.locationId,quantityDelta:-quantity},{locationId:target,quantityDelta:quantity}])this.store.save<InventoryMovement>('movements',{id:id(),productId:lot.productId,ownerId:lot.ownerId,...movement,operationKey:`${text(key)}:${movement.locationId}`,sourceEntityId:lotId,createdAt:now()});this.store.audit(actor.user.id,'inventory.transfer',lotId,lot.revision+1);return transferred;});}
}
