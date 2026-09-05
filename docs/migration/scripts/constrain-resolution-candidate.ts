import {readFileSync,writeFileSync}from'node:fs';
const dest=process.argv[2];
if(!dest)throw new Error('Pass an existing disposable workspace candidate directory; never run against the target or sources.');
const original=JSON.parse(readFileSync('docs/migration/dependency-resolutions-before.json','utf8'));
const versions=new Map<string,Set<string>>();
for(const list of Object.values(original) as any[])for(const value of Object.values(list) as string[]){const at=value.lastIndexOf('@'),name=value.slice(0,at),version=value.slice(at+1);if(!versions.has(name))versions.set(name,new Set());versions.get(name)!.add(version);}
const current=Bun.JSONC.parse(readFileSync(`${dest}/bun.lock`,'utf8'));
const manifest=JSON.parse(readFileSync(`${dest}/package.json`,'utf8'));manifest.overrides??={};
let added=0;const blocked=[];
for(const [key,entry]of Object.entries(current.packages) as any){const id=entry[0];if(id.includes('workspace:'))continue;const at=id.lastIndexOf('@'),parent=id.slice(0,at),pv=id.slice(at+1);
 for(const [child,range]of Object.entries({...entry[2]?.dependencies,...entry[2]?.optionalDependencies})as [string,string][]){if(range.startsWith('npm:')||!versions.has(child))continue;const candidates=[...versions.get(child)!].filter(v=>Bun.semver.satisfies(v,range));if(!candidates.length){blocked.push({parent,pv,child,range});continue;}
 // Constrain only packages with a new version outside approved locks in this candidate.
 const installedVersions=Object.values(current.packages).filter((v:any)=>v[0].startsWith(child+'@')).map((v:any)=>v[0].slice(child.length+1));
 if(!installedVersions.some(v=>!versions.get(child)!.has(v)))continue;
 candidates.sort(Bun.semver.order);const chosen=candidates.at(-1)!;const selector=`${parent}@${pv}>${child}`;if(!manifest.overrides[selector]){manifest.overrides[selector]=chosen;added++;}
 }
}
writeFileSync(`${dest}/package.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${dest}/constraint-blocked.json`,JSON.stringify(blocked,null,2)+'\n');console.log('added',added,'total',Object.keys(manifest.overrides).length,'no-old-compatible',blocked.length);
