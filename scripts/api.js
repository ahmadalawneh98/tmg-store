// scripts/api.js
const proxy = '/api/categories';

/**
 * يحوّل مصفوفة فلاتر لصيغة:
 *  field||operator||value
 * أمثلة:
 *  ['parent_id','isnull']  → "parent_id||isnull"
 *  ['hidden','eq','false'] → "hidden||eq||false"
 */
function encodeFilters(arr){
  return arr.map(([f, op, val]) =>
    (op === 'isnull' || op === 'notnull') ? `${f}||${op}` : `${f}||${op}||${val}`
  );
}

/**
 * جلب أقسام المستوى الأعلى:
 * parent_id IS NULL AND hidden = false
 */
export async function fetchTopCategories(){
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id','isnull'],
    ['hidden','eq','false']
  ]).forEach(f => url.searchParams.append('filters', f)); // ← لاحظ: filters (جمع)

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * جلب الأقسام الفرعية بحسب parent_id:
 * parent_id = {parentId} AND hidden = false
 */
export async function fetchCategoriesByParent(parentId){
  const url = new URL(proxy, location.origin);
  encodeFilters([
    ['parent_id','eq', String(parentId)],
    ['hidden','eq','false']
  ]).forEach(f => url.searchParams.append('filters', f)); // ← filters (جمع)

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
