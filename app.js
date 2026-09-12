const STORAGE_KEY = "nutrirank-user-products-v1";

const demoProducts = [
  {id:1,brand:"NutriLab",name:"Whey Balance 900 g",category:"Whey Concentrado",weightG:900,servingG:30,proteinServingG:24,carbsG:3.2,fatG:2.1,sodiumMg:118,price:119.90,lactoseFree:false,flavor:"Chocolate",change:-12,color:"#4ce6d2",source:"demo"},
  {id:2,brand:"PrimeFuel",name:"Albumin Pro 1 kg",category:"Albumina",weightG:1000,servingG:30,proteinServingG:24,carbsG:2.0,fatG:.2,sodiumMg:320,price:99.90,lactoseFree:true,flavor:"Natural",change:-18,color:"#ff9d54",source:"demo"},
  {id:3,brand:"Core Athlete",name:"Whey Essential 1 kg",category:"Whey Concentrado",weightG:1000,servingG:32,proteinServingG:23,carbsG:4.5,fatG:2.4,sodiumMg:135,price:129.90,lactoseFree:false,flavor:"Baunilha",change:-7,color:"#9e8cff",source:"demo"},
  {id:4,brand:"Pure Motion",name:"Iso Pure 900 g",category:"Whey Isolado",weightG:900,servingG:30,proteinServingG:27,carbsG:.8,fatG:.5,sodiumMg:92,price:199.90,lactoseFree:true,flavor:"Chocolate",change:-9,color:"#52a7ff",source:"demo"},
  {id:5,brand:"Endura",name:"Casein Night 900 g",category:"Caseína",weightG:900,servingG:35,proteinServingG:26,carbsG:3.8,fatG:1.4,sodiumMg:142,price:179.90,lactoseFree:false,flavor:"Baunilha",change:-5,color:"#d795ff",source:"demo"},
  {id:6,brand:"NutriLab",name:"Whey 3W Performance 900 g",category:"Blend 3W",weightG:900,servingG:30,proteinServingG:25,carbsG:2.1,fatG:1.6,sodiumMg:105,price:159.90,lactoseFree:false,flavor:"Cookies",change:-13,color:"#c9ff3d",source:"demo"},
  {id:7,brand:"BioStrong",name:"Albumina Premium 500 g",category:"Albumina",weightG:500,servingG:28,proteinServingG:22,carbsG:1.7,fatG:.3,sodiumMg:290,price:64.90,lactoseFree:true,flavor:"Morango",change:-16,color:"#ff7b79",source:"demo"},
  {id:8,brand:"MaxPower",name:"Whey Pro 900 g",category:"Whey Concentrado",weightG:900,servingG:30,proteinServingG:21,carbsG:5.2,fatG:2.8,sodiumMg:148,price:109.90,lactoseFree:false,flavor:"Chocolate",change:-10,color:"#ffc857",source:"demo"},
  {id:9,brand:"Pure Motion",name:"Hydro Fast 900 g",category:"Whey Hidrolisado",weightG:900,servingG:30,proteinServingG:26,carbsG:1.0,fatG:.7,sodiumMg:96,price:239.90,lactoseFree:true,flavor:"Neutro",change:-6,color:"#52e0ff",source:"demo"},
  {id:10,brand:"PrimeFuel",name:"Whey Economy 1,8 kg",category:"Whey Concentrado",weightG:1800,servingG:30,proteinServingG:22,carbsG:4.2,fatG:2.5,sodiumMg:132,price:209.90,lactoseFree:false,flavor:"Chocolate",change:-21,color:"#ff9d54",source:"demo"},
  {id:11,brand:"Core Athlete",name:"Micellar Casein 900 g",category:"Caseína",weightG:900,servingG:34,proteinServingG:25,carbsG:3.4,fatG:1.2,sodiumMg:126,price:169.90,lactoseFree:false,flavor:"Chocolate",change:-8,color:"#9e8cff",source:"demo"},
  {id:12,brand:"BioStrong",name:"Iso Clean 600 g",category:"Whey Isolado",weightG:600,servingG:30,proteinServingG:26,carbsG:1.1,fatG:.6,sodiumMg:89,price:149.90,lactoseFree:true,flavor:"Baunilha",change:-11,color:"#ff7b79",source:"demo"}
];

const categoryMeta = [
  {name:"Whey Concentrado",code:"WC",desc:"Equilíbrio entre preço e composição",color:"#4ce6d2"},
  {name:"Whey Isolado",code:"WI",desc:"Alta concentração e menos lactose",color:"#52a7ff"},
  {name:"Whey Hidrolisado",code:"WH",desc:"Proteína parcialmente hidrolisada",color:"#52e0ff"},
  {name:"Blend 3W",code:"3W",desc:"Mistura de diferentes frações",color:"#c9ff3d"},
  {name:"Albumina",code:"AL",desc:"Proteína derivada da clara do ovo",color:"#ff9d54"},
  {name:"Caseína",code:"CA",desc:"Digestão lenta e uso prolongado",color:"#d795ff"}
];

const $ = selector => document.querySelector(selector);
const money = new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"});
const decimal = new Intl.NumberFormat("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1});
const cost = value => `R$ ${value.toFixed(3).replace(".", ",")}`;
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]));

function loadUserProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Não foi possível carregar os produtos locais.", error);
    return [];
  }
}

async function saveUserProducts() {
  const response = await window.mobileApi('/api/products', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({products:userProducts.filter(p => p.nutritionConfirmed)})});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');

}

function categoryColor(category) {
  return categoryMeta.find(item => item.name === category)?.color || "#4ce6d2";
}

