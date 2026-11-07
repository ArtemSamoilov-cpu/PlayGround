import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#100a21');
scene.fog = new THREE.FogExp2('#100a21', 0.018);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 180);
camera.position.set(0, 7.5, 13.5);
scene.add(new THREE.HemisphereLight('#d1bdff', '#22102e', 2.0));
const moonlight = new THREE.DirectionalLight('#f0d7ff', 2.8); moonlight.position.set(-5, 10, 7); scene.add(moonlight);
const violetLight = new THREE.PointLight('#bd54ff', 28, 24, 1.7); violetLight.position.set(3, 5, -2); scene.add(violetLight);
const cyanLight = new THREE.PointLight('#56dfff', 12, 18, 2); cyanLight.position.set(-5, 3, 0); scene.add(cyanLight);
const world = new THREE.Group(); scene.add(world);
const floorMat = new THREE.MeshStandardMaterial({ color: '#211936', roughness: .8, metalness: .16 });
const platformMat = new THREE.MeshStandardMaterial({ color: '#302346', roughness: .63, metalness: .25 });
const edgeMat = new THREE.MeshStandardMaterial({ color: '#a855ed', emissive: '#a438ed', emissiveIntensity: 2.2, roughness: .35 });
const darkMat = new THREE.MeshStandardMaterial({ color: '#0d0a1a', roughness: .9 });
const cyanMat = new THREE.MeshStandardMaterial({ color: '#61e8ff', emissive: '#28cfff', emissiveIntensity: 1.5, metalness: .35, roughness: .3 });
const goldMat = new THREE.MeshStandardMaterial({ color: '#ffcf62', emissive: '#d88724', emissiveIntensity: .8, metalness: .72, roughness: .24 });
const platform = new THREE.Mesh(new THREE.BoxGeometry(15, .55, 53), platformMat); platform.position.set(0, -.45, -19); world.add(platform);
const under = new THREE.Mesh(new THREE.BoxGeometry(14.8, .2, 52.8), darkMat); under.position.set(0, -.83, -19); world.add(under);
for (const x of [-7.47, 7.47]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(.09,.08,53),edgeMat); rail.position.set(x,-.1,-19); world.add(rail); }
const grid = new THREE.GridHelper(16, 20, '#74439a', '#49305e'); grid.position.set(0,-.157, -19); grid.scale.set(1,1,3.35); grid.material.transparent=true;grid.material.opacity=.23; world.add(grid);
// Distant floating monoliths frame a small, deliberately readable 2.5D world.
for(let i=0;i<34;i++){
 const side=i%2?1:-1, z=-i*2.35-2, x=side*(8+Math.random()*7), h=2+Math.random()*7;
 const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.8+Math.random()*1.5,0),new THREE.MeshStandardMaterial({color:i%3?'#1a112b':'#221333',roughness:.92,metalness:.1}));
 rock.scale.set(.8+Math.random(),h,.7+Math.random());rock.position.set(x,-1.2+h/2,z);rock.rotation.set(Math.random()*.4,Math.random()*2,Math.random()*.3);world.add(rock);
 if(i%4===0){const glow=new THREE.Mesh(new THREE.BoxGeometry(.055,h*.7,.055),edgeMat);glow.position.set(x-side*.65,-1.1+h*.55,z);world.add(glow)}
}
// Floating stepping stones make a few deliberate jumps useful without blocking the route.
const ledges=[];
[[3.6,.02,-13],[ -3.4,.15,-27],[3.5,.4,-40]].forEach(([x,y,z],i)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(2.4,.34,2.4),platformMat);mesh.position.set(x,y,z);world.add(mesh);const line=new THREE.Mesh(new THREE.BoxGeometry(2.3,.04,2.3),edgeMat);line.position.set(x,y+.2,z);world.add(line);ledges.push(mesh)});
// Soft, layered nebula discs, always beyond the playable platform.
for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:i%2?'#7733bd':'#21567b',transparent:true,opacity:.08,depthWrite:false}));m.scale.set(5+Math.random()*4,2+Math.random()*2,.45);m.position.set((Math.random()-.5)*18,4+Math.random()*5,-8-i*7);world.add(m)}
// Fine stars keep the sky alive with no external texture dependency.
const starsGeo=new THREE.BufferGeometry(), starPos=[];for(let i=0;i<900;i++)starPos.push((Math.random()-.5)*115,Math.random()*46-4,-Math.random()*105+12);starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:'#ded0ff',size:.105,transparent:true,opacity:.8,sizeAttenuation:true}));scene.add(stars);
const bigStars=[];for(let i=0;i<26;i++){const star=new THREE.Mesh(new THREE.SphereGeometry(.055+Math.random()*.08,8,7),new THREE.MeshBasicMaterial({color:i%3?'#c5a5ff':'#8deeff',transparent:true,opacity:.8}));star.position.set((Math.random()-.5)*58,2+Math.random()*23,-Math.random()*78-4);scene.add(star);bigStars.push(star)}
// A distant pulsing supernova provides the bright purple beacon.
const nova=new THREE.Group();nova.position.set(0,5,-47);scene.add(nova);
const novaCore=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,2),new THREE.MeshBasicMaterial({color:'#ecd0ff'}));nova.add(novaCore);
for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.7+i*.42,.026,new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,1,0)),1,.02,3).parameters?.radialSegments||4,120),new THREE.MeshBasicMaterial({color:i%2?'#d472ff':'#8c50ff',transparent:true,opacity:.55-i*.07}));ring.rotation.set(.6+i*.3,.4+i*.52,.2);nova.add(ring)}
const novaGlow=new THREE.PointLight('#a43cff',110,34,1.3);nova.add(novaGlow);
const halo=new THREE.Mesh(new THREE.SphereGeometry(2.7,20,16),new THREE.MeshBasicMaterial({color:'#aa4fff',transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false}));nova.add(halo);
// Generate a stylized three-dimensional neon cat from polished primitives.
const cat=new THREE.Group();scene.add(cat);
const bodyMat=new THREE.MeshStandardMaterial({color:'#9b45db',emissive:'#351050',emissiveIntensity:.65,metalness:.48,roughness:.31});
const bellyMat=new THREE.MeshStandardMaterial({color:'#e4b7ff',emissive:'#8443ad',emissiveIntensity:.35,metalness:.18,roughness:.4});
const darkPurple=new THREE.MeshStandardMaterial({color:'#44195f',roughness:.38,metalness:.3});
const eyeMat=new THREE.MeshBasicMaterial({color:'#adffff'});
const body=new THREE.Mesh(new THREE.SphereGeometry(.42,24,18),bodyMat);body.scale.set(.86,1.05,1.17);body.position.y=.69;cat.add(body);
const head=new THREE.Group();head.position.set(0,1.28,-.12);cat.add(head);
const headBall=new THREE.Mesh(new THREE.SphereGeometry(.48,28,22),bodyMat);headBall.scale.set(1.04,.9,.82);head.add(headBall);
function ear(x,rot){const g=new THREE.Group();g.position.set(x,.31,0);g.rotation.z=rot;const outer=new THREE.Mesh(new THREE.ConeGeometry(.22,.53,5),bodyMat);outer.position.y=.17;outer.rotation.z=x<0?-.12:.12;g.add(outer);const inner=new THREE.Mesh(new THREE.ConeGeometry(.115,.32,5),bellyMat);inner.position.set(0,.17,.082);inner.rotation.z=outer.rotation.z;g.add(inner);head.add(g)}ear(-.31,-.23);ear(.31,.23);
const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.21,16,12),bellyMat);muzzle.scale.set(1,.62,.65);muzzle.position.set(0,-.12,.34);head.add(muzzle);
const nose=new THREE.Mesh(new THREE.OctahedronGeometry(.055),new THREE.MeshBasicMaterial({color:'#ff9adf'}));nose.scale.set(1,.7,.5);nose.position.set(0,-.1,.52);head.add(nose);
for(const x of [-.19,.19]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.072,12,10),eyeMat);eye.scale.set(.75,1, .45);eye.position.set(x,.04,.405);head.add(eye);const shine=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),new THREE.MeshBasicMaterial({color:'#fff'}));shine.position.set(x-.015,.065,.438);head.add(shine)}
for(const s of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.32,4,8),bodyMat);leg.position.set(s*.23,.26,.02);cat.add(leg);const paw=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),bellyMat);paw.scale.set(1,.55,1.2);paw.position.set(s*.23,.11,-.015);cat.add(paw)}
const tail=new THREE.Mesh(new THREE.TorusGeometry(.24,.09,10,20,Math.PI*1.35),bodyMat);tail.position.set(0,.8,.42);tail.rotation.set(1.2,0,-.55);cat.add(tail);
const collar=new THREE.Mesh(new THREE.TorusGeometry(.29,.045,8,24),new THREE.MeshStandardMaterial({color:'#52edff',emissive:'#0ba4d9',emissiveIntensity:2,metalness:.4,roughness:.25}));collar.position.set(0,1.02,-.08);collar.rotation.x=Math.PI/2;cat.add(collar);
const tag=new THREE.Mesh(new THREE.OctahedronGeometry(.09),goldMat);tag.position.set(0,.91,-.39);cat.add(tag);
const catGlow=new THREE.PointLight('#a34eff',4,4,2);catGlow.position.set(0,1,.1);cat.add(catGlow);
cat.position.set(0,0,3);
// Collectibles: bright, readable stars and rotating crystal prisms placed along the path.
const collectibles=[];
const coinGeo=new THREE.TorusGeometry(.23,.075,10,22);
function addCoin(x,z){const g=new THREE.Group();const c=new THREE.Mesh(coinGeo,goldMat);c.rotation.x=Math.PI/2;g.add(c);const star=new THREE.Mesh(new THREE.OctahedronGeometry(.085),new THREE.MeshBasicMaterial({color:'#fff0b0'}));g.add(star);g.position.set(x,.8,z);world.add(g);collectibles.push({mesh:g,type:'coin',baseY:.8,phase:Math.random()*6})}
function addCrystal(x,z){const g=new THREE.Group();const c=new THREE.Mesh(new THREE.OctahedronGeometry(.36,0),cyanMat);c.scale.set(.76,1.4,.76);g.add(c);const aura=new THREE.Mesh(new THREE.OctahedronGeometry(.51,0),new THREE.MeshBasicMaterial({color:'#38dfff',wireframe:true,transparent:true,opacity:.25}));aura.scale.y=1.3;g.add(aura);const glow=new THREE.PointLight('#35dfff',2.2,4,2);g.add(glow);g.position.set(x,1.03,z);world.add(g);collectibles.push({mesh:g,type:'crystal',baseY:1.03,phase:Math.random()*6})}
function addShard(x,z){const g=new THREE.Group();const s=new THREE.Mesh(new THREE.OctahedronGeometry(.48,1),new THREE.MeshStandardMaterial({color:'#f0b5ff',emissive:'#be42ff',emissiveIntensity:2.6,metalness:.55,roughness:.2}));s.scale.set(.68,1.5,.68);g.add(s);const aura=new THREE.Mesh(new THREE.TorusGeometry(.65,.018,6,40),new THREE.MeshBasicMaterial({color:'#d568ff',transparent:true,opacity:.76}));aura.rotation.x=Math.PI/2;g.add(aura);const l=new THREE.PointLight('#c43fff',9,8,1.5);g.add(l);g.position.set(x,1.35,z);world.add(g);collectibles.push({mesh:g,type:'shard',baseY:1.35,phase:Math.random()*6})}
const coinXs=[-4.5,-2.8,-1.3,1.1,2.7,4.4,4.2,2.2,0,-2.2,-4.1,-1.8];coinXs.forEach((x,i)=>addCoin(x,-4-i*3.35));
[[-3.4,-12],[3.6,-21],[-3.3,-31],[3.4,-42],[0,-48]].forEach(([x,z])=>addCrystal(x,z));
[[-2.2,-16.5],[2.5,-34],[0,-47.5]].forEach(([x,z])=>addShard(x,z));
const keys=new Set();let running=false,paused=false,won=false,score={coin:0,crystal:0,shard:0};let velocityY=0,onGround=true,dashTime=0,elapsed=0,last=0,toastTimer=0;
const total={coin:12,crystal:5,shard:3};
function updateHud(){document.querySelector('#coins').innerHTML=`${String(score.coin).padStart(2,'0')} <span>/ 12</span>`;document.querySelector('#crystals').innerHTML=`${String(score.crystal).padStart(2,'0')} <span>/ 5</span>`;document.querySelector('#shards').innerHTML=`${String(score.shard).padStart(2,'0')} <span>/ 3</span>`;const n=score.coin+score.crystal*2+score.shard*4;document.querySelector('#progress').style.width=`${Math.min(100,n/36*100)}%`;if(score.shard===3)document.querySelector('#objective').innerHTML='The <b>nova shards</b> are home. You did it, star-chaser.';else if(score.crystal===5)document.querySelector('#objective').innerHTML='Almost there — follow the <b>purple nova light</b>!';}
function notify(text){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1350)}
function jump(){if(!running||paused||!onGround)return;velocityY=7.15;onGround=false;catGlow.intensity=8;setTimeout(()=>catGlow.intensity=4,300)}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'||e.code==='ArrowUp')jump();if(e.code==='ShiftLeft'||e.code==='ShiftRight')dashTime=.19;if(e.code==='Escape'&&running)togglePause()},{passive:false});window.addEventListener('keyup',e=>keys.delete(e.code));
let joy={x:0,y:0};const stick=document.querySelector('#stick'),joyEl=document.querySelector('#joystick');let joyPointer=null;
joyEl.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joyEl.setPointerCapture(e.pointerId);moveJoy(e)});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e)});function moveJoy(e){const r=joyEl.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),lim=r.width*.35,len=Math.hypot(dx,dy),k=Math.min(1,lim/Math.max(1,len));joy.x=dx*k/lim;joy.y=dy*k/lim;stick.style.transform=`translate(calc(-50% + ${joy.x*lim}px),calc(-50% + ${joy.y*lim}px))`}function resetJoy(){joyPointer=null;joy.x=joy.y=0;stick.style.transform='translate(-50%,-50%)'}joyEl.addEventListener('pointerup',resetJoy);joyEl.addEventListener('pointercancel',resetJoy);document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
let soundOn=true,audioCtx=null;
function playTone(freq=680,duration=.18){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audioCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*1.45,audioCtx.currentTime+duration);gain.gain.setValueAtTime(.035,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration)}catch{}}
function setSound(){soundOn=!soundOn;document.querySelector('#soundBtn').textContent=soundOn?'♫':'♪';document.querySelector('#settingsSound').textContent=soundOn?'On':'Off';if(soundOn)playTone(540,.13)}document.querySelector('#soundBtn').onclick=setSound;document.querySelector('#settingsSound').onclick=setSound;
function togglePause(){if(!running)return;paused=!paused;document.querySelector('#pauseScreen').classList.toggle('hidden',!paused)}
document.querySelector('#pauseBtn').onclick=()=>{if(running)togglePause();else document.querySelector('#settings').classList.remove('hidden')};document.querySelector('#closeSettings').onclick=()=>document.querySelector('#settings').classList.add('hidden');document.querySelector('#startBtn').onclick=()=>{running=true;document.querySelector('#startScreen').classList.add('hidden');playTone(460,.26)};document.querySelector('#resumeBtn').onclick=togglePause;
function resetGame(){score={coin:0,crystal:0,shard:0};updateHud();for(const c of collectibles){c.mesh.visible=true}cat.position.set(0,0,3);velocityY=0;onGround=true;won=false;running=true;paused=false;document.querySelector('#winScreen').classList.add('hidden');document.querySelector('#startScreen').classList.add('hidden');document.querySelector('#pauseScreen').classList.add('hidden')}
document.querySelector('#againBtn').onclick=resetGame;
// Camera, cat and collectibles follow the same horizontal plane: the experience is a side-view 2.5D platformer with 3D geometry.
const cameraTarget=new THREE.Vector3();
function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<700?48:42;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-last)/1000||.016);last=now;elapsed+=dt;
 for(let i=0;i<bigStars.length;i++){bigStars[i].material.opacity=.55+.35*Math.sin(elapsed*1.5+i)}
 novaCore.scale.setScalar(1+Math.sin(elapsed*2.4)*.08);halo.scale.setScalar(1+Math.sin(elapsed*1.7)*.09);nova.rotation.y=elapsed*.13;nova.rotation.z=Math.sin(elapsed*.3)*.06;violetLight.intensity=25+Math.sin(elapsed*2)*4;
 for(const c of collectibles){if(!c.mesh.visible)continue;c.mesh.rotation.y+=dt*(c.type==='coin'?1.5:1.05);c.mesh.position.y=c.baseY+Math.sin(elapsed*2.3+c.phase)*.12;if(running&&!paused){const dx=cat.position.x-c.mesh.position.x,dz=cat.position.z-c.mesh.position.z;if(dx*dx+dz*dz<.85*.85&&Math.abs(cat.position.y+1-c.mesh.position.y)<1.65){c.mesh.visible=false;score[c.type]++;updateHud();if(c.type==='coin'){notify('STAR COIN · NICE CATCH');playTone(740,.12)}else if(c.type==='crystal'){notify('VOID CRYSTAL RECOVERED');playTone(880,.2)}else{notify('NOVA SHARD · THE LIGHT GROWS');playTone(1040,.28)}if(score.shard>=total.shard){won=true;running=false;document.querySelector('#finalScore').textContent=`${score.coin} STAR COINS · ${score.crystal} CRYSTALS · ${score.shard} NOVA SHARDS`;setTimeout(()=>document.querySelector('#winScreen').classList.remove('hidden'),500)}}}}
 if(running&&!paused){let ax=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;let az=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joy.y;const mag=Math.hypot(ax,az);if(mag>1){ax/=mag;az/=mag}const speed=dashTime>0?10:5.5;if(dashTime>0)dashTime=Math.max(0,dashTime-dt);cat.position.x=THREE.MathUtils.clamp(cat.position.x+ax*speed*dt,-6.45,6.45);cat.position.z=THREE.MathUtils.clamp(cat.position.z+az*speed*dt, -50, 5.2);if(!onGround){velocityY-=17*dt;cat.position.y+=velocityY*dt;if(cat.position.y<=0){cat.position.y=0;velocityY=0;onGround=true}}if(onGround&&keys.has('Space'))jump();cat.rotation.y=THREE.MathUtils.damp(cat.rotation.y,ax*.14,7,dt);const moving=mag>.12;const bob=moving&&onGround?Math.sin(elapsed*15)*.055:Math.sin(elapsed*2)*.018;body.position.y=.69+bob;head.position.y=1.28+bob;for(const index of [2,4])cat.children[index].rotation.x=moving?Math.sin(elapsed*15+(index===4?Math.PI:0))*.34:0;tail.rotation.z=-.55+Math.sin(elapsed*4)*.25;
 }
 const target=new THREE.Vector3(cat.position.x*.35,cat.position.y+1.35,cat.position.z-10.4);camera.position.x=THREE.MathUtils.damp(camera.position.x,target.x,3.6,dt);camera.position.y=THREE.MathUtils.damp(camera.position.y,target.y+4,3.6,dt);camera.position.z=THREE.MathUtils.damp(camera.position.z,cat.position.z+13.5,3.6,dt);cameraTarget.set(cat.position.x*.22,.95,cat.position.z-8);camera.lookAt(cameraTarget);
 renderer.render(scene,camera)}requestAnimationFrame(animate);
