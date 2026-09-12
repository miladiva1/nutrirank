import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {Browser} from '@capacitor/browser';
import {App} from '@capacitor/app';
import {createStore,validLink} from './store.mjs';

const native=Capacitor.isNativePlatform();
const file='nutrirank-data.json';
const driver={
  async read(){
    if(!native) return localStorage.getItem('nutrirank-mobile-data-v1');
    const listing=await Filesystem.readdir({path:'',directory:Directory.Data});
    if(!listing.files.some(f=>f.name===file)) return null;
    return (await Filesystem.readFile({path:file,directory:Directory.Data,encoding:Encoding.UTF8})).data;
  },
  async write(value){
    if(!native){localStorage.setItem('nutrirank-mobile-data-v1',value);return;}
    await Filesystem.writeFile({path:file+'.tmp',directory:Directory.Data,data:value,encoding:Encoding.UTF8});
    await Filesystem.rename({from:file+'.tmp',to:file,directory:Directory.Data,toDirectory:Directory.Data});
  }
};
const store=createStore(driver);
window.mobileReady=store.load();

const API_BASE='https://api.mercadolibre.com';
const normalizeText=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const numberValue=value=>{
  if(value==null) return null;
  const normalized=String(value).trim().replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
  const match=normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const grams=value=>{
  if(value==null) return null;
  const text=String(value).replace(',','.').toLowerCase();
  const number=numberValue(text);
  if(!Number.isFinite(number)||number<=0) return null;
  if(/kg|quilo/.test(text)) return number*1000;
  if(/mg/.test(text)) return number/1000;
  return number;
};
const attrList=object=>[
  ...(Array.isArray(object?.attributes)?object.attributes:[]),
  ...(Array.isArray(object?.technical_specs)?object.technical_specs.flatMap(section=>Array.isArray(section.attributes)?section.attributes:[]):[])
];
function attrValue(attributes, ids, names){
  const match=attributes.find(attribute=>{
    const id=normalizeText(attribute.id);
    const name=normalizeText(attribute.name);
    return ids.includes(id.toUpperCase()) || names.some(candidate=>name===candidate || name.includes(candidate));
  });
  return match?.value_name ?? match?.value ?? match?.value_struct?.number ?? null;
}
function itemIdFromUrl(raw){
  const match=String(raw).match(/\bMLB[-_]?\d{6,}\b/i);
  return match?.[0].replace(/[-_]/g,'').toUpperCase() || null;
}
function inferCategory(title){
  const text=normalizeText(title);
  if(/hidrolis|hydro/.test(text)) return 'Whey Hidrolisado';
  if(/isolad|isolate/.test(text)) return 'Whey Isolado';
  if(/3\s*w|blend/.test(text)) return 'Blend 3W';
  if(/albumin/.test(text)) return 'Albumina';
  if(/casein/.test(text)) return 'Caseína';
  return 'Whey Concentrado';
}
function inferWeight(title){
  const match=String(title).match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i);
  if(!match) return null;
  const number=Number(match[1].replace(',','.'));
  return match[2].toLowerCase()==='kg' ? number*1000 : number;
}
function textGrams(text, patterns){
  for(const pattern of patterns){
    const match=String(text).match(pattern);
    if(match){const value=Number(match[1].replace(',','.'));if(Number.isFinite(value)&&value>0)return value;}
  }
  return null;
}
async function fetchJson(url){
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload.message || `Mercado Livre retornou HTTP ${response.status}.`);
  return payload;
}
async function importMercadoLivre(rawUrl){
  let resolved=rawUrl;
  let id=itemIdFromUrl(resolved);
  if(!id){
    try{
      const redirect=await fetch(rawUrl,{redirect:'follow'});
      resolved=redirect.url || rawUrl;
      if(!validLink(resolved)) throw new Error('O link curto redirecionou para um endereço fora do Mercado Livre.');
      id=itemIdFromUrl(resolved);
    }catch(error){throw new Error('Não foi possível abrir o link curto do Mercado Livre.');}
  }
  if(!id) throw new Error('Não consegui identificar o código MLB deste anúncio.');
  const item=await fetchJson(`${API_BASE}/items/${encodeURIComponent(id)}`);
  const description=await fetch(`${API_BASE}/items/${encodeURIComponent(id)}/description`,{headers:{Accept:'application/json'}})
    .then(response=>response.ok?response.json():{}).catch(()=>({}));
  let catalog={};
  if(item.catalog_product_id){
    catalog=await fetch(`${API_BASE}/products/${encodeURIComponent(item.catalog_product_id)}`,{headers:{Accept:'application/json'}})
      .then(response=>response.ok?response.json():{}).catch(()=>({}));
  }
  const attributes=attrList(item).concat(attrList(catalog));
  const title=String(item.title || catalog.name || '').trim();
  if(!title) throw new Error('O Mercado Livre não retornou o título do produto.');
  const category=inferCategory(title);
  const brand=String(attrValue(attributes,['BRAND'],['marca']) || '').trim();
  const flavor=String(attrValue(attributes,['FLAVOR'],['sabor']) || '').trim();
  const weight=grams(attrValue(attributes,['NET_WEIGHT','UNIT_WEIGHT'],['peso liquido','peso da unidade','peso do produto'])) || inferWeight(title);
  const descriptionText=String(description.plain_text || description.text || '');
  const combined=`${title}\n${descriptionText}`;
  const serving=grams(attrValue(attributes,['SERVING_SIZE','PORTION_SIZE','PORTION'],['tamanho da porcao','porcao'])) || textGrams(combined,[/por[cç][aã]o(?:\s+de)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,/serving\s+size\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i]);
  let protein=grams(attrValue(attributes,['PROTEINS','PROTEIN','PROTEIN_PER_SERVING'],['proteina por porcao','proteinas'])) || textGrams(combined,[/(\d+(?:[.,]\d+)?)\s*g\s+de\s+prote[ií]na/i,/prote[ií]nas?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,/prote[ií]na(?:s)?\s+por\s+por[cç][aã]o\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i]);
  const warnings=[];
  if(weight && serving && protein && protein>serving){warnings.push('A proteína encontrada é maior que o tamanho da porção; confirme no rótulo.');protein=null;}
  if(!weight) warnings.push('Peso líquido não encontrado; preencha conforme o rótulo.');
  if(!serving) warnings.push('Porção não encontrada; preencha conforme o rótulo.');
  if(!protein) warnings.push('Proteína por porção não encontrada; preencha conforme o rótulo.');
  const image=item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || item.thumbnail || null;
  return {
    item_id:id, catalog_product_id:item.catalog_product_id || null, permalink:item.permalink || rawUrl,
    title, brand, category, flavor, price:Number(item.price)||null, currency_id:item.currency_id || 'BRL',
    available_quantity:item.available_quantity, status:item.status, image, weight_g:weight, serving_g:serving,
    protein_per_serving_g:protein, warnings,
    confidence:{title:'high',price:item.price!=null?'high':'none',brand:brand?'high':'none',category:'medium',flavor:flavor?'high':'none',weight_g:weight?'medium':'none',serving_g:serving?'medium':'none',protein_per_serving_g:protein?'medium':'none'}
  };
}
window.mobileApi=async(path,options={})=>{
  try{
    await window.mobileReady;
    if(path==='/api/products'){
      const data=options.method==='POST' ? await store.save(JSON.parse(options.body).products) : await store.load();
      return {ok:true,json:async()=>({products:data.products,ok:true})};
    }
    if(path.startsWith('/api/history?')){
      const id=new URLSearchParams(path.split('?')[1]).get('id');
      const data=await store.load();
      return {ok:true,json:async()=>({history:data.history[id] || []})};
    }
    if(path==='/api/import' && options.method==='POST'){
      const body=JSON.parse(options.body || '{}');
      const url=String(body.url || '').trim();
      if(!validLink(url)) throw new Error('Informe um link HTTPS válido do Mercado Livre.');
      return {ok:true,json:async()=>importMercadoLivre(url)};
    }
    throw new Error('Rota não encontrada.');
  }catch(error){return {ok:false,json:async()=>({error:error.message})};}
};

window.mobileExport=async(text,name,type)=>{
  if(native){
    const path='exports/'+name;
    await Filesystem.writeFile({path,directory:Directory.Cache,data:text,encoding:Encoding.UTF8,recursive:true});
    const {uri}=await Filesystem.getUri({path,directory:Directory.Cache});
    await Share.share({title:'NutriRank',files:[uri],dialogTitle:'Salvar ou compartilhar'});
  }else{
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
};
document.addEventListener('click',async event=>{
  const link=event.target.closest('a[target="_blank"]');
  if(!link || !native)return;
  event.preventDefault();
  if(validLink(link.href))try{await Browser.open({url:link.href});}catch{window.alert('Não foi possível abrir a oferta.');}
});
if(native && Capacitor.getPlatform()==='android')App.addListener('backButton',()=>{
  const dialog=document.querySelector('dialog[open]');
  if(dialog){dialog.close();return;}
  if(location.hash && location.hash!=='#ranking'){location.hash='ranking';return;}
  App.minimizeApp();
});
window.mobileReady.catch(()=>{});
await import('./app.js');
