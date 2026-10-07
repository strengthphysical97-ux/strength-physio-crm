const token=localStorage.getItem('crmToken');
if(!token) location.href='login.html';
const user=JSON.parse(localStorage.getItem('crmUser')||'{}');
const $=x=>document.getElementById(x);
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const localISO=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const now=new Date();
const first=new Date(now.getFullYear(),now.getMonth(),1);
$('from').value=localISO(first); $('to').value=localISO(now);
if(user.role!=='admin') $('staffWrap').style.display='none';
async function api(url){const r=await fetch(url,{headers:{Authorization:'Bearer '+token}});const d=await r.json();if(!r.ok||!d.success)throw Error(d.message||'Unable to load report');return d}
function setStatus(msg,type=''){const el=$('reportStatus');el.textContent=msg;el.className='report-status '+type}
function renderDaily(rows){
  $('dailyRows').innerHTML=rows.map(x=>`<tr><td>${esc(x.label)}</td><td>${x.orders}</td><td>${money(x.billing)}</td><td class="money-positive">${money(x.sale)}</td><td class="money-warning">${money(x.pending)}</td></tr>`).join('')||'<tr><td colspan="5">No dates in selected range.</td></tr>';
  const max=Math.max(1,...rows.map(x=>x.sale));
  $('dailyBars').innerHTML=rows.map(x=>`<div class="bar-col" title="${esc(x.label)}: ${money(x.sale)}"><div class="bar-value">${money(x.sale)}</div><div class="bar-track"><i style="height:${Math.max(3,Math.round(x.sale/max*100))}%"></i></div><span>${esc(x.label.split(' ')[0])}</span></div>`).join('');
}
async function load(){
  const from=$('from').value,to=$('to').value;
  if(!from||!to){setStatus('Please select both From and To dates.','error');return}
  if(from>to){setStatus('To date cannot be before From date.','error');return}
  const btn=$('run');btn.disabled=true;btn.textContent='Generating…';setStatus('Generating report…');
  try{
    const q=new URLSearchParams({start:from,end:to});
    if(user.role==='admin'&&$('staff').value) q.set('staffId',$('staff').value);
    const d=await api('/api/reports?'+q);
    $('rReceived').textContent=money(d.summary.received);$('rPending').textContent=money(d.summary.pending);$('rOrders').textContent=d.summary.orders;
    $('rConversion').textContent=(d.summary.leads?Math.round(d.summary.converted/d.summary.leads*100):0)+'%';
    $('rangeLabel').textContent=`${from} → ${to}${user.role==='admin'&&$('staff').value?' · '+$('staff').selectedOptions[0].text:''}`;
    $('reportRows').innerHTML=d.orders.length?d.orders.map(o=>`<tr><td>${localDateLabel(o.orderDate)}</td><td>${esc(o.customer?.name)}</td><td><span class="staff-badge">${esc(o.assignedTo?.name||'Unassigned')}</span></td><td>${esc(o.product)}</td><td>${money(o.totalAmount)}</td><td class="money-positive">${money(o.amountPaid)}</td><td class="money-warning">${money(Math.max(0,o.totalAmount-o.amountPaid))}</td><td>${esc(o.paymentStatus)}</td></tr>`).join(''):'<tr><td colspan="8">No orders found for the selected filters.</td></tr>';
    renderDaily(d.daily||[]);
    $('teamCards').innerHTML=(d.staffSummary||[]).map(v=>`<div class="team-card"><div class="person-cell"><span class="mini-avatar">${esc(v.staff).charAt(0).toUpperCase()}</span><b>${esc(v.staff)}</b></div><strong>${money(v.sale)}</strong><span>${v.orders} orders · ${money(v.pending)} pending</span></div>`).join('')||'<div class="empty-state">No staff activity.</div>';
    window.__rows=d.orders; window.__daily=d.daily||[]; window.__reportMeta={from,to,staff:user.role==='admin'?($('staff').selectedOptions[0]?.text||'All staff'):'My data'};
    setStatus(`Report generated successfully · ${d.daily.length} day${d.daily.length===1?'':'s'} checked`,'success');
  }catch(e){setStatus(e.message,'error');$('reportRows').innerHTML='<tr><td colspan="8">Unable to generate report.</td></tr>'}
  finally{btn.disabled=false;btn.textContent='Generate Report'}
}
async function staff(){
  if(user.role!=='admin') return;
  try{const d=await api('/api/users');const users=(d.users||[]).filter(x=>x.role==='staff');$('staff').innerHTML='<option value="">All staff</option>'+users.map(x=>`<option value="${x._id}">${esc(x.name)}</option>`).join('')}catch(e){setStatus('Unable to load staff filter.','error')}
}
$('run').onclick=load;
function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function downloadCsv(filename, rows){
  const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n');
  const a=document.createElement('a');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function localDateLabel(value){
  if(!value) return '';
  const [y,m,d]=String(value).slice(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-IN');
}
$('exportDaily').onclick=()=>{
  const rows=window.__daily||[];
  if(!rows.length){setStatus('Generate a report first.','error');return;}
  const meta=window.__reportMeta||{};
  downloadCsv(`strength-physio-date-wise-${meta.from||'report'}-to-${meta.to||'report'}.csv`,[
    ['Date','Orders','Billing','Sale','Pending'],
    ...rows.map(x=>[x.label,x.orders,x.billing,x.sale,x.pending])
  ]);
  setStatus('Date-wise CSV exported successfully.','success');
};
$('exportOrders').onclick=()=>{
  const rows=window.__rows||[];
  if(!rows.length){setStatus('No order rows to export for this report.','error');return;}
  const meta=window.__reportMeta||{};
  downloadCsv(`strength-physio-orders-${meta.from||'report'}-to-${meta.to||'report'}.csv`,[
    ['Date','Customer','Phone','Staff','Product','Quantity','Billing','Sale','Pending','Payment Status','Order Status'],
    ...rows.map(o=>[localDateLabel(o.orderDate),o.customer?.name||'',o.customer?.phone||'',o.assignedTo?.name||'Unassigned',o.product||'',o.quantity||1,o.totalAmount||0,o.amountPaid||0,Math.max(0,(o.totalAmount||0)-(o.amountPaid||0)),o.paymentStatus||'Pending',o.orderStatus||''])
  ]);
  setStatus('Orders CSV exported successfully.','success');
};
$('reset').onclick=()=>{const n=new Date();$('from').value=localISO(new Date(n.getFullYear(),n.getMonth(),1));$('to').value=localISO(n);$('staff').value='';setStatus('Filters reset. Click Generate Report.');};
staff().catch(()=>{});
