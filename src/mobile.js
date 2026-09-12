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
    throw new Error('Importação online ainda não ativada. Preencha os dados do anúncio e confirme o rótulo para ranquear.');
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