function enrichProduct(product) {
  const listPrice = Number(product.listPrice ?? product.price);
  const validCoupon = product.couponExpires && new Date(product.couponExpires + 'T23:59:59') >= new Date();
  const couponPrice = validCoupon && Number(product.couponPrice) > 0 && Number(product.couponPrice) <= listPrice ? Number(product.couponPrice) : null;
  const effectivePrice = document.querySelector('#couponRanking')?.checked && couponPrice ? couponPrice : listPrice;
  const concentration = (Number(product.proteinServingG) / Number(product.servingG)) * 100;
  const totalProteinG = Number(product.weightG) * concentration / 100;
  const costPerProteinG = effectivePrice / totalProteinG;
  const servings = Number(product.weightG) / Number(product.servingG);
  const costPerServing = effectivePrice / servings;
  const score = Math.max(6.2, Math.min(9.8, 10 - costPerProteinG * 7 + concentration / 100)).toFixed(1);

  return {
    ...product,
    listPrice,
    couponPrice,
    price: effectivePrice,
    concentration,
    totalProteinG,
    costPerProteinG,
    servings,
    costPerServing,
    score:Number(score),
    color:product.color || categoryColor(product.category),
    flavor:product.flavor || "Não informado",
    source:product.source || "user"
  };
}

let userProducts = [];
let products = [];
let editingId = null;

const state = {category:"", filtered:[], compareIds:[]};

const refs = {
  html:document.documentElement,
  themeToggle:$("#themeToggle"), menuToggle:$("#menuToggle"), mobileNav:$("#mobileNav"),
  heroSearchForm:$("#heroSearchForm"), heroSearchInput:$("#heroSearchInput"), heroMockProducts:$("#heroMockProducts"),
  categoryGrid:$("#categoryGrid"), categoryTabs:$("#categoryTabs"), dealGrid:$("#dealGrid"), productGrid:$("#productGrid"),
  searchInput:$("#searchInput"), brandFilter:$("#brandFilter"), priceFilter:$("#priceFilter"), sortFilter:$("#sortFilter"),
  concentrationFilter:$("#concentrationFilter"), lactoseFreeFilter:$("#lactoseFreeFilter"), userOnlyFilter:$("#userOnlyFilter"), clearFilters:$("#clearFilters"),
  advancedToggle:$("#advancedToggle"), advancedFilters:$("#advancedFilters"), resultCount:$("#resultCount"),
  compareEmpty:$("#compareEmpty"), compareGrid:$("#compareGrid"), compareTray:$("#compareTray"), trayCount:$("#trayCount"), trayProducts:$("#trayProducts"),
  toast:$("#toast"), newsletterForm:$("#newsletterForm"), newsletterMessage:$("#newsletterMessage"),
  calcPrice:$("#calcPrice"), calcServing:$("#calcServing"), calcProtein:$("#calcProtein"), calcWeight:$("#calcWeight"),
  calcConcentration:$("#calcConcentration"), calcTotalProtein:$("#calcTotalProtein"), calcCost:$("#calcCost"),
  articlesTrack:$("#articlesTrack"), articlesPrev:$("#articlesPrev"), articlesNext:$("#articlesNext"),
  manualProductForm:$("#manualProductForm"), manualProductLink:$("#manualProductLink"), manualBrand:$("#manualBrand"), manualName:$("#manualName"),
  manualCategory:$("#manualCategory"), manualPrice:$("#manualPrice"), manualCouponPrice:$("#manualCouponPrice"), manualCouponCode:$("#manualCouponCode"),
  manualWeight:$("#manualWeight"), manualServing:$("#manualServing"), manualProtein:$("#manualProtein"), manualFlavor:$("#manualFlavor"), manualLactoseFree:$("#manualLactoseFree"),
  manualAffiliateLink:$("#manualAffiliateLink"), manualNutritionConfirmed:$("#manualNutritionConfirmed"),
  importProductButton:$("#importProductButton"), importStatus:$("#importStatus"), importPreview:$("#importPreview"),
  importWarnings:$("#importWarnings"), importProductImage:$("#importProductImage"), importProductTitle:$("#importProductTitle"),
  importProductMeta:$("#importProductMeta"), importItemId:$("#importItemId"), importProductId:$("#importProductId"),
  importFoundPrice:$("#importFoundPrice"), importAvailability:$("#importAvailability"),
  manualImageUrl:$("#manualImageUrl"), manualItemId:$("#manualItemId"), manualCatalogProductId:$("#manualCatalogProductId"),
  manualImportConfidence:$("#manualImportConfidence"),
  userProductCount:$("#userProductCount"), userProductsTableBody:$("#userProductsTableBody"), userProductsMobile:$("#userProductsMobile"),
  exportProductsButton:$("#exportProductsButton"), clearUserProductsButton:$("#clearUserProductsButton")
};

function rebuildProducts() {
  products = (document.querySelector('#demoMode')?.checked ? demoProducts : userProducts.filter(p => p.nutritionConfirmed && !['paused','closed','inactive','unavailable'].includes(p.status))).map(enrichProduct);
  state.compareIds = state.compareIds.filter(id => products.some(product => product.id === id));
  refreshBrandFilter();
  updateCounters();
}

function refreshBrandFilter() {
  const current = refs.brandFilter.value;
  const brands = [...new Set(products.map(product => product.brand))].sort((a,b) => a.localeCompare(b, "pt-BR"));
  refs.brandFilter.innerHTML = '<option value="">Todas as marcas</option>' + brands.map(brand => `<option value="${escapeHTML(brand)}">${escapeHTML(brand)}</option>`).join("");
  refs.brandFilter.value = brands.includes(current) ? current : "";
}

function updateCounters() {
  $("#heroProductCount").textContent = products.length;
  $("#heroBrandCount").textContent = new Set(products.map(product => product.brand)).size;
  refs.userProductCount.textContent = userProducts.length;
  $("#lastUpdate").textContent = new Intl.DateTimeFormat("pt-BR", {dateStyle:"long"}).format(new Date());
}

function jarHTML(product, compact=false) {
  const categoryCode = product.category.replace("Whey ", "").replace("Concentrado", "WPC").replace("Isolado", "ISO").replace("Hidrolisado", "HYDRO").toUpperCase();
  return `<div class="product-visual" style="--product-color:${product.color}"><div class="jar ${compact ? "jar-compact" : ""}"><div class="jar-label"><b>${escapeHTML(product.brand)}</b><small>${escapeHTML(categoryCode)}</small></div></div></div>`;
}

