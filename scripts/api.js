// /scripts/api.js - FIXED VERSION (with safe fallbacks)
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
/**
 * يجلب المنتجات عامّة (بدون join)
 */
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
  if (join) url.searchParams.set('join', join);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ======= Low-level helpers for categories join ======= */
/**
 * صفحة واحدة مع join=categories (بدون fields لتفادي data:[])
 */
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

/**
 * يجلب عدة صفحات ثم يفلتر محليًا حسب categoryId أو slug
 */
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
  url.searchParams.append('filter', `categories.id||${op}||${op === '$in' ? onlyIds.join(',') : onlyIds[0]}`);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ========= High-level APIs (with fallback to client-side filtering) ========= */
/**
 * منتجات حسب تصنيف واحد:
 * - يحاول فلترة السيرفر أولًا
 * - إن رجع فاضي: يستخدم فلترة محلية عبر جلب صفحات مع join=categories
 */
export async function fetchProductsByCategory(categoryId, {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC', // غير مستخدم في fallback لكن نُبقيه للتناسق
  // ⚠️ لا نضع "categories" ضمن fields عندما نستخدم join=categories
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join = 'categories',
  slug = null,          // يمكن تمرير slug لاستخدامه في fallback
  maxPages = 10         // عدد صفحات أقصى للـ fallback
} = {}) {
  try {
    const sr = await fetchProductsByCategoryServer(categoryId, { page, limit });
    const data = toArrayData(sr);
    if (data.length) return { data };
    // fallback
    const fb = await fetchProductsByCategoryClientSide({ categoryId, slug, maxPages, limit });
    return fb;
  } catch (e) {
    // في حالة خطأ من السيرفر، جرّب fallback مباشرة
    const fb = await fetchProductsByCategoryClientSide({ categoryId, slug, maxPages, limit });
    return fb;
  }
}

/**
 * منتجات حسب عدة تصنيفات (أب + أبناء):
 * - يحاول فلترة السيرفر ($in/eq)
 * - إن رجع فاضي: يجلب صفحات ويُفلتر محليًا على المعرّفات المرسلة
 */
export async function fetchProductsByCategories(ids = [], {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join   = 'categories',
  maxPages = 10
} = {}) {
  const onlyIds = (ids || []).filter(Boolean).map(String);
  if (!onlyIds.length) return { data: [] };

  try {
    const sr = await fetchProductsByCategoriesServer(onlyIds, { page, limit });
    const data = toArrayData(sr);
    if (data.length) return { data };
    // fallback: فلترة محلية
    const { data: pages } = await fetchProductsByCategoryClientSide({ categoryId: onlyIds[0], maxPages, limit });
    const setIds = new Set(onlyIds.map(String));
    const filtered = (pages || []).filter(p => (p?.categories || []).some(c => setIds.has(String(c?.id))));
    return { data: filtered };
  } catch (e) {
    // لو فشل السيرفر، نفّذ fallback
    const { data: pages } = await fetchProductsByCategoryClientSide({ categoryId: onlyIds[0], maxPages, limit });
    const setIds = new Set(onlyIds.map(String));
    const filtered = (pages || []).filter(p => (p?.categories || []).some(c => setIds.has(String(c?.id))));
    return { data: filtered };
  }
}
