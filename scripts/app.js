// /scripts/app.js - COMPLETE FIXED VERSION (ENGLISH)
import {
  fetchTopCategories,
  fetchCategoriesByParent,
  fetchAllProducts,
  fetchProductsByCategory,
  fetchProductsByCategories, // Re-added since it's fixed in api.js
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

// FIXED: Re-using fetchProductsByCategories with the fix
async function loadProducts({ categoryId = null, categoriesIn = null, page = 1 } = {}) {
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = '<div class="loading">Loading…</div>';

  console.log('Loading products with params:', { categoryId, categoriesIn, page }); // For debugging

  let res;
  try {
    if (Array.isArray(categoriesIn) && categoriesIn.length) {
      console.log('Using fetchProductsByCategories with IDs:', categoriesIn);
      res = await fetchProductsByCategories(categoriesIn, { page });
    } else if (categoryId) {
      console.log('Using fetchProductsByCategory with ID:', categoryId);
      res = await fetchProductsByCategory(categoryId, { page });
    } else {
      console.log('Using fetchAllProducts');
      res = await fetchAllProducts({ page });
    }

    console.log('Products API response:', res); // For debugging

    const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);
    console.log('Raw products after processing:', raw); // For debugging

    const items = mapProducts(raw);
    console.log('Mapped products:', items); // For debugging

    if (items.length === 0) {
      grid.innerHTML = '<div class="no-products">No products found in this category</div>';
    } else {
      renderProducts(items);
    }
  } catch (error) {
    console.error('Error loading products:', error);
    grid.innerHTML = '<div class="error">Error loading products</div>';
  }
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

/* ========= Navigation (Categories/Sub-categories) - FIXED & IMPROVED ========= */
async function loadCategories(parentId = null) {
  console.log('Loading categories for parentId:', parentId); // For debugging
  setBackVisibility(parentId);

  try {
    const res = parentId ? await fetchCategoriesByParent(parentId) : await fetchTopCategories();
    const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);
    console.log('Categories response:', raw); // For debugging

    if (parentId) {
      // Collect IDs for direct children + parent
      const childIds = raw.map(c => (c?.id ?? c?._id ?? c?.uuid ?? c?.pk)).filter(Boolean);
      const allIds = [parentId, ...childIds];
      console.log('All category IDs (parent + children):', allIds); // For debugging

      // Show products from parent + children (following original logic)
      await loadProducts({ categoriesIn: allIds, page: 1 });

      // Scroll to products section
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // If no sub-categories, just show products
      if (childIds.length === 0) {
        console.log('No subcategories found, showing only products');
        return;
      }
    } else {
      // Top level: general products
      await loadProducts({ page: 1 });
    }

    // Display category cards (if any)
    const items = raw.map(c => ({
      id: c?.id ?? c?._id ?? c?.uuid ?? c?.pk ?? null,
      name: c?.name ?? 'Category',
      image: c?.thumb ?? c?.image ?? '',
      slug: c?.slug ?? ''
    }));
    console.log('Mapped categories for display:', items); // For debugging
    renderCategories(items);
  } catch (error) {
    console.error('Error loading categories:', error);
    const grid = document.getElementById('categoriesGrid');
    if (grid) {
      grid.innerHTML = '<div class="error">Error loading categories</div>';
    }
  }
}

async function navigateToCategory(categoryId, slug) {
  console.log('Navigating to category:', categoryId, slug); // For debugging
  history.pushState({ parentId: categoryId }, '', `#/categories/${categoryId}${slug ? ('/' + slug) : ''}`);
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
    console.log('Category card clicked:', { id, slug }); // For debugging
    if (!id) return console.warn('No category id on card. Check API mapping.');
    await navigateToCategory(id, slug);
  });
}

/* Browser Back/Forward support */
window.addEventListener('popstate', async (e) => {
  const parentId = e.state?.parentId ?? null;
  console.log('Browser back/forward, parentId:', parentId); // For debugging
  setBackVisibility(parentId);
  await loadCategories(parentId);
});

/* ========= Boot ========= */
(async () => {
  try {
    console.log('Application starting...'); // For debugging
    history.replaceState({ parentId: null }, '', '#/categories');
    setBackVisibility(null);
    await loadCategories(null);
    console.log('Application loaded successfully'); // For debugging
  } catch (err) {
    console.error('Failed to load application:', err);
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