function setup() {
  rebuildProducts();
  $("#currentYear").textContent = new Date().getFullYear();
  renderCategories();
  renderAllDynamic();
  calculate();
  setupTheme();
}

function renderAllDynamic() {
  renderHeroMock();
  renderDeals();
  renderUserProducts();
  applyFilters();
  renderCompare();
}

function renderCategories() {
  refs.categoryGrid.innerHTML = categoryMeta.map(category => `<button class="category-card" data-category="${category.name}" style="--category-color:${category.color}"><span class="category-arrow">↗</span><span class="category-visual">${category.code}</span><span><strong>${category.name}</strong><small>${category.desc}</small></span></button>`).join("");
  refs.categoryTabs.innerHTML = '<button class="category-tab active" data-tab-category="">Todas</button>' + categoryMeta.map(category => `<button class="category-tab" data-tab-category="${category.name}">${category.name}</button>`).join("");
}

function renderHeroMock() {
  refs.heroMockProducts.innerHTML = [...products].sort((a,b) => a.costPerProteinG - b.costPerProteinG).slice(0,4).map(product => `<div class="mock-product"><div class="mock-jar"><span>${product.category === "Albumina" ? "ALB" : "PRO"}</span></div><div class="mock-info"><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.brand)} · ${decimal.format(product.concentration)}% proteína</small></div><div class="mock-price"><strong>${cost(product.costPerProteinG)}</strong><small>por grama</small></div></div>`).join("");
}

function offerLink(product, className="offer-link") {
  if (!product.url || !isMercadoLivreUrl(product.url)) return "";
  return `<a class="${className}" href="${escapeHTML(product.url)}" target="_blank" rel="noopener noreferrer sponsored">Ver oferta <span>↗</span></a>`;
}

function renderDeals() {
  refs.dealGrid.innerHTML = [...products].sort((a,b) => a.costPerProteinG - b.costPerProteinG).slice(0,4).map((product,index) => `<article class="deal-card"><div class="deal-top"><span class="deal-badge">${index === 0 ? "Melhor custo" : index === 1 ? "Destaque" : "Boa compra"}</span>${product.source === "user" ? '<span class="user-source-badge">Sua oferta</span>' : `<span class="deal-change">↘ ${Math.abs(product.change || 0)}%</span>`}</div>${jarHTML(product)}<h3>${escapeHTML(product.name)}</h3><span class="product-brand">${escapeHTML(product.brand)} · ${escapeHTML(product.category)}</span><div class="deal-pricing"><div><span>${document.querySelector("#couponRanking")?.checked && product.couponPrice ? "Potencial com cupom" : "Preço anunciado"}</span><strong>${money.format(product.price)}</strong></div><small>${cost(product.costPerProteinG)}/g</small></div>${offerLink(product, "deal-offer-link")}</article>`).join("");
}

function applyFilters() {
  const query = refs.searchInput.value.trim().toLowerCase();
  const brand = refs.brandFilter.value;
  const maxPrice = Number(refs.priceFilter.value) || Infinity;
  const minConcentration = Number(refs.concentrationFilter.value) || 0;
  const lactoseFree = refs.lactoseFreeFilter.checked;
  const userOnly = refs.userOnlyFilter.checked;

  let result = products.filter(product => {
    const searchable = `${product.name} ${product.brand} ${product.category} ${product.flavor} ${product.couponCode || ""}`.toLowerCase();
    return searchable.includes(query)
      && (!state.category || product.category === state.category)
      && (!brand || product.brand === brand)
      && product.price <= maxPrice
      && product.concentration >= minConcentration
      && (!lactoseFree || product.lactoseFree)
      && (!userOnly || product.source === "user");
  });

  const sort = refs.sortFilter.value;
  result.sort((a,b) => sort === "scoreDesc" ? b.score - a.score : sort === "concentrationDesc" ? b.concentration - a.concentration : sort === "priceAsc" ? a.price - b.price : a.costPerProteinG - b.costPerProteinG);
  state.filtered = result;
  renderProducts();
  refs.resultCount.textContent = result.length;
}

function renderProducts() {
  if (!state.filtered.length) {
    refs.productGrid.innerHTML = '<div class="empty-state"><strong>Nenhum produto encontrado.</strong><br>Altere os filtros ou cadastre uma nova oferta.</div>';
    return;
  }

  const bestCost = Math.min(...state.filtered.map(product => product.costPerProteinG));
  refs.productGrid.innerHTML = state.filtered.map((product,index) => `<article class="product-card ${product.source === "user" ? "user-product-card" : ""}"><div class="product-card-top"><span class="rank-pill"><strong>#${index + 1}</strong> no filtro</span><div class="card-badges">${product.source === "user" ? '<span class="user-source-badge">Sua oferta</span>' : ""}</div></div>${jarHTML(product)}<h3>${escapeHTML(product.name)}</h3><span class="product-brand">${escapeHTML(product.brand)} · ${escapeHTML(product.flavor)}</span><div class="product-chips"><span class="product-chip">${escapeHTML(product.category)}</span>${product.lactoseFree ? '<span class="product-chip">Sem lactose</span>' : ""}${product.couponPrice ? `<span class="product-chip coupon-chip">Cupom ${escapeHTML(product.couponCode || "informado")} · até ${escapeHTML(product.couponExpires)}</span><span class="product-chip">${escapeHTML(product.couponTerms || "Consulte a elegibilidade e as condições na loja")}</span>` : ""}<span class="product-chip">${Math.round(product.totalProteinG)} g proteína</span></div><div class="product-stats"><div><span>Concentração</span><strong>${decimal.format(product.concentration)}%</strong></div><div><span>Por dose</span><strong>${product.proteinServingG} g</strong></div><div><span>Custo/dose</span><strong>${money.format(product.costPerServing)}</strong></div></div><div class="product-price-row"><div><span>${document.querySelector("#couponRanking")?.checked && product.couponPrice ? "Potencial com cupom" : "Preço anunciado"}</span><strong>${money.format(product.price)}</strong>${product.couponPrice ? `<small>Potencial: ${money.format(product.couponPrice)} · cupom ${escapeHTML(product.couponCode || "informado")} · sujeito às condições</small>` : ""}<small>${product.costPerProteinG === bestCost ? "melhor custo · " : ""}${cost(product.costPerProteinG)}/g</small></div><button class="compare-button ${state.compareIds.includes(product.id) ? "selected" : ""}" data-compare="${product.id}" type="button">${state.compareIds.includes(product.id) ? "✓ Selecionado" : "＋ Comparar"}</button></div><small>Preço registrado: ${escapeHTML(product.checkedAt ? new Date(product.checkedAt).toLocaleString("pt-BR") : "cadastro manual; confirme na loja")}</small>${offerLink(product, "product-offer-link")}</article>`).join("");
}

