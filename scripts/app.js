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

/* ========= Views (list=Categories+Products, product=ProductPage) ========= */
function showView(mode) {
  const cat = document.getElementById('categories');
  const prod = document.getElementById('products');
  const prodPage = document.getElementById('productPage');
  if (!cat || !prod || !prodPage) return;

  if (mode === 'product') {
    cat.style.display = 'none';
    prod.style.display = 'none';
    prodPage.style.display = '';
  } else { // 'list'
    cat.style.display = '';
    prod.style.display = '';
    prodPage.style.display = 'none';
  }
}

function renderProducts(items = []) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  const tpl = document.getElementById('productCardTpl').content;

  items.forEach(it => {
    const n = tpl.cloneNode(true);

    const card    = n.querySelector('.card');
    const img     = n.querySelector('img');
    const titleEl = n.querySelector('.title');
    const amount  = n.querySelector('.amount');
    const buyA    = n.querySelector('.buy a');

    img.src = it.image || '';
    img.alt = it.title || 'Product';
    titleEl.textContent = it.title || 'Product';
    amount.textContent = (it.price ?? 0).toFixed(2);

    // slug from item or url
    const slug = it.slug || (it.url && it.url.startsWith('#/product/')
                  ? it.url.split('/').pop()
                  : '');
    card.dataset.id = it.id ?? '';
    card.dataset.slug = slug ?? '';

    // buy link
    buyA.href = slug ? `#/product/${slug}` : (it.url || '#');

    // open product on card click
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.buy')) return; // let Buy button work normally
      if (slug) {
        navigateToProduct(it.id, slug);
      } else if (it.url) {
        location.href = it.url;
      }
    });

    grid.appendChild(n);
  });

  attachTilt(grid);
}

/* ========= Product navigation & loading ========= */
async function navigateToProduct(productId, slug) {
  history.pushState({ view: 'product', productId, slug }, '', `#/product/${slug || productId}`);
  await loadProduct({ productId, slug });
}

