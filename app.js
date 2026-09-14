const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const getPeriod=()=>{const h=new Date().getHours();return h>=4&&h<10?'morning':h>=10&&h<20?'day':'night'};
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentStage=Number(localStorage.getItem('ss-stage')??5);
let caught=new Set(JSON.parse(localStorage.getItem('ss-caught')||'[]'));
let excluded=new Set(JSON.parse(localStorage.getItem('ss-excluded')||'[]'));
let records=JSON.parse(localStorage.getItem('ss-records')||'{}');
const recommendations={
 'ヘラクロス':{score:5,label:'★★★ 最有力',cls:'top',reason:'高い攻撃と格闘火力。アカネ以降の主要戦で長く活躍。'},
 'ケーシィ':{score:5,label:'★★★ 最有力',cls:'top',reason:'ユンゲラー以降の特攻・素早さが非常に高く、特殊エース向き。'},
 'メリープ':{score:5,label:'★★★ 最有力',cls:'top',reason:'デンリュウまで育てると安定した電気枠。耐久と特攻が扱いやすい。'},
 'イシツブテ':{score:4,label:'★★ 有力',cls:'good',reason:'序盤～中盤の相性が良く、物理耐久も高い。ゴローンでも十分実用的。'},
 'ゴース':{score:4,label:'★★ 有力',cls:'good',reason:'ゴースト枠兼特殊アタッカー。進化できるほど評価が上がる。'},
 'ズバット':{score:4,label:'★★ 有力',cls:'good',reason:'序盤は弱めだが、なつき進化のクロバットが高速で使いやすい。'},
 'ストライク':{score:4,label:'★★ 有力',cls:'good',reason:'高い攻撃・素早さで即戦力。むしとりたいかいで入手可能。'},
 'カイロス':{score:4,label:'★★ 有力',cls:'good',reason:'高い物理火力で旅の即戦力。進化なしで完成が早い。'},
 'ニドラン♀':{score:4,label:'★★ 有力',cls:'good',reason:'進化後の技範囲が広く、長期運用しやすい。'},
 'ニドラン♂':{score:4,label:'★★ 有力',cls:'good',reason:'進化後の技範囲が広く、長期運用しやすい。'},
 'ロコン':{score:4,label:'★★ 有力',cls:'good',reason:'ソウルシルバーの炎枠候補。特に炎タイプ不足なら価値が高い。'},
 'メノクラゲ':{score:3,label:'★ 候補',cls:'okay',reason:'水・毒の耐性と素早さが優秀。なみのり要員にもできる。'},
 'ウパー':{score:3,label:'★ 候補',cls:'okay',reason:'水・地面で弱点が少なく、ストーリー攻略で扱いやすい。'},
 'スリープ':{score:3,label:'★ 候補',cls:'okay',reason:'序盤のエスパー枠。耐久寄りで安定するが、ケーシィ系より火力は控えめ。'},
 'オニスズメ':{score:3,label:'★ 候補',cls:'okay',reason:'序盤の飛行枠として即戦力。オニドリルまでの完成も早い。'},
 'クラブ':{score:3,label:'★ 候補',cls:'okay',reason:'キングラーの物理攻撃は高い。水技と攻撃種別の噛み合わせには注意。'},
 'オドシシ':{score:3,label:'★ 候補',cls:'okay',reason:'捕獲直後から能力がまとまり、進化なしで使える即戦力。'},
 'ポッポ':{score:3,label:'★ 候補',cls:'okay',reason:'そらをとぶ要員として便利。終盤火力はやや控えめ。'},
 'オタチ':{score:3,label:'便利',cls:'utility',reason:'オオタチに進化後、フィールド技を多く担当できる便利枠。'},
 'タマタマ':{score:3,label:'★ 候補',cls:'okay',reason:'進化後は高い特攻を持つ。進化アイテムと技習得時期を意識。'},
 'パラス':{score:2,label:'図鑑向け',cls:'dex',reason:'状態異常など個性はあるが、旅パ効率では優先度低め。'},
 'レディバ':{score:2,label:'図鑑向け',cls:'dex',reason:'サポート寄りで火力が低く、通常攻略では優先度低め。'},
 'コイキング':{score:4,label:'★★ 有力',cls:'good',reason:'育成は必要だが、ギャラドス進化後は非常に強力。'}
};
function uniqueSpecies(){return [...new Set(E.map(e=>e.name))]}
function save(){
 localStorage.setItem('ss-stage',currentStage);
 localStorage.setItem('ss-caught',JSON.stringify([...caught]));
 localStorage.setItem('ss-excluded',JSON.stringify([...excluded]));
 localStorage.setItem('ss-records',JSON.stringify(records));
}
function expOf(e){const b=(meta[e.name]||[null,null])[1];if(!b)return null;return Math.floor(b*((e.min+e.max)/2)/7)}
function catchRate(name){return (meta[name]||[null])[0]}
function timeOK(e,p){return e.time==='all'||e.time===p}
function recOf(name){return recommendations[name]||null}
function recBadge(name){const r=recOf(name);return r?`<span class="rec rec-${r.cls}" title="${esc(r.reason)}">${r.label}</span>`:''}
function recordSummary(name){const r=records[name]||{};const parts=[];if(r.level)parts.push(`Lv${esc(r.level)}`);if(r.status)parts.push(esc(r.status));if(r.nature)parts.push(`性格 ${esc(r.nature)}`);return parts.join(' ・ ')}
function card(e){
 const cr=catchRate(e.name),ex=expOf(e),rare=e.rate<=5,isCaught=caught.has(e.name),isExcluded=excluded.has(e.name),summary=recordSummary(e.name);
 return `<div class="card ${isCaught?'caught':''} ${isExcluded?'excluded':''}">
 <div class="ball"></div><div><div class="poke-line"><div class="poke">${e.name}</div>${recBadge(e.name)}</div><div class="where">${e.location} ・ ${methods[e.method]}${e.note?' ・ '+e.note:''}</div>
 <div class="badges"><span class="badge rate">出現 ${e.rate}%</span>${rare?'<span class="badge rare">低確率</span>':''}<span class="badge ${e.time==='night'?'night':''}">${periods[e.time]}</span>${e.method.startsWith('head')?'<span class="badge head">ずつき</span>':''}${e.method==='oldrod'?'<span class="badge fish">釣り</span>':''}${ex?`<span class="badge exp">約${ex}EXP</span>`:''}${isExcluded?'<span class="badge excluded-badge">狙わない</span>':''}</div>
 ${summary?`<div class="record-mini">${summary}</div>`:''}
 <div class="details"><div class="metric"><span>レベル</span><b>${e.min===e.max?'Lv'+e.min:`Lv${e.min}–${e.max}`}</b></div><div class="metric"><span>捕獲係数</span><b>${cr??'—'}</b></div><div class="metric"><span>基礎EXP</span><b>${(meta[e.name]||[])[1]??'—'}</b></div></div>
 </div><div class="card-actions"><button class="check ${isCaught?'on':''}" data-catch="${e.name}" aria-label="捕獲チェック">${isCaught?'✓':'○'}</button><button class="mini-btn ${isExcluded?'restore':''}" data-exclude="${e.name}">${isExcluded?'除外解除':'狙わない'}</button>${isCaught?`<button class="mini-btn edit" data-edit="${e.name}">状態</button>`:''}</div></div>`
}
function dedupeBest(arr){const m=new Map();for(const e of arr){const key=e.name,old=m.get(key);if(!old||e.rate>old.rate||(e.rate===old.rate&&((e.min+e.max)>(old.min+old.max))))m.set(key,e)}return [...m.values()]}
function populate(){
 $('#progressSelect').innerHTML=progress.map(p=>`<option value="${p.id}" ${p.id===currentStage?'selected':''}>${p.name}</option>`).join('');
 const locs=[...new Set(E.map(e=>e.location))];$('#locationFilter').innerHTML='<option value="all">すべての場所</option>'+locs.map(x=>`<option>${x}</option>`).join('');
 $('#methodFilter').innerHTML='<option value="all">すべての方法</option>'+Object.entries(methods).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
}
function renderNow(){
 const p=getPeriod();const avail=dedupeBest(E.filter(e=>e.stage<=currentStage&&timeOK(e,p)&&!caught.has(e.name)&&!excluded.has(e.name))).sort((a,b)=>(recOf(b.name)?.score||0)-(recOf(a.name)?.score||0)||a.rate-b.rate);
 $('#progressNote').textContent=progress[currentStage].note;const top=avail.slice(0,20);$('#nowCards').innerHTML=top.length?top.map(card).join(''):'<div class="empty">現在の条件で未捕獲・未除外の候補はありません。</div>';
 const strong=avail.filter(e=>(recOf(e.name)?.score||0)>=4).slice(0,4).map(e=>e.name).join(' / ');const rare=avail.filter(e=>e.rate<=5).slice(0,3).map(e=>`${e.name} ${e.rate}%`).join(' / ');
 $('#todayTip').innerHTML=strong?`<strong>今の育成有力候補：</strong>${strong}${rare?`<br><strong>低確率候補：</strong>${rare}`:''}`:(rare?`<strong>今の低確率候補：</strong>${rare}`:'今の時間帯は高確率の未捕獲種から回収すると効率的です。');
}
function renderDex(){
 const q=$('#search').value.trim(),loc=$('#locationFilter').value,met=$('#methodFilter').value,tf=$('#timeFilter').value,p=tf==='current'?getPeriod():tf;let arr=E.filter(e=>e.stage<=currentStage);
 if(q)arr=arr.filter(e=>e.name.includes(q)||e.location.includes(q));if(loc!=='all')arr=arr.filter(e=>e.location===loc);if(met!=='all')arr=arr.filter(e=>e.method===met);if(tf!=='all')arr=arr.filter(e=>timeOK(e,p));if($('#uncaughtOnly').checked)arr=arr.filter(e=>!caught.has(e.name));if($('#hideExcluded').checked)arr=arr.filter(e=>!excluded.has(e.name));
 arr.sort((a,b)=>a.location.localeCompare(b.location,'ja')||b.rate-a.rate);$('#dexCards').innerHTML=arr.length?arr.map(card).join(''):'<div class="empty">該当する出現データがありません。</div>';
}
function renderRecommendations(){
 const availableNames=new Set(E.filter(e=>e.stage<=currentStage).map(e=>e.name));const arr=Object.entries(recommendations).filter(([n,r])=>availableNames.has(n)&&r.score>=3).sort((a,b)=>b[1].score-a[1].score||a[0].localeCompare(b[0],'ja'));
 $('#recommendList').innerHTML=arr.map(([name,r])=>`<div class="recommend-card ${caught.has(name)?'owned':''}"><div class="recommend-head"><b>${name}</b><span class="rec rec-${r.cls}">${r.label}</span></div><p>${r.reason}</p><div class="recommend-foot">${caught.has(name)?'✓ 捕獲済み':excluded.has(name)?'— 狙わない':'未捕獲'}</div></div>`).join('')||'<div class="empty">現在の進行度では候補がありません。</div>';
}
function renderExp(){
 const restrict=$('#expCurrent').checked;let arr=E.filter(e=>['grass','oldrod'].includes(e.method)&&(restrict?e.stage<=currentStage:true));arr=dedupeBest(arr).map(e=>({...e,exp:expOf(e)})).filter(e=>e.exp).sort((a,b)=>b.exp-a.exp).slice(0,18);
 $('#expRank').innerHTML=arr.map((e,i)=>`<div class="rank"><div class="rankno">${i+1}</div><div class="rankbody"><div class="ranktitle">${e.name} <span style="font-weight:500;color:#667085">${e.min===e.max?'Lv'+e.min:`Lv${e.min}–${e.max}`}</span> ${recBadge(e.name)}</div><div class="ranksub">${e.location} ・ 出現${e.rate}%</div></div><div class="rankexp"><b>約${e.exp}</b><span>EXP/1匹</span></div></div>`).join('');
 const advice=currentStage>=5?'コガネ到着時点では、34番道路より35番道路のLv14スリープが高めの経験値を安定して得やすいです。オドシシは1匹あたり多いものの5%なので、経験値目的だけで狙い続ける効率は安定しません。アカネに勝てる主力Lv18～20程度まで、未撃破トレーナー戦を優先し、不足分だけ野生で補うのがおすすめです。':currentStage>=4?'34番道路まで進むとスリープLv10～12が50%で出現し、それ以前より育成効率が大きく上がります。':'序盤は野生狩りより、道中トレーナーを残さず倒す方が効率的です。次の高レベルエリアまで必要分だけ補助的に野生を倒してください。';$('#levelAdvice').textContent=advice;
 renderRecommendations();
}
function manageCard(name){
 const r=records[name]||{},rec=recOf(name);const info=[r.level?`Lv${esc(r.level)}`:'Lv未記録',r.status?esc(r.status):'状態未設定'].join(' ・ ');
 return `<div class="manage-card"><div class="manage-main"><div class="poke-line"><b>${name}</b>${recBadge(name)}</div><div class="manage-summary">${info}${r.nickname?` ・ 「${esc(r.nickname)}」`:''}</div><div class="manage-sub">${r.nature?`性格: ${esc(r.nature)}　`:''}${r.ability?`特性: ${esc(r.ability)}　`:''}${r.item?`持ち物: ${esc(r.item)}`:''}</div>${r.memo?`<div class="manage-memo">${esc(r.memo)}</div>`:''}${rec?`<div class="rec-reason">${esc(rec.reason)}</div>`:''}</div><button class="btn compact" data-edit="${name}">編集</button></div>`;
}
function renderManage(){
 const q=$('#manageSearch').value.trim(),status=$('#manageStatus').value;let names=[...caught].filter(n=>E.some(e=>e.name===n));if(q)names=names.filter(n=>n.includes(q)||(records[n]?.nickname||'').includes(q));if(status!=='all')names=names.filter(n=>(records[n]?.status||'')===status);names.sort((a,b)=>(recOf(b)?.score||0)-(recOf(a)?.score||0)||a.localeCompare(b,'ja'));
 $('#manageCards').innerHTML=names.length?names.map(manageCard).join(''):'<div class="empty">条件に合う捕獲済みポケモンがありません。</div>';
 const ex=[...excluded].sort((a,b)=>a.localeCompare(b,'ja'));$('#excludedList').innerHTML=ex.length?ex.map(n=>`<div class="excluded-row"><span>${n}</span><button class="mini-btn restore" data-exclude="${n}">除外解除</button></div>`).join(''):'<div class="empty small">除外中のポケモンはありません。</div>';
}
function renderStats(){
 const species=uniqueSpecies();$('#areaCount').textContent=new Set(E.filter(e=>e.stage<=currentStage).map(e=>e.location)).size;$('#speciesCount').textContent=new Set(E.filter(e=>e.stage<=currentStage).map(e=>e.name)).size;$('#caughtCount').textContent=[...caught].filter(x=>species.includes(x)).length;const total=new Set(E.filter(e=>e.stage<=currentStage).map(e=>e.name)).size,c=[...caught].filter(x=>E.some(e=>e.stage<=currentStage&&e.name===x)).length;$('#caughtProgressText').textContent=`${c} / ${total}`;$('#excludedText').textContent=`除外 ${excluded.size}`;$('#caughtBar').style.width=`${total?Math.round(c/total*100):0}%`;
}
function renderAll(){renderNow();renderDex();renderExp();renderManage();renderStats()}
function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});const p=getPeriod();$('#period').textContent=periods[p];$('#periodHero').textContent=p==='morning'?'朝':p==='day'?'昼':'夜'}
function openEditor(name){
 const r=records[name]||{};$('#dialogName').textContent=name;$('#editSpecies').value=name;$('#editNickname').value=r.nickname||'';$('#editLevel').value=r.level||'';$('#editStatus').value=r.status||'';$('#editNature').value=r.nature||'';$('#editAbility').value=r.ability||'';$('#editItem').value=r.item||'';$('#editMemo').value=r.memo||'';$('#pokeDialog').showModal();
}
populate();clock();setInterval(clock,30000);renderAll();
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});
$('#progressSelect').onchange=e=>{currentStage=Number(e.target.value);save();renderAll()};
['search','locationFilter','methodFilter','timeFilter','uncaughtOnly','hideExcluded'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',renderDex));
['manageSearch','manageStatus'].forEach(id=>$('#'+id).addEventListener(id==='manageSearch'?'input':'change',renderManage));
$('#expCurrent').onchange=renderExp;
document.addEventListener('click',e=>{
 const catchBtn=e.target.closest('[data-catch]');if(catchBtn){const n=catchBtn.dataset.catch;caught.has(n)?caught.delete(n):caught.add(n);save();renderAll();return;}
 const excludeBtn=e.target.closest('[data-exclude]');if(excludeBtn){const n=excludeBtn.dataset.exclude;excluded.has(n)?excluded.delete(n):excluded.add(n);save();renderAll();return;}
 const editBtn=e.target.closest('[data-edit]');if(editBtn){openEditor(editBtn.dataset.edit);return;}
});
$('#pokeForm').addEventListener('submit',e=>{e.preventDefault();const n=$('#editSpecies').value;records[n]={nickname:$('#editNickname').value.trim(),level:$('#editLevel').value,status:$('#editStatus').value,nature:$('#editNature').value.trim(),ability:$('#editAbility').value.trim(),item:$('#editItem').value.trim(),memo:$('#editMemo').value.trim()};save();$('#pokeDialog').close();renderAll();});
$('#closeDialog').onclick=()=>$('#pokeDialog').close();
$('#clearRecord').onclick=()=>{const n=$('#editSpecies').value;if(confirm(`${n}の状態記録を消しますか？`)){delete records[n];save();$('#pokeDialog').close();renderAll();}};
$('#pokeDialog').addEventListener('click',e=>{if(e.target===$('#pokeDialog'))$('#pokeDialog').close()});
$('#resetBtn').onclick=()=>{if(confirm('捕獲チェックをすべてリセットしますか？\n状態メモと「狙わない」設定は残ります。')){caught.clear();save();renderAll()}};
$('#exportBtn').onclick=()=>{
 const lines=['【ソウルシルバー 図鑑・育成ナビ】',''];[...caught].sort((a,b)=>a.localeCompare(b,'ja')).forEach(n=>{const r=records[n]||{};let s=`☑ ${n}`;if(r.level)s+=` Lv${r.level}`;if(r.status)s+=` / ${r.status}`;if(r.nature)s+=` / ${r.nature}`;if(r.memo)s+=` / ${r.memo}`;lines.push(s)});if(excluded.size){lines.push('','【狙わない】',...[...excluded].sort((a,b)=>a.localeCompare(b,'ja')).map(n=>'－ '+n));}const text=lines.join('\n');if(navigator.share){navigator.share({title:'ソウルシルバー 捕獲・育成データ',text}).catch(()=>{})}else{navigator.clipboard?.writeText(text);alert('保存データをクリップボードにコピーしました。')}
};