function renderUserProducts() {
  const sorted = userProducts.map(enrichProduct).sort((a,b) => a.costPerProteinG - b.costPerProteinG);
  refs.userProductCount.textContent = sorted.length;
  const alerts = userProducts.filter(p => p.alertTarget > 0 && p.listPrice <= p.alertTarget && p.nutritionConfirmed && !['closed','paused','unavailable','inactive'].includes(p.status));
  $('#localAlerts').textContent = alerts.length ? 'Preço-alvo atingido: '+alerts.map(p => p.name+' ('+money.format(p.listPrice)+')').join('; ') : 'Nenhum preço-alvo atingido. Configure um alerta ao cadastrar ou editar um produto.';
  refs.exportProductsButton.disabled = sorted.length === 0;
  refs.clearUserProductsButton.disabled = sorted.length === 0;

  if (!sorted.length) {
    refs.userProductsTableBody.innerHTML = '<tr><td colspan="8"><div class="user-products-empty">Nenhum produto cadastrado. Use o formulário acima para criar sua primeira comparação.</div></td></tr>';
    refs.userProductsMobile.innerHTML = '<div class="user-products-empty">Nenhum produto cadastrado.</div>';
    return;
  }

  refs.userProductsTableBody.innerHTML = sorted.map((product,index) => `<tr><td><span class="manual-rank">#${index + 1}</span></td><td><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.brand)} · ${escapeHTML(product.category)}${product.couponCode ? ` · Cupom ${escapeHTML(product.couponCode)}` : ""}</small></td><td><strong>${money.format(product.price)}</strong>${product.couponPrice ? `<small>anunciado: ${money.format(product.listPrice)}</small>` : ""}</td><td>${decimal.format(product.concentration)}%</td><td>${Math.round(product.totalProteinG)} g</td><td><strong class="table-cost">${cost(product.costPerProteinG)}</strong></td><td>${offerLink(product, "table-offer-link")}</td><td><button data-edit="${product.id}" type="button">Editar</button> <button data-history="${product.id}" type="button">Histórico</button> <button class="delete-product-button" data-delete-user="${product.id}" type="button" aria-label="Excluir ${escapeHTML(product.name)}">Excluir</button></td></tr>`).join("");

  refs.userProductsMobile.innerHTML = sorted.map((product,index) => `<article class="user-product-mobile-card"><div><span class="manual-rank">#${index + 1}</span><button data-edit="${product.id}" type="button">Editar</button><button data-history="${product.id}" type="button">Histórico</button><button class="delete-product-button" data-delete-user="${product.id}" type="button">Excluir</button></div><h4>${escapeHTML(product.name)}</h4><p>${escapeHTML(product.brand)} · ${escapeHTML(product.category)}</p><dl><div><dt>Preço usado</dt><dd>${money.format(product.price)}</dd></div><div><dt>Concentração</dt><dd>${decimal.format(product.concentration)}%</dd></div><div><dt>Proteína total</dt><dd>${Math.round(product.totalProteinG)} g</dd></div><div><dt>Custo/g</dt><dd>${cost(product.costPerProteinG)}</dd></div></dl>${offerLink(product, "table-offer-link")}</article>`).join("");
}

function selectCategory(category) {
  state.category = category;
  document.querySelectorAll(".category-tab").forEach(button => button.classList.toggle("active", button.dataset.tabCategory === category));
  applyFilters();
  $("#ranking").scrollIntoView({behavior:"smooth"});
}

function toggleCompare(id) {
  if (state.compareIds.includes(id)) {
    state.compareIds = state.compareIds.filter(productId => productId !== id);
  } else {
    if (state.compareIds.length >= 3) {
      showToast("Você pode comparar no máximo três produtos.");
      return;
    }
    state.compareIds.push(id);
  }
  renderProducts();
  renderCompare();
}

function renderCompare() {
  const selected = state.compareIds.map(id => products.find(product => product.id === id)).filter(Boolean);
  refs.compareEmpty.hidden = selected.length > 0;
  refs.compareGrid.hidden = selected.length === 0;
  const best = selected.length ? Math.min(...selected.map(product => product.costPerProteinG)) : null;

  refs.compareGrid.innerHTML = selected.map(product => `<article class="compare-card ${product.costPerProteinG === best ? "best" : ""}">${product.costPerProteinG === best ? '<span class="best-label">Melhor custo entre os selecionados</span>' : ""}<button class="compare-remove" data-remove="${product.id}" type="button" aria-label="Remover ${escapeHTML(product.name)}">×</button>${jarHTML(product,true)}<h3>${escapeHTML(product.name)}</h3><small>${escapeHTML(product.brand)} · ${escapeHTML(product.category)}</small><dl><div><dt>Preço usado</dt><dd>${money.format(product.price)}</dd></div>${product.couponPrice ? `<div><dt>Preço anunciado</dt><dd>${money.format(product.listPrice)}</dd></div>` : ""}<div><dt>Concentração</dt><dd>${decimal.format(product.concentration)}%</dd></div><div><dt>Proteína total</dt><dd>${Math.round(product.totalProteinG)} g</dd></div><div><dt>Proteína por dose</dt><dd>${product.proteinServingG} g</dd></div><div><dt>Custo por dose</dt><dd>${money.format(product.costPerServing)}</dd></div><div><dt>Sem lactose</dt><dd>${product.lactoseFree ? "Sim" : "Não"}</dd></div></dl><div class="compare-highlight"><span>Custo por grama de proteína</span><strong>${cost(product.costPerProteinG)}</strong></div>${offerLink(product, "compare-offer-link")}</article>`).join("");

  refs.compareTray.classList.toggle("visible", selected.length > 0);
  refs.trayCount.textContent = selected.length;
  refs.trayProducts.innerHTML = selected.map(product => `<span class="tray-product" title="${escapeHTML(product.name)}">${escapeHTML(product.brand.slice(0,2).toUpperCase())}</span>`).join("");
}