// ======= REPLACE ONLY THIS FUNCTION IN /scripts/app.js =======
async function loadProduct({ productId = null, slug = null } = {}) {
  showView('product');
  const box = document.getElementById('productDetails');
  box.innerHTML = '<div class="loading">Loading product…</div>';

  try {
    // 1) Fetch get-one product (via your /api/products proxy)
    let p;
    if (productId) {
      const r = await fetch(`/api/products?id=${encodeURIComponent(productId)}&join=categories,variations,variants`);
      if (!r.ok) throw new Error(await r.text());
      p = await r.json();                        // ← كائن منتج واحد
    } else if (slug) {
      const url = new URL('/api/products', location.origin);
      url.searchParams.append('filter', `slug||eq||${slug}`);
      url.searchParams.set('limit', '1');
      url.searchParams.set('join', 'categories,variations,variants');
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      p = (Array.isArray(j) ? j : (j?.data ?? []))[0] || null;
    }
    if (!p) { box.innerHTML = '<div class="error">Product not found</div>'; return; }

    // 2) Normalize
    const basePrice = Number(p.price || 0);
    const salePrice = Number(p.sale_price || 0);
    const gallery   = Array.isArray(p.images) && p.images.length ? p.images : (p.thumb ? [p.thumb] : []);
    const cats      = Array.isArray(p.categories) ? p.categories : [];
    const variations = Array.isArray(p.variations) ? p.variations : [];
    const variants   = Array.isArray(p.variants)   ? p.variants   : [];

    // 3) Selection state
    const selected = {};          // { [variationName]: value }
    let selectedVariant = null;   // matched variant object

    function matchVariant() {
      if (!variations.length || !variants.length) return null;
      // يجب اختيار جميع الـ variations
      for (const v of variations) if (!selected[v.name]) return null;
      return variants.find(v => {
        const props = Array.isArray(v.variation_props) ? v.variation_props : [];
        return Object.entries(selected).every(([name, val]) =>
          props.some(pp => String(pp.variation) === String(name) && String(pp.variation_prop) === String(val))
        );
      }) || null;
    }

    function currentPrice() {
      // لو فيه variant مطابق استخدم سعره، وإلا استخدم سعر المنتج (مع خصم إن وجد)
      if (selectedVariant) {
        const vp = Number(selectedVariant.sale_price || 0) > 0
          ? Number(selectedVariant.sale_price)
          : Number(selectedVariant.price || basePrice);
        return vp;
      }
      return Number(salePrice || 0) > 0 ? salePrice : basePrice;
    }

    function stockLabel() {
      if (selectedVariant) {
        const q = Number(selectedVariant.quantity || 0);
        return q > 0 ? `In stock • ${q}` : 'Out of stock';
      }
      if (p.track_stock) {
        const q = Number(p.quantity || 0);
        return q > 0 ? `In stock • ${q}` : 'Out of stock';
      }
      return 'Available';
    }

    // 4) Render variations UI
   function renderVariations() {
  if (!variations.length) return '';

  const blocks = variations.map(v => {
    // اجلب المصفوفة مهما كان اسم الحقل
    const rawProps =
      Array.isArray(v.props)   ? v.props :
      Array.isArray(v.values)  ? v.values :
      Array.isArray(v.options) ? v.options : [];

    // طبّع العناصر إلى شكل موحّد {name, value}
    const props = rawProps.map(pr => ({
      name:  pr.name ?? pr.label ?? pr.value ?? '',
      value: pr.value ?? pr.name  ?? pr.label ?? ''
    })).filter(p => p.value !== '');

    if (!props.length) return '';

    const type = String(v.type || 'buttons').toLowerCase();

    if (type === 'dropdown') {
      const opts = ['<option value="">— Select —</option>']
        .concat(props.map(pr => `<option value="${pr.value}">${pr.name}</option>`))
        .join('');
      return `
        <label class="var-block dropdown">
          <div class="var-title">${v.name}</div>
          <select class="var-select" data-vname="${v.name}">
            ${opts}
          </select>
        </label>
      `;
    }

    // buttons / color
    const btns = props.map(pr => `
      <button type="button" class="var-btn" data-vname="${v.name}" data-vval="${pr.value}">
        ${pr.name}
      </button>
    `).join('');

    return `
      <div class="var-block ${type}">
        <div class="var-title">${v.name}</div>
        <div class="var-options">${btns}</div>
      </div>
    `;
  }).join('');

  // لو لم ينتج أي بلوك بعد التطبيع، لا تعرض القسم
  if (!blocks.trim()) return '';
  return `<div class="pd-variations"><h4>Options</h4>${blocks}</div>`;
}

    // 5) Page HTML
    box.innerHTML = `
      <article class="product-details card-xl">
        <div class="pd-media">
          <div class="pd-gallery">
            ${gallery.map((src,i)=>`<img class="pd-img ${i===0?'active':''}" src="${src}" alt="${p.name || 'Product'} ${i+1}" />`).join('')}
          </div>
          ${gallery.length>1 ? `
            <div class="pd-thumbs">
              ${gallery.map((src,i)=>`<img class="pd-thumb ${i===0?'active':''}" src="${src}" data-index="${i}" alt="thumb ${i+1}" />`).join('')}
            </div>` : ''}
        </div>

        <div class="pd-body">
          <h2>${p.name || 'Product'}</h2>

          <div class="pd-meta">
            <div class="pd-price" id="pdPrice"></div>
            <div class="pd-stock" id="pdStock"></div>
            ${p.is_free_shipping ? `<div class="pd-badge free-ship">Free Shipping</div>` : ''}
          </div>

          ${cats.length ? `<div class="pd-cats"><b>Categories:</b> ${cats.map(c=>c.name||c.slug||c.id).join(', ')}</div>` : ''}

          <div id="pdVarsWrap">${renderVariations()}</div>

          ${p.description ? `<div class="pd-desc">${p.description}</div>` : ''}

          <div class="pd-actions">
            <button id="proceedBtn" class="btn primary">Proceed to Checkout</button>
            <button id="pdBack" class="btn">Back</button>
          </div>
        </div>
      </article>
    `;

    // 6) thumbs switch
    const thumbs = box.querySelectorAll('.pd-thumb');
    const imgs   = box.querySelectorAll('.pd-img');
    thumbs.forEach(t=>{
      t.addEventListener('click', ()=>{
        const idx = Number(t.dataset.index||0);
        imgs.forEach(i=>i.classList.remove('active'));
        thumbs.forEach(i=>i.classList.remove('active'));
        imgs[idx]?.classList.add('active');
        t.classList.add('active');
      });
    });

    // 7) price/stock refresh
    function refreshMeta() {
      selectedVariant = matchVariant();
      const priceNode = box.querySelector('#pdPrice');
      const stockNode = box.querySelector('#pdStock');

      if (!selectedVariant && salePrice > 0) {
        priceNode.innerHTML = `<del>€ ${basePrice.toFixed(2)}</del> <strong>€ ${salePrice.toFixed(2)}</strong>`;
      } else {
        priceNode.innerHTML = `<strong>€ ${currentPrice().toFixed(2)}</strong>`;
      }
      stockNode.textContent = stockLabel();

      // تفعيل/تعطيل زر المتابعة لو المنتج غير متاح
      const proceed = box.querySelector('#proceedBtn');
      const out = stockNode.textContent.toLowerCase().includes('out of stock');
      proceed.disabled = out;
    }
    refreshMeta();

    // 8) variations handlers
    // dropdowns
    box.querySelectorAll('.var-select').forEach(sel=>{
      sel.addEventListener('change', ()=>{
        const name = sel.dataset.vname;
        const val  = sel.value || null;
        if (val) selected[name] = val;
        else delete selected[name];
        refreshMeta();
      });
    });
    // buttons
    box.querySelectorAll('.var-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const vname = btn.dataset.vname;
        const vval  = btn.dataset.vval;
        // toggle active within same group
        btn.closest('.var-block')?.querySelectorAll('.var-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selected[vname] = vval;
        refreshMeta();
      });
    });

    // 9) proceed to checkout (no WhatsApp; just save draft for real API later)
    box.querySelector('#proceedBtn')?.addEventListener('click', ()=>{
      // تأكد من اختيار كل الـ variations إن وُجدت
      if (variations.length) {
        const missing = variations.filter(v => !selected[v.name]).map(v=>v.name);
        if (missing.length) {
          alert(`Please select: ${missing.join(', ')}`);
          return;
        }
      }

      // جهّز مسودة الطلب
      const draft = {
        product: {
          id: p.id || p._id || p.uuid || null,
          slug: p.slug || null,
          name: p.name || '',
          thumb: p.thumb || (Array.isArray(p.images) ? p.images[0] : ''),
        },
        selections: { ...selected },              // قيم variations المختارة
        variant: selectedVariant ? {
          id: selectedVariant.id || null,
          taager_code: selectedVariant.taager_code || null,
          price: Number(selectedVariant.price || 0),
          sale_price: Number(selectedVariant.sale_price || 0),
          quantity: Number(selectedVariant.quantity || 0),
          props: selectedVariant.variation_props || []
        } : null,
        price: currentPrice(),
        quantity: 1
      };

      // خزّنها لاستخدام صفحة /checkout لاحقًا (سنكمل API للشراء هناك)
      try { sessionStorage.setItem('checkoutDraft', JSON.stringify(draft)); } catch {}
      window.dispatchEvent(new CustomEvent('checkout:draft', { detail: draft }));

      // انتقل لصفحة الدفع (SPA)
      const target = `#/checkout/${p.slug || (p.id || '')}`;
      history.pushState({ view: 'checkout', draft }, '', target);
      // هنا يمكنك إظهار/تحميل صفحة checkout الفعلية
      alert('Draft saved. Implement real checkout API next.');
    });

    // 10) back
    document.getElementById('pdBack')?.addEventListener('click', () => history.back());
  } catch (err) {
    console.error(err);
    box.innerHTML = '<div class="error">Error loading product</div>';
  }
}

