export const emptyState = () => ({version:1, products:[], history:{}});

export function validLink(value) {
  try {
    const u=new URL(value);
    return u.protocol==='https:' && !u.username && !u.password && (!u.port || u.port==='443') &&
      (u.hostname==='meli.la' || ['mercadolivre.com.br','mercadolivre.com'].some(d=>u.hostname===d || u.hostname.endsWith('.'+d)));
  } catch {return false;}
}

export function validateProducts(rows) {
  if (!Array.isArray(rows) || rows.length>1000) throw new Error('Limite de 1.000 produtos por aparelho.');
  const ids=new Set();
  for (const p of rows) {
    if (!p || !Number.isSafeInteger(p.id) || p.id<=0 || ids.has(p.id)) throw new Error('Identificador inválido ou duplicado.');
    ids.add(p.id);
    for(const key of ['listPrice','weightG','servingG','proteinServingG']) {
      if(typeof p[key]!=='number' || !Number.isFinite(p[key]) || p[key]<=0) throw new Error('Confira preço, peso e proteína.');
    }
    if(p.proteinServingG>p.servingG || p.servingG>p.weightG || p.nutritionConfirmed!==true) throw new Error('Confira e confirme as informações nutricionais.');
    for(const key of ['name','brand','category']) if(typeof p[key]!=='string' || !p[key].trim() || p[key].length>300) throw new Error('Nome, marca e categoria são obrigatórios (até 300 caracteres).');
    for(const key of ['url','originalUrl','affiliateUrl']) if(p[key] && !validLink(p[key])) throw new Error('Use links HTTPS válidos do Mercado Livre.');
    if(p.couponPrice!=null && (!Number.isFinite(p.couponPrice) || p.couponPrice<=0 || p.couponPrice>p.listPrice)) throw new Error('Preço com cupom inválido.');
    if(p.color && !/^#[0-9a-f]{6}$/i.test(p.color)) throw new Error('Cor inválida no cadastro.');
  }
  if(JSON.stringify(rows).length>2000000) throw new Error('O cadastro excede 2 MB.');
}

export function nextState(current, products, now=new Date().toISOString()) {
  validateProducts(products);
  const state=structuredClone(current);
  const old=new Map(current.products.map(p=>[p.id,p]));
  state.products=structuredClone(products);
  for(const p of products) {
    const previous=old.get(p.id);
    if(!previous || previous.listPrice!==p.listPrice || previous.checkedAt!==p.checkedAt) {
      state.history[p.id]=[{observed:now, price:p.listPrice,status:p.status || 'manual'},...(state.history[p.id] || [])].slice(0,500);
    }
  }
  const activeIds=new Set(products.map(p=>String(p.id)));
  for(const id of Object.keys(state.history)) if(!activeIds.has(id)) delete state.history[id];
  return state;
}

export function createStore(driver) {
  let current;
  let queue=Promise.resolve();
  return {
    async load() {
      if(current) return structuredClone(current);
      const raw=await driver.read();
      const parsed=raw ? JSON.parse(raw) : emptyState();
      if(parsed.version!==1 || !parsed.history || typeof parsed.history!=='object') throw new Error('Backup local incompatível.');
      validateProducts(parsed.products);
      current=parsed;
      return structuredClone(current);
    },
    save(products) {
      const operation=queue.then(async()=>{
        if(!current) throw new Error('Aguarde o carregamento dos dados.');
        const next=nextState(current,products);
        await driver.write(JSON.stringify(next));
        current=next;
        return structuredClone(current);
      });
      queue=operation.catch(()=>{});
      return operation;
    }
  };
}
