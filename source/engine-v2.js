(function(root){
'use strict';
const E=root.ResearchEngine||(typeof require==='function'?require('./engine.js'):null),{sum,mean,sd}=E;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function ema(a,p){const k=2/(p+1);return a.reduce((out,v,i)=>(out.push(i?out[i-1]+k*(v-out[i-1]):v),out),[]);}
function indicators(prices){
 const n=prices.length,rsi=Array(n).fill(null),macd=Array(n).fill(null),signal=Array(n).fill(null),histogram=Array(n).fill(null);
 if(n>14){let gain=0,loss=0;for(let i=1;i<=14;i++){const d=prices[i]-prices[i-1];gain+=Math.max(0,d)/14;loss+=Math.max(0,-d)/14;}const value=()=>gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);rsi[14]=value();for(let i=15;i<n;i++){const d=prices[i]-prices[i-1];gain=(gain*13+Math.max(0,d))/14;loss=(loss*13+Math.max(0,-d))/14;rsi[i]=value();}}
 const a=ema(prices,12),b=ema(prices,26),raw=a.map((v,i)=>v-b[i]),s=ema(raw.slice(25),9);for(let i=33;i<n;i++){macd[i]=raw[i];signal[i]=s[i-25];histogram[i]=macd[i]-signal[i];}
 return{rsi,macd,signal,histogram};
}
function assetInfo(key,id,endDate){
 const m=E.market(key);let end=endDate?m.dates.findIndex(d=>d===endDate):m.dates.length-1;if(end<0)end=m.dates.length-1;
 const rs=m.returns.slice(0,end+1).map(r=>r[id]),prices=[];let p=100;for(const r of rs){p*=1+r;prices.push(p);}const ind=indicators(prices),ret=n=>rs.slice(-n).reduce((v,r)=>v*(1+r),1)-1;
 const tail=rs.slice(-63),ram=mean(tail)/(sd(tail)||.001)*Math.sqrt(252),ma20=mean(prices.slice(-20)),rsi=ind.rsi.at(-1)??50;
 return{id,ticker:m.assets[id][0],name:m.assets[id][1],sector:m.assets[id][2],date:m.dates[end],r21:ret(21),r63:ret(63),r252:ret(252),vol:sd(tail)*Math.sqrt(252),ram,rsi,trend:prices.at(-1)>=ma20?'Tích cực':'Thận trọng',prices,dates:m.dates.slice(0,end+1),...ind};
}
function cappedWeights(raw,cap){
 const n=raw.length;if(!n||n*cap<1-1e-10)throw new Error('Giới hạn mỗi mã quá thấp so với số mã đã chọn.');
 const w=Array(n).fill(0),pending=new Set(raw.map((_,i)=>i));let rest=1;
 while(pending.size){const denom=sum([...pending].map(i=>Math.max(raw[i],1e-9)));const over=[...pending].filter(i=>rest*Math.max(raw[i],1e-9)/denom>cap+1e-12);if(!over.length){for(const i of pending)w[i]=rest*Math.max(raw[i],1e-9)/denom;break;}for(const i of over){w[i]=cap;rest-=cap;pending.delete(i);}}
 return w;
}
function plan(options){
 const {key,horizon=21,mode='Adaptive',capital,count=12,cap=.15,reserve=.05,excluded=[],cursor=-1}=options;
 if(!Number.isFinite(capital)||capital<1||capital>1e12)throw new Error('Vốn phải từ 1 đến 1.000.000.000.000.');
 if(!Number.isFinite(reserve)||reserve<0||reserve>.5)throw new Error('Tiền mặt dự phòng phải từ 0% đến 50%.');
 if(!Number.isFinite(cap)||cap<=0||cap>1)throw new Error('Giới hạn tỷ trọng không hợp lệ.');
 const sim=E.simulate(key,horizon,mode),record=sim.records[cursor<0?sim.records.length-1:clamp(cursor,0,sim.records.length-1)],m=E.market(key),at=m.dates.findIndex(d=>d===record.date),signalDate=m.dates[Math.max(0,at-1)],excludedSet=new Set(excluded);
 const candidates=sim.assets.map((a,id)=>({a,id,raw:record.weights[id],info:null})).filter(o=>!excludedSet.has(o.a[0]));
 for(const c of candidates)c.info=assetInfo(key,c.id,signalDate);
 candidates.sort((a,b)=>b.raw-a.raw||b.info.ram-a.info.ram);
 const selected=candidates.slice(0,Math.min(Math.round(count),candidates.length));if(selected.length<2)throw new Error('Cần ít nhất hai cổ phiếu trong tập lựa chọn.');
 const raw=selected.map(c=>c.raw>0?c.raw:Math.max(.002,1/(c.info.vol*1000||100))),weights=cappedWeights(raw,cap);
 const unit=key==='VN'?1:100,totalMinor=Math.round(capital*unit),available=totalMinor-Math.round(totalMinor*reserve),investMinor=Math.floor(available/1.001),feeMinor=Math.round(investMinor*.001),cashMinor=totalMinor-investMinor-feeMinor;
 const floors=weights.map(w=>Math.floor(w*investMinor)),fractions=weights.map((w,i)=>({i,v:w*investMinor-floors[i]})).sort((a,b)=>b.v-a.v);
 const missing=investMinor-sum(floors);for(let i=0;i<missing;i++)floors[fractions[i%fractions.length].i]++;
 const rows=selected.map((o,i)=>({...o.info,weight:weights[i],amount:floors[i]/unit,baseWeight:o.raw})).sort((a,b)=>b.weight-a.weight);
 const sectors=Array(E.SECTORS.length).fill(0);rows.forEach(r=>sectors[r.sector]+=r.weight);
 return{key,horizon,mode,capital:totalMinor/unit,count:rows.length,cap,reserve,date:record.date,signalDate,endDate:record.endDate,record:record.index,action:record.action,rows,sectors,invested:investMinor/unit,fee:feeMinor/unit,cash:cashMinor/unit,hhi:sum(weights.map(w=>w*w)),unit,excluded:[...excluded]};
}
function attribution(pr,br){const n=Math.min(pr.length,br.length),p=pr.slice(0,n),b=br.slice(0,n),pm=mean(p),bm=mean(b),v=mean(b.map(x=>(x-bm)**2)),cov=mean(p.map((x,i)=>(x-pm)*(b[i]-bm))),beta=v?cov/v:0,ex=p.map((r,i)=>r-b[i]),te=sd(ex)*Math.sqrt(252);return{beta,alpha:(pm-beta*bm)*252,te,ir:te?mean(ex)*252/te:0};}
function rolling(a,window,fn){return a.map((_,i)=>i+1<window?null:fn(a.slice(i-window+1,i+1)));}
function sentiment(key,date){
 const m=E.market(key),end=m.dates.indexOf(date),at=end<0?m.dates.length-1:end,returns=m.ew.slice(0,at+1),curve=[];let p=100;returns.forEach(r=>{p*=1+r;curve.push(p);});const ind=indicators(curve),last21=returns.slice(-21),last63=returns.slice(-63),breadth=mean(m.assets.map((_,j)=>sum(m.returns.slice(at-20,at+1).map(r=>r[j]))>0?1:0));
 const components=[{name:'Động lượng',value:clamp(50+mean(last21)*7500,0,100)},{name:'Xu hướng RSI',value:ind.rsi.at(-1)??50},{name:'Độ rộng thị trường',value:breadth*100},{name:'Dòng tiền',value:null},{name:'Biến động',value:clamp(100-sd(last63)*Math.sqrt(252)*260,0,100)},{name:'Tâm lý tin tức',value:null}];
 const score=Math.round(mean(components.filter(c=>c.value!==null).map(c=>c.value))),label=score>75?'Hưng phấn':score>60?'Tích cực':score>40?'Trung lập':score>25?'Thận trọng':'Phòng thủ';
 return{score,label,components,breadth,advances:Math.round(breadth*m.assets.length),declines:m.assets.length-Math.round(breadth*m.assets.length),coverage:4};
}
Object.assign(E,{indicators,assetInfo,cappedWeights,plan,attribution,rolling,sentiment});
if(typeof module!=='undefined')module.exports=E;
})(globalThis);
