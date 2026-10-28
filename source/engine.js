(function(root){
'use strict';
const HORIZONS=[5,10,21,63];
const ASSETS={
 VN:[['VCB','Vietcombank',0],['BID','BIDV',0],['CTG','VietinBank',0],['TCB','Techcombank',0],['MBB','MB Bank',0],['VPB','VPBank',0],['ACB','ACB',0],['SSI','SSI Securities',0],['VND','VNDirect',0],['VIC','Vingroup',1],['VHM','Vinhomes',1],['VRE','Vincom Retail',1],['KDH','Khang Điền',1],['NLG','Nam Long',1],['GAS','PV GAS',2],['PLX','Petrolimex',2],['POW','PV Power',2],['FPT','FPT',3],['CMG','CMC',3],['VNM','Vinamilk',4],['MSN','Masan',4],['MWG','Thế Giới Di Động',4],['PNJ','PNJ',4],['SAB','Sabeco',4],['HPG','Hòa Phát',5],['HSG','Hoa Sen',5],['GMD','Gemadept',5],['REE','REE',5],['DGC','Đức Giang',5],['DPM','Đạm Phú Mỹ',5]],
 US:[['JPM','JPMorgan Chase',0],['BAC','Bank of America',0],['GS','Goldman Sachs',0],['MS','Morgan Stanley',0],['V','Visa',0],['MA','Mastercard',0],['BRK.B','Berkshire Hathaway',0],['PLD','Prologis',1],['AMT','American Tower',1],['O','Realty Income',1],['SPG','Simon Property',1],['XOM','Exxon Mobil',2],['CVX','Chevron',2],['COP','ConocoPhillips',2],['NEE','NextEra Energy',2],['AAPL','Apple',3],['MSFT','Microsoft',3],['NVDA','NVIDIA',3],['GOOGL','Alphabet',3],['META','Meta',3],['AVGO','Broadcom',3],['ORCL','Oracle',3],['CRM','Salesforce',3],['AMZN','Amazon',4],['COST','Costco',4],['WMT','Walmart',4],['PG','Procter & Gamble',4],['KO','Coca-Cola',4],['PEP','PepsiCo',4],['MCD','McDonald’s',4],['HD','Home Depot',4],['CAT','Caterpillar',5],['GE','GE Aerospace',5],['HON','Honeywell',5],['UPS','UPS',5],['DE','Deere',5],['UNH','UnitedHealth',6],['JNJ','Johnson & Johnson',6],['LLY','Eli Lilly',6],['ABBV','AbbVie',6]]};
const SECTORS=['Tài chính','Bất động sản','Năng lượng','Công nghệ','Tiêu dùng','Công nghiệp','Y tế'];
const COLORS=['#2563eb','#7284b4','#e69b47','#14b8a6','#965fe7','#6d9fbd','#e77ca8'];
const RESULTS={
 VN:{Hybrid:{sr:[.355,.452,.493,.602],calmar:[.247,.210,.338,.359],sortino:[.593,.651,.811,.707],omega:[1.116,1.096,1.152,1.132]},EW:{sr:[.243,.243,.243,.152],calmar:[.131,.133,.133,.096],sortino:[.329,.329,.329,.172],omega:[1.054,1.054,1.054,1.051]},BH:{sr:[.316,.316,.316,.152],calmar:[.170,.170,.170,.067],sortino:[.428,.428,.428,.172],omega:[1.066,1.066,1.066,1.051]},MomEW:{sr:[.031,.050,.155,-.037],calmar:[.016,.027,.092,-.022],sortino:[.041,.067,.204,-.042],omega:[1.019,1.022,1.041,1.016]},ci:[[.245,1.257],[.175,1.241],[.529,1.502],[-.316,1.647]]},
 US:{Hybrid:{sr:[.942,1.245,1.213,1.156],calmar:[.846,1.688,1.835,1.770],sortino:[1.230,1.652,1.666,1.606],omega:[1.207,1.251,1.249,1.232]},EW:{sr:[.733,.733,.733,.733],calmar:[.456,.600,.599,.599],sortino:[.875,.875,.875,.875],omega:[1.169,1.169,1.169,1.169]},BH:{sr:[.733,.733,.733,.733],calmar:[.428,.428,.428,.428],sortino:[.875,.875,.875,.875],omega:[1.169,1.169,1.169,1.169]},MomEW:{sr:[.898,.825,.755,.591],calmar:[.701,.868,.984,.625],sortino:[1.135,1.044,.960,.746],omega:[1.186,1.174,1.161,1.134]},ci:[[.092,1.910],[.363,2.151],[.321,2.107],[.291,2.006]]}};
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
function normal(r){const a=Math.max(r(),1e-9);return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*r());}
const sum=a=>a.reduce((s,x)=>s+x,0),mean=a=>a.length?sum(a)/a.length:0;
function sd(a){const m=mean(a);return a.length>1?Math.sqrt(sum(a.map(x=>(x-m)**2))/(a.length-1)):0;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normalize(a){const s=sum(a);return s>0?a.map(x=>x/s):a.map(()=>1/a.length);}
const markets=new Map(), simulations=new Map();
function market(key){
 if(markets.has(key))return markets.get(key);
 const random=rng(key==='US'?202601:202602),assets=ASSETS[key],dates=[],returns=[],factors=[];
 for(let t=Date.UTC(2019,0,2);t<=Date.UTC(2026,2,24);t+=86400000){const d=new Date(t);if(d.getUTCDay()===0||d.getUTCDay()===6)continue;dates.push(d.toISOString().slice(0,10));}
 const betas=assets.map((_,j)=>.75+(j%9)*.055),alphas=assets.map((a,j)=>((j*7%13)-5)*.000014+(a[2]===3?.00007:0));
 dates.forEach((date,i)=>{
  let vol=key==='US'?.007:.0085,drift=key==='US'?.00100:.00085;
  if(date>='2020-02-24'&&date<='2020-03-25'){vol*=2.5;drift=-.007;}
  else if(date>='2020-04-01'&&date<='2020-08-31'){drift=.0014;vol*=1.35;}
  else if(date>='2022-02-01'&&date<='2022-10-31'){drift=-.00075;vol*=1.35;}
  else if(date>='2025-04-01'&&date<='2025-04-18'){drift=-.0035;vol*=1.8;}
  const f=drift+vol*normal(random)+.00012*Math.sin(i/48),sec=SECTORS.map(()=>normal(random)*.0031);
  factors.push(f);returns.push(assets.map((a,j)=>clamp(betas[j]*f+sec[a[2]]+alphas[j]+normal(random)*.008,-.12,.12)));
 });
 const start=dates.findIndex(d=>d>='2020-01-02');
 const obj={key,assets,dates,returns,factors,start,ew:returns.map(row=>mean(row))};markets.set(key,obj);return obj;
}
function covariance(m,ids,end,shrink){
 const hist=m.returns.slice(Math.max(0,end-63),end),means=ids.map(id=>mean(hist.map(r=>r[id])));
 const cov=ids.map((id,i)=>ids.map((jd,j)=>sum(hist.map(r=>(r[id]-means[i])*(r[jd]-means[j])))/Math.max(1,hist.length-1)));
 if(shrink){const avg=mean(cov.map((r,i)=>r[i]));cov.forEach((row,i)=>row.forEach((v,j)=>cov[i][j]=.65*v+(i===j?.35*avg:0)));}
 return {cov,means};
}
function hrp(cov){
 const n=cov.length,dist=cov.map((row,i)=>row.map((v,j)=>Math.sqrt(Math.max(0,(1-clamp(v/Math.sqrt(cov[i][i]*cov[j][j]||1e-12),-1,1))/2))));
 let clusters=Array.from({length:n},(_,i)=>({ids:[i],size:1}));
 // Ward linkage with Lance-Williams distance updates.
 let ds=dist.map(r=>[...r]);
 while(clusters.length>1){let a=0,b=1,best=Infinity;for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++)if(ds[i][j]<best){a=i;b=j;best=ds[i][j];}
  const ca=clusters[a],cb=clusters[b],keep=clusters.map((_,i)=>i).filter(i=>i!==a&&i!==b);
  const merged={ids:ca.ids.concat(cb.ids),size:ca.size+cb.size};
  const newD=keep.map(k=>Math.sqrt(Math.max(0,((clusters[k].size+ca.size)*ds[k][a]**2+(clusters[k].size+cb.size)*ds[k][b]**2-clusters[k].size*ds[a][b]**2)/(clusters[k].size+ca.size+cb.size))));
  const nextD=keep.map((k,i)=>keep.map(l=>ds[k][l]).concat(newD[i]));nextD.push(newD.concat(0));
  clusters=keep.map(k=>clusters[k]).concat(merged);ds=nextD;
 }
 const weights=Array(n).fill(1),variance=ids=>{const w=normalize(ids.map(i=>1/Math.max(cov[i][i],1e-9)));return sum(ids.map((i,a)=>sum(ids.map((j,b)=>w[a]*w[b]*cov[i][j]))));};
 const split=ids=>{if(ids.length<2)return;const k=Math.floor(ids.length/2),a=ids.slice(0,k),b=ids.slice(k),va=variance(a),vb=variance(b),alpha=vb/(va+vb||1);a.forEach(i=>weights[i]*=alpha);b.forEach(i=>weights[i]*=1-alpha);split(a);split(b);};split(clusters[0].ids);return normalize(weights);
}
function pso(cov,means,prev,profile,seed){
 const random=rng(seed),n=means.length,eta=[2,1,.5][profile],pen=[.001,.0005,.0001][profile],mu=means.map(v=>clamp(252*v,-.6,1.5));
 // Annual covariance keeps both terms on the same scale in this illustrative allocator.
 const score=w=>sum(w.map((x,i)=>x*mu[i]))-eta*252*sum(w.map((x,i)=>x*sum(w.map((y,j)=>y*cov[i][j]))))-pen*sum(w.map((x,i)=>Math.abs(x-prev[i])));
 const particles=Array.from({length:12},(_,k)=>{const x=k===0?normalize(cov.map((r,i)=>1/Math.max(r[i],1e-8))):normalize(Array.from({length:n},()=>random()+.1));return{x,v:Array(n).fill(0),best:[...x],score:score(x)};});
 let best=[...particles[0].best],bestScore=particles[0].score;
 for(let it=0;it<18;it++)for(const p of particles){const sc=score(p.x);if(sc>p.score){p.best=[...p.x];p.score=sc;}if(sc>bestScore){best=[...p.x];bestScore=sc;}p.v=p.v.map((v,i)=>clamp(.5*v+1.5*random()*(p.best[i]-p.x[i])+1.5*random()*(best[i]-p.x[i]),-.12,.12));p.x=normalize(p.x.map((x,i)=>clamp(x+p.v[i],.002,.18)));}
 return normalize(best);
}
function simulate(key,horizon,mode='Adaptive'){
 const cacheKey=[key,horizon,mode].join('/');if(simulations.has(cacheKey))return simulations.get(cacheKey);
 const m=market(key),n=m.assets.length,records=[],daily=[],nav=[],bench=[],bh=[],mom=[];
 let weights=Array(n).fill(0),bhw=Array(n).fill(1/n),momw=Array(n).fill(1/n),navValue=100,bValue=100,bhValue=100,momValue=100,lastAction=0;
 for(let start=m.start;start<m.dates.length;start+=horizon){
  const hist=m.returns.slice(start-63,start),ranks=m.assets.map((_,j)=>{const a=hist.slice(-21).map(r=>r[j]),b=hist.map(r=>r[j]);return{id:j,ram:.5*mean(a)/(sd(a)||.01)*Math.sqrt(252)+.5*mean(b)/(sd(b)||.01)*Math.sqrt(252)};}).sort((a,b)=>b.ram-a.ram);
  const ids=ranks.slice(0,key==='US'?30:20).map(x=>x.id),recent=m.ew.slice(start-21,start),ms=clamp(mean(recent)/(sd(recent)||.01)*Math.sqrt(252),-4,4),disp=sd(m.assets.map((_,j)=>sum(hist.slice(-21).map(r=>r[j]))));
  const raw=covariance(m,ids,start,false),corr=mean(raw.cov.flatMap((r,i)=>r.filter((_,j)=>j>i).map((v,j)=>{const k=i+1+j;return v/Math.sqrt(raw.cov[i][i]*raw.cov[k][k]||1e-12);}))),shrink=sd(recent)*Math.sqrt(252)>.16||ms<.4;
  const opt=ms<.15||corr>.62?'HRP':'PSO';let profile=ms>1.1?2:ms<-.2?0:1;
  if(mode!=='Adaptive')profile={Conservative:0,Moderate:1,Aggressive:2}[mode];
  const model=shrink?covariance(m,ids,start,true):raw;
  const local=opt==='HRP'?hrp(model.cov):pso(model.cov,model.means,ids.map(j=>weights[j]),profile,(key==='US'?730:910)+start*17+horizon);
  const next=Array(n).fill(0);ids.forEach((j,i)=>next[j]=local[i]);
  const turnover=sum(next.map((x,j)=>Math.abs(x-weights[j]))),cost=.001*turnover,priorHHI=sum(weights.map(w=>w*w));weights=next;
  momw=Array(n).fill(0);ids.forEach(j=>momw[j]=1/ids.length);
  const actionId=(opt==='HRP'?6:0)+(shrink?3:0)+profile,end=Math.min(start+horizon,m.dates.length),begin=daily.length,oldNav=navValue;
  for(let t=start;t<end;t++){
   const gross=sum(weights.map((w,j)=>w*m.returns[t][j])),r=gross-(t===start?cost:0),br=m.ew[t],bhr=sum(bhw.map((w,j)=>w*m.returns[t][j])),mr=sum(momw.map((w,j)=>w*m.returns[t][j]));
   bhw=normalize(bhw.map((w,j)=>w*(1+m.returns[t][j])));navValue*=1+r;bValue*=1+br;bhValue*=1+bhr;momValue*=1+mr;
   daily.push({date:m.dates[t],ret:r,gross,benchRet:br,bhRet:bhr,momRet:mr,cost:t===start?cost:0,record:records.length});nav.push(navValue);bench.push(bValue);bh.push(bhValue);mom.push(momValue);
  }
  records.push({index:records.length,date:m.dates[start],endDate:m.dates[end-1],start:begin,end:daily.length-1,weights:[...weights],ids:[...ids],turnover,cost,hhi:sum(weights.map(w=>w*w)),blockRet:navValue/oldNav-1,action:{id:actionId,opt,cov:shrink?'Co rút':'Sample',profile:['Thận trọng','Cân bằng','Tăng trưởng'][profile],profileIndex:profile},states:[ms,clamp(mean(ranks.slice(0,5).map(x=>x.ram))-mean(ranks.slice(-5).map(x=>x.ram)),-10,10),clamp(corr,-1,1),clamp(disp,0,.5),priorHHI,lastAction/11]});lastAction=actionId;
 }
 const result={key,horizon,mode,assets:m.assets,daily,nav,bench,bh,mom,records};simulations.set(cacheKey,result);return result;
}
function metrics(rets){
 if(!rets.length)return{total:0,annual:0,vol:0,sr:0,calmar:0,maxDD:0,sortino:0,omega:0,win:0,var95:0,cvar95:0,curve:[100],dd:[0]};
 let value=100,peak=100,ddMax=0;const curve=[],dd=[];for(const r of rets){value*=1+r;peak=Math.max(peak,value);const d=value/peak-1;curve.push(value);dd.push(d);ddMax=Math.min(ddMax,d);}
 const annual=Math.pow(value/100,252/rets.length)-1,vol=sd(rets)*Math.sqrt(252),down=Math.sqrt(mean(rets.map(r=>Math.min(r,0)**2)))*Math.sqrt(252),sorted=[...rets].sort((a,b)=>a-b),q=sorted[Math.max(0,Math.ceil(.05*rets.length)-1)],tail=sorted.filter(r=>r<=q),loss=Math.abs(sum(rets.filter(r=>r<0)));
 return{total:value/100-1,annual,vol,sr:vol?annual/vol:0,calmar:ddMax?annual/Math.abs(ddMax):0,maxDD:ddMax,sortino:down?annual/down:0,omega:loss?sum(rets.filter(r=>r>0))/loss:0,win:rets.filter(r=>r>0).length/rets.length,var95:Math.max(0,-q),cvar95:Math.max(0,-mean(tail)),curve,dd};
}
root.ResearchEngine={ASSETS,SECTORS,COLORS,RESULTS,HORIZONS,simulate,market,metrics,mean,sd,sum};
if(typeof module!=='undefined')module.exports=root.ResearchEngine;
})(globalThis);