function clearFilters() {
  state.category = "";
  refs.searchInput.value = "";
  refs.brandFilter.value = "";
  refs.priceFilter.value = "";
  refs.sortFilter.value = "costAsc";
  refs.concentrationFilter.value = "";
  refs.lactoseFreeFilter.checked = false;
  refs.userOnlyFilter.checked = false;
  document.querySelectorAll(".category-tab").forEach(button => button.classList.toggle("active", button.dataset.tabCategory === ""));
  applyFilters();
}

function calculate() {
  const price = Number(refs.calcPrice.value);
  const serving = Number(refs.calcServing.value);
  const protein = Number(refs.calcProtein.value);
  const weight = Number(refs.calcWeight.value);
  if (![price,serving,protein,weight].every(n => Number.isFinite(n) && n > 0) || protein > serving || serving > weight) {
    refs.calcConcentration.textContent = "—";
    refs.calcTotalProtein.textContent = "—";
    refs.calcCost.textContent = "—";
    return;
  }
  const concentration = protein / serving * 100;
  const total = weight * concentration / 100;
  const value = price / total;
  refs.calcConcentration.textContent = `${decimal.format(concentration)}%`;
  refs.calcTotalProtein.textContent = `${Math.round(total)} g`;
  refs.calcCost.textContent = cost(value);
}

function isMercadoLivreUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && (hostname === "meli.la" || ["mercadolivre.com.br","mercadolivre.com"].some(d => hostname === d || hostname.endsWith("." + d)));
  } catch {
    return false;
  }
}


let lastImportedProduct = null;
let importGeneration = 0;

function setImportStatus(state, title, message) {
  refs.importStatus.dataset.state = state;
  const icons = {idle:"◎", loading:"↻", success:"✓", warning:"!", error:"×"};
  refs.importStatus.querySelector(".import-status-icon").textContent = icons[state] || "◎";
  refs.importStatus.querySelector("strong").textContent = title;
  refs.importStatus.querySelector("p").textContent = message;
}

function setSourceBadge(id, confidence, label) {
  const badge = document.querySelector(id);
  if (!badge) return;
  badge.dataset.confidence = confidence || "none";
  badge.textContent = label || ({high:"API", medium:"inferido", none:"confirmar"}[confidence] || "");
}

function setNumericInput(input, value) {
  input.value = Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : "";
}

function resetImportPresentation() {
  refs.importPreview.hidden = true;
  refs.importWarnings.hidden = true;
  refs.importWarnings.innerHTML = "";
  refs.manualImageUrl.value = "";
  refs.manualItemId.value = "";
  refs.manualCatalogProductId.value = "";
  refs.manualImportConfidence.value = "";
  refs.manualNutritionConfirmed.checked = false;
  ["#manualBrandSource","#manualNameSource","#manualCategorySource","#manualPriceSource","#manualWeightSource","#manualServingSource","#manualProteinSource","#manualFlavorSource"]
    .forEach(id => setSourceBadge(id, "none", ""));
}

