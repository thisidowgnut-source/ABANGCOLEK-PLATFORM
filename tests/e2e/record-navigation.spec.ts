import {expect,test} from '@playwright/test';
import {fixture,login} from './fixtures';
test('mobile sidebar is excluded from keyboard focus when closed and Escape returns to opener',async({page})=>{
 await page.setViewportSize({width:390,height:844});await login(page,'founder');
 const sidebar=page.getByLabel('Navigasi ruang kerja');await expect(sidebar).toHaveAttribute('inert','');
 await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();await expect(sidebar).not.toHaveAttribute('inert','');
 expect(await sidebar.evaluate(node=>node.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');await expect(sidebar).toHaveAttribute('inert','');
 await expect(page.getByRole('button',{name:'Buka navigasi',exact:true})).toBeFocused();
});
test('UUID linked calendar task opens its current collaboration and order deep links fetch source directly',async({page})=>{
 await login(page,'founder');const identity=(await(await page.request.get('/api/platform/session')).json()).data;
 const headers={Origin:fixture().origin,'X-CSRF-Token':identity.csrfToken,'Idempotency-Key':crypto.randomUUID()};
 const response=await page.request.post('/api/platform/tasks',{headers,data:{title:'QA source navigation',assigneeId:identity.user.id,entityId:'business',documentIds:[]}});expect(response.ok()).toBe(true);const task=(await response.json()).data;
 const event=await page.request.post('/api/platform/calendar',{headers:{...headers,'Idempotency-Key':crypto.randomUUID()},data:{title:'QA UUID source event',entityIds:[task.id],startAt:'2026-10-03T01:00:00Z',endAt:'2026-10-03T02:00:00Z'}});expect(event.ok()).toBe(true);
 await page.goto('/founder/calendar');await page.getByRole('button',{name:`Linked task: ${task.id}`,exact:true}).click();
 await expect(page).toHaveURL(new RegExp('/founder/tasks/'+task.id));await expect(page.getByRole('heading',{name:'Checklist & task conversation'})).toBeVisible();
 const catalogueVersion=(await(await page.request.get('/api/platform/catalogue/version')).json()).data.version;
 const order=await page.request.post('/api/platform/orders',{headers:{...headers,'Idempotency-Key':crypto.randomUUID()},data:{lines:[{productId:fixture().productId,quantity:1}],catalogueVersion,fulfilment:'pickup',contactRef:'QA deep link'}});expect(order.ok()).toBe(true);const id=(await order.json()).data.id;
 await page.goto('/founder/orders/'+id);await expect(page.getByRole('heading',{name:`Pesanan ${id}`,exact:true})).toBeVisible();
});
