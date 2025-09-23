// /scripts/app.js - COMPLETE FIXED VERSION (ENGLISH)
import {
  fetchTopCategories,
  fetchCategoriesByParent,
  fetchAllProducts,
  fetchProductsByCategory,
  fetchProductsByCategories, // Re-added since it's fixed in api.js
} from './api.js';

document.addEventListener('DOMContentLoaded', handleHashRoute);


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('buyNowBtn');
  if (btn) {
    btn.textContent = 'Click here to buy';
  }
});


// يعمل حتى لو العناصر انضافت لاحقاً
document.addEventListener('change', (e) => {
  const sel = e.target.closest('select.var-select[data-vkey="Login Type"]');
  if (!sel) return;

  const box = document.getElementById('productDetails') || document;
  const ta  = box.querySelector('textarea.var-input[data-vkey="Recovery Codes"]');
  if (!ta) return;

  const val = (sel.value || '').trim().toLowerCase();

  if (val === 'facebook') {
    ta.disabled = false;
    ta.value = '';
    ta.placeholder = 'Enter recovery code';
  } else {
    ta.disabled = true;
    ta.value = '';
    ta.value  = 'Not required';
  }

  // خلّي منطقك الداخلي يتحدّث (listeners) إن وُجد
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});

// يطبّق الحالة بدايةً لو كان فيه قيمة مختارة
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.querySelector('select.var-select[data-vkey="Login Type"]');
  if (sel) sel.dispatchEvent(new Event('change', { bubbles: true }));
});



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
  handleHashRoute(); // ← سيخفي الهيرو ويستدعي loadProduct بالمنطق الموحد
}



