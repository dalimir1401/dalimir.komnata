import {createRoom, stations, ROOM} from './room.js';
import {walkable, findPath} from './navigation.js';
const $=id=>document.getElementById(id);
const tasks=[
 {title:'Немного света',description:'Включи лампу на столе',action:'Включить лампу',hint:'Подойди к лампе',marker:'К лампе',reward:'Лампа включена. Уже уютнее!',mood:'Первый тёплый свет'},
 {title:'Время для фокуса',description:'Сядь за компьютер на минутку',action:'Начать фокус',hint:'Подойди к компьютеру',marker:'К компьютеру',reward:'Фокус пойман. Мысли на месте.',mood:'Время для хороших идей'},
 {title:'Навстречу прогулке',description:'Подкачай колёса велосипеда',action:'Подготовить велосипед',hint:'Подойди к велосипеду',marker:'К велосипеду',reward:'Велосипед готов к прогулке!',mood:'Всё готово для прогулки'},
 {title:'Последний штрих',description:'Приглуши свет выключателем у двери',action:'Вечерний свет',hint:'Подойди к выключателю',marker:'К выключателю',reward:'Твой идеальный вечер начинается.',mood:'Идеальный вечер'}
];
const state={quest:0,score:0,paused:false,mode:'walk',elapsed:0,pumps:0,completed:false,path:[],near:false,sound:false,pose:'idle'};
let world,last=performance.now(),toastUntil=0,soundContext,miniResolve,moveResolve,lastPump=-1,footstepAt=0;
const keys=new Set(),stick={x:0,y:0,pointer:null};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const portrait=()=>matchMedia('(orientation: portrait)').matches;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=performance.now()+2400;}
function tone(freq=600,length=.13,volume=.08){if(!state.sound)return;try{soundContext??=new (window.AudioContext||window.webkitAudioContext)();if(soundContext.state==='suspended')soundContext.resume();const o=soundContext.createOscillator(),g=soundContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(volume,soundContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,soundContext.currentTime+length);o.connect(g);g.connect(soundContext.destination);o.start();o.stop(soundContext.currentTime+length);}catch{}}
function chime(){tone(523,.4,.06);setTimeout(()=>tone(659,.4,.05),100);setTimeout(()=>tone(784,.6,.045),200);}
function cancelPath(reason='cancelled'){state.path=[];world.moveTarget.visible=false;if(moveResolve){moveResolve({arrived:false,reason});moveResolve=null;}}
function startPath(point){if(state.paused||portrait()||state.mode!=='walk')return false;const path=findPath(world.hero.position,point);cancelPath('new destination');if(!path.length){toast('Здесь не пройти. Нажми на свободный пол.');return false;}state.path=path;world.moveTarget.position.set(path.at(-1).x,.043,path.at(-1).z);world.moveTarget.visible=true;return true;}
function goToStation(){return state.quest<4&&startPath(stations[state.quest].point);}
const marker=document.createElement('button');marker.id='station-marker';marker.className='world-marker';marker.addEventListener('click',goToStation);$('world-labels').appendChild(marker);
function updateQuest(){
 $('score').textContent=state.score;$('progress-text').textContent=`${state.quest} / 4`;
 document.querySelectorAll('.quest-progress span').forEach((el,i)=>{el.className=i<state.quest?'done':i===state.quest?'current':'';});
 document.querySelectorAll('[data-quest]').forEach((el,i)=>{el.className=i<state.quest?'done':i===state.quest?'active':'';el.querySelector('i').textContent=i<state.quest?'✓':i===state.quest?'●':'';});
 if(state.quest<4){const q=tasks[state.quest];$('quest-title').textContent=q.title;$('quest-description').textContent=q.description;$('quest-number').textContent=String(state.quest+1).padStart(2,'0');marker.innerHTML=`<span class="marker-icon" aria-hidden="true">${['☼','▱','◎','☾'][state.quest]}</span><span>${q.marker}</span>`;marker.setAttribute('aria-label',`Подойти: ${q.description}`);marker.hidden=false;}
 else{$('quest-title').textContent='Вечер начинается';$('quest-description').textContent='Все четыре дела сделаны';$('quest-number').textContent='✓';$('quest-tip').textContent='Можно просто побыть дома';marker.hidden=true;marker.style.display='none';}
 world.setCompleted(state.quest);updateAction();
}
function updateAction(){
 const btn=$('interact');
 if(state.quest>=4){btn.disabled=false;$('action-label').textContent='Итоги вечера';$('action-hint').textContent='Всё готово. Отдыхай.';return;}
 state.near=Math.hypot(world.hero.position.x-stations[state.quest].point.x,world.hero.position.z-stations[state.quest].point.z)<.34;
 if(state.mode==='focus'){btn.disabled=true;$('action-label').textContent=`Фокус · ${Math.round(Math.min(state.elapsed/4,1)*100)}%`;$('action-hint').textContent='Выдохни. Одна мысль за раз.';}
 else if(state.mode==='pump'){btn.disabled=false;$('action-label').textContent=`Подкачать · ${state.pumps} / 3`;$('action-hint').textContent='Три нажатия — и можно ехать';}
 else{btn.disabled=!state.near||state.paused;const q=tasks[state.quest];$('action-label').textContent=q.action;$('action-hint').textContent=state.near?'Нажми кнопку или E':q.hint;}
 marker.classList.toggle('near',state.near);marker.style.display=state.mode==='walk'?'flex':'none';$('quest-tip').textContent=state.near?'Отлично, теперь выполни действие':'Нажми на маркер или подойди к нему';
}
function completeTask(){
 const index=state.quest;if(index>=4)return;state.mode='walk';state.pose='idle';state.quest++;state.score+=100;state.elapsed=0;state.near=false;cancelPath();world.celebrate(world.hero.position);chime();toast(`+100 ✧  ${tasks[index].reward}`);$('mood').textContent=tasks[index].mood;$('player-status').textContent=['Свет включён. Уже теплее.','Мысли на месте.','Велосипед ждёт прогулки.','Все дела позади.'][index];updateQuest();
 if(miniResolve){miniResolve({completed:true,quest:state.quest,score:state.score});miniResolve=null;}
 if(state.quest===4){state.completed=true;setTimeout(()=>{if(state.quest===4&&!state.paused)showFinal();},1400);}
}
function interact(){
 if(state.paused||portrait())return false;
 if(state.quest>=4){showFinal();return true;}
 if(state.mode==='pump'){if(performance.now()-lastPump<250)return false;lastPump=performance.now();state.pumps++;tone(170+state.pumps*50,.16,.035);if(state.pumps>=3)completeTask();else updateAction();return true;}
 if(state.mode!=='walk'||!state.near)return false;
 cancelPath();world.hero.rotation.y=stations[state.quest].facing;
 if(state.quest===0||state.quest===3){completeTask();return true;}
 if(state.quest===1){state.mode='focus';state.pose='sit';state.elapsed=0;world.hero.position.set(-.50,0,.19);world.focusScreen(0);tone(440,.15,.03);}
 else{state.mode='pump';state.pose='pump';state.pumps=0;state.elapsed=0;lastPump=performance.now()-500;toast('Подкачай колёса: нажми действие 3 раза');}
 updateAction();return true;
}
function clearInput(){keys.clear();stick.x=stick.y=0;stick.pointer=null;$('stick').style.transform='';}
function setPaused(paused){state.paused=!!paused;clearInput();if(paused){if(!$('pause-dialog').open)$('pause-dialog').showModal();}else if($('pause-dialog').open)$('pause-dialog').close();updateAction();return readStatus();}
function showFinal(){$('final-score').textContent=state.score;state.paused=true;clearInput();if(!$('final-dialog').open)$('final-dialog').showModal();}
function reset(){
 for(const d of[$('pause-dialog'),$('final-dialog')])if(d.open)d.close();cancelPath('restart');if(miniResolve){miniResolve({completed:false,reason:'restart'});miniResolve=null;}
 Object.assign(state,{quest:0,score:0,paused:false,mode:'walk',elapsed:0,pumps:0,completed:false,path:[],near:false,pose:'idle'});clearInput();world.hero.position.set(.05,0,1.25);world.hero.rotation.y=.2;world.rig.position.y=0;world.resetScreen();$('mood').textContent='Тихий вечер';$('player-status').textContent='Дома. Можно выдохнуть.';$('toast').classList.remove('visible');updateQuest();
}
$('interact').addEventListener('click',interact);$('pause').addEventListener('click',()=>setPaused(true));$('resume').addEventListener('click',()=>setPaused(false));
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();setPaused(false);});$('final-dialog').addEventListener('cancel',e=>{e.preventDefault();$('final-dialog').close();state.paused=false;});
$('restart-paused').addEventListener('click',reset);$('restart-final').addEventListener('click',reset);$('explore').addEventListener('click',()=>{$('final-dialog').close();state.paused=false;});
$('rotate').addEventListener('click',()=>world.rotate());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await $('game').requestFullscreen();if(screen.orientation?.lock)try{await screen.orientation.lock('landscape');}catch{}}}catch{toast('Разверни окно браузера для большого экрана');}});
$('sound').addEventListener('click',()=>{state.sound=!state.sound;$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');$('sound').innerHTML=state.sound?'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/></svg>';if(state.sound)tone();});
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if($('final-dialog').open)return;if(!e.repeat)setPaused(!state.paused);return;}if(e.code==='KeyE'&&!e.repeat){interact();return;}if(!state.paused&&!portrait())keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden&&world&&!state.paused&&!portrait())setPaused(true);});window.addEventListener('resize',clearInput);
let tapStart;
$('scene').addEventListener('pointerdown',e=>{tapStart={x:e.clientX,y:e.clientY};});$('scene').addEventListener('pointerup',e=>{if(!tapStart||Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)>12)return;tapStart=null;const p=world.floorPoint(e.clientX,e.clientY);if(p&&Math.abs(p.x)<=1.5&&p.z>=ROOM.windowZ&&p.z<=ROOM.entryZ)startPath(p);});
const joy=$('joystick');
function moveStick(e){const r=joy.getBoundingClientRect();const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,max=r.width*.3,len=Math.hypot(x,y),k=len>max?max/len:1;stick.x=x*k/max;stick.y=y*k/max;$('stick').style.transform=`translate(${x*k}px,${y*k}px)`;}
joy.addEventListener('pointerdown',e=>{if(stick.pointer!==null||state.paused)return;stick.pointer=e.pointerId;joy.setPointerCapture(e.pointerId);cancelPath();moveStick(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===stick.pointer)moveStick(e);});
for(const type of['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(type,e=>{if(e.pointerId===stick.pointer){stick.pointer=null;stick.x=stick.y=0;$('stick').style.transform='';}});
function move(dx,dz,dt){
 const p=world.hero.position,step=1.05*dt,before={x:p.x,z:p.z};if(walkable(p.x+dx*step,p.z))p.x+=dx*step;if(walkable(p.x,p.z+dz*step))p.z+=dz*step;const dist=Math.hypot(p.x-before.x,p.z-before.z);
 if(dist>.0001){const target=Math.atan2(p.x-before.x,p.z-before.z),diff=Math.atan2(Math.sin(target-world.hero.rotation.y),Math.cos(target-world.hero.rotation.y));world.hero.rotation.y+=diff*Math.min(1,dt*16);}return dist/Math.max(step,.001);
}
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;let speed=0;
 if(!state.paused&&!portrait()){
  if(state.mode==='focus'){state.elapsed+=dt;world.focusScreen(Math.min(1,state.elapsed/4));if(state.elapsed>=4){world.hero.position.set(stations[1].point.x,0,stations[1].point.z);completeTask();}}
  else if(state.mode==='walk'){
   let xx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x,yy=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;const len=Math.hypot(xx,yy);
   if(len>.08){cancelPath('manual control');if(len>1){xx/=len;yy/=len;}const b=world.cameraBasis();speed=move(b.right.x*xx+b.forward.x*yy,b.right.z*xx+b.forward.z*yy,dt);}
   else if(state.path.length){const p=state.path[0],dx=p.x-world.hero.position.x,dz=p.z-world.hero.position.z,dist=Math.hypot(dx,dz);if(dist<.025)state.path.shift();else{const f=Math.min(1,dist/(1.05*dt));speed=move(dx/dist*f,dz/dist*f,dt);}if(!state.path.length){world.moveTarget.visible=false;if(moveResolve){moveResolve({arrived:true,position:{x:world.hero.position.x,z:world.hero.position.z}});moveResolve=null;}}}
   if(speed>.1&&now-footstepAt>450){footstepAt=now;tone(105,.04,.012);}
  }updateAction();
 }
 world.render(state.paused||portrait()?0:dt,reducedMotion?0:speed,state.pose);
 if(state.quest<4){const p=world.project(stations[state.quest].object);marker.style.left=`${p.x}px`;marker.style.top=`${p.y}px`;}
 if(now>toastUntil)$('toast').classList.remove('visible');requestAnimationFrame(frame);
}
function readStatus(){return {quest:state.quest,score:state.score,paused:state.paused,mode:state.mode,completed:state.completed,position:{x:+world.hero.position.x.toFixed(3),z:+world.hero.position.z.toFixed(3)},activeStation:stations[state.quest]?.id??null,near:state.near,moving:state.path.length>0,dimensions:ROOM,rendering:world.diagnostics};}
function webTools(){
 const context=document.modelContext;if(!context?.registerTool)return;const lifetime=new AbortController();const definitions=[
  {name:'get_evening_status',title:'Состояние вечера',description:'Read game progress, current station, avatar position and room dimensions.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>readStatus()},
  {name:'walk_to_active_station',title:'Подойти к заданию',description:'Walk around furniture to the active station; does not complete the task. Returns after arrival.',inputSchema:{type:'object',properties:{station:{type:'string',enum:stations.map(s=>s.id)}},required:['station'],additionalProperties:false},execute:input=>{if(!input||input.station!==stations[state.quest]?.id)throw new Error('Station must match the current task');if(state.paused||state.mode!=='walk'||portrait())throw new Error('Game must be running in landscape');if(state.near)return {arrived:true};if(!goToStation())throw new Error('Destination is unreachable');return new Promise(resolve=>{moveResolve=resolve;});}},
  {name:'interact_at_station',title:'Выполнить действие',description:'Perform the visible action at the current station when nearby. Computer focus takes four seconds; bicycle preparation requires start and three separate pumps.',inputSchema:{type:'object',properties:{station:{type:'string',enum:stations.map(s=>s.id)}},required:['station'],additionalProperties:false},execute:input=>{if(!input||input.station!==stations[state.quest]?.id)throw new Error('Station must match the current task');if(!interact())throw new Error('Move near the active station and unpause before interacting');if(state.mode==='focus')return new Promise(resolve=>{miniResolve=resolve;});return readStatus();}},
  {name:'set_evening_pause',title:'Пауза игры',description:'Pause or resume the same game using the visible pause dialog.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},execute:input=>{if(typeof input?.paused!=='boolean')throw new Error('paused must be a boolean');if($('final-dialog').open)throw new Error('Close the results dialog first');return setPaused(input.paused);}}
 ];
 for(const t of definitions){try{Promise.resolve(context.registerTool({...t,annotations:{readOnlyHint:false,untrustedContentHint:false,...t.annotations}},{signal:lifetime.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifetime.abort(),{once:true});
}
try{world=createRoom($('scene'));updateQuest();requestAnimationFrame(frame);$('loading').classList.add('hidden');$('loading').setAttribute('aria-hidden','true');webTools();}
catch(err){$('loading').innerHTML='<span>Не получилось запустить 3D.</span><span>Обнови страницу в браузере с поддержкой WebGL.</span><button class="action-button" id="reload-game">Попробовать ещё раз</button>';$('reload-game').onclick=()=>location.reload();console.error('3D initialization failed',err);}