/* ========= Products helpers ========= */
function pickPrice(p){
  const sp = Number(p?.sale_price || 0);
  const pr = Number(p?.price || 0);
  return sp > 0 ? sp : pr;
}

function mapProducts(raw = []) {
  return raw.map(p => {
    const id   = p?.id ?? p?._id ?? p?.uuid ?? null;
    const slug = p?.slug ? String(p.slug) : (id ? String(id) : null);
    return {
      id,
      slug, // important for SPA route
      title: p?.name ?? 'Product',
      image: p?.thumb || (Array.isArray(p?.images) ? p.images[0] : '') || '',
      price: pickPrice(p),
      url:   slug ? `#/product/${slug}` : '#'
    };
  });
}

// FIXED: Re-using fetchProductsByCategories with the fix
async function loadProducts({ categoryId = null, categoriesIn = null, page = 1 } = {}) {
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = '<div class="loading">Loading…</div>';

  let res;
  try {
    if (Array.isArray(categoriesIn) && categoriesIn.length) {
      res = await fetchProductsByCategories(categoriesIn, { page });
    } else if (categoryId) {
      res = await fetchProductsByCategory(categoryId, { page });
    } else {
      res = await fetchAllProducts({ page });
    }

    const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);
    const items = mapProducts(raw);

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
  setBackVisibility(parentId);

  try {
    const res = parentId ? await fetchCategoriesByParent(parentId) : await fetchTopCategories();
    const raw = Array.isArray(res) ? res : (res?.data ?? res ?? []);

    if (parentId) {
      // parent + children products
      const childIds = raw.map(c => (c?.id ?? c?._id ?? c?.uuid ?? c?.pk)).filter(Boolean);
      const allIds = [parentId, ...childIds];
      await loadProducts({ categoriesIn: allIds, page: 1 });

      // scroll into view
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // if no sub-cats, stop (only products shown)
      if (childIds.length === 0) return;
    } else {
      await loadProducts({ page: 1 });
    }

    // show categories grid (if any)
    const items = raw.map(c => ({
      id: c?.id ?? c?._id ?? c?.uuid ?? c?.pk ?? null,
      name: c?.name ?? 'Category',
      image: c?.thumb ?? c?.image ?? '',
      slug: c?.slug ?? ''
    }));
    renderCategories(items);
  } catch (error) {
    console.error('Error loading categories:', error);
    const grid = document.getElementById('categoriesGrid');
    if (grid) grid.innerHTML = '<div class="error">Error loading categories</div>';
  }
}

