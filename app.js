
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const state={
  favorites:JSON.parse(localStorage.getItem('cc_favorites')||'[]'),
  notes:JSON.parse(localStorage.getItem('cc_notes')||'{}'),
  ratings:JSON.parse(localStorage.getItem('cc_ratings')||'{}'),
  ingredients:JSON.parse(localStorage.getItem('cc_ingredients')||'{}'),
  planner:JSON.parse(localStorage.getItem('cc_planner')||'{}'),
  shopping:JSON.parse(localStorage.getItem('cc_shopping')||'[]')
};

function save(){
  localStorage.setItem('cc_favorites',JSON.stringify(state.favorites));
  localStorage.setItem('cc_notes',JSON.stringify(state.notes));
  localStorage.setItem('cc_ratings',JSON.stringify(state.ratings));
  localStorage.setItem('cc_ingredients',JSON.stringify(state.ingredients));
  localStorage.setItem('cc_planner',JSON.stringify(state.planner));
  localStorage.setItem('cc_shopping',JSON.stringify(state.shopping));
  updateStats();
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function recipeCard(r){
  const fav=state.favorites.includes(r.id),note=state.notes[r.id]||'',rating=state.ratings[r.id]||'',ings=state.ingredients[r.id]||'';
  const badges=[r.category,...r.tags.slice(0,2)].map(x=>`<span class="badge">${esc(x)}</span>`).join('');
  return `<article class="card">
    <div class="card-main"><div class="badges">${badges}</div><h3>${esc(r.title)}</h3><div class="source">${esc(r.source)} · ${esc(r.protein)}</div></div>
    <div class="actions">
      <a class="open" href="${esc(r.url)}" target="_blank" rel="noopener">Open Recipe ↗</a>
      <button class="icon-btn ${fav?'active':''}" onclick="toggleFavorite(${r.id})">${fav?'★':'☆'}</button>
      <button class="icon-btn" onclick="addToPlannerPrompt(${r.id})">＋</button>
    </div>
    <details><summary>Notes, ingredients, and rating</summary>
      <textarea placeholder="My notes…" oninput="setNote(${r.id},this.value)">${esc(note)}</textarea>
      <textarea placeholder="Searchable ingredients, separated by commas…" oninput="setIngredients(${r.id},this.value)">${esc(ings)}</textarea>
      <div class="rating-row"><label>Rating</label><select onchange="setRating(${r.id},this.value)">
        <option value="">Not rated</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${String(rating)===String(n)?'selected':''}>${'★'.repeat(n)}</option>`).join('')}
      </select></div>
    </details>
  </article>`;
}

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  if(id==='favorites') renderFavorites();
  if(id==='planner') renderPlanner();
  if(id==='shopping') renderShopping();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showView(b.dataset.view));

function renderHome(){
  const counts={}; RECIPES.forEach(r=>counts[r.category]=(counts[r.category]||0)+1);
  categoryGrid.innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([c,n])=>
    `<button class="category-card" onclick="openCategory('${esc(c)}')"><strong>${esc(c)}</strong><span>${n} recipes</span></button>`).join('');
  recentGrid.innerHTML=RECIPES.slice(-4).reverse().map(recipeCard).join('');
}
function openCategory(c){showView('recipes');categoryFilter.value=c;renderRecipes()}
function renderRecipes(){
  const q=search.value.trim().toLowerCase(),iq=ingredientSearch.value.trim().toLowerCase();
  const filtered=RECIPES.filter(r=>{
    const hay=[r.title,r.source,r.category,r.protein,...r.tags].join(' ').toLowerCase();
    const ih=[r.title,...r.tags,state.ingredients[r.id]||''].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!iq||ih.includes(iq))&&(!categoryFilter.value||r.category===categoryFilter.value)&&(!proteinFilter.value||r.protein===proteinFilter.value);
  });
  recipeGrid.innerHTML=filtered.map(recipeCard).join('');
  recipeCount.textContent=`${filtered.length} recipe${filtered.length===1?'':'s'}`;
  empty.style.display=filtered.length?'none':'block';
}
function renderFavorites(){
  const f=RECIPES.filter(r=>state.favorites.includes(r.id));
  favoriteGrid.innerHTML=f.length?f.map(recipeCard).join(''):'<div class="empty" style="display:block">No favorites yet. Click ☆ on any recipe.</div>';
}
function toggleFavorite(id){
  state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
  save();renderRecipes();renderHome();if(document.getElementById('favorites').classList.contains('active'))renderFavorites();
}
function setNote(id,v){state.notes[id]=v;save()}
function setIngredients(id,v){state.ingredients[id]=v;save()}
function setRating(id,v){state.ratings[id]=v;save()}
function clearFilters(){search.value='';ingredientSearch.value='';categoryFilter.value='';proteinFilter.value='';renderRecipes()}
function pickRandom(){
  const pool=state.favorites.length?RECIPES.filter(r=>state.favorites.includes(r.id)):RECIPES;
  const r=pool[Math.floor(Math.random()*pool.length)];
  tonightText.innerHTML=`<strong>${esc(r.title)}</strong><br><span>${esc(r.source)}</span><br><a href="${esc(r.url)}" target="_blank">Open recipe ↗</a>`;
}
function updateStats(){
  recipeTotal.textContent=RECIPES.length;
  favoriteTotal.textContent=state.favorites.length;
  ratedTotal.textContent=Object.values(state.ratings).filter(Boolean).length;
}
function renderPlanner(){
  week.innerHTML=DAYS.map(d=>{
    const cur=state.planner[d]||'';
    const recipe=RECIPES.find(r=>String(r.id)===String(cur));
    return `<div class="day"><h3>${d}</h3><select onchange="setPlan('${d}',this.value)">
      <option value="">Choose recipe</option>
      ${RECIPES.map(r=>`<option value="${r.id}" ${String(cur)===String(r.id)?'selected':''}>${esc(r.title)}</option>`).join('')}
      </select>${recipe?`<p><a href="${recipe.url}" target="_blank">Open recipe ↗</a></p>`:''}</div>`;
  }).join('');
}
function setPlan(day,id){state.planner[day]=id;save();renderPlanner()}
function addToPlannerPrompt(id){
  const day=prompt('Add to which day? Monday–Sunday');
  if(day&&DAYS.map(x=>x.toLowerCase()).includes(day.toLowerCase())){
    const proper=DAYS.find(x=>x.toLowerCase()===day.toLowerCase());state.planner[proper]=id;save();alert('Added to '+proper);
  }
}
function renderShopping(){
  shoppingRows.innerHTML=state.shopping.length?state.shopping.map((x,i)=>`<div class="shop-row">
    <input type="checkbox" ${x.done?'checked':''} onchange="updateShop(${i},'done',this.checked)">
    <input value="${esc(x.item||'')}" placeholder="Item" oninput="updateShop(${i},'item',this.value)">
    <input value="${esc(x.qty||'')}" placeholder="Quantity" oninput="updateShop(${i},'qty',this.value)">
    <button onclick="removeShop(${i})">Remove</button></div>`).join(''):'<div class="empty" style="display:block">No items yet.</div>';
}
function addShoppingRow(){state.shopping.push({item:'',qty:'',done:false});save();renderShopping()}
function updateShop(i,k,v){state.shopping[i][k]=v;save()}
function removeShop(i){state.shopping.splice(i,1);save();renderShopping()}

const cats=[...new Set(RECIPES.map(r=>r.category))].sort();cats.forEach(v=>categoryFilter.add(new Option(v,v)));
[...new Set(RECIPES.map(r=>r.protein))].sort().forEach(v=>proteinFilter.add(new Option(v,v)));
search.addEventListener('input',renderRecipes);ingredientSearch.addEventListener('input',renderRecipes);
categoryFilter.addEventListener('change',renderRecipes);proteinFilter.addEventListener('change',renderRecipes);
clearFilters.addEventListener('click',clearFilters);randomBtn.addEventListener('click',pickRandom);addShopping.addEventListener('click',addShoppingRow);

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden')});
installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add('hidden')});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'))}
renderHome();renderRecipes();renderPlanner();renderShopping();updateStats();
