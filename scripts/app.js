// scripts/app.js
import { fetchTopCategories } from './api.js';

/* ========= Year ========= */
document.getElementById('y').textContent = new Date().getFullYear();

/* ========= Reveal on scroll ========= */
const io = new IntersectionObserver(es=>{
  es.forEach((e, i)=>{
    if(e.isIntersecting){
      setTimeout(()=>{ e.target.classList.add('show'); io.unobserve(e.target); }, i*150);
    }
  });
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ========= Tilt on cards ========= */
function attachTilt(root=document){
  root.querySelectorAll('.tilt').forEach(card=>{
    const strength = 8; let raf=null;
    const move = (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - .5;
      const py = (e.clientY - r.top)/r.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${py*strength}deg) rotateY(${-px*strength}deg) translateZ(20px)`;
    };
    const leave = ()=>{ card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)'; };
    card.addEventListener('mousemove', e=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>move(e)); });
    card.addEventListener('mouseleave', leave);
  });
}

/* ========= Background glow particles ========= */
const c = document.getElementById('bgParticles');
const ctx = c.getContext('2d',{ alpha:true });
let W,H,dpr,parts=[];

function resize(){
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = c.width = innerWidth * dpr; 
  H = c.height = innerHeight * dpr;
  c.style.width = innerWidth+'px'; 
  c.style.height = innerHeight+'px';
  const n = Math.min(100, Math.floor(innerWidth/10));
  parts = Array.from({length:n}, ()=>({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*3+1, s: Math.random()*1.5+.3,
    a: Math.random()*Math.PI*2, color: Math.random()>0.7?'brand2':'brand',
    opacity: Math.random()*0.6+0.2
  }));
}
resize(); addEventListener('resize', resize);

(function loop(){
  ctx.clearRect(0,0,W,H);
  for(const p of parts){
    p.x += Math.cos(p.a)*p.s; p.y += Math.sin(p.a)*p.s*0.6; p.a += (Math.random()-.5)*0.08;
    if(p.x<-50) p.x=W+50; if(p.x>W+50) p.x=-50; if(p.y<-50) p.y=H+50; if(p.y>H+50) p.y=-50;
    const colors = { brand:[255,106,0], brand2:[255,143,0] };
    const [r,g,b] = colors[p.color];
    const g1 = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*12);
    g1.addColorStop(0,`rgba(${r},${g},${b},${p.opacity*0.4})`);
    g1.addColorStop(.4,`rgba(${r},${g},${b},${p.opacity*0.15})`);
    g1.addColorStop(1,'transparent');
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*12,0,Math.PI*2); ctx.fill();
  }
  requestAnimationFrame(loop);
})();

/* ========= Render helpers ========= */
function renderCategories(items=[]){
  const grid = document.getElementById('categoriesGrid');
  grid.innerHTML = '';
  const tpl = document.getElementById('categoryCardTpl').content;
  items.forEach(it=>{
    const n = tpl.cloneNode(true);
    n.querySelector('img').src = it.image || '';
    n.querySelector('img').alt = it.name || 'Category';
    n.querySelector('.title').textContent = it.name || 'Category';
    grid.appendChild(n);
  });
}

function renderProducts(items=[]){
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  const tpl = document.getElementById('productCardTpl').content;
  items.forEach(it=>{
    const n = tpl.cloneNode(true);
    n.querySelector('img').src = it.image || '';
    n.querySelector('img').alt = it.title || 'Product';
    n.querySelector('.title').textContent = it.title || 'Product';
    n.querySelector('.amount').textContent = (it.price ?? 0).toFixed(2);
    n.querySelector('.buy a').href = it.url || '#';
    grid.appendChild(n);
  });
  attachTilt(grid);
}

/* ========= Boot ========= */
(async ()=>{
  try{
    const data = await fetchTopCategories();
    // غيّر الماب حسب شكل الاستجابة الفعلي
    const items = (data?.data ?? data?.results ?? data)?.map(c => ({
      name: c.name ?? c.title ?? 'Category',
      image: c.image ?? c.thumbnail ?? c.icon ?? '',
    })) ?? [];
    renderCategories(items);
  }catch(err){
    console.error('Failed to load categories:', err);
  }
})();
