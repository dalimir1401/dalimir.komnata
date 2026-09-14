import * as THREE from './vendor/three.module.min.js';
export { THREE };

// Metres. Revised entry is 30 cm farther from the window, with a recessed door.
export const ROOM = { width:3, depth:4.3, height:2.4, windowZ:-2, entryZ:2.3, doorRecess:.22 };
export const obstacles = [
  {x:-1.15,z:.06,w:.72,d:1.8,name:'desk'},
  {x:-1.14,z:-1.14,w:.68,d:.56,name:'drawers'},
  {x:.98,z:.51,w:.97,d:2.12,name:'bed'},
  {x:-.50,z:.19,w:.48,d:.48,name:'chair'},
  {x:-1.0,z:1.42,w:.52,d:.46,name:'second-chair'},
  {x:-.26,z:-1.66,w:1.4,d:.36,name:'bike'},
  {x:1.14,z:-1.42,w:.55,d:.87,name:'clothes'}
];
export const stations = [
  {id:'lamp',point:{x:-.53,z:.88},object:{x:-1.1,y:1.32,z:.68},facing:-Math.PI/2},
  {id:'computer',point:{x:.02,z:.18},object:{x:-1.07,y:1.38,z:-.02},facing:-Math.PI/2},
  {id:'bicycle',point:{x:.08,z:-1.24},object:{x:-.2,y:1.05,z:-1.65},facing:Math.PI},
  {id:'bedlight',point:{x:.77,z:1.95},object:{x:.78,y:1.17,z:2.28},facing:0}
];

function makeTexture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function woodTexture(){return makeTexture((c,w,h)=>{c.fillStyle='#b97d45';c.fillRect(0,0,w,h);for(let i=0;i<180;i++){const v=(Math.sin(i*73.137)*10000)%1;c.strokeStyle=i%3?'rgba(83,41,21,.12)':'rgba(255,228,168,.15)';c.lineWidth=.5+(i%5)*.2;c.beginPath();const x=i*w/180;c.moveTo(x,0);c.bezierCurveTo(x+v*6,h*.25,x-v*9,h*.6,x,h);c.stroke();}},256,512);}
function shirtTexture(){return makeTexture((c,w,h)=>{c.fillStyle='#efeada';c.fillRect(0,0,w,h);c.font='15px Georgia';c.fillStyle='#787571';for(let y=16;y<h;y+=39)for(let x=15;x<w;x+=38){c.save();c.translate(x+(y%2)*9,y);c.rotate(Math.sin(x+y)*.3);c.fillText('H',0,0);c.restore();}c.strokeStyle='#466a65';c.lineWidth=3;c.strokeRect(158,61,31,40);c.font='bold 25px Georgia';c.fillStyle='#466a65';c.fillText('D',164,89);});}

const geometryCache=new Map();
function roundedGeo(w,h,d,r=.025){const k=[w,h,d,r].join();if(geometryCache.has(k))return geometryCache.get(k);r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);if(r<=.002){const g=new THREE.BoxGeometry(w,h,d);geometryCache.set(k,g);return g;}const shape=new THREE.Shape();const x=-w/2+r,y=-h/2+r,ww=w-2*r,hh=h-2*r;shape.moveTo(x,y-r);shape.lineTo(x+ww,y-r);shape.quadraticCurveTo(x+ww+r,y-r,x+ww+r,y);shape.lineTo(x+ww+r,y+hh);shape.quadraticCurveTo(x+ww+r,y+hh+r,x+ww,y+hh+r);shape.lineTo(x,y+hh+r);shape.quadraticCurveTo(x-r,y+hh+r,x-r,y+hh);shape.lineTo(x-r,y);shape.quadraticCurveTo(x-r,y-r,x,y-r);const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.5,bevelThickness:r,curveSegments:3});geo.translate(0,0,-d/2+r);geometryCache.set(k,geo);return geo;}

