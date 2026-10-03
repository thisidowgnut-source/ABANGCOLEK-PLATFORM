import { test,expect } from '@playwright/test';
import { fixture,login } from './fixtures';

test('same workspace never retains previous account orders after a browser-session switch',async({page})=>{
  await login(page,'customer');const identity=(await (await page.request.get('/api/platform/session')).json()).data;
  const catalogueVersion=(await(await page.request.get('/api/platform/catalogue/version')).json()).data.version;
  const response=await page.request.post('/api/platform/orders',{headers:{Origin:fixture().origin,'X-CSRF-Token':identity.csrfToken,'Idempotency-Key':crypto.randomUUID()},data:{lines:[{productId:fixture().productId,quantity:1}],catalogueVersion,fulfilment:'pickup',contactRef:'Isolated QA privacy order'}});
  expect(response.ok()).toBe(true);const order=(await response.json()).data;
  await page.goto('/customer/orders');await expect(page.getByRole('button',{name:new RegExp(order.id)})).toBeVisible();
  const email=`privacy-${crypto.randomUUID()}@qa.invalid`;
  const switched=await page.request.post('/api/platform/auth/signup',{headers:{Origin:fixture().origin},data:{name:'Isolated second account',email,password:'random-qa-password-12345'}});expect(switched.ok()).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByText(email,{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:new RegExp(order.id)})).toHaveCount(0);
});

test('offline field draft restores when the existing server flow resumes',async({page})=>{
  await login(page,'customer');await page.goto('/flows/order');await page.getByRole('button',{name:'Mulakan flow'}).click();
  await page.getByRole('combobox',{name:'Produk',exact:true}).selectOption(fixture().productId);await page.getByLabel('Kuantiti',{exact:true}).fill('3');
  await page.getByLabel('Simpan draft pada device ini jika offline.',{exact:false}).check();
  await page.route('**/api/platform/flow-sessions/*/advance',route=>route.abort());
  await page.getByRole('button',{name:'Teruskan',exact:true}).click();await expect(page.getByText('Draft tersimpan pada device ini; belum diterima server.')).toBeVisible();
  await page.evaluate(()=>{const key=Object.keys(localStorage).find(value=>value.startsWith('abangcolek-private-draft:'));if(!key)throw new Error('Missing opted-in draft');const draft=JSON.parse(localStorage.getItem(key)!);draft.answers.contactRef='Pending offline pickup reminder';localStorage.setItem(key,JSON.stringify(draft));});
  await page.unroute('**/api/platform/flow-sessions/*/advance');await page.reload();
  await expect(page.getByLabel('Kuantiti',{exact:true})).toHaveValue('3');
  await expect(page.getByLabel('Simpan draft pada device ini jika offline.',{exact:false})).toBeChecked();
  await page.getByLabel('Kuantiti',{exact:true}).fill('2');await page.getByRole('button',{name:'Teruskan',exact:true}).click();
  await page.getByRole('button',{name:'Kembali satu langkah',exact:false}).click();
  await expect(page.getByLabel('Kuantiti',{exact:true})).toHaveValue('2');
  await page.reload();await expect(page.getByLabel('Kuantiti',{exact:true})).toHaveValue('2');
  expect(await page.evaluate(()=>{const key=Object.keys(localStorage).find(value=>value.startsWith('abangcolek-private-draft:'));return key?JSON.parse(localStorage.getItem(key)!).answers.contactRef:null;})).toBe('Pending offline pickup reminder');
});
