import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
await mkdir('www',{recursive:true});
for(const f of ['index.html','styles.css'])await copyFile('src/'+f,'www/'+f);
// Resolve only the imported files; no parent-directory configuration discovery.
const resolver={name:'explicit-project-files',setup(b){
  b.onResolve({filter:/.*/},args=>{
    const base=args.importer ? path.dirname(args.importer) : process.cwd();
    const resolved=args.path.startsWith('.') ? path.resolve(base,args.path) : createRequire(path.join(base,'package.json')).resolve(args.path);
    return {path:resolved,namespace:'project'};
  });
  b.onLoad({filter:/.*/,namespace:'project'},async args=>({contents:await readFile(args.path,'utf8'),loader:'js'}));
}};
await build({entryPoints:['./src/mobile.js'],outfile:'www/mobile.js',bundle:true,format:'esm',target:['es2022'],minify:false,plugins:[resolver]});
console.log('Interface móvel gerada em www.');
