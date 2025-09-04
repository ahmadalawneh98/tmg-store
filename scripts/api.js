// scripts/api.js
const proxy = '/api/categories'; // وظيفة Vercel

function encodeFilters(arr){
  return arr.map(([f,op,val]) =>
    (op === 'isnull' || op === 'notnull') ? `${f}||${op}` : `${f}||${op}||${val}`
  );
}

export async function fetchTopCategories(){
  const url = new URL(proxy, location.origin);
  encodeFilters([['parent_id','isnull'], ['hidden','eq','false']])
    .forEach(f => url.searchParams.append('filters', f));
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
