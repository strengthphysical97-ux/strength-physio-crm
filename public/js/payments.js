const token=localStorage.getItem('crmToken');if(!token)location.href='login.html';
const $=x=>document.getElementById(x);
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function api(u){const r=await fetch(u,{headers:{Authorization:'Bearer '+token}});const d=await r.json();if(!r.ok||!d.success)throw Error(d.message||'Request failed');return d}
async function load(){
  const d=await api('/api/orders'); const orders=d.orders||[];
  const billing=orders.reduce((s,o)=>s+Number(o.totalAmount||0),0);
  const sale=orders.reduce((s,o)=>s+Number(o.amountPaid||0),0);
  const pending=Math.max(0,billing-sale);
  $('billing').textContent=money(billing);$('received').textContent=money(sale);$('pending').textContent=money(pending);
  $('open').textContent=orders.filter(o=>Number(o.remainingAmount||0)>0).length;
  $('rows').innerHTML=orders.filter(o=>Number(o.remainingAmount||0)>0).map(o=>`<tr><td><b>${esc(o.customer?.name)}</b><small class="muted-block">${esc(o.customer?.phone||'')}</small></td><td><span class="staff-badge">${esc(o.assignedTo?.name||'Unassigned')}</span></td><td>${esc(o.product)}</td><td>${money(o.totalAmount)}</td><td class="money-positive">${money(o.amountPaid)}</td><td class="money-warning">${money(Math.max(0,o.totalAmount-o.amountPaid))}</td><td>${esc(o.paymentStatus||'Pending')}</td></tr>`).join('')||'<tr><td colspan="7">No pending payments.</td></tr>';
}
load().catch(e=>{$('rows').innerHTML='<tr><td colspan="7">Unable to load collection data.</td></tr>';});
