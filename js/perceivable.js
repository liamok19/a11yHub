(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  function seg(id,cb){
    var g=$(id);
    g.addEventListener('click',function(e){
      var b=e.target.closest('button[data-v]');if(!b)return;
      g.querySelectorAll('button[data-v]').forEach(function(o){o.setAttribute('aria-pressed',o===b);});
      cb(b.dataset.v);
    });
  }
  function onCheck(id,cb){$(id).addEventListener('change',function(e){cb(e.target.checked);});}
  function chip(el,ok,passText,failText){el.className='chip '+(ok?'pass':'fail');el.textContent=ok?'✓ '+(passText||'Pass'):'✕ '+(failText||'Fail');}
  function clipped(el){return el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1;}
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  /* colour maths */
  function hexToRgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function lin(c){c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
  function lum(rgb){return 0.2126*lin(rgb[0])+0.7152*lin(rgb[1])+0.0722*lin(rgb[2]);}
  function ratio(a,b){var la=lum(a),lb=lum(b);return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);}
  function mix(a,b,t){return [0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t);});}
  function css(rgb){return 'rgb('+rgb.join(',')+')';}

  /* ---------- 1.1.1 non-text content ---------- */
  var altMode='missing';
  var altLines={
    missing:[['image',1],['Stoneware mug, heading',0],['38 dollars',0],['button',1]],
    file:[['I M G underscore 4032 dot J P G, image',1],['Stoneware mug, heading',0],['38 dollars',0],['icon dash heart dash outline, button',1]],
    good:[['Speckled cream stoneware mug with a wide handle, image',0],['Stoneware mug, heading',0],['38 dollars',0],['Save to wishlist, button',0]]
  };
  function altPaint(){
    $('alt-sr').innerHTML=altLines[altMode].map(function(l){return '<li'+(l[1]?' class="bad"':'')+'>'+esc(l[0])+'</li>';}).join('');
  }
  seg('alt-seg',function(v){altMode=v;altPaint();});
  onCheck('alt-off',function(on){$('alt-card').classList.toggle('masked',on);$('alt-card').style.visibility='visible';[].forEach.call($('alt-card').children,function(c){c.style.visibility=on?'hidden':'visible';});});
  altPaint();

  /* ---------- 1.2 time-based media ---------- */
  var beats=[
    {see:'A pan of oil bursts into flame on the stove.',hear:'[Smoke alarm beeping]'},
    {see:'The presenter slides a metal lid over the pan.',hear:'“Never use water. Do this instead.”'},
    {see:'Text on screen: Turn off the heat. Leave the lid on.',hear:'[Calm music]'}
  ];
  var mFacts=[['A pan is on fire','v'],['Never use water','a'],['Cover it with a lid','v'],['Turn off the heat','v']];
  function mPaint(){
    var deaf=$('m-deaf').checked,blind=$('m-blind').checked,cap=$('m-cap').checked,ad=$('m-ad').checked,tr=$('m-tr').checked;
    var h='<div class="lh">What you see</div><div class="lh">What you hear</div>';
    beats.forEach(function(b){
      h+=blind?'<div class="cell masked">Nothing</div>':'<div class="cell"><span>'+esc(b.see)+'</span>'+(cap?'<span class="extra">CC '+esc(b.hear)+'</span>':'')+'</div>';
      h+=deaf?'<div class="cell masked">Nothing</div>':'<div class="cell"><span>'+esc(b.hear)+'</span>'+(ad?'<span class="extra">Describer: '+esc(b.see)+'</span>':'')+'</div>';
    });
    $('m-lanes').innerHTML=h;
    $('m-transcript').hidden=!tr;
    var got=0,f='';
    mFacts.forEach(function(x){
      var ok=tr||(x[1]==='v'?(!blind||(ad&&!deaf)):(!deaf||(cap&&!blind)));
      if(ok)got++;
      f+='<span>'+x[0]+'</span><span class="chip '+(ok?'pass':'fail')+'">'+(ok?'✓ Got it':'✕ Missed')+'</span>';
    });
    $('m-facts').innerHTML=f;
    var note=got===4?'':(deaf&&blind?' Only a transcript, read by braille display, reaches a deafblind viewer.':deaf?' Captions would carry the speech.':blind?' Audio description would carry the pictures.':'');
    $('m-score').textContent='You took in '+got+' of 4 key points.'+note;
  }
  ['m-deaf','m-blind','m-cap','m-ad','m-tr'].forEach(function(id){$(id).addEventListener('change',mPaint);});
  mPaint();

  /* ---------- 1.3.1 info and relationships ---------- */
  var stLines={
    fake:[['Headings on this page: none',1],['Lists on this page: none',1],['Form fields: 1, announced only as “edit text”',1],['Everything else is one unbroken run of text',1]],
    real:[['Heading level 2: Opening hours',0],['List with 3 items',0],['Email for updates, edit text',0]]
  };
  function stPaint(v){$('st-sr').innerHTML=stLines[v].map(function(l){return '<li'+(l[1]?' class="bad"':'')+'>'+esc(l[0])+'</li>';}).join('');}
  seg('st-seg',stPaint);stPaint('fake');

  /* ---------- 1.3.2 meaningful sequence ---------- */
  var sqMode='broken',sqTimer=null,sqSteps=[].slice.call($('sq-steps').children);
  function sqStop(){clearInterval(sqTimer);sqTimer=null;sqSteps.forEach(function(s){s.classList.remove('now');});}
  seg('sq-seg',function(v){sqMode=v;sqStop();$('sq-out').textContent=v==='broken'?'The code order was shuffled, then CSS put it back in place visually. Press Read it aloud.':'The code order now matches the screen. Press Read it aloud.';});
  $('sq-play').addEventListener('click',function(){
    sqStop();
    var order=sqMode==='broken'?[2,0,3,1]:[0,1,2,3],i=0,said=[];
    function tick(){
      sqSteps.forEach(function(s){s.classList.remove('now');});
      if(i>=order.length){
        clearInterval(sqTimer);sqTimer=null;
        $('sq-out').textContent='Heard: '+said.join(' ')+(sqMode==='broken'?' The tea is poured before the kettle boils. This fails 1.3.2.':' Same order as the screen. This passes.');
        return;
      }
      var s=sqSteps[order[i]];s.classList.add('now');said.push(s.textContent+'.');
      $('sq-out').textContent='Reading: '+said.join(' ');i++;
    }
    tick();sqTimer=setInterval(tick,1000);
  });

  /* ---------- 1.3.3 sensory characteristics ---------- */
  var seMode='vague';
  function sePaint(){
    var grey=$('se-grey').checked,linear=$('se-lin').checked;
    $('se-instr').textContent=seMode==='vague'?'To continue, press the round green button on the right.':'To continue, press Next. It is the round green button on the right.';
    $('se-visual').hidden=linear;$('se-linear').hidden=!linear;
    $('se-visual').classList.toggle('grey',grey);
    var msg;
    if(seMode==='named')msg='✓ The instruction names the button, so it works however the page is presented.';
    else if(linear)msg='✕ Round? Green? On the right? None of that exists in a list of three buttons. The instruction is useless.';
    else if(grey)msg='✕ “Green” is gone. Shape and position still help here, but one more change and you are guessing.';
    else msg='Fine for you right now. Take something away and see if the instruction survives.';
    $('se-result').textContent=msg;
  }
  seg('se-seg',function(v){seMode=v;sePaint();});
  onCheck('se-grey',sePaint);onCheck('se-lin',sePaint);sePaint();

  /* ---------- 1.3.4 orientation ---------- */
  var orMode='locked',orLand=false;
  function orPaint(){
    var p=$('or-phone');p.classList.toggle('land',orLand);p.classList.toggle('locked',orMode==='locked');
    $('or-out').textContent=!orLand?'The phone is upright. Rotate it to landscape, the way it sits on a mount.':orMode==='locked'?'The app refuses to turn. Its content is now sideways, and someone who cannot move the phone has to read it with their head tilted. This fails 1.3.4.':'The layout turned with the phone. Everything is readable in landscape. This passes.';
  }
  seg('or-seg',function(v){orMode=v;orPaint();});
  $('or-rot').addEventListener('click',function(){orLand=!orLand;orPaint();});

  /* ---------- 1.3.5 identify input purpose ---------- */
  var ipMode='none',ipFilled=false;
  var ipFields=[['Name','Sam Rivera','name'],['Email','sam@example.com','email'],['Phone','021 555 0142','tel'],['Postcode','6011','postal-code']];
  function ipPaint(){
    $('ip-form').innerHTML=ipFields.map(function(f){
      return '<div class="frow"><span>'+f[0]+'</span><span class="v">'+(ipFilled&&ipMode==='auto'?f[1]:'')+'</span>'+(ipMode==='auto'?'<code>autocomplete="'+f[2]+'"</code>':'<code>no autocomplete</code>')+'</div>';
    }).join('');
  }
  seg('ip-seg',function(v){ipMode=v;ipFilled=false;ipPaint();$('ip-out').textContent='Press Use my saved details and see what the browser can do.';});
  $('ip-fill').addEventListener('click',function(){
    ipFilled=true;ipPaint();
    var keys=ipFields.reduce(function(n,f){return n+f[1].length;},0);
    $('ip-out').textContent=ipMode==='auto'?'All 4 fields filled in one tap. The browser knew which was which.':'Nothing happened. The browser cannot tell what these fields are, so you type all 4 by hand: about '+keys+' key presses, each a chance for a typo.';
  });
  $('ip-clear').addEventListener('click',function(){ipFilled=false;ipPaint();$('ip-out').textContent='Cleared.';});
  ipPaint();

  /* ---------- 1.4.1 use of colour ---------- */
  var coItems=[['Oat milk',1],['Sourdough loaf',0],['Free-range eggs',1],['Salted butter',0]];
  function coPaint(){
    var grey=$('co-grey').checked,fix=$('co-fix').checked;
    $('co-list').innerHTML=coItems.map(function(i){
      return '<span class="dot '+(i[1]?'in':'out')+'"></span><span>'+i[0]+'</span><span class="lbl">'+(fix?(i[1]?'✓ In stock':'✕ Sold out'):'')+'</span>';
    }).join('');
    $('co-mock').classList.toggle('grey',grey);
    $('co-out').textContent=fix?'✓ The icon and word carry the meaning. Colour is now a bonus.':grey?'✕ Four identical grey dots. The red and green were chosen with equal brightness, as many palettes are. This fails 1.4.1.':'Red means sold out, green means in stock. Now view it without colour.';
  }
  onCheck('co-grey',coPaint);onCheck('co-fix',coPaint);coPaint();

  /* ---------- 1.4.2 audio control ---------- */
  var auMode='broken',auTimer=null,auSecs=0;
  function auStop(msg){clearInterval(auTimer);auTimer=null;$('au-mock').classList.remove('playing');if(msg)$('au-out').textContent=msg;}
  seg('au-seg',function(v){auMode=v;$('au-pause').hidden=v!=='fixed';auStop('Build changed. Press Load the page.');});
  $('au-load').addEventListener('click',function(){
    auStop();auSecs=0;$('au-mock').classList.add('playing');
    $('au-out').textContent='Music started by itself. The screen reader is talking underneath it.';
    auTimer=setInterval(function(){
      auSecs++;
      if(auSecs===3)$('au-out').textContent=auMode==='broken'?'3 seconds and still playing, with nothing on the page to stop it. The screen reader is drowned out. This fails 1.4.2.':'3 seconds in. The first control on the page is Pause music. Press it.';
      if(auSecs>=3&&auMode==='broken'){clearInterval(auTimer);auTimer=null;}
    },1000);
  });
  $('au-pause').addEventListener('click',function(){auStop('Paused. The screen reader can be heard again. This passes.');});

  /* ---------- 1.4.3 contrast ---------- */
  var cFg=$('c-fg'),cBg=$('c-bg'),cFade=$('c-fade'),cSample=$('c-sample');
  function cPaint(){
    var fg=hexToRgb(cFg.value),bg=hexToRgb(cBg.value),eff=mix(fg,bg,cFade.value/100);
    cSample.style.color=css(eff);cSample.style.background=css(bg);
    var r=ratio(eff,bg);
    $('c-ratio').textContent=(Math.floor(r*10)/10).toFixed(1)+':1';
    $('c-mark').style.left=(Math.log(r)/Math.log(21)*100).toFixed(1)+'%';
    chip($('c-v1'),r>=4.5);chip($('c-v2'),r>=3);chip($('c-v3'),r>=7);
  }
  [cFg,cBg,cFade].forEach(function(el){el.addEventListener('input',cPaint);});
  document.querySelectorAll('[data-fg]').forEach(function(b){b.addEventListener('click',function(){cFg.value=b.dataset.fg;cBg.value=b.dataset.bg;cFade.value=0;cPaint();});});
  onCheck('c-glare',function(on){cSample.classList.toggle('glare',on);});
  cPaint();

  /* ---------- 1.4.4 resize text ---------- */
  var rzBox=$('rz-box');
  function rzPaint(){
    var z=+$('rz-size').value;$('rz-v').textContent=z;
    rzBox.style.fontSize=(15*z/100)+'px';
    var bad=clipped(rzBox)||clipped(rzBox.querySelector('.tag'));
    chip($('rz-chip'),!bad,'Nothing lost','Text cut off');
    $('rz-out').textContent=bad?'The box and button are sized in pixels, so the bigger text no longer fits.':'Everything is still readable at this size.';
  }
  seg('rz-seg',function(v){rzBox.classList.toggle('broken',v==='broken');rzPaint();});
  $('rz-size').addEventListener('input',rzPaint);rzPaint();

  /* ---------- 1.4.5 images of text ---------- */
  var itC=$('it-canvas'),itX=itC.getContext('2d');
  itX.fillStyle='#FFFFFF';itX.fillRect(0,0,250,34);
  itX.fillStyle='#14172B';itX.font='bold 15px Verdana, sans-serif';itX.textBaseline='middle';
  itX.fillText('Summer sale: 20% off everything',2,17);
  function itPaint(){
    var z=+$('it-zoom').value/100;$('it-v').textContent=Math.round(z*100);
    itC.style.width=(250*z)+'px';itC.style.height=(34*z)+'px';
    $('it-real').style.fontSize=(15*z)+'px';
  }
  $('it-zoom').addEventListener('input',itPaint);
  onCheck('it-hc',function(on){$('it-real').classList.toggle('hc',on);});
  itPaint();

  /* ---------- 1.4.10 reflow ---------- */
  var rfFrame=$('rf-frame'),rfPage=$('rf-page');
  function rfPaint(){
    var z=+$('rf-zoom').value;$('rf-v').textContent=z;
    var base=Math.min(11,rfFrame.clientWidth/38);
    rfPage.style.fontSize=(base*z/100)+'px';
    var side=rfFrame.scrollWidth>rfFrame.clientWidth+2;
    chip($('rf-chip'),!side,'One direction','Scrolls both ways');
    $('rf-out').textContent=side?'Every line runs off the edge. Reading means scrolling right and back, line after line.':z>100?'The columns stacked. You only scroll down.':'At 100% both layouts look the same. Zoom in.';
  }
  seg('rf-seg',function(v){rfPage.className='rf-page '+v;rfPaint();});
  $('rf-zoom').addEventListener('input',rfPaint);window.addEventListener('resize',rfPaint);rfPaint();

  /* ---------- 1.4.11 non-text contrast ---------- */
  function ntPaint(){
    var t=+$('nt-str').value,v=Math.round(238-t*1.9),c=[v,v,v],r=ratio(c,[255,255,255]);
    var m=$('nt-mock');m.querySelector('.inp').style.borderColor=css(c);m.querySelector('.box').style.borderColor=css(c);m.querySelector('svg').style.stroke=css(c);
    $('nt-ratio').textContent=(Math.floor(r*10)/10).toFixed(1)+':1';
    chip($('nt-chip'),r>=3,'Passes 3:1','Below 3:1');
  }
  $('nt-str').addEventListener('input',ntPaint);ntPaint();

  /* ---------- 1.4.12 text spacing ---------- */
  var spBox=$('sp-box');
  function spPaint(){
    var on=$('sp-on').checked;spBox.classList.toggle('spaced',on);
    var bad=clipped(spBox);
    chip($('sp-chip'),!bad,'Nothing lost','Text cut off');
    $('sp-out').textContent=bad?'The card could not grow, so the last lines, including how to reschedule, are gone.':on?'The card grew to fit the looser text.':'Default spacing. Now apply the reader’s settings.';
  }
  seg('sp-seg',function(v){spBox.classList.toggle('broken',v==='broken');spPaint();});
  onCheck('sp-on',spPaint);spPaint();

  /* ---------- 1.4.13 content on hover or focus ---------- */
  var ttMode='broken',ttTimer=null,ttTip=$('tt-tip'),ttBtn=$('tt-btn');
  function ttChips(){var ok=ttMode==='fixed';chip($('tt-c1'),ok,'Yes','No');chip($('tt-c2'),ok,'Yes','No');chip($('tt-c3'),ok,'Yes','No');$('tt-close').hidden=!ok;}
  function ttHide(){clearTimeout(ttTimer);ttTip.hidden=true;ttBtn.setAttribute('aria-expanded','false');}
  function ttShow(){
    ttTip.hidden=false;ttBtn.setAttribute('aria-expanded','true');
    if(ttMode==='broken'){ttTimer=setTimeout(function(){ttHide();$('tt-out').textContent='Gone after a second and a half. Did you catch all three rules? And while it was up, it hid the fields underneath.';},1500);}
    else $('tt-out').textContent='It stays until you close it with the Close button or the Esc key.';
  }
  ttBtn.addEventListener('click',function(){if(ttTip.hidden)ttShow();else if(ttMode==='fixed')ttHide();});
  $('tt-close').addEventListener('click',function(){ttHide();ttBtn.focus();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!ttTip.hidden&&ttMode==='fixed'){ttHide();ttBtn.focus();}});
  seg('tt-seg',function(v){ttMode=v;ttHide();ttChips();$('tt-out').textContent=v==='broken'?'Press Rules. The flaky tooltip covers the fields below and vanishes before you can finish reading.':'Press Rules. This one waits for you.';});
  ttChips();
})();
