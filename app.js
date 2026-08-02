
const STATE_KEY='charlies-cookbook-6-personal';
let activeRecipe=null, currentCategory='', favoritesOnly=false, view=localStorage.getItem('cc6-view')||'grid';
let personal=loadPersonal();
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function loadPersonal(){try{return JSON.parse(localStorage.getItem(STATE_KEY))||{}}catch{return {}}}
function savePersonal(){localStorage.setItem(STATE_KEY,JSON.stringify(personal))}
function info(id){return personal[String(id)]||{favorite:false,rating:'',notes:''}}
function update(id,patch){personal[String(id)]={...info(id),...patch};savePersonal();updateStats()}
function randomRecipe(){return RECIPES[Math.floor(Math.random()*RECIPES.length)]}
function setFeature(r){$('featureImage').src=r.image;$('featureImage').alt=r.title;$('featureTitle').textContent=r.title;$('featureMeta').textContent=`${r.source} · ${r.category}`;$('featureCard').dataset.id=r.id}
function updateStats(){const vals=Object.values(personal);$('favoriteCount').textContent=vals.filter(x=>x.favorite).length;$('ratedCount').textContent=vals.filter(x=>x.rating).length;$('videoCount').textContent=RECIPES.filter(x=>x.type==='Video').length}
function buildFilters(){
 const cats=[...new Set(RECIPES.map(r=>r.category))].sort();const sources=[...new Set(RECIPES.map(r=>r.source))].sort((a,b)=>a.localeCompare(b));
 $('categoryFilter').innerHTML='<option value="">All collections</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
 $('sourceFilter').innerHTML='<option value="">All sources</option>'+sources.map(x=>`<option>${esc(x)}</option>`).join('');
 const featured=['Chicken','Mexican & Latin','Soups & Stews','Pasta & Noodles','Beef & Lamb','Pork','Rice & One-Pot','Salads & Sides','Videos'];
 $('collectionChips').innerHTML=featured.filter(x=>cats.includes(x)).map(x=>`<button class="collection-chip" data-category="${esc(x)}">${esc(x)}</button>`).join('');
 document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{currentCategory=b.dataset.category;$('categoryFilter').value=currentCategory;highlightCollections();render();location.hash='browse'}));
}
function highlightCollections(){document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===currentCategory))}
function filtered(){
 const q=$('search').value.trim().toLowerCase(),category=$('categoryFilter').value,source=$('sourceFilter').value;
 return RECIPES.filter(r=>{const d=info(r.id),hay=`${r.title} ${r.source} ${r.category} ${d.notes||''}`.toLowerCase();return(!q||hay.includes(q))&&(!category||r.category===category)&&(!source||r.source===source)&&(!favoritesOnly||d.favorite)})
}
function card(r){
 const d=info(r.id),stars=d.rating?'★'.repeat(Number(d.rating)):'';
 return `<article class="recipe-card"><div class="card-photo"><a class="photo-link" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(r.title)}"><img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy"></a><span class="category-tag">${esc(r.category)}</span><button class="favorite-badge ${d.favorite?'active':''}" data-favorite="${r.id}" aria-label="Favorite">${d.favorite?'★':'☆'}</button></div><div class="card-body"><h3>${esc(r.title)}</h3><div class="card-meta">${esc(r.source)} · ${esc(r.type)}</div><div class="stars">${stars}</div><div class="card-actions"><button class="details-button" data-details="${r.id}">Details</button><a class="source-link" href="${esc(r.url)}" target="_blank" rel="noopener">Open recipe →</a></div></div></article>`
}
function render(){
 const items=filtered();$('resultCount').textContent=`${items.length} recipe${items.length===1?'':'s'} shown · ${RECIPES.length} total`;$('recipeGrid').innerHTML=items.map(card).join('');$('emptyState').classList.toggle('hidden',items.length>0);
 document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.favorite);update(id,{favorite:!info(id).favorite});render()}));
 document.querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',()=>openDialog(Number(b.dataset.details))));
}
function openDialog(id){activeRecipe=RECIPES.find(r=>r.id===id);if(!activeRecipe)return;const d=info(id);$('dialogImage').src=activeRecipe.image;$('dialogImage').alt=activeRecipe.title;$('dialogMeta').textContent=`${activeRecipe.source} · ${activeRecipe.category}`;$('dialogTitle').textContent=activeRecipe.title;$('dialogOpen').href=activeRecipe.url;$('dialogFavorite').textContent=d.favorite?'★ Favorite':'☆ Add to favorites';$('dialogRating').value=d.rating||'';$('dialogNotes').value=d.notes||'';$('recipeDialog').showModal()}
function setView(v){view=v;localStorage.setItem('cc6-view',v);$('recipeGrid').classList.toggle('list-view',v==='list');$('gridView').classList.toggle('active',v==='grid');$('listView').classList.toggle('active',v==='list')}
function pick(){const r=randomRecipe();setFeature(r);openDialog(r.id)}
['search','categoryFilter','sourceFilter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{if(id==='categoryFilter'){currentCategory=$(id).value;highlightCollections()}render()}));
$('favoritesOnly').addEventListener('click',()=>{favoritesOnly=!favoritesOnly;$('favoritesOnly').classList.toggle('active',favoritesOnly);render()});
$('favoritesTop').addEventListener('click',()=>{favoritesOnly=true;$('favoritesOnly').classList.add('active');render();location.hash='browse'});
$('clearFilters').addEventListener('click',()=>{$('search').value='';$('categoryFilter').value='';$('sourceFilter').value='';currentCategory='';favoritesOnly=false;$('favoritesOnly').classList.remove('active');highlightCollections();render()});
$('clearCollection').addEventListener('click',()=>{$('categoryFilter').value='';currentCategory='';highlightCollections();render();location.hash='browse'});
$('gridView').addEventListener('click',()=>setView('grid'));$('listView').addEventListener('click',()=>setView('list'));
$('pickDinner').addEventListener('click',pick);$('surpriseTop').addEventListener('click',pick);$('featureCard').addEventListener('click',()=>openDialog(Number($('featureCard').dataset.id)));
$('dialogClose').addEventListener('click',()=>$('recipeDialog').close());$('recipeDialog').addEventListener('click',e=>{if(e.target===$('recipeDialog'))$('recipeDialog').close()});
$('dialogFavorite').addEventListener('click',()=>{if(!activeRecipe)return;update(activeRecipe.id,{favorite:!info(activeRecipe.id).favorite});openDialog(activeRecipe.id);render()});
$('dialogRating').addEventListener('change',()=>{if(activeRecipe){update(activeRecipe.id,{rating:$('dialogRating').value});render()}});
$('dialogNotes').addEventListener('input',()=>{if(activeRecipe)update(activeRecipe.id,{notes:$('dialogNotes').value})});
buildFilters();setView(view);setFeature(randomRecipe());updateStats();render();