export function createRoom(container){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const room=new THREE.Group();room.name='DalimirRoom_3x4.3x2.4m';room.userData.dimensions=ROOM;scene.add(room);
  const camera=new THREE.OrthographicCamera(-5,5,3,-3,.1,60);
  let angle=.67,targetAngle=.67;
  const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...opts});
  const oak=mat('#c7b698',{map:woodTexture(),roughness:.43});
  const darkOak=mat('#744b32',{map:oak.map,roughness:.6});
  const floorMats=['#bc8b5d','#b58155','#b78459','#c19362','#a9764e'].map(c=>mat(c,{map:oak.map,roughness:.66}));
  const wallMat=mat('#77717f'), trim=mat('#d4c9c1'), linen=mat('#eae4d8'), black=mat('#232631'), metal=mat('#34363d',{roughness:.35,metalness:.7});
  const violet=mat('#88719b'), cream=mat('#d5c8b4');
  function mesh(g,m,parent=room){const a=new THREE.Mesh(g,m);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
  function box(w,h,d,x,y,z,m=oak,parent=room,r=.015){const a=mesh(roundedGeo(w,h,d,r),m,parent);a.position.set(x,y,z);return a;}
  function sphere(w,h,d,x,y,z,m,parent=room){const a=mesh(new THREE.SphereGeometry(1,20,12),m,parent);a.scale.set(w,h,d);a.position.set(x,y,z);return a;}
  function cyl(r1,r2,h,x,y,z,m,parent=room,n=20){const a=mesh(new THREE.CylinderGeometry(r1,r2,h,n),m,parent);a.position.set(x,y,z);return a;}
  function rod(a,b,r,m,parent=room){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),delta=bb.clone().sub(aa);const obj=cyl(r,r,delta.length(),0,0,0,m,parent,10);obj.position.copy(aa.add(bb).multiplyScalar(.5));obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return obj;}
  function ring(radius,tube,x,y,z,m,parent=room){const a=mesh(new THREE.TorusGeometry(radius,tube,8,40),m,parent);a.position.set(x,y,z);return a;}
  function group(name,x=0,y=0,z=0,parent=room){const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}

  const ambient=new THREE.HemisphereLight('#d9dffc','#817061',2.5);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#ffe2bd',3.3);sun.position.set(-2.5,7,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun);
  const windowLight=new THREE.DirectionalLight('#bfdcfd',1.5);windowLight.position.set(0,2,-4);scene.add(windowLight);
  const rim=new THREE.DirectionalLight('#b5a4dd',1.3);rim.position.set(4,4,0);scene.add(rim);
  const base=box(3.18,.18,4.48,0,-.12,.15,mat('#252532'),room,.035);base.name='Room_base';
  box(3.02,.025,4.32,0,-.015,.15,darkOak,room);
  // Individual staggered parquet boards keep the direction and scale of the photos.
  for(let col=0;col<15;col++){for(let row=0;row<6;row++){const start=-2+row*.92-(col%2)*.46,end=Math.min(start+.92,2.3),s=Math.max(start,-2);if(end>s)box(.197,.023,end-s-.006,-1.4+col*.2,.001,(s+end)/2,floorMats[(row*3+col)%5],room,.001);}}
  const walls={left:group('Left_wall'),right:group('Right_wall'),front:group('Entry_wall'),back:group('Window_wall')};
  box(.12,2.4,4.42,-1.56,1.2,.15,wallMat,walls.left,.005);
  box(.12,2.4,4.42,1.56,1.2,.15,wallMat,walls.right,.005);
  for(const [x,w]of[[-1.19,.62],[1.19,.62]])box(w,2.4,.12,x,1.2,-2.06,wallMat,walls.back,.003);
  box(1.8,.69,.12,0,.345,-2.06,wallMat,walls.back,.003);box(1.8,.3,.12,0,2.25,-2.06,wallMat,walls.back,.003);
  box(1.31,2.4,.12,-.905,1.2,2.36,wallMat,walls.front,.003);box(.91,2.4,.12,1.105,1.2,2.36,wallMat,walls.front,.003);box(.9,.36,.12,.2,2.22,2.36,wallMat,walls.front,.003);
  const recess=group('Recessed_entry_22cm',.2,0,2.30,walls.front);
  box(.075,2.06,.25,-.465,1.03,.12,mat('#837984'),recess,.003);box(.075,2.06,.25,.465,1.03,.12,mat('#837984'),recess,.003);box(.98,.045,.25,0,2.05,.12,trim,recess,.003);
  box(.92,.04,.25,.2,.01,2.415,oak,room,.002);
  const door=group('Oak_door_with_six_glass_inserts',.2,0,2.515,walls.front);
  box(.83,2,.045,0,1,0,mat('#8c8274'),door,.006);
  for(let i=0;i<6;i++)box(.59,.047,.01,0,.36+i*.25,-.029,mat('#eee1b8',{emissive:'#ab9565',emissiveIntensity:.3}),door,.002);
  rod([-.38,.03,-.03],[-.38,2.05,-.03],.035,trim,door);rod([.38,.03,-.03],[.38,2.05,-.03],.035,trim,door);box(.88,.055,.09,0,2.05,0,trim,door);
  rod([-.30,.99,-.05],[-.30,.99,-.12],.017,metal,door);rod([-.3,.99,-.12],[-.17,.99,-.12],.013,metal,door);
  for(const [key,x,z,w,d]of[['left',-1.495,.15,.035,4.3],['right',1.495,.15,.035,4.3],['back',0,-1.995,3,.035],['front',0,2.295,3,.035]]){
    if(key!=='front')box(w,.07,d,x,.05,z,trim,room,.003);box(w+.015,.044,d+.015,x,2.36,z,linen,walls[key],.003);
  }
  box(1.21,.07,.035,-.895,.05,2.295,trim,room,.003);box(.81,.07,.035,1.105,.05,2.295,trim,room,.003);
  const ceiling=group('White_ceiling_2.4m');box(3,.05,4.3,0,2.435,.15,linen,ceiling);for(const x of[-.8,.8])for(const z of[-1.2,1.3])cyl(.08,.08,.02,x,2.402,z,mat('#fcf4d4'),ceiling);ceiling.visible=false;

  // A real window opening, layered curtains and a radiator.
  const skyMat=mat('#b4d0d5',{emissive:'#91b3c6',emissiveIntensity:.5,roughness:.2});
  box(1.75,1.35,.026,0,1.395,-2.075,skyMat,walls.back,.001);
  for(const x of[-.83,0,.83])box(.045,1.39,.07,x,1.385,-1.98,linen,walls.back,.003);
  for(const y of[.69,2.085])box(1.72,.05,.07,0,y,-1.98,linen,walls.back,.003);
  box(1.9,.065,.23,0,.665,-1.92,linen,walls.back);
  const outdoor=group('Soft_silhouettes_outside_window',0,0,0,walls.back);const leafMat=mat('#759f91',{emissive:'#628c7a',emissiveIntensity:.2});
  for(let i=0;i<8;i++){const x=-.72+i*.2;rod([x,.7,-2.047],[x+.03,1.65+(i%3)*.13,-2.047],.012,mat('#72958c'),outdoor);sphere(.16,.23,.025,x,1.42+(i%3)*.13,-2.04,leafMat,outdoor);}
  for(let i=0;i<11;i++)box(.075,.45,.11,-.5+i*.1,.34,-1.9,trim,walls.back,.012);
  rod([-1.33,2.24,-1.86],[1.33,2.24,-1.86],.019,metal,walls.back);
  const curtainMats=[mat('#aaa6a5',{roughness:1}),mat('#85838b',{roughness:1}),mat('#c8c0b4',{roughness:1})];
  for(const side of[-1,1]){const g=group('Pleated_grey_curtain',0,0,0,walls.back);for(let i=0;i<9;i++){const geo=new THREE.PlaneGeometry(.09,2.15,3,20);const p=geo.attributes.position;for(let k=0;k<p.count;k++){const yy=p.getY(k),xx=p.getX(k);p.setZ(k,Math.sin((xx/.09)*Math.PI*2)*.035+Math.sin(yy*3+i)*.012);}geo.computeVertexNormals();const material=curtainMats[i>6?2:i%2];material.side=THREE.DoubleSide;const a=mesh(geo,material,g);a.position.set(side*(.55+i*.083),1.15,-1.8);}}

  const desk=group('Clean_computer_desk',-1.12,0,.02);
  box(.7,.06,1.8,0,.77,0,oak,desk,.018);
  for(const zz of[-.76,.76])for(const xx of[-.27,.27])box(.042,.72,.045,xx,.37,zz,metal,desk,.005);
  box(.58,.026,.22,.04,.815,-.04,mat('#32343b'),desk,.015);
  const monitor=group('Monitor',-.13,.84,-.02,desk);monitor.rotation.y=Math.PI/2;
  box(.21,.025,.15,0,.003,0,black,monitor);box(.04,.18,.035,0,.1,-.015,metal,monitor);
  box(.63,.38,.033,0,.36,0,black,monitor,.013);
  const displayTexture=makeTexture((c,w,h)=>{c.fillStyle='#182333';c.fillRect(0,0,w,h);c.fillStyle='#adb3ce';c.font='11px sans-serif';c.fillText('EVENING / HOME',20,25);c.fillStyle='#87739e';c.fillRect(18,41,220,1);c.fillStyle='#e9c593';c.font='22px sans-serif';c.fillText('Твой вечер',20,108);c.fillStyle='#acabc2';c.font='11px sans-serif';c.fillText('Место для хороших идей',20,132);c.fillStyle='#8caab1';for(let i=0;i<5;i++)c.fillRect(20,180+i*10,155-i*18,3);});
  const screenMat=new THREE.MeshStandardMaterial({map:displayTexture,emissiveMap:displayTexture,emissive:'#ffffff',emissiveIntensity:.7,roughness:.4});
  box(.59,.338,.006,0,.36,.021,screenMat,monitor,.001);
  const keyboard=group('Keyboard',.20,.817,.03,desk);box(.19,.025,.50,0,0,0,black,keyboard,.009);
  for(let r=0;r<4;r++)for(let c=0;c<12;c++)box(.031,.007,.031,-.065+r*.041,.017,-.222+c*.04,mat('#737184'),keyboard,.002);
  sphere(.04,.017,.06,.22,.824,-.38,black,desk);
  // Intelite DL1-7W-WT: broad continuous white body, flat LED arm and touch strip.
  const lamp=group('Intelite_Desk_Lamp_7W_White_DL1',-.12,.806,.65,desk);
  const lampWhite=mat('#f2f0e7',{roughness:.4});
  box(.17,.024,.125,.035,.012,0,lampWhite,lamp,.018);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.035,.025,0),new THREE.Vector3(-.036,.17,0),new THREE.Vector3(-.018,.29,0),new THREE.Vector3(.055,.36,0),new THREE.Vector3(.16,.374,0),new THREE.Vector3(.33,.382,0)]);
  const positions=[],indices=[];
  for(let i=0;i<=40;i++){const t=i/40,p=curve.getPointAt(t),tan=curve.getTangentAt(t),thickness=t<.5?.020-.014*t:.010,width=.029*(1-.12*t);for(let j=0;j<=12;j++){const phi=j/12*Math.PI*2,off=Math.sin(phi)*thickness;positions.push(p.x-tan.y*off,p.y+tan.x*off,p.z+Math.cos(phi)*width);if(i<40&&j<12){const a=i*13+j,b=a+13;indices.push(a,b,a+1,b,b+1,a+1);}}}
  const lampGeo=new THREE.BufferGeometry();lampGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));lampGeo.setIndex(indices);lampGeo.computeVertexNormals();mesh(lampGeo,lampWhite,lamp);
  const lampEmitter=mat('#dedac9',{emissive:'#ffbf6b',emissiveIntensity:0});const led=box(.235,.006,.037,.211,.365,0,lampEmitter,lamp,.002);led.rotation.z=.048;
  box(.004,.09,.012,-.013,.142,0,mat('#929ba4',{metalness:.25,roughness:.4}),lamp,.002);
  for(let i=0;i<3;i++)sphere(.003,.003,.003,-.009,.12+i*.022,0,mat('#cedde1'),lamp);
  const deskLight=new THREE.PointLight('#ffd49d',0,2.4,2);deskLight.position.set(-.97,1.17,.68);room.add(deskLight);
  const mic=group('Microphone_arm',-.13,.82,-.66,desk);
  rod([0,0,0],[.11,.39,.01],.012,linen,mic);rod([.04,0,0],[.15,.39,.01],.012,linen,mic);rod([.11,.39,.01],[.40,.23,.11],.012,linen,mic);rod([.15,.39,.01],[.40,.19,.11],.012,linen,mic);sphere(.04,.08,.04,.40,.2,.11,black,mic);
  const tower=group('RGB_computer_front_toward_aisle',-1.01,0,-.58);tower.rotation.y=Math.PI/2;
  box(.24,.49,.43,0,.26,0,black,tower,.015);box(.245,.38,.33,.005,.27,0,mat('#272632',{metalness:.45,roughness:.3}),tower,.006);
  const fanMats=['#77dee2','#bfa1ef','#fbb685'].map(c=>mat(c,{emissive:c,emissiveIntensity:2}));const fans=[];
  for(let i=0;i<3;i++){const g=group('RGB_fan',0,.12+i*.145,.221,tower);ring(.056,.009,0,0,0,fanMats[i],g);cyl(.015,.015,.017,0,0,0,black,g).rotation.x=Math.PI/2;for(let j=0;j<5;j++){const b=box(.018,.074,.005,0,0,0,fanMats[i],g,.004);b.rotation.z=j*Math.PI*2/5;fans.push(b);}}
  const rgbGlow=new THREE.PointLight('#a887ec',.3,1.2,2);rgbGlow.position.set(-.8,.25,-.5);room.add(rgbGlow);

  const cabinet=group('Wooden_drawers',-1.14,0,-1.14);
  box(.65,.67,.54,0,.355,0,oak,cabinet,.018);
  for(let i=0;i<3;i++){box(.014,.197,.48,.334,.155+i*.211,0,oak,cabinet,.004);rod([.35,.17+i*.211,-.105],[.35,.17+i*.211,.105],.009,black,cabinet);}
  const shelf=group('Wall_shelves',-1.405,0,.05,walls.left);
  for(const y of[1.52,1.93,2.26])box(.22,.035,.925,0,y,.42,oak,shelf);
  for(const z of[-.025,.87])box(.22,.76,.035,0,1.88,z,oak,shelf);
  box(.22,.035,1.43,0,1.56,-.64,oak,shelf);
  const bookColors=['#94766b','#81919a','#bbaa92','#526776','#ac8c7f'];
  for(let i=0;i<7;i++){box(.15,.035,.24,-.015,1.97+i*.041,.59,mat(bookColors[i%5]),shelf,.001);}
  for(let i=0;i<6;i++){box(.16,.20+(i%3)*.02,.047,0,1.66,-1.20+i*.055,mat(bookColors[(i+1)%5]),shelf,.002);}
  const pictureTex=new THREE.TextureLoader().load('./assets/room-reference.jpg');pictureTex.colorSpace=THREE.SRGBColorSpace;pictureTex.repeat.set(.135,.255);pictureTex.offset.set(.59,.727);
  box(.025,.74,.48,.002,1.97,-.50,oak,shelf,.004);
  box(.003,.7,.44,.02,1.97,-.50,new THREE.MeshBasicMaterial({map:pictureTex}),shelf,.001);
  // Speaker and the small fabric gnome on the shelf.
  box(.15,.12,.26,0,1.645,-.47,black,shelf,.026);
  const gnome=group('Shelf_gnome',0,1.58,-.97,shelf);sphere(.066,.075,.06,0,.07,0,mat('#6d5465'),gnome);const hat=mesh(new THREE.ConeGeometry(.07,.21,20),mat('#8b8993'),gnome);hat.position.set(0,.21,0);hat.rotation.x=.18;sphere(.038,.071,.045,.035,.065,0,linen,gnome);sphere(.025,.022,.025,.054,.117,0,mat('#dbb697'),gnome);
  function chair(name,x,z,turn){const g=group(name,x,0,z);g.rotation.y=turn;for(const xx of[-.20,.20])for(const zz of[-.18,.18])box(.031,.46,.033,xx,.25,zz,oak,g,.008);box(.44,.045,.43,0,.48,0,black,g,.04);for(const xx of[-.22,.22]){box(.03,.43,.03,xx,.55,-.17,oak,g);box(.038,.035,.47,xx,.69,.015,oak,g,.009);}box(.45,.20,.045,0,.79,-.18,black,g,.038);return g;}
  const mainChair=chair('Computer_chair_facing_monitor',-.50,.19,-Math.PI/2);chair('Guest_chair_facing_room',-1.0,1.42,Math.PI*.75);

  const bed=group('Neatly_made_single_bed',.98,0,.51);
  box(.95,.18,2.12,0,.30,0,oak,bed,.015);
  for(const x of[-.40,.40])for(const z of[-.95,.95])box(.066,.35,.066,x,.19,z,darkOak,bed,.009);
  box(.91,.16,2.03,0,.466,0,linen,bed,.075);
  box(.93,.032,1.74,0,.561,.14,mat('#e0daca'),bed,.038);
  box(.99,.11,1.53,0,.59,.255,mat('#d9d1c4'),bed,.045);
  box(.98,.04,.24,0,.66,-.386,linen,bed,.015);
  for(const x of[-.438,.438])box(.013,.008,1.48,x,.652,.25,mat('#b7ac9e'),bed,.001);
  const pillow=sphere(.35,.091,.22,0,.63,-.735,linen,bed);pillow.rotation.y=.035;
  for(const z of[-1.07,1.07]){for(const x of[-.455,.455])box(.068,.77,.068,x,.405,z,oak,bed);box(.97,.17,.054,0,z<0?.75:.59,z,oak,bed,.012);}
  box(.995,.033,.38,0,.665,.72,mat('#91859c'),bed,.007);
  for(let i=0;i<5;i++)box(.997,.005,.014,0,.685,.565+i*.073,mat('#b6a9b7'),bed,.001);
  // There is no bedside cabinet or night lamp in the actual room.
  const lightSwitch=group('Evening_switch_by_door',.78,1.06,2.287,walls.front);
  box(.14,.085,.012,0,0,0,linen,lightSwitch,.006);box(.055,.061,.014,-.032,0,-.009,trim,lightSwitch,.003);box(.055,.061,.014,.032,0,-.009,trim,lightSwitch,.003);
  const nightLight=new THREE.PointLight('#ffd29c',0,6,2);nightLight.position.set(.6,2.21,.7);room.add(nightLight);

  const bike=group('Orbea_MX_40_blue_orange',-.26,.035,-1.67);bike.rotation.y=Math.PI;
  const teal=mat('#209fc1',{metalness:.28,roughness:.35}),orange=mat('#f57632'),rubber=mat('#171e25'),silver=mat('#b1b8bd',{metalness:.8,roughness:.25});
  for(const x of[-.54,.54]){
    ring(.325,.035,x,.355,0,rubber,bike);ring(.282,.009,x,.355,0,metal,bike);ring(.078,.006,x,.355,.048,silver,bike);
    for(let i=0;i<16;i++){const a=i*Math.PI/8;rod([x,.355,.004],[x+Math.cos(a)*.278,.355+Math.sin(a)*.278,.004],.0025,silver,bike);}
    sphere(.025,.025,.037,x,.355,0,metal,bike);
  }
  const treads=new THREE.InstancedMesh(new THREE.BoxGeometry(.02,.013,.054),rubber,96);bike.add(treads);const treadDummy=new THREE.Object3D();for(let i=0;i<96;i++){const a=(i%48)/48*Math.PI*2,x=i<48?-.54:.54;treadDummy.position.set(x+Math.cos(a)*.36,.355+Math.sin(a)*.36,0);treadDummy.rotation.z=a-Math.PI/2;treadDummy.updateMatrix();treads.setMatrixAt(i,treadDummy.matrix);}treads.castShadow=true;
  const p={rear:[-.54,.355,0],pedal:[-.07,.30,0],seat:[-.22,.655,0],steer:[.33,.81,0],front:[.54,.355,0]};
  for(const [a,b]of[['rear','seat'],['rear','pedal'],['pedal','seat'],['seat','steer'],['pedal','steer']])rod(p[a],p[b],a==='pedal'&&b==='steer'?.033:.022,teal,bike);
  for(const z of[-.047,.047]){rod([.34,.77,z],[.41,.565,z],.015,silver,bike);rod([.41,.565,z],[.54,.355,z],.023,black,bike);rod([.45,.49,z+.018],[.51,.39,z+.018],.009,orange,bike);}
  rod([.33,.81,-.07],[.33,.81,.07],.025,black,bike);
  rod([-.31,.925,0],p.seat,.018,black,bike);box(.23,.035,.105,-.33,.937,0,black,bike,.018);
  rod(p.steer,[.30,.93,0],.020,black,bike);rod([.30,.93,0],[.35,.955,0],.019,black,bike);rod([.35,.955,-.21],[.35,.955,.21],.015,black,bike);
  for(const side of[-1,1]){rod([.35,.955,side*.14],[.35,.955,side*.23],.019,rubber,bike);rod([.34,.94,side*.12],[.40,.92,side*.17],.005,black,bike);rod([-.19,.66,side*.022],[.20,.77,side*.022],.007,orange,bike);}
  rod([-.08,.30,-.095],[.02,.23,-.095],.014,metal,bike);box(.09,.028,.13,.02,.23,-.12,black,bike,.005);ring(.078,.008,-.07,.30,.027,metal,bike);ring(.058,.006,-.54,.355,.045,metal,bike);
  rod([-.07,.374,.036],[-.54,.405,.04],.0035,silver,bike);rod([-.07,.226,.036],[-.54,.305,.04],.0035,silver,bike);
  const orbeaTexture=makeTexture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#f76b26';c.font='italic 800 44px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ORBEA',w/2,h/2);},256,64);
  for(const side of[-1,1]){const decal=mesh(new THREE.PlaneGeometry(.43,.066),new THREE.MeshBasicMaterial({map:orbeaTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}),bike);decal.position.set(.13,.555,side*.033);decal.rotation.z=.906;decal.castShadow=false;}
  const bikeLightMat=mat('#e7d6b5',{emissive:'#fff2c8',emissiveIntensity:0});sphere(.024,.024,.027,.37,.87,.013,bikeLightMat,bike);
  const rack=group('White_chrome_double_clothes_rack',1.14,0,-1.42);
  const chrome=mat('#b7bcc0',{metalness:.9,roughness:.21}),plastic=mat('#e6e1cf');
  for(const z of[-.38,.38]){
    rod([-.19,.08,z],[.19,.08,z],.021,plastic,rack);
    for(const x of[-.19,.19]){sphere(.034,.044,.044,x,.05,z,plastic,rack);rod([x,.10,z],[x,.55,z],.021,plastic,rack);rod([x,.55,z],[x,x<0?1.50:1.73,z],.015,chrome,rack);cyl(.025,.025,.06,x,.58,z,plastic,rack);cyl(.026,.026,.055,x,x<0?1.5:1.73,z,plastic,rack);}
    rod([-.19,.45,z],[.19,.45,z],.014,plastic,rack);rod([-.19,.15,z],[.19,.15,z],.014,plastic,rack);
  }
  for(const [x,y]of[[-.19,1.5],[.19,1.73]])rod([x,y,-.42],[x,y,.42],.020,plastic,rack);
  for(const y of[.15,.46]){for(const x of[-.19,.19])rod([x,y,-.38],[x,y,.38],.010,plastic,rack);for(let i=0;i<9;i++)rod([-.18,y,-.35+i*.087],[.18,y,-.35+i*.087],.003,chrome,rack);}
  const clothMats=[mat('#485566'),mat('#b1afa2'),mat('#8b7467')];
  for(let i=0;i<3;i++){const g=group('Neatly_draped_clothing',-.20,1.51,-.27+i*.255,rack);box(.055,.51,.205,0,-.25,0,clothMats[i],g,.018);box(.16,.045,.205,.055,0,0,clothMats[i],g,.012);if(i===1){box(.07,.18,.075,-.008,-.38,.055,clothMats[i],g,.01);box(.07,.18,.075,-.008,-.38,-.055,clothMats[i],g,.01);}}
  for(let i=0;i<3;i++)box(.29,.052,.29,0,.50+i*.052,-.13,clothMats[i%2],rack,.02);
  for(const z of[.10,.24])sphere(.13,.055,.055,0,.215,z,black,rack);
  box(.24,.09,.36,.14,1.75,0,black,rack,.035);
  // Wall-mounted pull-up bar is left of the door when viewed from the window.
  const pullup=group('Pull_up_bar_left_of_door',1.13,2.0,2.24,walls.front);
  for(const x of[-.28,.28]){box(.055,.24,.025,x,-.025,.04,metal,pullup,.005);rod([x,-.10,.02],[x,.10,-.32],.013,linen,pullup);rod([x,.11,.015],[x,.12,-.32],.017,linen,pullup);}
  rod([-.35,.12,-.32],[.35,.12,-.32],.021,linen,pullup);rod([-.47,.03,-.40],[-.35,.12,-.32],.022,black,pullup);rod([.35,.12,-.32],[.47,.03,-.40],.022,black,pullup);
  for(let i=0;i<3;i++){const x=-.23+i*.19;box(.145,.67,.085,x,-.32,-.30,[mat('#8c9daa'),linen,black][i],pullup,.028);}
  const guitar=group('Acoustic_guitar',1.05,.065,2.08);guitar.rotation.z=-.11;
  sphere(.17,.20,.052,0,.23,0,oak,guitar);sphere(.125,.15,.05,0,.41,0,oak,guitar);cyl(.054,.054,.012,0,.365,.053,black,guitar).rotation.x=Math.PI/2;box(.066,.47,.033,0,.66,.014,darkOak,guitar,.004);box(.085,.12,.036,0,.94,.014,oak,guitar,.009);
  for(let i=0;i<6;i++)rod([-.018+i*.007,.14,.063],[-.018+i*.007,.98,.04],.0011,trim,guitar);
  box(.085,.018,.019,0,.2,.06,black,guitar);

  const hero=group('Dalimir_avatar',.05,0,1.25);hero.rotation.y=.2;
  const rig=group('Animated_body',0,0,0,hero);
  const skin=mat('#dbaf8c'),hair=mat('#95703f'),hairLight=mat('#b0874b'),pants=mat('#45464d'),sock=mat('#bfb6a3');
  const sweater=mat('#ffffff',{map:shirtTexture(),roughness:1});
  const torso=box(.36,.48,.23,0,.98,0,sweater,rig,.062);
  box(.365,.065,.234,0,.741,0,linen,rig,.025);
  cyl(.068,.075,.08,0,1.26,0,skin,rig);
  const head=group('Head',0,1.415,0,rig);
  sphere(.163,.199,.147,0,0,0,skin,head);
  // The fringe, side volume, ears and clothing follow the fourth photo.
  sphere(.17,.122,.151,0,.114,-.02,hair,head);
  for(let i=0;i<10;i++){const x=-.145+i*.032;const a=sphere(.034,.085,.032,x,.098+Math.sin(i*.7)*.009,.115,hairLight,head);a.rotation.z=-.22+(i/10)*.44;}
  for(const s of[-1,1]){sphere(.035,.057,.04,s*.154,-.01,0,skin,head);sphere(.016,.064,.071,s*.152,.075,-.01,hair,head);sphere(.029,.014,.009,s*.061,.005,.137,linen,head);sphere(.010,.013,.008,s*.06,.004,.146,mat('#5c635f'),head);sphere(.004,.007,.004,s*.06,.004,.153,black,head);const brow=box(.05,.012,.009,s*.06,.042,.134,hair,head,.004);brow.rotation.z=-s*.06;}
  sphere(.021,.03,.029,0,-.035,.143,skin,head);sphere(.036,.009,.009,0,-.084,.128,mat('#af7a69'),head);
  const arms=[],legs=[];
  for(const s of[-1,1]){
    const arm=group(s<0?'Left_arm':'Right_arm',s*.238,1.13,0,rig);arm.rotation.z=s*.07;box(.145,.38,.155,0,-.165,0,sweater,arm,.045);box(.14,.048,.145,0,-.368,0,linen,arm,.018);sphere(.057,.081,.053,0,-.434,.012,skin,arm);arms.push(arm);
    const leg=group(s<0?'Left_leg':'Right_leg',s*.098,.722,0,rig);box(.18,.60,.195,0,-.28,0,pants,leg,.043);sphere(.091,.051,.15,0,-.636,.055,sock,leg);legs.push(leg);
  }
  const shadowTexture=makeTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(19,15,29,.4)');g.addColorStop(1,'rgba(19,15,29,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},64,64);
  const shadow=mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),hero);shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;shadow.castShadow=false;

  const markers=stations.map((s,i)=>{const g=group('Task_'+s.id,s.point.x,.033,s.point.z);const m=new THREE.MeshBasicMaterial({color:'#f3ca90',transparent:true,opacity:.75,depthWrite:false});const r=ring(.16,.008,0,0,0,m,g);r.rotation.x=-Math.PI/2;r.castShadow=false;const disc=mesh(new THREE.CircleGeometry(.145,32),new THREE.MeshBasicMaterial({color:'#f3ca90',transparent:true,opacity:.09,depthWrite:false}),g);disc.rotation.x=-Math.PI/2;disc.castShadow=false;g.visible=i===0;return g;});
  const moveTarget=ring(.085,.004,0,.045,0,new THREE.MeshBasicMaterial({color:'#e9ddff',transparent:true,opacity:.6}));moveTarget.rotation.x=-Math.PI/2;moveTarget.visible=false;moveTarget.castShadow=false;
  const particleGroup=group('Celebration');const particles=[];
  function celebrate(position){for(let i=0;i<22;i++){const p=mesh(new THREE.OctahedronGeometry(.016),new THREE.MeshBasicMaterial({color:i%3?'#f4ca92':'#c4adef',transparent:true}),particleGroup);p.position.set(position.x,.85,position.z);const a=i*2.4;p.userData={v:new THREE.Vector3(Math.cos(a)*.27,.4+(i%5)*.12,Math.sin(a)*.27),life:1};p.castShadow=false;particles.push(p);}}
  const viewport={w:1,h:1};
  function resize(){const {width,height}=container.getBoundingClientRect();viewport.w=width;viewport.h=height;renderer.setSize(width,height,false);const a=width/height;const vertical=6.12;camera.left=-vertical*a/2;camera.right=vertical*a/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(container);resize();
  function updateCamera(dt){angle=THREE.MathUtils.damp(angle,targetAngle,6,dt);camera.position.set(Math.sin(angle)*7,6.4,Math.cos(angle)*7);const target=new THREE.Vector3(0,.82,0);camera.lookAt(target);const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);const offset=right.multiplyScalar(-.82);camera.position.add(offset);target.add(offset);camera.lookAt(target);camera.updateMatrixWorld();walls.front.visible=Math.cos(angle)<.12;walls.back.visible=Math.cos(angle)>-.12;walls.right.visible=Math.sin(angle)<.12;walls.left.visible=Math.sin(angle)>-.12;}
  updateCamera(1);
  let time=0,nightBlend=0;
  function render(dt,speed=0,pose='idle'){
    time+=dt;updateCamera(dt);const swing=Math.sin(time*10)*Math.min(speed,1)*.5;
    rig.position.y=speed>.05?Math.abs(Math.sin(time*10))*.02:Math.sin(time*1.8)*.006;
    for(let i=0;i<2;i++){arms[i].rotation.x=(i?1:-1)*swing;legs[i].rotation.x=(i?-1:1)*swing;}
    if(pose==='sit'){rig.position.y=-.28;legs.forEach(l=>l.rotation.x=-Math.PI/2.3);arms.forEach((a,i)=>a.rotation.x=-.8+Math.sin(time*8+i)*.06);}
    if(pose==='pump'){rig.rotation.x=.15;arms.forEach(a=>a.rotation.x=-.6+Math.sin(time*8)*.2);rig.position.y=-.025+Math.sin(time*8)*.017;}else rig.rotation.x=0;
    for(const g of markers){g.scale.setScalar(1+Math.sin(time*3)*.065);}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt*.7;p.userData.v.y-=dt*.7;p.position.addScaledVector(p.userData.v,dt);p.material.opacity=Math.max(0,p.userData.life);p.rotation.y+=dt;if(p.userData.life<=0){particleGroup.remove(p);p.geometry.dispose();p.material.dispose();particles.splice(i,1);}}
    fans.forEach((f,i)=>f.rotation.z+=dt*(2+i%5));
    nightBlend=THREE.MathUtils.damp(nightBlend,nightLight.intensity>0?1:0,1,dt);ambient.intensity=2.5-nightBlend*.35;sun.intensity=3.3-nightBlend*1.3;windowLight.intensity=1.5-nightBlend*.8;renderer.render(scene,camera);
  }
  const raycaster=new THREE.Raycaster();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  function floorPoint(clientX,clientY){const rect=container.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(plane,p)?p:null;}
  function project(p){const v=new THREE.Vector3(p.x,p.y,p.z).project(camera);return {x:(v.x+1)/2*viewport.w,y:(1-v.y)/2*viewport.h};}
  function setCompleted(index){deskLight.intensity=index>=1?1.7:0;lampEmitter.emissiveIntensity=index>=1?3:0;screenMat.emissiveIntensity=index>=2?1.6:.7;bikeLightMat.emissiveIntensity=index>=3?2:0;nightLight.intensity=index>=4?3.4:0;markers.forEach((g,i)=>g.visible=i===index);if(index===0)nightBlend=0;}
  return {scene,room,hero,rig,mainChair,renderer,camera,stations,markers,moveTarget,viewport,render,project,floorPoint,celebrate,setCompleted,
    rotate(){targetAngle+=Math.PI/2;},
    cameraBasis(){return {right:new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle)),forward:new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle))};},
    focusScreen(progress){const c=displayTexture.image.getContext('2d');c.fillStyle='#172c35';c.fillRect(0,0,256,256);c.fillStyle='#adbabf';c.font='12px sans-serif';c.fillText('ВРЕМЯ ДЛЯ СЕБЯ',22,32);c.fillStyle='#e6ccab';c.font='27px sans-serif';c.fillText('ФОКУС',22,100);c.font='13px sans-serif';c.fillStyle='#adc8bd';c.fillText(progress>=1?'Отличная работа':'Одна мысль за раз',22,136);c.fillStyle='#2d4b52';c.fillRect(22,175,210,7);c.fillStyle='#c5b992';c.fillRect(22,175,210*progress,7);displayTexture.needsUpdate=true;},
    resetScreen(){this.focusScreen(0);},
    get diagnostics(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,dimensions:ROOM};}
  };
}
