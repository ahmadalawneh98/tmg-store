// /scripts/app.js
import {
  fetchTopCategories,
  fetchCategoriesByParent,
  fetchAllProducts,
  fetchProductsByCategory
} from './api.js';

/* ========= Year ========= */
document.getElementById('y').textContent = new Date().getFullYear();

/* ========= Reveal on scroll ========= */
const io = new IntersectionObserver((es) => {
  es.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => {
        e.target.classList.add('show');
        io.unobserve(e.target);
      }, i * 150);
    }
  });
}, { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ========= Tilt on cards ========= */
function attachTilt(root = document) {
  root.querySelectorAll('.tilt').forEach(card => {
    const strength = 8; let raf = null;
    const move = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform =
        `perspective(1000px) rotateX(${py * strength}deg) rotateY(${-px * strength}deg) translateZ(20px)`;
    };
    const leave = () => { card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)'; };
    card.addEventListener('mousemove', e => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => move(e)); });
    card.addEventListener('mouseleave', leave);
  });
}

/* ========= Background glow particles ========= */
const c = document.getElementById('bgParticles');
const ctx = c.getContext('2d', { alpha: true });
let W, H, dpr, parts = [];

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = c.width = innerWidth * dpr;
  H = c.height = innerHeight * dpr;
  c.style.width = innerWidth + 'px';
  c.style.height = innerHeight + 'px';
  const n = Math.min(100, Math.floor(innerWidth / 10));
  parts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 3 + 1, s: Math.random() * 1.5 + .3,
    a: Math.random() * Math.PI * 2, color: Math.random() > 0.7 ? 'brand2' : 'brand',
    opacity: Math.random() * 0.6 + 0.2
  }));
}
resize(); addEventListener('resize', resize);

(function loop() {
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    p.x += Math.cos(p.a) * p.s; p.y += Math.sin(p.a) * p.s * 0.6; p.a += (Math.random() - .5) * 0.08;
    if (p.x < -50) p.x = W + 50; if (p.x > W + 50) p.x = -50; if (p.y < -50) p.y = H + 50; if (p.y > H + 50) p.y = -50;
    const colors = { brand: [255, 106, 0], brand2: [255, 143, 0] };
    const [r, g, b] = colors[p.color];
    const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 12);
    g1.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.4})`);
    g1.addColorStop(.4, `rgba(${r},${g},${b},${p.opacity * 0.15})`);
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 12, 0, Math.PI * 2); ctx.fill();
  }
  requestAnimationFrame(loop);
})();

/* ========= Render helpers ========= */
function renderCategories(items = []) {
  const grid = document.getElementById('categoriesGrid');
  grid.innerHTML = '';
  const tpl = document.getElementById('categoryCardTpl').content;

  items.forEach(it => {
    const n = tpl.cloneNode(true);
    const card = n.querySelector('.card');
    card.dataset.id = it.id ?? '';
    card.dataset.slug = it.slug ?? '';
    card.style.cursor = 'pointer';

    n.querySelector('img').src = it.image || '';
    n.querySelector('img').alt = it.name || 'Category';
    n.querySelector('.title').textContent = it.name || 'Category';
    grid.appendChild(n);
  });
}

function renderProducts(items = []) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  const tpl = document.getElementById('productCardTpl').content;
  items.forEach(it => {
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

/* ========= Products helpers ========= */
function pickPrice(p){
  const sp = Number(p?.sale_price || 0);
  const pr = Number(p?.price || 0);
  return sp > 0 ? sp : pr;
}

function mapProducts(raw = []) {
  return raw.map(p => ({
    id:    p?.id ?? p?._id ?? p?.uuid ?? null,
    title: p?.name ?? 'Product',
    image: p?.thumb || (Array.isArray(p?.images) ? p.images[0] : '') || '',
    price: pickPrice(p),
    url:   p?.slug ? `#/product/${p.slug}` : '#'
  }));
}

