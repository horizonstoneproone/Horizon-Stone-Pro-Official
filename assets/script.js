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
  const dur=900;const start=performance.now();
  function step(t){
    const p=Math.min(1,(t-start)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*eased);
    if(p<1) requestAnimationFrame(step);
    else el.textContent=target;
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

// contact form (contact.html)
const contactForm=document.getElementById('contact-form');
if(contactForm){
  contactForm.addEventListener('submit', async function(e){
    e.preventDefault();
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
      alert('We could not send your request. Please try again or email sales@horizonstonepro.com.');
    }
  });
}

// optional project-detail fields toggle (contact.html)
const extraToggle=document.getElementById('extra-toggle');
const extraFields=document.getElementById('extra-fields');
if(extraToggle && extraFields){
  extraToggle.addEventListener('click',()=>{
    const open=extraFields.classList.toggle('show');
    extraToggle.textContent = open ? 'Hide project details' : '+ Add project details (optional)';
  });
}

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
