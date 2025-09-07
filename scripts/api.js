// scripts/api.js
const proxy = '/api/categories';
const productsProxy = '/api/products';

function encodeFilters(arr){
  return arr.map(([f, op, val]) =>
    (op === 'isnull' || op === 'notnull') ? `${f}||${op}` : `${f}||${op}||${val}`
  );
}

export async function fetchTopCategories(){
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id','isnull'],
    ['hidden','eq','false']
  ]).forEach(f => url.searchParams.append('filter', f)); // ← filter (مفرد)
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchCategoriesByParent(parentId){
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id','eq', String(parentId)],
    ['hidden','eq','false']
  ]).forEach(f => url.searchParams.append('filter', f)); // ← filter (مفرد)
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}



// جلب عام
export async function fetchAllProducts({
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join   = '' // مثال: 'variations'
} = {}){
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

// جلب حسب الكاتيجوري
export async function fetchProductsByCategory(categoryId, {
  page = 1,
  limit = 24,
  sort = 'created_at,DESC',
  fields = 'id,name,thumb,price,sale_price,slug,images,quantity',
  join   = ''
} = {}){
  const url = new URL(productsProxy, location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  url.searchParams.set('sort', sort);
  if (fields) url.searchParams.set('fields', fields);
  if (join)   url.searchParams.set('join', join);

  // filter=category_id||eq||<id>
  encodeFilters([
    ['category_id','eq', String(categoryId)]
  ]).forEach(f => url.searchParams.append('filter', f));

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}