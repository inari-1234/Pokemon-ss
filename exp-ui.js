function expGrade(e){
  const ex=e.exp||0, rate=e.rate||0;
  if((rate>=40&&ex>=130)||(rate>=20&&ex>=180)) return {level:4,label:'◎ 高効率',cls:'best',note:'経験値と出現率の両方が優秀'};
  if((rate>=20&&ex>=130)||(rate>=10&&ex>=180)||(rate>=40&&ex>=100)) return {level:3,label:'○ おすすめ',cls:'good',note:'安定して経験値を稼ぎやすい'};
  if(ex>=180&&rate<10) return {level:2,label:'△ 高EXP・低出現',cls:'mid',note:'1匹は大きいが、出会いにくい'};
  if(ex>=120||rate>=20) return {level:2,label:'△ 候補',cls:'mid',note:'条件次第では使える育成相手'};
  return {level:1,label:'— 効率低め',cls:'low',note:'経験値効率目的なら優先度は低め'};
}
function expRateClass(rate){return rate>=30?'high':rate>=10?'medium':'low'}
function expScore(e){const g=expGrade(e);return g.level*100000+(e.exp||0)*100+Math.min(e.rate||0,99)}

renderExp=function(){
  const restrict=$('#expCurrent').checked;
  let arr=E.filter(e=>['grass','oldrod'].includes(e.method)&&(restrict?e.stage<=currentStage:true));
  arr=dedupeBest(arr).map(e=>({...e,exp:expOf(e)})).filter(e=>e.exp).sort((a,b)=>expScore(b)-expScore(a)).slice(0,18);
  const rank=$('#expRank');
  if(!document.querySelector('.exp-legend')){
    const legend=document.createElement('div');
    legend.className='exp-legend';
    legend.innerHTML='<span class="exp-grade exp-best">◎ 高効率</span><span class="exp-grade exp-good">○ おすすめ</span><span class="exp-grade exp-mid">△ 条件付き</span><span class="exp-grade exp-low">— 効率低め</span><small style="color:#98a2b3">1匹のEXP＋出現率で判定</small>';
    rank.parentElement.insertBefore(legend,rank);
  }
  rank.innerHTML=arr.map((e,i)=>{
    const g=expGrade(e),rateCls=expRateClass(e.rate);
    return `<div class="rank exp-rank-${g.cls}"><div class="rankno">${i+1}</div><div class="rankbody"><div class="ranktitle">${e.name} <span style="font-weight:500;color:#667085">${e.min===e.max?'Lv'+e.min:`Lv${e.min}–${e.max}`}</span> <span class="exp-grade exp-${g.cls}">${g.label}</span> ${recBadge(e.name)}</div><div class="ranksub">${e.location} ・ 出現 <span class="exp-rate ${rateCls}">${e.rate}%</span></div><div class="exp-note">${g.note}</div></div><div class="rankexp exp-${g.cls}-num"><b>約${e.exp}</b><span>EXP/1匹</span></div></div>`;
  }).join('');
  const advice=currentStage>=5?'コガネ到着時点では、35番道路のLv14スリープが「経験値量」と「出現率」のバランスがよく、高効率です。オドシシは1匹あたりの経験値は多いものの出現率5%なので、黄色の「高EXP・低出現」として区別しています。未撃破トレーナー戦を優先し、不足分を緑・青の野生相手で補うのがおすすめです。':currentStage>=4?'34番道路のスリープは高めの経験値を50%で狙えるため、序盤としては非常に安定した育成相手です。緑・青の表示を優先してください。':'序盤は野生狩りより道中トレーナーを残さず倒す方が効率的です。野生で補う場合は、緑・青の表示を優先してください。';
  $('#levelAdvice').textContent=advice;
  renderRecommendations();
};
const expToggle=document.querySelector('#expCurrent');
if(expToggle) expToggle.onchange=renderExp;
renderExp();
