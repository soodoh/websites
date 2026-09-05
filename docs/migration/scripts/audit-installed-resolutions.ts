import { readFileSync, existsSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const imports=JSON.parse(readFileSync('docs/migration/source-imports.json','utf8'));
const baselineRoot=process.argv[2];
if(!baselineRoot)throw new Error('Pass the pristine disposable baseline install root; raw lock entries are not installed-version evidence.');
const reports:any={};
const carolyn=imports.sources.find((s:any)=>s.name==='carolyn-portfolio');
imports.sources.push({...carolyn,name:'carolyn-portfolio/infra',targetPrefix:carolyn.targetPrefix+'/infra'});
for(const s of imports.sources){
 const root=join(process.cwd(),s.targetPrefix);
 const old=Bun.JSONC.parse(execFileSync('git',['show',`${s.importCommit}:${s.targetPrefix}/bun.lock`],{encoding:'utf8',maxBuffer:10e6}));
 const oldPackages=old.packages;
 function oldLookup(parent:string,dep:string):string|undefined{let p=parent;for(;;){const k=p?`${p}/${dep}`:dep;if(oldPackages[k])return k;if(!p)return;const parts=p.split('/');parts.pop();if(parts.at(-1)?.startsWith('@'))parts.pop();p=parts.join('/');}}
 function installedLookup(from:string,dep:string):string|undefined{let p=from;for(;;){const file=join(p,'node_modules',dep,'package.json');if(existsSync(file))return realpathSync(file);const up=dirname(p);if(up===p)return;p=up;}}
 const rawLockLocatorDifferences:any[]=[];const verifiedInstalledVersionDifferences:any[]=[];const baselineLockMetadataDiscrepancies:any[]=[];const unavailable:string[]=[];const baselineUnavailable:string[]=[];const visited=new Set<string>();let baselineVerified=0;
 function walk(oldKey:string,actualFile:string,baselineFile:string|undefined,via:any){
  const visit=oldKey+'|'+actualFile+'|'+baselineFile;if(visited.has(visit))return;visited.add(visit);
  const expected=oldPackages[oldKey];const actual=JSON.parse(readFileSync(actualFile,'utf8'));const candidateInstalled=`${actual.name}@${actual.version}`;
  if(expected[0]!==candidateInstalled)rawLockLocatorDifferences.push({oldKey,rawLockResolution:expected[0],candidateInstalled,via});
  if(baselineFile){
   baselineVerified++;const baseline=JSON.parse(readFileSync(baselineFile,'utf8'));const baselineInstalled=`${baseline.name}@${baseline.version}`;
   if(expected[0]!==baselineInstalled)baselineLockMetadataDiscrepancies.push({oldKey,rawLockResolution:expected[0],baselineInstalled});
   if(baselineInstalled!==candidateInstalled)verifiedInstalledVersionDifferences.push({oldKey,baselineInstalled,candidateInstalled,via});
  }else baselineUnavailable.push(oldKey);
  for(const dep of Object.keys({...expected[2]?.dependencies,...expected[2]?.optionalDependencies})){
   const ok=oldLookup(oldKey,dep),af=installedLookup(dirname(actualFile),dep),bf=baselineFile?installedLookup(dirname(baselineFile),dep):undefined;
   if(ok&&af)walk(ok,af,bf,{parentRawLockResolution:expected[0],dependency:dep,range:expected[2]?.dependencies?.[dep]??expected[2]?.optionalDependencies?.[dep]});else if(ok)unavailable.push(ok);
  }
 }
 const appManifest=existsSync(join(root,'package.json'))?JSON.parse(readFileSync(join(root,'package.json'),'utf8')):old.workspaces[''];
 for(const dep of Object.keys({...appManifest.dependencies,...appManifest.devDependencies})){const k=oldLookup('',dep),f=installedLookup(root,dep);if(k&&f)walk(k,f,installedLookup(join(baselineRoot,s.targetPrefix),dep),{parent:s.name,dependency:dep,range:appManifest.dependencies?.[dep]??appManifest.devDependencies?.[dep]});}
 reports[s.name]={comparisonScope:'Matched original lock locators; not unique packages or a complete graph diff. Installed drift requires an actual baseline package at the corresponding import edge.',checked:visited.size,baselineVerified,rawLockLocatorDifferences,verifiedInstalledVersionDifferences,baselineLockMetadataDiscrepancies,unavailable:[...new Set(unavailable)].sort(),baselineUnavailable:[...new Set(baselineUnavailable)].sort()};console.log(s.name,visited.size,'raw-lock differences',rawLockLocatorDifferences.length,'verified installed differences',verifiedInstalledVersionDifferences.length);
}
writeFileSync(process.argv[3]??'docs/migration/dependency-resolution-comparison.json',JSON.stringify(reports,null,2)+'\n');