async function loadProducts({ categoryId = null, page = 1 } = {}) {
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = '<div class="loading">Loading…</div>';

  const res = categoryId
    ? await fetchProductsByCategory(categoryId, { page })
    : await fetchAllProducts({ page });

  const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);
  const items = mapProducts(raw);
  renderProducts(items);
}

/* ========= Back Button (only in subcategory) ========= */
let backBtn = document.getElementById('backBtn');
if (!backBtn) {
  backBtn = document.createElement('button');
  backBtn.id = 'backBtn';
  backBtn.textContent = 'Back';
  backBtn.className = 'back-btn';
  backBtn.style.display = 'none';

  const gridContainer = document.getElementById('categoriesGrid')?.parentElement;
  if (gridContainer) {
    gridContainer.insertBefore(backBtn, gridContainer.firstChild);
  } else {
    document.querySelector('.nav')?.appendChild(backBtn);
  }
}
backBtn.addEventListener('click', () => history.back());

function setBackVisibility(parentId) {
  backBtn.style.display = parentId ? 'inline-block' : 'none';
}

/* ========= Navigation (Categories/Sub-categories) ========= */
/* ========= Navigation (Categories/Sub-categories) ========= */
async function loadCategories(parentId = null) {
  setBackVisibility(parentId);

  const res = parentId ? await fetchCategoriesByParent(parentId) : await fetchTopCategories();
  const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);

  // 1) دائماً حمّل منتجات التصنيف المحدد (حتى لو عنده Sub-categories)
  if (parentId) {
    // اعرض منتجات هذا التصنيف
    await loadProducts({ categoryId: parentId, page: 1 });
    // اختياري: انزل لقسم المنتجات
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // في المستوى الأعلى، اعرض منتجات عامة (إن حاب ترجع تعرض الكل)
    await loadProducts({ page: 1 });
  }

  // 2) لو ما فيه Sub-categories، كملت تحميل المنتجات فوق وخلاص
  if (parentId && raw.length === 0) {
    return; // لا تعرض كروت Sub-categories لأنه ما فيه
  }

  // 3) اعرض كروت التصنيفات (لو فيه)
  const items = raw.map(c => ({
    id: c?.id ?? c?._id ?? c?.uuid ?? c?.pk ?? null,
    name: c?.name ?? 'Category',
    image: c?.thumb ?? c?.image ?? '',
    slug: c?.slug ?? ''
  }));

  renderCategories(items);
}

async function navigateToCategory(categoryId, slug) {
  history.pushState({ parentId: categoryId }, '', `#/categories/${categoryId}${slug ? ('/' + slug) : ''}`);
  // ملاحظة: الآن loadCategories نفسه صار يجيب المنتجات دائماً، فنداء واحد يكفي
  await loadCategories(categoryId);
}

/* Delegate clicks from container */
const categoriesGrid = document.getElementById('categoriesGrid');
if (categoriesGrid) {
  categoriesGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const slug = card.dataset.slug;
    if (!id) return console.warn('No category id on card. Check API mapping.');
    await navigateToCategory(id, slug);
  });
}

/* Browser Back/Forward support */
window.addEventListener('popstate', async (e) => {
  const parentId = e.state?.parentId ?? null;
  setBackVisibility(parentId);
  await loadCategories(parentId);
});

/* ========= Boot ========= */
(async () => {
  try {
    history.replaceState({ parentId: null }, '', '#/categories');
    setBackVisibility(null);
    await loadCategories(null);
    await loadProducts({ page: 1 }); // عرض المنتجات العامة في قسم Products
  } catch (err) {
    console.error('Failed to load:', err);
  }
})();

/* ========= Mobile menu toggle ========= */
const nav = document.querySelector('.nav');
const burger = document.querySelector('.burger');
if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('is-open');
    document.body.classList.toggle('menu-open', nav.classList.contains('is-open'));
  });
}

/* ========= Smooth scroll for nav links ========= */
document.querySelectorAll('.navlinks a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
      nav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }
  });
});
