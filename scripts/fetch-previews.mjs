import fs from 'node:fs/promises';

const recipes = JSON.parse(await fs.readFile(new URL('../recipes.json', import.meta.url), 'utf8'));
const existingText = await fs.readFile(new URL('../previews.js', import.meta.url), 'utf8').catch(() => 'window.RECIPE_PREVIEWS = {};');
let existing = {};
try {
  const match = existingText.match(/window\.RECIPE_PREVIEWS\s*=\s*(\{[\s\S]*\});?/);
  if (match) existing = JSON.parse(match[1]);
} catch {}

const decode = (s='') => s
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>');

function absolutize(value, pageUrl) {
  if (!value) return '';
  try { return new URL(decode(value.trim()), pageUrl).href; } catch { return ''; }
}

function getMeta(html, pageUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return absolutize(match[1], pageUrl);
  }
  return '';
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CharliesCookbookPreviewBot/1.0; +https://github.com/CharlieBludau/Charlie-s-Collected-Recipes)',
        'accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/html')) return '';
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

const previews = {...existing};
for (const recipe of recipes) {
  const key = String(recipe.id);
  try {
    const html = await fetchText(recipe.url);
    const image = getMeta(html, recipe.url);
    if (image) {
      previews[key] = image;
      console.log(`✓ ${recipe.id}: ${recipe.title}`);
    } else {
      delete previews[key];
      console.log(`– ${recipe.id}: no preview image`);
    }
  } catch (err) {
    console.log(`! ${recipe.id}: ${err.message}`);
  }
  await new Promise(resolve => setTimeout(resolve, 250));
}

const output = `window.RECIPE_PREVIEWS = ${JSON.stringify(previews, null, 2)};\n`;
await fs.writeFile(new URL('../previews.js', import.meta.url), output, 'utf8');
console.log(`Saved ${Object.keys(previews).length} remote preview URLs.`);
