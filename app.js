
const RECIPES=window.RECIPES||[];
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const state={
favorites:JSON.parse(localStorage.getItem('cc_favorites')||'[]'),
notes:JSON.parse(localStorage.getItem('cc_notes')||'{}'),
ratings:JSON.parse(localStorage.getItem('cc_ratings')||'{}'),
ingredients:JSON.parse(localStorage.getItem('cc_ingredients')||'{}'),
planner:JSON.parse(localStorage.getItem('cc_planner')||'{}'),
shopping:JSON.parse(localStorage.getItem('cc_shopping')||'[]'),
recent:JSON.parse(localStorage.getItem('cc_recent')||'[]')
};
function save(){localStorage.setItem('cc_favorites',JSON.stringify(state.favorites));localStorage.setItem('cc_notes',JSON.stringify(state.notes));localStorage.setItem('cc_ratings',JSON.stringify(state.ratings));localStorage.setItem('cc_ingredients',JSON.stringify(state.ingredients));localStorage.setItem('cc_planner',JSON.stringify(state.planner));localStorage.setItem('cc_shopping',JSON.stringify(state.shopping));localStorage.setItem('cc_recent',JSON.stringify(state.recent))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function recipeCard(r){const fav=state.favorites.includes(r.id),note=state.notes[r.id]||'',rating=state.ratings[r.id]||'',ings=state.ingredients[r.id]||'';return `<article class="card"><div class="card-main"><div class="badges">${[r.category,...r.tags.slice(0,2)].map(x=>`<span class="badge">${esc(x)}</span>`).join('')}</div><h3>${esc(r.title)}</h3><div class="source">${esc(r.source)} · ${esc(r.protein)}</div></div><div class="actions"><a class="open" href="${esc(r.url)}" target="_blank" rel="noopener" data-open="${r.id}">Open Recipe ↗</a><button class="icon-btn ${fav?'active':''}" data-favorite="${r.id}">${fav?'★':'☆'}</button><button class="icon-btn" data-plan="${r.id}">＋</button></div><details><summary>Notes, ingredients, and rating</summary><textarea placeholder="My notes…" data-note="${r.id}">${esc(note)}</textarea><textarea placeholder="Searchable ingredients, separated by commas…" data-ingredients="${r.id}">${esc(ings)}</textarea><div class="rating-row"><label>Rating</label><select data-rating="${r.id}"><option value="">Not rated</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${String(rating)===String(n)?'selected':''}>${'★'.repeat(n)}</option>`).join('')}</select></div></details></article>`}
function bindCards(root=document){root.querySelectorAll('[data-open]').forEach(a=>a.addEventListener('click',()=>trackRecent(Number(a.dataset.open))));root.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>toggleFavorite(Number(b.dataset.favorite))));root.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>addToPlannerPrompt(Number(b.dataset.plan))));root.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('input',()=>{state.notes[el.dataset.note]=el.value;save()}));root.querySelectorAll('[data-ingredients]').forEach(el=>el.addEventListener('input',()=>{state.ingredients[el.dataset.ingredients]=el.value;save()}));root.querySelectorAll('[data-rating]').forEach(el=>el.addEventListener('change',()=>{state.ratings[el.dataset.rating]=el.value;save()}))}

function trackRecent(id){
  state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,4);
  save();
  renderContinue();
}
function renderContinue(){
  const items=state.recent.map(id=>RECIPES.find(r=>r.id===id)).filter(Boolean);
  continueSection.classList.toggle('hidden',items.length===0);
  continueGrid.innerHTML=items.map(recipeCard).join('');
  bindCards(continueGrid);
}
function categoryIcon(category){
  const icons={
    'Chicken':'🍗','Beef & Lamb':'🥩','Pork':'🐖','Seafood':'🐟',
    'Vegetarian':'🥬','Soups & Stews':'🥣','Salads & Sides':'🥗',
    'Pasta & Noodles':'🍝','Handhelds & Grilling':'🌮',
    'Desserts':'🍰','Collections & Other':'📚'
  };
  return icons[category]||'🍽️';
}

function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.main-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='favorites')renderFavorites();if(id==='planner')renderPlanner();if(id==='shopping')renderShopping();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.main-nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.jump)));
function setFeatured(r){featuredTitle.textContent=r.title;featuredMeta.textContent=`${r.source} · ${r.category}`;featuredLink.href=r.url;featuredLink.dataset.featuredId=r.id}
function randomRecipe(){const pool=state.favorites.length?RECIPES.filter(r=>state.favorites.includes(r.id)):RECIPES;return pool[Math.floor(Math.random()*pool.length)]}
function renderHome(){const counts={};RECIPES.forEach(r=>counts[r.category]=(counts[r.category]||0)+1);categoryGrid.innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<button class="category-card" data-category="${esc(c)}" data-icon="${categoryIcon(c)}"><strong>${esc(c)}</strong><span>${n} recipes</span></button>`).join('');categoryGrid.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{showView('recipes');categoryFilter.value=b.dataset.category;renderRecipes()}));recentGrid.innerHTML=RECIPES.slice(-4).reverse().map(recipeCard).join('');bindCards(recentGrid);if(RECIPES.length)setFeatured(RECIPES[0])}
function renderRecipes(){const q=search.value.trim().toLowerCase(),iq=ingredientSearch.value.trim().toLowerCase();const filtered=RECIPES.filter(r=>{const hay=[r.title,r.source,r.category,r.protein,...r.tags].join(' ').toLowerCase();const ih=[r.title,...r.tags,state.ingredients[r.id]||''].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!iq||ih.includes(iq))&&(!categoryFilter.value||r.category===categoryFilter.value)&&(!proteinFilter.value||r.protein===proteinFilter.value)});recipeGrid.innerHTML=filtered.map(recipeCard).join('');recipeCount.textContent=`${filtered.length} recipe${filtered.length===1?'':'s'}`;empty.style.display=filtered.length?'none':'block';bindCards(recipeGrid)}
function renderFavorites(){const f=RECIPES.filter(r=>state.favorites.includes(r.id));favoriteGrid.innerHTML=f.length?f.map(recipeCard).join(''):'<div class="empty" style="display:block">No favorites yet. Click ☆ on any recipe.</div>';bindCards(favoriteGrid)}
function toggleFavorite(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();renderRecipes();renderHome();if(document.getElementById('favorites').classList.contains('active'))renderFavorites()}
function addToPlannerPrompt(id){const day=prompt('Add to which day? Monday–Sunday');if(day&&DAYS.map(x=>x.toLowerCase()).includes(day.toLowerCase())){const proper=DAYS.find(x=>x.toLowerCase()===day.toLowerCase());state.planner[proper]=id;save();alert('Added to '+proper)}}
function renderPlanner(){week.innerHTML=DAYS.map(d=>{const cur=state.planner[d]||'',recipe=RECIPES.find(r=>String(r.id)===String(cur));return `<div class="day"><h3>${d}</h3><select data-day="${d}"><option value="">Choose recipe</option>${RECIPES.map(r=>`<option value="${r.id}" ${String(cur)===String(r.id)?'selected':''}>${esc(r.title)}</option>`).join('')}</select>${recipe?`<p><a href="${recipe.url}" target="_blank">Open recipe ↗</a></p>`:''}</div>`}).join('');week.querySelectorAll('[data-day]').forEach(s=>s.addEventListener('change',()=>{state.planner[s.dataset.day]=s.value;save();renderPlanner()}))}
function renderShopping(){shoppingRows.innerHTML=state.shopping.length?state.shopping.map((x,i)=>`<div class="shop-row"><input type="checkbox" ${x.done?'checked':''} data-shop-done="${i}"><input value="${esc(x.item||'')}" placeholder="Item" data-shop-item="${i}"><input value="${esc(x.qty||'')}" placeholder="Quantity" data-shop-qty="${i}"><button data-shop-remove="${i}">Remove</button></div>`).join(''):'<div class="empty" style="display:block">No items yet.</div>';shoppingRows.querySelectorAll('[data-shop-done]').forEach(e=>e.addEventListener('change',()=>{state.shopping[e.dataset.shopDone].done=e.checked;save()}));shoppingRows.querySelectorAll('[data-shop-item]').forEach(e=>e.addEventListener('input',()=>{state.shopping[e.dataset.shopItem].item=e.value;save()}));shoppingRows.querySelectorAll('[data-shop-qty]').forEach(e=>e.addEventListener('input',()=>{state.shopping[e.dataset.shopQty].qty=e.value;save()}));shoppingRows.querySelectorAll('[data-shop-remove]').forEach(e=>e.addEventListener('click',()=>{state.shopping.splice(Number(e.dataset.shopRemove),1);save();renderShopping()}))}
[...new Set(RECIPES.map(r=>r.category))].sort().forEach(v=>categoryFilter.add(new Option(v,v)));[...new Set(RECIPES.map(r=>r.protein))].sort().forEach(v=>proteinFilter.add(new Option(v,v)));
search.addEventListener('input',renderRecipes);ingredientSearch.addEventListener('input',renderRecipes);categoryFilter.addEventListener('change',renderRecipes);proteinFilter.addEventListener('change',renderRecipes);clearFilters.addEventListener('click',()=>{search.value='';ingredientSearch.value='';categoryFilter.value='';proteinFilter.value='';renderRecipes()});newFeatured.addEventListener('click',()=>setFeatured(randomRecipe()));tonightBtn.addEventListener('click',()=>{const r=randomRecipe();setFeatured(r);window.scrollTo({top:0,behavior:'smooth'})});addShopping.addEventListener('click',()=>{state.shopping.push({item:'',qty:'',done:false});save();renderShopping()});
let deferredPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden')});installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add('hidden')});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'));
featuredLink.addEventListener('click',()=>{if(featuredLink.dataset.featuredId)trackRecent(Number(featuredLink.dataset.featuredId))});
function runHomeSearch(){
  const q=homeSearch.value.trim();
  showView('recipes');
  search.value=q;
  renderRecipes();
}
homeSearchBtn.addEventListener('click',runHomeSearch);
homeSearch.addEventListener('keydown',e=>{if(e.key==='Enter')runHomeSearch()});
renderHome();renderContinue();renderRecipes();renderPlanner();renderShopping();
