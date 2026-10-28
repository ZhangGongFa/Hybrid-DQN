const E=require('./engine-v2.js'),assert=require('node:assert/strict');
for(const key of ['VN','US'])for(const capital of [1000,12345.67,key==='VN'?1000000000:100000]){
 const p=E.plan({key,capital,horizon:21,count:12,cap:.15,reserve:.05});assert.equal(p.rows.length,12);assert(Math.abs(E.sum(p.rows.map(r=>r.weight))-1)<1e-10);assert(p.rows.every(r=>r.weight<=.15+1e-10));assert(Math.abs(E.sum(p.rows.map(r=>r.amount))+p.cash+p.fee-p.capital)<1/p.unit+.00001);assert.equal(new Set(p.rows.map(r=>r.ticker)).size,12);assert(p.rows.every(r=>r.date<p.date));assert(p.rows.every(r=>Number.isFinite(r.r21)&&Number.isFinite(r.rsi.at(-1))));
 const x=E.plan({key,capital:capital*2,horizon:21,count:12,cap:.15,reserve:.05});assert.deepEqual(x.rows.map(r=>[r.ticker,r.weight]),p.rows.map(r=>[r.ticker,r.weight]));assert(Math.abs(x.invested-2*p.invested)<=2/p.unit);
 const ex=E.plan({key,capital,horizon:21,count:10,cap:.15,reserve:.1,excluded:[p.rows[0].ticker]});assert(!ex.rows.some(r=>r.ticker===p.rows[0].ticker));
 console.log(key,capital,'stocks',p.count,'reconciled',p.capital);
}
assert.throws(()=>E.plan({key:'VN',capital:1e9,count:8,cap:.1}));assert.throws(()=>E.plan({key:'VN',capital:0}));
assert.equal(E.indicators(Array(30).fill(100)).rsi.at(-1),50);assert.equal(E.indicators(Array.from({length:30},(_,i)=>100+i)).rsi.at(-1),100);assert.equal(E.indicators(Array.from({length:30},(_,i)=>100-i)).rsi.at(-1),0);assert(E.indicators(Array(60).fill(100)).macd.every(v=>v===null||v===0));
for(const key of ['VN','US']){const s=E.sentiment(key,'2026-03-24');assert(s.score>=0&&s.score<=100);assert.equal(s.coverage,4);assert.equal(s.components.filter(c=>c.value===null).length,2);assert.equal(s.advances+s.declines,E.ASSETS[key].length);}
console.log('PASS: capital reconciliation, caps, exclusions, no future signals, RSI/MACD and sentiment coverage');
