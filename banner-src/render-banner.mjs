import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const THREE = await import(process.env.THREE_MODULE ? pathToFileURL(process.env.THREE_MODULE).href : 'three');
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FRAME_DIR = process.env.BANNER_FRAME_DIR || path.join(ROOT, '.frames');
const WIDTH = 1000, HEIGHT = 270, FRAMES = 90;

// Build the network in a Three.js scene, then project each frame to SVG.
// The SVG backend keeps the typography crisp and avoids a browser/GPU dependency.
const scene = new THREE.Scene();
const network = new THREE.Group();
scene.add(network);
const camera = new THREE.PerspectiveCamera(38, 1.35, .1, 30);
camera.position.set(0, 0, 5.2);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
camera.updateMatrixWorld();

const raw = new THREE.IcosahedronGeometry(1.12, 0).getAttribute('position');
const unique = new Map();
for (let i = 0; i < raw.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(raw, i);
  unique.set(v.toArray().map(n => n.toFixed(5)).join(','), v);
}
const vertices = [...unique.values()];
const nodes = vertices.map(v => {
  const node = new THREE.Object3D();
  node.position.copy(v);
  network.add(node);
  return node;
});
const edges = [];
for (let i=0; i<vertices.length; i++) {
  for (let j=i+1; j<vertices.length; j++) {
    if (vertices[i].distanceTo(vertices[j]) < 1.24) edges.push([i,j]);
  }
}
if (nodes.length !== 12 || edges.length !== 30) throw new Error('Unexpected icosahedron topology');

function project(node) {
  const world = node.getWorldPosition(new THREE.Vector3());
  const projected = world.clone().project(camera);
  return {x:824 + projected.x*136, y:114 - projected.y*103, depth:(world.z+1.2)/2.4};
}

function wave(phase, offset, amplitude, secondary, baseline) {
  const points=[];
  for (let x=0; x<=WIDTH; x+=5) {
    const y=baseline + Math.sin(x/WIDTH*Math.PI*2 + phase + offset)*amplitude
      + Math.sin(x/WIDTH*Math.PI*4 - phase + offset)*secondary;
    points.push(`${x.toFixed(1)},${y.toFixed(2)}`);
  }
  return `M${points.join(' L')} L1000,270 L0,270 Z`;
}

function frameSvg(frame, dark) {
  const phase=frame/FRAMES*Math.PI*2;
  network.rotation.set(.16 + Math.sin(phase)*.16,phase,.13*Math.sin(phase));
  scene.updateMatrixWorld(true);
  const points=nodes.map(project);
  const bg=dark?'#0d1117':'#eff6ff';
  const fg=dark?'#f0f6fc':'#0f172a';
  const muted=dark?'#a5b4cf':'#475569';
  const accent=dark?'#38bdf8':'#0875c5';
  const lines=edges.map(([i,j],k)=>{
    const a=points[i],b=points[j];
    const opacity=(dark?.20:.16)+(a.depth+b.depth)*.12;
    let s=`<path d="M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}" fill="none" stroke="${accent}" stroke-width="1.1" opacity="${opacity.toFixed(3)}"/>`;
    if (k%6===0) {
      const f=(frame/FRAMES+k*.13)%1;
      s+=`<circle cx="${(a.x+(b.x-a.x)*f).toFixed(2)}" cy="${(a.y+(b.y-a.y)*f).toFixed(2)}" r="1.8" fill="${accent}" opacity=".8"/>`;
    }
    return s;
  }).join('');
  const dots=points.slice().sort((a,b)=>a.depth-b.depth).map(p=>{
    const r=2.5+p.depth*2.5;
    return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(r+3).toFixed(2)}" fill="${accent}" opacity="${(.03+p.depth*.05).toFixed(2)}"/><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${r.toFixed(2)}" fill="${bg}" stroke="${accent}" stroke-width="1.1" opacity="${(.45+p.depth*.45).toFixed(2)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0875c5"/><stop offset="1" stop-color="#22d3ee"/></linearGradient><clipPath id="clip"><rect width="1000" height="270" rx="18"/></clipPath></defs>
<g clip-path="url(#clip)"><rect width="1000" height="270" fill="${bg}"/>
${lines}${dots}
<text x="44" y="48" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="${accent}">HELLO, I'M TUAN</text>
<text x="44" y="103" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="${fg}">Nguyen Bui Anh Tuan</text>
<text x="44" y="143" font-family="Arial,sans-serif" font-size="23" fill="${accent}">AI Software Engineer</text>
<text x="44" y="179" font-family="Arial,sans-serif" font-size="15" fill="${muted}">AI applications · Backend services · API integration</text>
<path d="${wave(phase,.7,14,4,229)}" fill="url(#wave)" opacity=".16"/>
<path d="${wave(phase,0,12,3,249)}" fill="url(#wave)" opacity=".84"/>
</g></svg>`;
}

for (const theme of ['dark','light']) {
  const target=path.join(FRAME_DIR,theme);
  await fs.mkdir(target,{recursive:true});
  for (let n=0;n<FRAMES;n++) {
    const svg=frameSvg(n,theme==='dark');
    await sharp(Buffer.from(svg)).png().toFile(path.join(target,`${String(n).padStart(3,'0')}.png`));
    if (n===0) await fs.writeFile(path.join(target,'still.svg'),svg);
  }
  process.stdout.write(`Rendered ${theme}: ${FRAMES} Three.js frames, ${WIDTH} × ${HEIGHT}\n`);
}