async function navigateToCategory(categoryId, slug) {
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
    if (!id) return console.warn('No category id on card. Check API mapping.');
    await navigateToCategory(id, slug);
  });
}

/* Browser Back/Forward support */
window.addEventListener('popstate', async (e) => {
  const state = e.state || {};

  if (state.view === 'product') {
    await loadProduct({ productId: state.productId, slug: state.slug });
    return;
  }

  const parentId = state.parentId ?? null;
  setBackVisibility(parentId);
  showView('list');
  await loadCategories(parentId);
});

/* Hash router (open product via #/product/slug directly) */
function handleHashRoute() {
  const hash = location.hash || '';

  // /product/:slug
  const m = hash.match(/^#\/product\/([^/?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    history.replaceState({ view: 'product', slug }, '', `#/product/${slug}`);
    loadProduct({ slug });
    return;
  }

  // default: /categories (+ products)
  if (hash.startsWith('#/categories') || hash === '' || hash === '#') {
    history.replaceState({ parentId: null }, '', '#/categories');
    setBackVisibility(null);
    showView('list');
    loadCategories(null);
  }
}
window.addEventListener('hashchange', handleHashRoute);

/* ========= Boot ========= */
(async () => {
  try {
    // Open product directly if URL is #/product/slug
    const m = location.hash.match(/^#\/product\/([^/?#]+)/);
    if (m) {
      const slug = decodeURIComponent(m[1]);
      history.replaceState({ view: 'product', slug }, '', `#/product/${slug}`);
      await loadProduct({ slug });
      return;
    }

    // Default: categories + products
    history.replaceState({ parentId: null }, '', '#/categories');
    setBackVisibility(null);
    showView('list');
    await loadCategories(null);
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
