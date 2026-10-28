/* Akmon · Identidade A — comportamento comum das variações (sem build) */
(function(){
  'use strict';
  var A=window.AKMON,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')};

  /* sprite: símbolo e ícones autorais (mesmos da Identidade A) */
  document.body.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'+
    '<symbol id="sym-akmon" viewBox="0 0 64 64"><path d="M4 20H60V30H46V36H52V50H58V56H12V50H18V36H26V30H18L4 22Z" fill="currentColor"/><rect x="16" y="12" width="30" height="8" style="fill:var(--blade,#B8340A)"/><rect x="22" y="5" width="4" height="4" style="fill:var(--blade,#B8340A)"/><rect x="31" y="2" width="4" height="4" style="fill:var(--blade,#B8340A)"/><rect x="40" y="6" width="4" height="4" style="fill:var(--blade,#B8340A)"/></symbol>'+
    '<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12"/><path d="M4 16V4H16"/></symbol>'+
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12.5L9.5 18L20 6.5"/></symbol>'+
    '<symbol id="i-x" viewBox="0 0 24 24"><path d="M5 5L19 19M19 5L5 19"/></symbol>'+
    '<symbol id="i-out" viewBox="0 0 24 24"><path d="M7 17L17 7M8 7H17V16"/></symbol>'+
    '<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 4V19M6 13L12 19L18 13"/></symbol></svg>');

  /* gravura ASCII: corpo + camada das faíscas (marcação) */
  $$('[data-art]').forEach(function(f){
    var m=f.dataset.art;
    f.innerHTML=(m==='faisca'?'':'<pre class="corpo">'+esc(A.art)+'</pre>')+(m==='corpo'?'':'<pre class="faisca">'+esc(A.spark)+'</pre>');
  });

  /* instalação */
  var PECA={cat:'01-automacao-n8n-make',skill:'n8n-flow-builder'};
  var REPO='git clone https://github.com/RafaelMKn/skills-library.git && cd skills-library';
  var H={
    claude:{rot:'Claude Code',dest:'Destino: <span class="mono">~/.claude/skills/</span>. Rode dentro da pasta clonada.',
      l:function(p){return [REPO,'ln -s "$(pwd)/'+p.cat+'/'+p.skill+'" ~/.claude/skills/'+p.skill]}},
    agents:{rot:'Google Antigravity · Codex',dest:'Destino: <span class="mono">.agents/skills/</span>, na raiz do projeto onde o harness roda.',
      l:function(p){return [REPO,'ln -s "$(pwd)/'+p.cat+'/'+p.skill+'" .agents/skills/'+p.skill]}},
    hermes:{rot:'Hermes · OpenClaw',dest:'Destino: <span class="mono">~/.hermes/skills/&lt;categoria&gt;/&lt;skill&gt;/</span>. Em vez do link, dá para copiar a pasta com <span class="mono">cp -r</span>.',
      l:function(p){return [REPO,'mkdir -p ~/.hermes/skills/'+p.cat,'ln -s "$(pwd)/'+p.cat+'/'+p.skill+'" ~/.hermes/skills/'+p.cat+'/'+p.skill]}}
  };
  var harness='claude';
  function cmdTxt(){return H[harness].l(PECA).join('\n')}
  function render(){
    $$('[data-m-pre]').forEach(function(p){p.innerHTML=H[harness].l(PECA).map(function(x){return '<span class="p" aria-hidden="true">$ </span>'+esc(x)}).join('\n')});
    $$('[data-m-rot]').forEach(function(e){e.textContent=H[harness].rot});
    $$('[data-m-dest]').forEach(function(e){e.innerHTML=H[harness].dest});
    $$('[data-m-peca]').forEach(function(e){e.textContent=PECA.cat+'/'+PECA.skill});
    $$('.copy').forEach(reset);
  }
  function reset(b){b.dataset.st='';b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-copy"/></svg><span>Copiar</span>';var m=b.closest('.cmd').querySelector('.cmd-msg');if(m)m.textContent=''}
  $$('.seg').forEach(function(g){
    var bs=$$('button',g);
    bs.forEach(function(b,i){
      b.addEventListener('click',function(){sel(b)});
      b.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!k)return;e.preventDefault();var n=bs[(i+k+bs.length)%bs.length];n.focus();sel(n)});
    });
    function sel(b){bs.forEach(function(x){var on=x===b;x.setAttribute('aria-checked',on);x.tabIndex=on?0:-1});harness=b.dataset.h;render()}
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copy');if(!b)return;
    var m=b.closest('.cmd').querySelector('.cmd-msg');
    var ok=function(){b.dataset.st='ok';b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><span>Copiado</span>';m.textContent='Comando copiado. Cole no terminal.';clearTimeout(b._t);b._t=setTimeout(function(){reset(b)},2600)};
    var ko=function(){b.dataset.st='erro';b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg><span>Falhou</span>';m.textContent='O navegador bloqueou a cópia. Selecione o texto do comando e copie na mão.'};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(cmdTxt()).then(ok,ko);else ko();
  });

  /* categorias: abas + folha */
  var max=Math.max.apply(null,A.cats.map(function(c){return c.n}));
  $$('[data-tabs]').forEach(function(t){
    var painel=$(t.dataset.tabs);
    t.setAttribute('role','tablist');
    t.innerHTML=A.cats.map(function(c,i){return '<button class="tab" role="tab" id="tab-'+c.id+'" aria-controls="'+painel.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" style="--n:'+c.n+';--r:'+(c.n/max).toFixed(3)+'" aria-label="'+esc(c.id+' '+c.nome)+'">'+
      '<span class="tab-num">'+c.id+'</span><span class="tab-nome">'+esc(c.curto)+'</span><span class="tab-nome-l">'+esc(c.nome)+'</span><span class="tab-pasta mono">'+c.pasta+'</span><span class="tab-n mono">'+c.n+'</span></button>'}).join('');
    var bs=$$('.tab',t);
    function abrir(b,anim){
      bs.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
      var c=A.cats[bs.indexOf(b)];
      painel.setAttribute('role','tabpanel');painel.setAttribute('aria-labelledby',b.id);painel.tabIndex=0;
      painel.innerHTML='<div class="folha-cab"><p class="folha-cod" aria-hidden="true">'+c.id+'</p><div><h3>'+esc(c.nome)+'</h3><p class="folha-pasta mono">'+c.pasta+'</p><p class="folha-n"><span class="mono">'+c.n+'</span> SKILL.md no disco · contagem em revisão</p></div></div>'+
        '<ul class="pecas">'+c.pecas.map(function(p){var on=PECA.skill===p.skill;var cat=c.pasta.replace(/\/$/,'');return '<li><button type="button" class="peca" aria-pressed="'+on+'" data-cat="'+cat+'" data-skill="'+p.skill+'"><span class="peca-nome">'+p.skill+'</span><span class="peca-desc">'+esc(p.desc)+'</span><span class="peca-acao">'+(on?'✓ Escolhida':'Escolher peça')+'</span></button></li>'}).join('')+'</ul>'+
        '<p class="folha-nota">Algumas peças da pasta, não a lista completa.</p>';
      if(anim&&!reduced.matches){painel.classList.remove('troca');void painel.offsetWidth;painel.classList.add('troca')}
    }
    bs.forEach(function(b,i){
      b.addEventListener('click',function(){abrir(b,true)});
      b.addEventListener('keydown',function(e){var v=t.getAttribute('aria-orientation')==='vertical';var k=(e.key===(v?'ArrowDown':'ArrowRight'))?1:(e.key===(v?'ArrowUp':'ArrowLeft'))?-1:0;if(!k)return;e.preventDefault();var n=bs[(i+k+bs.length)%bs.length];n.focus();abrir(n,true)});
    });
    painel.addEventListener('click',function(e){
      var p=e.target.closest('.peca');if(!p)return;
      PECA={cat:p.dataset.cat,skill:p.dataset.skill};
      $$('.peca',painel).forEach(function(x){var on=x===p;x.setAttribute('aria-pressed',on);x.querySelector('.peca-acao').textContent=on?'✓ Escolhida':'Escolher peça'});
      render();
    });
    abrir(bs[0],false);
  });
  render();
})();
