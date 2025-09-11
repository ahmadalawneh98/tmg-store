// /scripts/api.js - FIXED VERSION (with safe fallbacks + get-one endpoints)
const proxy = '/api/categories';
const productsProxy = '/api/products';

/* ========= Helpers ========= */
function encodeFilters(arr) {
  return arr.map(([f, op, val]) =>
    (op === 'isnull' || op === 'notnull') ? `${f}||${op}` : `${f}||${op}||${val}`
  );
}

function toArrayData(res) {
  return Array.isArray(res) ? res : (res?.data ?? res ?? []);
}

/* ========= Categories API ========= */
export async function fetchTopCategories() {
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id', 'isnull'],
    ['hidden', 'eq', 'false'],
  ]).forEach(f => url.searchParams.append('filter', f));

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchCategoriesByParent(parentId) {
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id', 'eq', String(parentId)],
    ['hidden', 'eq', 'false'],
  ]).forEach(f => url.searchParams.append('filter', f));

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ========= Products API ========= */
/** يجلب المنتجات عامة (قائمة) */
export async function fetchAllProducts({
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join = '',
} = {}) {
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', sort);
  if (fields) url.searchParams.set('fields', fields);
  if (join)   url.searchParams.set('join', join);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/** ✅ منتج واحد بالـ ID (يستخدم GET /products/:id عبر البروكسي ?id=) */
export async function fetchProductById(id, { join = 'categories' } = {}) {
  if (!id) throw new Error('fetchProductById: id is required');
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('id', String(id));
  if (join) url.searchParams.set('join', join);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // يرجع كائن المنتج مباشرة
}

/** منتج واحد بالـ slug (fallback عند غياب id) */
export async function fetchProductBySlug(slug, { join = 'categories' } = {}) {
  if (!slug) throw new Error('fetchProductBySlug: slug is required');
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('limit', '1');
  if (join) url.searchParams.set('join', join);
  url.searchParams.append('filter', `slug||eq||${String(slug)}`);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return toArrayData(j)[0] ?? null; // يعيد منتجًا واحدًا أو null
}

/* ======= Low-level helpers for categories join ======= */
/** صفحة واحدة مع join=categories (بدون fields لتفادي data:[]) */
export async function fetchProductsPageWithCategories({ page = 1, limit = 24 } = {}) {
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sort', 'created_at,DESC');
  url.searchParams.set('join', 'categories'); // ⚠️ لا نرسل fields هنا

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return {
    data: toArrayData(j),
    page: Number(j?.page ?? page) || page,
    totalPages: Number(j?.totalPages ?? 1) || 1
  };
}

/** يجلب عدة صفحات ثم يفلتر محليًا حسب categoryId أو slug */
export async function fetchProductsByCategoryClientSide({
  categoryId = null,
  slug = null,
  maxPages = 10,
  limit = 24
} = {}) {
  if (!categoryId && !slug) return { data: [] };

  let page = 1;
  const out = [];
  let totalPages = 1;

  do {
    const { data, totalPages: tp } = await fetchProductsPageWithCategories({ page, limit });
    out.push(...data);
    totalPages = tp;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  const filtered = out.filter(p => {
    const cats = Array.isArray(p?.categories) ? p.categories : [];
    return cats.some(c =>
      (categoryId && String(c?.id) === String(categoryId)) ||
      (slug && String(c?.slug) === String(slug))
    );
  });

  return { data: filtered };
}

/* ======= Server-side attempts (may return empty on some setups) ======= */
async function fetchProductsByCategoryServer(categoryId, { page = 1, limit = 24 } = {}) {
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', 'created_at,DESC');
  // ⚠️ لا ترسل "categories" ضمن fields مع join=categories
  url.searchParams.set('fields', 'id,name,thumb,price,sale_price,slug,images,quantity');
  url.searchParams.set('join', 'categories');

  // بعض البيئات لا تتعامل جيدًا مع $in لقيمة واحدة، جرّب eq:
  url.searchParams.append('filter', `categories.id||eq||${String(categoryId)}`);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function fetchProductsByCategoriesServer(ids = [], { page = 1, limit = 24 } = {}) {
  const onlyIds = (ids || []).filter(Boolean).map(String);
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', 'created_at,DESC');
  url.searchParams.set('fields', 'id,name,thumb,price,sale_price,slug,images,quantity');
  url.searchParams.set('join', 'categories');

  const op = onlyIds.length === 1 ? 'eq' : '$in';
  url.searchParams.append('filter',
    `categories.id||${op}||${op === '$in' ? onlyIds.join(',') : onlyIds[0]}`
  );

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ========= High-level APIs (with fallback to client-side filtering) ========= */
/** تصنيف واحد: محاولة سيرفر أولًا ثم fallback محلي */
export async function fetchProductsByCategory(categoryId, {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC', // غير مستخدم في fallback لكن نُبقيه للتناسق
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity', // ⚠️ لا نضع "categories" ضمن fields عند join
  join = 'categories',
  slug = null,
  maxPages = 10
} = {}) {
  try {
    const sr = await fetchProductsByCategoryServer(categoryId, { page, limit });
    const data = toArrayData(sr);
    if (data.length) return { data };
    // fallback
    return await fetchProductsByCategoryClientSide({ categoryId, slug, maxPages, limit });
  } catch {
    return await fetchProductsByCategoryClientSide({ categoryId, slug, maxPages, limit });
  }
}

/** عدة تصنيفات: محاولة سيرفر أولًا ثم fallback محلي */
export async function fetchProductsByCategories(ids = [], {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join = 'categories',
  maxPages = 10
} = {}) {
  const onlyIds = (ids || []).filter(Boolean).map(String);
  if (!onlyIds.length) return { data: [] };

  try {
    const sr = await fetchProductsByCategoriesServer(onlyIds, { page, limit });
    const data = toArrayData(sr);
    if (data.length) return { data };

    // fallback محلي
    const { data: pages } = await fetchProductsByCategoryClientSide({ categoryId: onlyIds[0], maxPages, limit });
    const setIds = new Set(onlyIds.map(String));
    const filtered = (pages || []).filter(p =>
      (p?.categories || []).some(c => setIds.has(String(c?.id)))
    );
    return { data: filtered };
  } catch {
    const { data: pages } = await fetchProductsByCategoryClientSide({ categoryId: onlyIds[0], maxPages, limit });
    const setIds = new Set(onlyIds.map(String));
    const filtered = (pages || []).filter(p =>
      (p?.categories || []).some(c => setIds.has(String(c?.id)))
    );
    return { data: filtered };
  }
}
