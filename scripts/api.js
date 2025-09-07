// /scripts/api.js - FIXED VERSION
const proxy = '/api/categories';
const productsProxy = '/api/products';

/* ========= Helpers ========= */
function encodeFilters(arr) {
  return arr.map(([f, op, val]) =>
    (op === 'isnull' || op === 'notnull') ? `${f}||${op}` : `${f}||${op}||${val}`
  );
}

/* ========= Categories API ========= */
export async function fetchTopCategories() {
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id', 'isnull'],
    ['hidden', 'eq', 'false'],
  ]).forEach(f => url.searchParams.append('filter', f));

  console.log('Fetching top categories:', url.toString()); // للتشخيص
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  console.log('Top categories response:', data); // للتشخيص
  return data;
}

export async function fetchCategoriesByParent(parentId) {
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id', 'eq', String(parentId)],
    ['hidden', 'eq', 'false'],
  ]).forEach(f => url.searchParams.append('filter', f));

  console.log('Fetching subcategories for parent:', parentId, url.toString()); // للتشخيص
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  console.log('Subcategories response:', data); // للتشخيص
  return data;
}

/* ========= Products API ========= */
// جميع المنتجات (عام)
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

  console.log('Fetching all products:', url.toString()); // للتشخيص
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  console.log('All products response:', data); // للتشخيص
  return data;
}

// منتجات حسب تصنيف واحد - FIXED
export async function fetchProductsByCategory(categoryId, {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity,categories',
  join = 'categories', // إضافة join للحصول على معلومات التصنيفات
} = {}) {
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', sort);
  if (fields) url.searchParams.set('fields', fields);
  if (join) url.searchParams.set('join', join);

  // FIXED: استخدم categories.id بدلاً من category_id
  // لأن المنتج يحتوي على مصفوفة categories حسب API documentation
  encodeFilters([
    ['categories.id', 'eq', String(categoryId)],
  ]).forEach(f => url.searchParams.append('filter', f));

  console.log('Fetching products by category:', categoryId, url.toString()); // للتشخيص
  const r = await fetch(url.toString());
  if (!r.ok) {
    console.error('Error fetching products by category:', await r.text());
    throw new Error(await r.text());
  }
  const data = await r.json();
  console.log('Products by category response:', data); // للتشخيص
  return data;
}

// منتجات حسب عدة تصنيفات ($in) — مفيد لعرض الأب + كل الأبناء/الأحفاد
export async function fetchProductsByCategories(ids = [], {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity,categories',
  join   = 'categories' // مهم: نربط جدول/علاقة التصنيفات
} = {}) {
  const onlyIds = (ids || []).filter(Boolean).map(String);
  if (!onlyIds.length) {
    console.log('No valid category IDs provided to fetchProductsByCategories');
    return [];
  }

  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', sort);
  if (fields) url.searchParams.set('fields', fields);
  if (join)   url.searchParams.set('join', join);

  // ✔ حسب التوثيق: $in وعلى الحقل categories.id لأن المنتج لديه مصفوفة categories
  encodeFilters([
    ['categories.id', '$in', onlyIds.join(',')]
  ]).forEach(f => url.searchParams.append('filter', f));

  console.log('Fetching products by categories:', onlyIds, url.toString()); // للتشخيص
  const r = await fetch(url.toString());
  if (!r.ok) {
    console.error('Error fetching products by categories:', await r.text());
    throw new Error(await r.text());
  }
  const data = await r.json();
  console.log('Products by categories response:', data); // للتشخيص
  return data;
}