// ======= REPLACE THIS WHOLE FUNCTION =======
// ======= REPLACE THIS WHOLE FUNCTION =======
async function loadProduct({ productId = null, slug = null } = {}) {
  showView('product');
  const box = document.getElementById('productDetails');
  box.innerHTML = '<div class="loading">Loading product…</div>';

  try {
    // resolve id by slug using a lightweight list call
    async function resolveIdBySlug(sl) {
      const url = new URL('/api/products', location.origin);
      url.searchParams.set('fields', 'id,slug');
      url.searchParams.set('limit', '1');
      url.searchParams.append('filter', `slug||eq||${sl}`);
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const arr = Array.isArray(j) ? j : (j?.data ?? []);
      return arr[0]?.id ?? arr[0]?._id ?? arr[0]?.uuid ?? null;
    }

    if (!productId && slug) productId = await resolveIdBySlug(slug);

    let p;
    if (productId) {
      // EasyOrders Get One Product (returns variations + variants)
      const r = await fetch(`/api/products?id=${encodeURIComponent(productId)}`);
      if (!r.ok) throw new Error(await r.text());
      p = await r.json();
    }
    if (!p) { box.innerHTML = '<div class="error">Product not found</div>'; return; }

    // ---------- helpers: normalization (CRITICAL) ----------
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const normMap = (obj) => Object.fromEntries(Object.entries(obj).map(([k,v]) => [norm(k), norm(v)]));

    // ---------- normalize ----------
    const basePrice  = Number(p.price || 0);
    const salePrice  = Number(p.sale_price || 0);
    const gallery    = Array.isArray(p.images) && p.images.length ? p.images : (p.thumb ? [p.thumb] : []);
    const cats       = Array.isArray(p.categories) ? p.categories : [];
    const variations = Array.isArray(p.variations) ? p.variations : [];
    const variants   = Array.isArray(p.variants)   ? p.variants   : [];
    const currency   = (p.custom_currency || p.currency || 'EUR').toUpperCase();

    // ---------- selection state ----------
    const selectedDisplay = {};   // { rawName: rawValue }
    const selected        = {};   // { normName: normValue }
    let selectedVariant   = null;

    // structured types only affect variant match
    const structuredTypes = new Set(['dropdown', 'buttons', 'button', 'color', 'swatch', 'radio']);
    const isStructured = (v) => structuredTypes.has(String(v?.type || '').toLowerCase());

    // text-like detection
    const isTextLikeByType = (v) => {
      const t = String(v?.type || '').toLowerCase();
      return ['text','input','textarea','email','password','number','user_text'].includes(t);
    };
    const propsArePlaceholders = (props) => {
      if (!Array.isArray(props) || props.length === 0) return false;
      return props.every(pr => ['user will enter','user will write','enter value','will enter','سيقوم المستخدم بالإدخال','اكتب هنا']
        .includes(norm(pr?.value ?? pr?.name ?? '')));
    };

    function matchVariant() {
      if (!variations.length || !variants.length) return null;

      // أسماء المتغيّرات المطلوبة (مطبّعة) — فقط للـ structured لأنها هي اللي تبني variant
      const requiredKeys = variations
        .filter(isStructured)
        .map(v => norm(v.name));

      if (requiredKeys.some(k => !selected[k])) return null;

      for (const varItem of variants) {
        const props = Array.isArray(varItem.variation_props) ? varItem.variation_props : [];
        const ok = requiredKeys.every(k => {
          const selVal = selected[k];
          return props.some(pp =>
            norm(pp.variation) === k &&
            norm(pp.variation_prop) === selVal
          );
        });
        if (ok) return varItem;
      }
      return null;
    }

    function currentPrice() {
      if (selectedVariant) {
        const sp = Number(selectedVariant.sale_price || 0);
        return sp > 0 ? sp : Number(selectedVariant.price || basePrice);
      }
      return salePrice > 0 ? salePrice : basePrice;
    }

    // --------- render variations (respect API types) ---------
    function renderVariations() {
      if (!variations.length) return '';

      const blocks = variations.map(v => {
        const vRawName = String(v.name || '');
        const vKey     = norm(vRawName);
        const type     = String(v.type || '').toLowerCase();

        const rawProps =
          Array.isArray(v.props)   ? v.props :
          Array.isArray(v.values)  ? v.values :
          Array.isArray(v.options) ? v.options : [];

        const props = rawProps.map(pr => {
          const name  = pr.name ?? pr.label ?? pr.value ?? '';
          const value = pr.value ?? pr.name  ?? pr.label ?? '';
          return { name: String(name), value: String(value), vval: norm(value) };
        }).filter(p => p.value !== '');

        const treatAsText = isTextLikeByType(v) || propsArePlaceholders(props);

        // 1) text-like -> real input/textarea
        if (treatAsText) {
          const ph = props[0]?.name || props[0]?.value || vRawName || 'Enter value';
          let inputType = 'text';
          const low = vRawName.toLowerCase();
          if (type === 'email' || low.includes('email')) inputType = 'email';
          else if (type === 'password' || low.includes('pass')) inputType = 'password';
          else if (type === 'number') inputType = 'number';

          const control = (type === 'textarea' || low.includes('code'))
            ? `<textarea class="var-input" rows="3" data-vkey="${vKey}" data-vname="${vRawName}" placeholder="${ph}"></textarea>`
            : `<input class="var-input" type="${inputType}" data-vkey="${vKey}" data-vname="${vRawName}" placeholder="${ph}">`;

          return `
            <label class="var-block input">
              <div class="var-title">${vRawName.trim()}</div>
              ${control}
            </label>
          `;
        }

        // 2) dropdown
        if (type === 'dropdown' && props.length) {
          const opts = ['<option value="">— Select —</option>']
            .concat(props.map(pr => `<option value="${pr.vval}" data-raw="${pr.value}">${pr.name}</option>`))
            .join('');
          return `
            <label class="var-block dropdown">
              <div class="var-title">${vRawName.trim()}</div>
              <select class="var-select" data-vkey="${vKey}" data-vname="${vRawName}">
                ${opts}
              </select>
            </label>
          `;
        }

        // 3) color swatches
        if (type === 'color' && props.length) {
          const btns = props.map(pr => `
            <button type="button" class="var-btn var-color"
                    data-vkey="${vKey}" data-vname="${vRawName}"
                    data-vval="${pr.vval}" data-raw="${pr.value}" title="${pr.name}">
              <span class="swatch" style="background:${pr.value};"></span>
              <span class="swatch-label">${pr.name}</span>
            </button>
          `).join('');
          return `
            <div class="var-block colors">
              <div class="var-title">${vRawName.trim()}</div>
              <div class="var-options">${btns}</div>
            </div>
          `;
        }

        // 4) buttons (default)
        if (props.length) {
          const defaultVal = v.default ?? (v.auto_select_first ? props[0].vval : null);
          const btns = props.map(pr => `
            <button type="button" class="var-btn${defaultVal && defaultVal === pr.vval ? ' active':''}"
                    data-vkey="${vKey}" data-vname="${vRawName}"
                    data-vval="${pr.vval}" data-raw="${pr.value}">
              ${pr.name}
            </button>
          `).join('');

          // set default selection once
          if (defaultVal != null && !selected[vKey]) {
            selected[vKey] = defaultVal;
            const rawForDefault = rawProps.find(x => norm(x.value ?? x.name ?? '') === defaultVal);
            selectedDisplay[vRawName] = String(rawForDefault?.value ?? rawForDefault?.name ?? defaultVal);
          }

          return `
            <div class="var-block buttons">
              <div class="var-title">${vRawName.trim()}</div>
              <div class="var-options">${btns}</div>
            </div>
          `;
        }

        // 5) fallback: simple input
        return `
          <label class="var-block input">
            <div class="var-title">${(vRawName || 'Option').trim()}</div>
            <input class="var-input" type="text"
                   data-vkey="${vKey}" data-vname="${vRawName}"
                   placeholder="${vRawName || 'Option'}">
          </label>
        `;
      }).join('');

      // No "Options" heading to mimic original page
      return blocks.trim() ? `<div class="pd-variations">${blocks}</div>` : '';
    }

    // ---------- page markup ----------
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

          <div class="pd-actions">
            <button id="buyNowBtn" class="btn primary">Click here to buy</button>
            <button id="addToCartBtn" class="btn">Add to cart</button>
          </div>

          ${p.description ? `<div class="pd-desc">${p.description}</div>` : ''}
        </div>
      </article>
    `;

    // تأكيد النص
    const buyBtn = box.querySelector('#buyNowBtn');
    if (buyBtn) buyBtn.textContent = 'Click here to buy';

    // ---------- gallery thumbs ----------
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

    // ---------- price / stock ----------
    function refreshMeta() {
      selectedVariant = matchVariant();
      const priceNode = box.querySelector('#pdPrice');
      const stockNode = box.querySelector('#pdStock');

      if (!selectedVariant && salePrice > 0) {
        priceNode.innerHTML = `<del>${basePrice.toFixed(2)} ${currency}</del> <strong>${salePrice.toFixed(2)} ${currency}</strong>`;
      } else {
        priceNode.innerHTML = `<strong>${currentPrice().toFixed(2)} ${currency}</strong>`;
      }

      if (stockNode) {
        stockNode.textContent = 'Available'; // متجر رقمي
      }

      const buy = box.querySelector('#buyNowBtn');
      if (buy) buy.disabled = false;
    }

    refreshMeta();

    // ---------- variation events ----------
    // selects
    box.querySelectorAll('.var-select').forEach(sel=>{
      sel.addEventListener('change', ()=>{
        const vKey  = sel.dataset.vkey;
        const vName = sel.dataset.vname;
        const raw   = sel.options[sel.selectedIndex]?.getAttribute('data-raw') || sel.value;
        selected[vKey]        = norm(sel.value || '');
        selectedDisplay[vName]= raw;
        refreshMeta();
      });
    });

    // buttons
    box.querySelectorAll('.var-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const vKey  = btn.dataset.vkey;
        const vName = btn.dataset.vname;
        const vVal  = btn.dataset.vval || '';
        const raw   = btn.getAttribute('data-raw') || vVal;

        btn.closest('.var-block')?.querySelectorAll('.var-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');

        selected[vKey]         = norm(vVal);
        selectedDisplay[vName] = raw;
        refreshMeta();
      });
    });

    // text inputs / textareas
    box.querySelectorAll('.var-input').forEach(inp=>{
      const apply = () => {
        const vKey  = inp.dataset.vkey;
        const vName = inp.dataset.vname;
        const val   = inp.value ?? '';
        selected[vKey]         = norm(val);
        selectedDisplay[vName] = val; // احتفظ بالنص كما أدخله المستخدم
      };
      ['input','change','blur'].forEach(ev => inp.addEventListener(ev, apply));
    });

    // ---------- helpers: إبراز الحقول الناقصة ----------
    function highlightMissing(missingKeysNorm) {
      const wrap = box.querySelector('#pdVarsWrap');
      if (!wrap) return;

      // امسح إبراز سابق
      wrap.querySelectorAll('.var-block').forEach(b => b.classList.remove('is-missing'));

      // فعّل إبراز جديد
      variations.forEach(v => {
        const keyNorm = norm(v.name);
        if (missingKeysNorm.includes(keyNorm)) {
          // ابحث عن كتلة هذا الفاريشن (حسب data-vname)
          const block = wrap.querySelector(
            `.var-block [data-vname]` // عنصر داخلي يحمل data-vname
          )?.closest('.var-block');
          if (block) block.classList.add('is-missing');
        }
      });
    }

    // ---------- actions ----------
    const buildDraft = () => ({
      product: {
        id: p.id || p._id || p.uuid || null,
        slug: p.slug || null,
        name: p.name || '',
        thumb: p.thumb || (Array.isArray(p.images) ? p.images[0] : '')
      },
      selections: { ...selectedDisplay },
      variant: selectedVariant ? {
        id: selectedVariant.id || null,
        taager_code: selectedVariant.taager_code || null,
        price: Number(selectedVariant.price || 0),
        sale_price: Number(selectedVariant.sale_price || 0),
        quantity: Number(selectedVariant.quantity || 0),
        props: selectedVariant.variation_props || []
      } : null,
      price: currentPrice(),
      currency,
      quantity: 1
    });

    // دالة مشتركة للتحقق من إلزامية "كل" الفاريشنات
    function getMissingAllVariations() {
      // كل الأسماء المطبّعة
      const requiredKeys = variations.map(v => norm(v.name));
      // مفقود إذا ما في selected أو قيمة فارغة
      const missing = requiredKeys.filter(k => !selected[k] || String(selected[k]).length === 0);
      return missing;
    }

    // Buy Now
    box.querySelector('#buyNowBtn')?.addEventListener('click', ()=>{
      const missing = getMissingAllVariations(); // ← كل الفاريشنات إلزامية
      if (missing.length) {
        highlightMissing(missing);
        const missingDisplay = variations
          .filter(v => missing.includes(norm(v.name)))
          .map(v => String(v.name).trim());

        if (window.Swal) {
          Swal.fire({
            icon: 'warning',
            title: 'Missing selections',
            html: `Please select:<br><b>${missingDisplay.join(', ')}</b>`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#ff6a00',
          });
        } else {
          alert(`Please select: ${missingDisplay.join(', ')}`);
        }
        return;
      }

      const draft = buildDraft();
      try { sessionStorage.setItem('checkoutDraft', JSON.stringify(draft)); } catch {}
      history.pushState({ view: 'checkout', draft }, '', `#/checkout/${p.slug || (p.id || '')}`);
      showCheckout(draft);
    });

    // Add to cart — نفس فحص الإلزام
    box.querySelector('#addToCartBtn')?.addEventListener('click', ()=>{
      const missing = getMissingAllVariations();
      if (missing.length) {
        highlightMissing(missing);
        const missingDisplay = variations
          .filter(v => missing.includes(norm(v.name)))
          .map(v => String(v.name).trim());

        if (window.Swal) {
          Swal.fire({
            icon: 'warning',
            title: 'Missing selections',
            html: `Please select:<br><b>${missingDisplay.join(', ')}</b>`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#ff6a00',
          });
        } else {
          alert(`Please select: ${missingDisplay.join(', ')}`);
        }
        return;
      }

      const draft = buildDraft();
      addToCart(draft, { open: true });
    });

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

  if (state.view === 'checkout') {
    let draft = null;
    try { draft = JSON.parse(sessionStorage.getItem('checkoutDraft') || 'null'); } catch {}
    showCheckout(draft);
    return;
  }

  if (state.view === 'product') {
    await loadProduct({ productId: state.productId, slug: state.slug });
    return;
  }

  const parentId = state.parentId ?? null;
  setBackVisibility(parentId);
  showView('list');
  await loadCategories(parentId);
});

