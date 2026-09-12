import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,emptyState,nextState,validLink,validateProducts} from '../src/store.mjs';
const product=()=>({id:1,name:'Whey teste',brand:'Teste',category:'Whey Concentrado',listPrice:159.9,weightG:1000,servingG:30,proteinServingG:23,nutritionConfirmed:true});
test('links falsos e protocolos são rejeitados',()=>{
 assert.ok(validLink('https://meli.la/teste'));
 assert.equal(validLink('https://falsomercadolivre.com.br/x'),false);
 assert.equal(validLink('javascript:alert(1)'),false);
});
test('validação nutricional, cupom e conteúdo do backup',()=>{
 for(const change of [{proteinServingG:31},{listPrice:0},{nutritionConfirmed:false},{couponPrice:200},{color:'red;position:fixed'}])assert.throws(()=>validateProducts([{...product(),...change}]));
});
test('histórico grava mudanças e preserva observações iguais',()=>{
 const first=nextState(emptyState(),[product()]);
 const same=nextState(first,[product()]);assert.equal(same.history[1].length,1);
 const changed=nextState(same,[{...product(),listPrice:100}]);assert.equal(changed.history[1].length,2);
 assert.deepEqual(nextState(changed,[]).history,{});
});
test('falha de gravação não destrói o estado anterior',async()=>{
 let fail=false,raw=null;
 const store=createStore({read:async()=>raw,write:async v=>{if(fail)throw Error('sem espaço');raw=v;}});
 await store.load();await store.save([product()]);fail=true;
 await assert.rejects(store.save([]));assert.equal((await store.load()).products.length,1);
});
test('persiste, recarrega e serializa gravações',async()=>{
 let raw=null;const driver={read:async()=>raw,write:async v=>{raw=v;}};
 const store=createStore(driver);await store.load();
 await Promise.all([store.save([product()]),store.save([{...product(),listPrice:99}])]);
 const reloaded=await createStore(driver).load();assert.equal(reloaded.products[0].listPrice,99);assert.equal(reloaded.history[1].length,2);
});
