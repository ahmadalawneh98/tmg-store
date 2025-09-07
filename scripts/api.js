// scripts/api.js
const proxy = '/api/categories';

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
