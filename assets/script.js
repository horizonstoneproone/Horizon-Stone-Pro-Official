// scroll progress + sticky header state
const header=document.getElementById('site-header');
const bar=document.getElementById('scrollbar');
function onScroll(){
  const y=window.scrollY||document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y>10);
  const h=document.documentElement.scrollHeight-window.innerHeight;
  bar.style.width=(h>0?(y/h)*100:0)+'%';
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

// US map draw-in
const mapWrap=document.getElementById('map-wrap');
const mapOutline=mapWrap ? mapWrap.querySelector('.map-outline') : null;
if(mapOutline){
  const len=mapOutline.getTotalLength();
  mapOutline.style.strokeDasharray=len;
  mapOutline.style.strokeDashoffset=len;
  mapOutline.setAttribute('fill-opacity','0');
  mapOutline.style.transition='stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1), fill-opacity 1.6s ease .5s';
}

// reveal on scroll + count-up
const revealEls=document.querySelectorAll('.reveal, .reveal-stagger');
const counted=new WeakSet();
function countUp(el){
  const target=parseFloat(el.dataset.count);
  const fmt=n=>Math.round(n).toLocaleString('en-US');
  const dur=900;const start=performance.now();
  function step(t){
    const p=Math.min(1,(t-start)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=fmt(target*eased);
    if(p<1) requestAnimationFrame(step);
    else el.textContent=fmt(target);
  }
  requestAnimationFrame(step);
}
const io=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(el=>{
        if(!counted.has(el)){counted.add(el);countUp(el);}
      });
      if(entry.target===mapWrap && mapOutline){
        requestAnimationFrame(()=>{
          mapOutline.style.strokeDashoffset='0';
          mapOutline.setAttribute('fill-opacity','0.18');
        });
      }
      io.unobserve(entry.target);
    }
  });
},{threshold:0.15});
revealEls.forEach(el=>io.observe(el));

// cookie banner
const cookieBanner=document.getElementById('cookie-banner');
const cookieAccept=document.getElementById('cookie-accept');
let dismissed=false;
try{ dismissed = localStorage.getItem('hsp_cookie_ok')==='1'; }catch(e){}
if(!dismissed){ setTimeout(()=>cookieBanner.classList.add('show'),1200); }
if(cookieAccept){
  cookieAccept.addEventListener('click',()=>{
    cookieBanner.classList.remove('show');
    try{ localStorage.setItem('hsp_cookie_ok','1'); }catch(e){}
  });
}

// FAQ accordion (faq.html)
document.querySelectorAll('.f-item').forEach(item=>{
  const q=item.querySelector('.f-q');
  const a=item.querySelector('.f-a');
  q.addEventListener('click',()=>{
    const open=item.classList.contains('open');
    document.querySelectorAll('.f-item.open').forEach(o=>{o.classList.remove('open');o.querySelector('.f-a').style.maxHeight=null;});
    if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
  });
});

// multi-step contact form (contact.html)
const contactForm=document.getElementById('contact-form');
if(contactForm){
  const steps=[...contactForm.querySelectorAll('.msf-step')];
  const segs=[...contactForm.querySelectorAll('.msf-seg')];
  const errBox=document.getElementById('msf-err');
  let cur=1;
  function msfError(msg){
    if(!msg){errBox.classList.remove('show');errBox.textContent='';return;}
    errBox.textContent=msg;errBox.classList.add('show');
    errBox.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function showStep(n){
    cur=n;msfError(null);
    steps.forEach(s=>s.classList.toggle('show',+s.dataset.step===n));
    segs.forEach(g=>{
      const k=+g.dataset.seg;
      g.classList.toggle('active',k===n);
      g.classList.toggle('done',k<n);
      g.querySelector('.msf-bar i').style.width=k<n?'100%':(k===n?'100%':'0');
    });
  }
  function validStep(n){
    if(n===1){
      if(!contactForm.querySelector('input[name=service]:checked')){msfError('Pick a service to continue.');return false;}
    }
    if(n===2){
      if(!document.getElementById('msf-ptype').value){msfError('Select a project type to continue.');return false;}
    }
    if(n===3){
      const name=document.getElementById('msf-name').value.trim();
      const email=document.getElementById('msf-email').value.trim();
      const msg=document.getElementById('msf-msg').value.trim();
      if(!name){msfError('Tell us your name.');return false;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msfError('Enter a valid email address.');return false;}
      if(!msg){msfError('Add a line about your project.');return false;}
    }
    msfError(null);return true;
  }
  contactForm.querySelectorAll('[data-msf-next]').forEach(b=>b.addEventListener('click',()=>{if(validStep(cur))showStep(Math.min(3,cur+1));}));
  contactForm.querySelectorAll('[data-msf-back]').forEach(b=>b.addEventListener('click',()=>showStep(Math.max(1,cur-1))));
  // file dropzone
  const drop=document.getElementById('msf-drop'),fileInput=document.getElementById('msf-file'),fileList=document.getElementById('msf-files');
  if(drop&&fileInput){
    const renderFiles=()=>{
      fileList.innerHTML='';
      [...fileInput.files].slice(0,10).forEach(f=>{
        const chip=document.createElement('span');chip.className='dz-file';
        chip.textContent=f.name.length>28?f.name.slice(0,25)+'…':f.name;
        fileList.appendChild(chip);
      });
    };
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
    drop.addEventListener('drop',e=>{
      const dt=new DataTransfer();
      [...(e.dataTransfer.files||[])].slice(0,10).forEach(f=>dt.items.add(f));
      fileInput.files=dt.files;renderFiles();
    });
    fileInput.addEventListener('change',renderFiles);
  }
  contactForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!validStep(3))return;
    const button=document.getElementById('submit-button');
    const status=document.getElementById('form-status');
    const originalText=button.textContent;
    button.disabled=true;
    button.textContent='Sending...';
    const payload=new FormData(contactForm);
    try{
      const response=await fetch('https://formsubmit.co/ajax/sales@horizonstonepro.com',{
        method:'POST',
        headers:{'Accept':'application/json'},
        body:payload
      });
      if(!response.ok) throw new Error('Submission failed');
      contactForm.style.display='none';
      status.classList.add('show');
      if(typeof fbq==='function') fbq('track','Lead');
      if(typeof gtag==='function') gtag('event','generate_lead',{event_category:'form'});
    }catch(err){
      console.error(err);
      button.disabled=false;
      button.textContent=originalText;
      msfError('We could not send your request. Please try again or email sales@horizonstonepro.com.');
    }
  });
}