// helper: أظهر/أخفِ الهيرو (.hero)
function setHeroVisibility(show){
  const body = document.body;
  // view-inner = صفحات داخلية (Product/Checkout/Categories فرعية)
  body.classList.toggle('view-inner', !show);
}

function handleHashRoute() {
  const hash = location.hash || '';

  // /checkout/:slug
  const mCheckout = hash.match(/^#\/checkout\/([^/?#]+)/);
  if (mCheckout) {
    setHeroVisibility(false); // اخفِ الهيرو
    const slug = decodeURIComponent(mCheckout[1]);
    history.replaceState({ view: 'checkout', slug }, '', `#/checkout/${slug}`);
    let draft = null;
    try { draft = JSON.parse(sessionStorage.getItem('checkoutDraft') || 'null'); } catch {}
    showCheckout(draft);
    return;
  }

  // /product/:slug
  const mProd = hash.match(/^#\/product\/([^/?#]+)/);
  if (mProd) {
    setHeroVisibility(false); // اخفِ الهيرو
    hideCheckout(); // <-- مهم
    const slug = decodeURIComponent(mProd[1]);
    history.replaceState({ view: 'product', slug }, '', `#/product/${slug}`);
    loadProduct({ slug });
    return;
  }

  // /categories/:id (تصنيف داخلي)
  const mCat = hash.match(/^#\/categories\/([^/?#]+)/);
  if (mCat) {
    setHeroVisibility(false); // اخفِ الهيرو
    hideCheckout(); // <-- مهم
    const parentId = decodeURIComponent(mCat[1]);
    history.replaceState({ parentId }, '', `#/categories/${parentId}`);
    setBackVisibility(parentId);
    showView('list');
    loadCategories(parentId);
    return;
  }

  // default: الصفحة الرئيسية (top categories)
  setHeroVisibility(true); // أظهر الهيرو في الهوم فقط
  hideCheckout(); // <-- مهم
  history.replaceState({ parentId: null }, '', '#/categories');
  setBackVisibility(null);
  showView('list');
  loadCategories(null);
}



window.addEventListener('hashchange', handleHashRoute);

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



/* ========= Cart logic ========= */
const CART_KEY = 'cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items || []));
  window.dispatchEvent(new CustomEvent('cart:updated'));
}
function cartCount() {
  return getCart().reduce((s, it) => s + Number(it.quantity || 1), 0);
}
function cartTotal() {
  const items = getCart();
  const sum = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  // نفترض العملة من أول عنصر (أو USD)
  const currency = items[0]?.currency || 'USD';
  return { sum, currency };
}
function sameCartLine(a, b) {
  // دمج العناصر المتطابقة: نفس المنتج + نفس الـ variant (لو موجود) + نفس selections
  const aKey = JSON.stringify({ pid:a.product?.id, vid:a.variant?.id || null, sel:a.selections || {} });
  const bKey = JSON.stringify({ pid:b.product?.id, vid:b.variant?.id || null, sel:b.selections || {} });
  return aKey === bKey;
}
function addToCart(line, { open = true } = {}) {
  const items = getCart();
  const idx = items.findIndex(it => sameCartLine(it, line));
  if (idx >= 0) {
    items[idx].quantity = Number(items[idx].quantity || 1) + Number(line.quantity || 1);
  } else {
    items.push({ ...line, quantity: Number(line.quantity || 1) || 1 });
  }
  setCart(items);
  if (open) openCartDrawer();
}
function removeFromCart(index) {
  const items = getCart();
  items.splice(index, 1);
  setCart(items);
}
function updateCartQty(index, qty) {
  qty = Math.max(1, Number(qty) || 1);
  const items = getCart();
  if (!items[index]) return;
  items[index].quantity = qty;
  setCart(items);
}

/* ==== UI bindings ==== */
const cartBtn     = document.getElementById('cartBtn');
const cartDrawer  = document.getElementById('cartDrawer');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCurrEl  = document.getElementById('cartCurrency');
const cartCountEl = document.getElementById('cartCount');

function renderCartCount() {
  if (!cartCountEl) return;
  cartCountEl.textContent = String(cartCount());
}
function renderCartDrawer() {
  if (!cartItemsEl) return;
  const items = getCart();

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<div class="empty">Your cart is empty.</div>`;
  } else {
    cartItemsEl.innerHTML = items.map((it, i) => {
      const name = it?.product?.name || 'Product';
      const thumb= it?.product?.thumb || '';
      const qty  = Number(it.quantity || 1);
      const price= Number(it.price || 0);
      const line = (qty * price).toFixed(2);

      // عرض الاختيارات
      const opts = it.selections
        ? Object.entries(it.selections).map(([k,v]) => `<span><b>${k}:</b> ${v}</span>`).join(' • ')
        : '';

      return `
        <div class="cart-item" data-idx="${i}">
          <img src="${thumb}" alt="${name}">
          <div>
            <div class="ci-title">${name}</div>
            <div class="ci-opts">${opts}</div>
            <div class="cart-qty" role="group" aria-label="Quantity">
              <button data-act="dec" aria-label="Decrease">−</button>
              <input type="number" min="1" value="${qty}" data-act="qty">
              <button data-act="inc" aria-label="Increase">+</button>
            </div>
            <button class="cart-remove" data-act="remove">Remove</button>
          </div>
          <div class="ci-price">${line}</div>
        </div>
      `;
    }).join('');
  }

  const { sum, currency } = cartTotal();
  cartTotalEl.textContent = sum.toFixed(2);
  cartCurrEl.textContent  = currency;

  // Delegation for qty / remove
  cartItemsEl.onclick = (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const idx = Number(item.dataset.idx || -1);
    const act = e.target.getAttribute('data-act');
    if (act === 'remove') { removeFromCart(idx); return; }
    if (act === 'dec')    { updateCartQty(idx, Number(item.querySelector('[data-act="qty"]').value) - 1); return; }
    if (act === 'inc')    { updateCartQty(idx, Number(item.querySelector('[data-act="qty"]').value) + 1); return; }
  };
  cartItemsEl.onchange = (e) => {
    const input = e.target.closest('input[data-act="qty"]');
    if (!input) return;
    const item = e.target.closest('.cart-item'); if (!item) return;
    updateCartQty(Number(item.dataset.idx || -1), Number(input.value || 1));
  };
}

function openCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  renderCartDrawer();
}
function closeCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
}

/* Bind open/close */
cartBtn?.addEventListener('click', openCartDrawer);
cartDrawer?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close="drawer"]') || e.target.classList.contains('cart-overlay')) {
    closeCartDrawer();
  }
});
document.getElementById('clearCart')?.addEventListener('click', () => setCart([]));
document.getElementById('goCheckout')?.addEventListener('click', () => {
  // لو عندك صفحة Checkout SPA: وجهه لها. وإلا خليه يفتح الدرج فقط.
  // history.pushState({ view: 'checkout' }, '', '#/checkout'); // إذا عندك صفحة Checkout
  closeCartDrawer();
  alert('Proceed to checkout (wire this to your real checkout flow)');
});

/* React to updates (and cross-tab updates) */
window.addEventListener('cart:updated', () => { renderCartCount(); renderCartDrawer(); });
window.addEventListener('storage', (e) => { if (e.key === CART_KEY) { renderCartCount(); renderCartDrawer(); } });

/* First render */
renderCartCount();






// ===== Tabs: activation + copy-to-clipboard =====
(function initPayTabs(){
  const header = document.querySelector('#payTabs .pay-tabs-header');
  const live   = document.getElementById('payCopyLive');
  if(!header) return;

  header.addEventListener('click', (e)=>{
    const btn = e.target.closest('.pay-tab-btn'); if(!btn) return;
    const id  = btn.getAttribute('aria-controls');
    // Deactivate others
    header.querySelectorAll('.pay-tab-btn').forEach(b=>{
      b.setAttribute('aria-selected', b===btn ? 'true' : 'false');
      b.setAttribute('tabindex', b===btn ? '0' : '-1');
    });
    document.querySelectorAll('#payTabs .pay-tab-panel').forEach(p=>{
      p.setAttribute('aria-hidden', p.id===id ? 'false' : 'true');
    });
    // Focus panel for a11y
    document.getElementById(id)?.focus?.();
  });

  // Copy buttons
  document.getElementById('payTabs')?.addEventListener('click', async (e)=>{
    const c = e.target.closest('.pay-copy'); if(!c) return;
    const txt = c.getAttribute('data-copy') || '';
    try{
      await navigator.clipboard.writeText(txt);
      c.textContent = 'Copied';
      setTimeout(()=>{ c.textContent = 'Copy'; }, 1200);
      if(live) live.textContent = 'Copied to clipboard';
    }catch{ if(live) live.textContent = 'Copy failed'; }
  });
})();

// ===== Order Summary (uses your existing cart helpers) =====
(function renderSummary(){
  const wrap = document.getElementById('sumItems'); if(!wrap) return;
  const items = (typeof getCart === 'function') ? getCart() : [];
  if(items.length === 0){
    wrap.innerHTML = '<div class="empty">Your cart is empty.</div>';
  }else{
    wrap.innerHTML = items.map(it=>{
      const name = it?.product?.name || 'Product';
      const img  = it?.product?.thumb || '';
      const qty  = Number(it.quantity || 1);
      const price= Number(it.price || 0);
      const line = (qty*price).toFixed(2);
      const opts = it.selections ? Object.entries(it.selections).map(([k,v])=>`${k}: ${v}`).join(' • ') : '';
      return `
        <div class="sum-item">
          <img src="${img}" alt="${name}">
          <div>
            <h4>${name}</h4>
            <div class="meta">${opts}</div>
            <div class="meta">Qty: ${qty} × ${price.toFixed(2)}</div>
          </div>
          <div class="line">${line}</div>
        </div>
      `;
    }).join('');
  }
  if(typeof cartTotal === 'function'){
    const { sum, currency } = cartTotal();
    document.getElementById('sumTotal').textContent = sum.toFixed(2);
    document.getElementById('sumCurr').textContent  = currency;
  }
})();

// Live updates when cart changes
window.addEventListener('cart:updated', ()=>{
  try { document.querySelector('#orderSummary .sum-items').innerHTML = ''; } catch {}
  // re-render quickly:
  const ev = new Event('DOMContentLoaded'); document.dispatchEvent(ev);
});

// Edit cart button -> open drawer (your helper)
document.getElementById('editCart')?.addEventListener('click', ()=>{
  if(typeof openCartDrawer === 'function') openCartDrawer();
});

// Submit order (placeholder: hook to your backend)
// Replace the whole submit listener with this:
// ضع رقمك هنا بصيغة دولية بدون + أو 00
const WHATSAPP_NUMBER = '96278604666';

// helper: يبني نص رسالة واتساب
function buildWhatsAppMessage(payload) {
  const { customer, payment_method, items = [], status, notes } = payload;

  // بنبني تفاصيل العناصر + إجمالي
  let total = 0;
  const lines = items.map((it, i) => {
    const qty   = Number(it.quantity || 1);
    const price = Number(it.price || 0);
    const line  = qty * price;
    total += line;
    return `#${i+1}
• Product ID: ${it.product_id ?? '-'}
• Variant ID: ${it.variant_id ?? '-'}
• Qty: ${qty}
• Price: ${price.toFixed(2)} ${it.currency || ''}
• Line: ${line.toFixed(2)} ${it.currency || ''}
• Selections: ${it.selections ? JSON.stringify(it.selections) : '{}'}`;
  }).join('\n\n');

  return (
`🧾 New Order
——————————————
👤 Customer
• Name: ${customer?.name || '-'}
• Phone: ${customer?.phone || '-'}
• Instagram: ${customer?.instagram || '-'}

💳 Payment: ${payment_method || '-'}
📌 Status: ${status || 'pending'}
📝 Notes: ${notes || '-'}

📦 Items:
${lines}

——————————————
💰 Total: ${total.toFixed(2)} ${(items[0]?.currency || 'EUR')}
⏰ Time: ${new Date().toLocaleString()}` );
}

document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.currentTarget;
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const showLoading = (title = 'Preparing WhatsApp message…') =>
    window.Swal?.fire({ title, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    // 1) Form data + payment tab
    const data = Object.fromEntries(new FormData(form).entries());
    const activeTab = document.querySelector('.pay-tab-btn[aria-selected="true"]')?.id || '';
    const payment_method = activeTab.replace('tabbtn-',''); // paypal | uk | jo | other

    // 2) Get items (cart → draft)
    const cart = (typeof getCart === 'function') ? getCart() : [];
    let items = [];

    if (cart.length) {
      items = cart.map(line => ({
        product_id: line?.product?.id || null,
        variant_id: line?.variant?.id || null,
        quantity: Number(line?.quantity || 1),
        price: Number(line?.price || 0),
        currency: line?.currency || 'EUR',
        selections: line?.selections || {}
      }));
    } else {
      let draft = null;
      try { draft = JSON.parse(sessionStorage.getItem('checkoutDraft') || 'null'); } catch {}
      if (!draft) {
        if (window.Swal) {
          await Swal.fire({ icon: 'info', title: 'Your cart is empty', text: 'Please add a product first.' });
        } else {
          alert('Your cart is empty.');
        }
        submitBtn && (submitBtn.disabled = false);
        return;
      }
      items = [{
        product_id: draft?.product?.id || null,
        variant_id: draft?.variant?.id || null,
        quantity: Number(draft?.quantity || 1),
        price: Number(draft?.price || 0),
        currency: draft?.currency || 'EUR',
        selections: draft?.selections || {}
      }];
    }

    // 3) Build payload (نفس الشكل السابق تقريبًا)
    const orderPayload = {
      customer: {
        name: data.name || '',
        phone: data.phone || '',
        instagram: data.instagram || ''
      },
      notes: data.transfer_number ? `Transfer Number: ${data.transfer_number}` : '',
      payment_method,
      items,
      status: 'pending'
    };

    // 4) جهّز رسالة الواتساب وافتحها
    showLoading();
    const msg = buildWhatsAppMessage(orderPayload);
    const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

    // فضّي السلة محليًا (اختياري)
    if (typeof setCart === 'function') setCart([]);
    sessionStorage.removeItem('checkoutDraft');

    // افتح واتساب في تبويب جديد
    if (window.Swal?.isLoading()) Swal.close();
    window.open(waURL, '_blank');

    // Optionally: أظهر نجاح سريع
    if (window.Swal) {
      await Swal.fire({
        icon: 'success',
        title: 'Opening WhatsApp…',
        text: 'Send the pre-filled order message to confirm.'
      });
    }

  } catch (err) {
    console.error(err);
    if (window.Swal) {
      await Swal.fire({ icon: 'error', title: 'Unexpected error', text: 'Please try again later.' });
    } else {
      alert('Unexpected error while creating your order.');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

function showCheckout(draft = null) {
  const sec = document.getElementById('purchase');
  const details = document.getElementById('productDetails');
  if (!sec) return;

  details?.classList.add('is-hidden');
  sec.classList.add('open');
  sec.removeAttribute('aria-hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (draft) { 
    try { sessionStorage.setItem('checkoutDraft', JSON.stringify(draft)); } catch {}
    renderCheckoutSummaryFromDraft(draft); // <<=== الجديد
  } else {
    // لو ما وصل draft، جرّب من التخزين
    try {
      const d = JSON.parse(sessionStorage.getItem('checkoutDraft') || 'null');
      if (d) renderCheckoutSummaryFromDraft(d);
    } catch {}
  }
}


function renderCheckoutSummaryFromDraft(draft){
  const wrap = document.getElementById('sumItems'); 
  if(!wrap || !draft) return;

  const name = draft?.product?.name || 'Product';
  const img  = draft?.product?.thumb || '';
  const qty  = Number(draft.quantity || 1);
  const price= Number(draft.price || 0);
  const line = (qty*price).toFixed(2);
  const opts = draft.selections 
    ? Object.entries(draft.selections).map(([k,v])=>`${k}: ${v}`).join(' • ')
    : '';

  wrap.innerHTML = `
    <div class="sum-item">
      <img src="${img}" alt="${name}">
      <div>
        <h4>${name}</h4>
        <div class="meta">${opts}</div>
        <div class="meta">Qty: ${qty} × ${price.toFixed(2)}</div>
      </div>
      <div class="line">${line}</div>
    </div>
  `;

  // ✅ صح: إسناد بعد فحص وجود العنصر
  const sumTotalEl = document.getElementById('sumTotal');
  if (sumTotalEl) sumTotalEl.textContent = line;

  const sumCurrEl = document.getElementById('sumCurr');
  if (sumCurrEl) sumCurrEl.textContent = (draft.currency || 'EUR');
}

function hideCheckout() {
  const sec = document.getElementById('purchase');
  const details = document.getElementById('productDetails');
  if (!sec) return;

  sec.classList.remove('open');
  sec.setAttribute('aria-hidden', 'true');
  details?.classList.remove('is-hidden'); // رجّع تفاصيل المنتج
}