function fillImportedProduct(data) {
  lastImportedProduct = data;
  const confidence = data.confidence || {};

  if (data.permalink) refs.manualProductLink.value = data.permalink;
  refs.manualBrand.value = data.brand || "";
  refs.manualName.value = data.title || "";
  refs.manualCategory.value = data.category || "Whey Concentrado";
  setNumericInput(refs.manualPrice, data.price);
  setNumericInput(refs.manualWeight, data.weight_g);
  setNumericInput(refs.manualServing, data.serving_g);
  setNumericInput(refs.manualProtein, data.protein_per_serving_g);
  refs.manualFlavor.value = data.flavor || "";
  refs.manualLactoseFree.checked = data.lactose_free === true;
  refs.manualImageUrl.value = data.image || "";
  refs.manualItemId.value = data.item_id || "";
  refs.manualCatalogProductId.value = data.catalog_product_id || "";
  refs.manualImportConfidence.value = JSON.stringify(confidence);

  setSourceBadge("#manualBrandSource", confidence.brand || "none");
  setSourceBadge("#manualNameSource", confidence.title || "high");
  setSourceBadge("#manualCategorySource", confidence.category || "medium");
  setSourceBadge("#manualPriceSource", confidence.price || "high");
  setSourceBadge("#manualWeightSource", confidence.weight_g || "none");
  setSourceBadge("#manualServingSource", confidence.serving_g || "none");
  setSourceBadge("#manualProteinSource", confidence.protein_per_serving_g || "none");
  setSourceBadge("#manualFlavorSource", confidence.flavor || "none");

  if (data.image) {
    refs.importProductImage.src = data.image;
    refs.importProductImage.hidden = false;
  } else {
    refs.importProductImage.removeAttribute("src");
    refs.importProductImage.hidden = true;
  }
  refs.importProductImage.alt = data.title ? `Imagem de ${data.title}` : "Imagem do produto";
  refs.importProductTitle.textContent = data.title || "Produto sem título";
  refs.importProductMeta.textContent = [data.brand, data.category, data.flavor].filter(Boolean).join(" · ") || "Dados parciais";
  refs.importItemId.textContent = `Anúncio: ${data.item_id || "não identificado"}`;
  refs.importProductId.textContent = `Catálogo: ${data.catalog_product_id || "não identificado"}`;
  refs.importFoundPrice.textContent = Number(data.price) > 0 ? money.format(data.price) : "Não encontrado";
  refs.importAvailability.textContent = data.available_quantity != null
    ? `${data.available_quantity} unidade(s) informada(s) · ${data.status || "situação não informada"}`
    : (data.status || "Disponibilidade não informada");
  refs.importPreview.hidden = false;

  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  if (warnings.length) {
    refs.importWarnings.innerHTML = `<strong>Confira antes de ranquear:</strong><ul>${warnings.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
    refs.importWarnings.hidden = false;
  } else {
    refs.importWarnings.hidden = true;
  }

  const missingNutrition = !data.weight_g || !data.serving_g || !data.protein_per_serving_g;
  if (missingNutrition) {
    setImportStatus("warning", "Produto importado com dados pendentes", "Os dados comerciais foram preenchidos. Complete ou confirme as informações nutricionais destacadas.");
  } else {
    setImportStatus("success", "Produto importado", "Revise os campos, marque a confirmação nutricional e adicione ao ranking.");
  }
}

async function importProductFromLink() {
  editingId = null;
  showToast("Importação online ainda não ativada. Cadastre os dados manualmente.");
  return;
  const url = refs.manualProductLink.value.trim();
  if (!isMercadoLivreUrl(url)) {
    showToast("Cole um link válido do Mercado Livre.");
    refs.manualProductLink.focus();
    return;
  }

  const generation = ++importGeneration;
  lastImportedProduct = null;
  resetImportPresentation();
  [refs.manualBrand,refs.manualName,refs.manualPrice,refs.manualWeight,refs.manualServing,refs.manualProtein,refs.manualFlavor,refs.manualCouponPrice,refs.manualCouponCode,refs.manualAffiliateLink].forEach(input => input.value = '');
  refs.importProductButton.disabled = true;
  setImportStatus("loading", "Consultando o Mercado Livre", "Identificando anúncio, preço, atributos e informações nutricionais disponíveis...");

  try {
    const response = await window.mobileApi("/api/import", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({url})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível importar este anúncio.");

    if (generation !== importGeneration) return;
    fillImportedProduct(payload);
  } catch (error) {
    if (generation !== importGeneration) return;
    console.error(error);
    const fileMode = window.location.protocol === "file:";
    setImportStatus(
      "error",
      "Falha na importação",
      fileMode
        ? "Abra o projeto pelo arquivo iniciar_nutrirank.bat; o importador não funciona abrindo apenas o index.html."
        : error.message
    );
    showToast(fileMode ? "Use iniciar_nutrirank.bat para ativar o servidor." : error.message);
  } finally {
    if (generation === importGeneration) refs.importProductButton.disabled = false;
  }
}

async function addManualProduct(event) {
  event.preventDefault();
  const url = refs.manualProductLink.value.trim();
  const listPrice = refs.manualPrice.valueAsNumber;
  const couponPrice = refs.manualCouponPrice.valueAsNumber;
  const affiliateUrl = refs.manualAffiliateLink.value.trim();
  const servingG = refs.manualServing.valueAsNumber;
  const proteinServingG = refs.manualProtein.valueAsNumber;

  if (!isMercadoLivreUrl(url)) {
    showToast("Informe um link válido do Mercado Livre.");
    refs.manualProductLink.focus();
    return;
  }
  if (!refs.manualNutritionConfirmed.checked) {
    showToast("Confirme que conferiu peso, porção e proteína por porção.");
    refs.manualNutritionConfirmed.focus();
    return;
  }
  if (affiliateUrl && !isMercadoLivreUrl(affiliateUrl)) {
    showToast("O link de afiliado deve ser um endereço válido do Mercado Livre.");
    refs.manualAffiliateLink.focus();
    return;
  }
  if (proteinServingG > servingG) {
    showToast("A proteína por porção não pode ser maior que o tamanho da porção.");
    refs.manualProtein.focus();
    return;
  }
  if (Number.isFinite(couponPrice) && couponPrice > 0 && couponPrice > listPrice) {
    showToast("O preço com cupom deve ser menor ou igual ao preço anunciado.");
    refs.manualCouponPrice.focus();
    return;
  }

  if (![listPrice, servingG, proteinServingG, refs.manualWeight.valueAsNumber].every(n => Number.isFinite(n) && n > 0) || servingG > refs.manualWeight.valueAsNumber) { showToast('Confira os valores positivos e o peso da porção.'); return; }
  if (couponPrice > 0 && (!$('#couponExpires').value || !refs.manualCouponCode.value.trim())) { showToast('Informe código e validade do cupom.'); return; }
  const product = {
    id:editingId || Date.now(),
    nutritionConfirmed:true,
    status:lastImportedProduct ? (lastImportedProduct.available_quantity === 0 ? 'unavailable' : lastImportedProduct.status) : (userProducts.find(p=>p.id===editingId)?.status || 'manual'),
    checkedAt:lastImportedProduct ? new Date().toISOString() : null,
    couponExpires:$('#couponExpires').value,
    couponTerms:$('#couponTerms').value,
    alertTarget:Number($('#alertTarget').value) || null,
    brand:refs.manualBrand.value.trim(),
    name:refs.manualName.value.trim(),
    category:refs.manualCategory.value,
    listPrice,
    couponPrice:Number.isFinite(couponPrice) && couponPrice > 0 ? couponPrice : null,
    price:Number.isFinite(couponPrice) && couponPrice > 0 ? couponPrice : listPrice,
    couponCode:refs.manualCouponCode.value.trim().toUpperCase(),
    weightG:refs.manualWeight.valueAsNumber,
    servingG,
    proteinServingG,
    carbsG:0,
    fatG:0,
    sodiumMg:0,
    lactoseFree:refs.manualLactoseFree.checked,
    flavor:refs.manualFlavor.value.trim() || "Não informado",
    change:0,
    color:categoryColor(refs.manualCategory.value),
    url:affiliateUrl || url,
    originalUrl:url,
    affiliateUrl:affiliateUrl || null,
    image:refs.manualImageUrl.value || null,
    itemId:refs.manualItemId.value || null,
    catalogProductId:refs.manualCatalogProductId.value || null,
    importConfidence:refs.manualImportConfidence.value ? JSON.parse(refs.manualImportConfidence.value) : {},
    source:"user",
    importedAutomatically:Boolean(refs.manualItemId.value || refs.manualCatalogProductId.value),
    createdAt:new Date().toISOString()
  };

  const previous = [...userProducts];
  userProducts = userProducts.filter(p => p.id !== product.id);
  userProducts.push(product);
  try { await saveUserProducts(); } catch(error) { userProducts = previous; showToast(error.message); return; }
  editingId = null;
  refs.manualProductForm.reset();
  refs.manualCategory.value = "Whey Concentrado";
  resetImportPresentation();
  setImportStatus("idle", "Pronto para importar", "Cole um link do Mercado Livre e clique em “Importar produto”.");
  lastImportedProduct = null;
  rebuildProducts();
  renderAllDynamic();
  showToast("Produto adicionado, calculado e incluído no ranking.");
}

async function deleteUserProduct(id) {
  const product = userProducts.find(item => item.id === id);
  if (!product) return;
  const previous = userProducts;
  userProducts = userProducts.filter(item => item.id !== id);
  try { await saveUserProducts(); } catch(error) { userProducts = previous; showToast(error.message); return; }
  rebuildProducts();
  renderAllDynamic();
  showToast("Produto removido da sua planilha.");
}

async function clearUserProducts() {
  if (!userProducts.length) return;
  if (!window.confirm("Excluir todos os produtos cadastrados neste aparelho?")) return;
  const previous = userProducts;
  userProducts = [];
  try { await saveUserProducts(); } catch(error) { userProducts = previous; showToast(error.message); return; }
  rebuildProducts();
  renderAllDynamic();
  showToast("Todos os produtos cadastrados foram excluídos.");
}

function csvCell(value) {
  const text = String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""');
  return `"${text}"`;
}

async function exportUserProducts() {
  const sorted = userProducts.map(enrichProduct).sort((a,b) => a.costPerProteinG - b.costPerProteinG);
  if (!sorted.length) {
    showToast("Cadastre ao menos um produto antes de exportar.");
    return;
  }

  const headers = ["Posição","Produto","Marca","Categoria","Preço anunciado","Preço com cupom","Preço usado no ranking","Cupom","Peso (g)","Porção (g)","Proteína por porção (g)","Concentração (%)","Proteína total (g)","Custo por grama (R$)","Custo por dose (R$)","Sem lactose","Sabor","ID anúncio","ID catálogo","Link original","Link afiliado","Data do cadastro"];
  const rows = sorted.map((product,index) => [index + 1, product.name, product.brand, product.category, product.listPrice.toFixed(2), product.couponPrice ? product.couponPrice.toFixed(2) : "", product.price.toFixed(2), product.couponCode || "", product.weightG, product.servingG, product.proteinServingG, product.concentration.toFixed(2), product.totalProteinG.toFixed(2), product.costPerProteinG.toFixed(4), product.costPerServing.toFixed(2), product.lactoseFree ? "Sim" : "Não", product.flavor, product.itemId || "", product.catalogProductId || "", product.originalUrl || product.url, product.affiliateUrl || "", product.createdAt ? new Intl.DateTimeFormat("pt-BR", {dateStyle:"short", timeStyle:"short"}).format(new Date(product.createdAt)) : ""]);
  const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n");
  try { await window.mobileExport(csv, 'nutrirank-produtos.csv', 'text/csv;charset=utf-8'); }
  catch { showToast('Exportação cancelada ou indisponível.'); return; }
  showToast("Planilha CSV exportada.");
}

function setupTheme() {
  const saved = localStorage.getItem("nutrirank-theme");
  refs.html.dataset.theme = saved || "light";
}

function toggleTheme() {
  refs.html.dataset.theme = refs.html.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("nutrirank-theme", refs.html.dataset.theme);
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => refs.toast.classList.remove("visible"), 2800);
}

function bind() {
  refs.themeToggle.addEventListener("click", toggleTheme);
  refs.menuToggle.addEventListener("click", () => {
    const open = refs.mobileNav.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    refs.menuToggle.setAttribute("aria-expanded", String(open));
  });
  refs.mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    refs.mobileNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    refs.menuToggle.setAttribute("aria-expanded", "false");
  }));
  refs.heroSearchForm.addEventListener("submit", event => {
    event.preventDefault();
    refs.searchInput.value = refs.heroSearchInput.value;
    applyFilters();
    $("#ranking").scrollIntoView({behavior:"smooth"});
  });
  refs.categoryGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) selectCategory(button.dataset.category);
  });
  refs.categoryTabs.addEventListener("click", event => {
    const button = event.target.closest("[data-tab-category]");
    if (button) selectCategory(button.dataset.tabCategory);
  });
  [refs.searchInput, refs.brandFilter, refs.priceFilter, refs.sortFilter, refs.concentrationFilter, refs.lactoseFreeFilter, refs.userOnlyFilter].forEach(element => element.addEventListener(element === refs.searchInput ? "input" : "change", applyFilters));
  refs.clearFilters.addEventListener("click", clearFilters);
  refs.advancedToggle.addEventListener("click", () => {
    const open = refs.advancedFilters.classList.toggle("open");
    refs.advancedToggle.querySelector("span").textContent = open ? "−" : "＋";
  });
  document.addEventListener("click", event => {
    const compareButton = event.target.closest("[data-compare]");
    if (compareButton) toggleCompare(Number(compareButton.dataset.compare));
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) toggleCompare(Number(removeButton.dataset.remove));
    const deleteButton = event.target.closest("[data-delete-user]");
    if (deleteButton) deleteUserProduct(Number(deleteButton.dataset.deleteUser));
  });
  [refs.calcPrice, refs.calcServing, refs.calcProtein, refs.calcWeight].forEach(input => input.addEventListener("input", calculate));
  refs.articlesPrev.addEventListener("click", () => refs.articlesTrack.scrollBy({left:-320, behavior:"smooth"}));
  refs.articlesNext.addEventListener("click", () => refs.articlesTrack.scrollBy({left:320, behavior:"smooth"}));
  refs.newsletterForm.addEventListener("submit", event => {
    event.preventDefault();
    refs.newsletterMessage.textContent = "Cadastro demonstrativo concluído. A integração será adicionada na próxima fase.";
    refs.newsletterForm.reset();
  });
  refs.importProductButton.addEventListener("click", importProductFromLink);
  refs.manualProductLink.addEventListener("paste", () => {
    window.setTimeout(() => {
      if (isMercadoLivreUrl(refs.manualProductLink.value.trim())) importProductFromLink();
    }, 80);
  });
  refs.manualProductLink.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      importProductFromLink();
    }
  });
  refs.manualProductLink.addEventListener("input", () => {
    importGeneration++;
    refs.importProductButton.disabled = false;
    refs.manualNutritionConfirmed.checked = false;
    if (lastImportedProduct) {
      lastImportedProduct = null;
      resetImportPresentation();
      setImportStatus("idle", "Link alterado", "A importação será iniciada ao colar o novo link ou ao clicar no botão.");
    }
  });
  [refs.manualWeight,refs.manualServing,refs.manualProtein].forEach(input => input.addEventListener('input', () => refs.manualNutritionConfirmed.checked = false));
  refs.manualProductForm.addEventListener("submit", addManualProduct);
  refs.exportProductsButton.addEventListener("click", exportUserProducts);
  refs.clearUserProductsButton.addEventListener("click", clearUserProducts);
}

setup();
bind();
await startDatabase();

async function startDatabase() {
  try {
    const response = await window.mobileApi('/api/products');
    if (!response.ok) {const error = await response.json();throw new Error(error.error || 'Armazenamento indisponível');}
    const data = await response.json();
    userProducts = data.products;
    $('#dbStatus').textContent = 'Dados salvos neste aparelho. Use Backup para transferir seus produtos.';
    rebuildProducts(); renderAllDynamic();
  } catch(error) { $('#dbStatus').textContent = 'Falha ao carregar os dados. '+error.message; }
}
['demoMode','couponRanking'].forEach(id => $('#'+id).addEventListener('change', () => {rebuildProducts();renderAllDynamic();}));
document.addEventListener('click', async event => {
  const edit = event.target.closest('[data-edit]');
  const history = event.target.closest('[data-history]');
  if (edit) {
    const p = userProducts.find(p => p.id === Number(edit.dataset.edit));
    if (!p) return;
    editingId = p.id; lastImportedProduct = null; resetImportPresentation();
    const fields = {manualBrand:'brand',manualName:'name',manualCategory:'category',manualPrice:'listPrice',manualCouponPrice:'couponPrice',manualCouponCode:'couponCode',manualWeight:'weightG',manualServing:'servingG',manualProtein:'proteinServingG',manualFlavor:'flavor',manualProductLink:'originalUrl',manualAffiliateLink:'affiliateUrl',manualItemId:'itemId',manualCatalogProductId:'catalogProductId',couponExpires:'couponExpires',couponTerms:'couponTerms',alertTarget:'alertTarget'};
    Object.entries(fields).forEach(([id,key]) => $('#'+id).value = p[key] ?? '');
    refs.manualLactoseFree.checked = p.lactoseFree;
    refs.manualProductForm.scrollIntoView({behavior:'smooth'});
    showToast('Editando produto. Confira o rótulo e salve pelo botão do formulário.');
  }
  if (history) {
    try {
      const response = await window.mobileApi('/api/history?id='+history.dataset.history);
      const data = await response.json();
      $('#historyContent').innerHTML = data.history.length ? '<table><tr><th>Consulta</th><th>Preço sem cupom</th><th>Situação</th></tr>'+data.history.map(h => `<tr><td>${escapeHTML(new Date(h.observed).toLocaleString('pt-BR'))}</td><td>${money.format(h.price)}</td><td>${escapeHTML(h.status)}</td></tr>`).join('')+'</table>' : '<p>Sem consultas gravadas.</p>';
      $('#historyDialog').showModal();
    } catch { showToast('Não foi possível carregar o histórico.'); }
  }
});
$('#refreshOffers').addEventListener('click', () => showToast('Atualização online ainda não ativada. Edite o preço manualmente.'));
$('#backupProducts').addEventListener('click', async () => {
  try {await window.mobileExport(JSON.stringify(userProducts,null,2),'nutrirank-backup.json','application/json');}
  catch {showToast('Compartilhamento cancelado ou indisponível.');}
});

['couponDiscount','couponMinimum','couponCap','manualPrice'].forEach(id => $('#'+id).addEventListener('input', () => {
  const price = Number(refs.manualPrice.value), percent = Number($('#couponDiscount').value), minimum = Number($('#couponMinimum').value), cap = Number($('#couponCap').value);
  if (!(price > 0 && percent > 0 && percent <= 100 && price >= minimum)) {refs.manualCouponPrice.value=''; return;}
  const discount = Math.min(price*percent/100,cap>0?cap:Infinity);
  refs.manualCouponPrice.value = (price-discount).toFixed(2);
}));

$('#restoreBackup').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('Backup excede 2 MB.');
    const rows = JSON.parse(await file.text());
    if (!Array.isArray(rows) || rows.some(p => !p.nutritionConfirmed)) throw new Error('Use um backup de cadastros confirmados da v5.');
    if (!confirm('Substituir os cadastros atuais pelo backup selecionado?')) return;
    const previous = userProducts; userProducts = rows;
    try { await saveUserProducts(); } catch(error) {userProducts = previous; throw error;}
    rebuildProducts(); renderAllDynamic(); showToast('Backup restaurado.');
  } catch(error) { showToast(error.message); }
  event.target.value = '';
});