// before/after takeoff slider (index.html)
(function(){
  const ba=document.getElementById('ba-slider');
  if(!ba)return;
  let dragging=false;
  function setPos(clientX){
    const r=ba.getBoundingClientRect();
    let p=((clientX-r.left)/r.width)*100;
    p=Math.max(2,Math.min(98,p));
    ba.style.setProperty('--bapos',p+'%');
    ba.setAttribute('aria-valuenow',Math.round(p));
  }
  function start(e){dragging=true;ba.setPointerCapture&&e.pointerId!==undefined&&ba.setPointerCapture(e.pointerId);setPos(e.clientX);}
  function move(e){if(dragging)setPos(e.clientX);}
  function end(){dragging=false;}
  ba.addEventListener('pointerdown',start);
  ba.addEventListener('pointermove',move);
  ba.addEventListener('pointerup',end);
  ba.addEventListener('pointercancel',end);
  ba.addEventListener('keydown',e=>{
    const cur=parseFloat(getComputedStyle(ba).getPropertyValue('--bapos'))||50;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      const p=Math.max(2,Math.min(98,cur+(e.key==='ArrowRight'?4:-4)));
      ba.style.setProperty('--bapos',p+'%');
      ba.setAttribute('aria-valuenow',Math.round(p));
    }
  });
})();

// in-house cost calculator (services.html)
(function(){
  const staff=document.getElementById('calc-staff');
  if(!staff)return;
  const salary=document.getElementById('calc-salary');
  const bids=document.getElementById('calc-bids');
  const staffVal=document.getElementById('calc-staff-val');
  const salaryVal=document.getElementById('calc-salary-val');
  const bidsVal=document.getElementById('calc-bids-val');
  const total=document.getElementById('calc-total');
  const fmt=n=>n.toLocaleString('en-US');
  function calc(){
    const s=+staff.value, sal=+salary.value;
    staffVal.textContent=s;
    salaryVal.textContent='$'+fmt(sal);
    bidsVal.textContent=bids.value;
    const annual=Math.round(s*(sal*1.32+3600));
    total.dataset.count=annual;
    total.textContent=fmt(annual);
  }
  [staff,salary,bids].forEach(el=>el.addEventListener('input',calc));
  calc();
})();

// outbound click/engagement tracking (present on every page)
document.querySelectorAll('[data-track]').forEach(el=>{
  const isInputLike = el.tagName === 'INPUT';
  const evt = isInputLike ? 'change' : 'click';
  el.addEventListener(evt, ()=>{
    const action=el.dataset.track;
    const label=el.dataset.label || '';
    if(typeof fbq==='function'){
      if(action==='quote') fbq('trackCustom','RequestQuote');
      if(action==='pricing') fbq('trackCustom','PricingClick',{plan:label});
      if(action==='call' || action==='email') fbq('track','Contact',{method:action});
      if(action==='capabilities') fbq('trackCustom','CapabilitiesStatementDownload');
    }
    if(typeof gtag==='function') gtag('event',action,{event_category:'engagement',event_label:label});
  });
});

// mobile nav toggle
(function(){
  var btn = document.querySelector('.nav-toggle');
  var nav = document.querySelector('#site-header nav');
  if(!btn || !nav) return;
  btn.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    btn.classList.toggle('x', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function(e){
    if(e.target.closest('a')){ nav.classList.remove('open'); btn.classList.remove('x'); btn.setAttribute('aria-expanded','false'); }
  });
})();
