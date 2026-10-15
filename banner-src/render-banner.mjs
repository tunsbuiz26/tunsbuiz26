import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FRAME_DIR = process.env.BANNER_FRAME_DIR || path.join(ROOT, '.frames-python');
const FONT_CACHE = process.env.BANNER_FONT_CACHE || path.join(ROOT, '.font-cache');
await fs.mkdir(FONT_CACHE,{recursive:true});
const fontDirs=[path.join(ROOT,'fonts'), ...(process.platform==='win32'?['C:/Windows/Fonts']:process.platform==='darwin'?['/System/Library/Fonts','/Library/Fonts']:['/usr/share/fonts','/usr/local/share/fonts'])];
const xmlEscape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const fontConfig=path.join(FONT_CACHE,'fonts.conf');
await fs.writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>${fontDirs.map(d=>`<dir>${xmlEscape(d)}</dir>`).join('')}<cachedir>${xmlEscape(FONT_CACHE)}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=fontConfig;
// Windows native font libraries read the process environment at startup.
// Restart once so the bundled monospace font is registered before Sharp is loaded.
if (process.env.BANNER_FONTCONFIG_READY !== '1') {
  const {spawnSync}=await import('node:child_process');
  const child=spawnSync(process.execPath,[fileURLToPath(import.meta.url)],{
    stdio:'inherit',
    env:{...process.env,FONTCONFIG_FILE:fontConfig,FONTCONFIG_PATH:FONT_CACHE,BANNER_FONTCONFIG_READY:'1'},
  });
  if(child.error) throw child.error;
  process.exit(child.status ?? 1);
}
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const THREE = await import(process.env.THREE_MODULE ? pathToFileURL(process.env.THREE_MODULE).href : 'three');
const WIDTH = 1000, HEIGHT = 270, FRAMES = 90;

// Use Three.js transforms to animate the Python emblem, then render to SVG.
// Offline rendering lets GitHub display the animation without running JavaScript.
const pythonLogo = (await fs.readFile(path.join(ROOT, '../assets/tool-python.svg'), 'utf8'))
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const logoRig = new THREE.Object3D();

function wave(phase, offset, amplitude, secondary, baseline) {
  const points=[];
  for (let x=0; x<=WIDTH; x+=5) {
    const y=baseline + Math.sin(x/WIDTH*Math.PI*2 + phase + offset)*amplitude
      + Math.sin(x/WIDTH*Math.PI*4 - phase + offset)*secondary;
    points.push(`${x.toFixed(1)},${y.toFixed(2)}`);
  }
  return `M${points.join(' L')} L1000,270 L0,270 Z`;
}

function frameSvg(frame, dark, staticText=false) {
  const phase=frame/FRAMES*Math.PI*2;
  logoRig.rotation.z=.035*Math.sin(phase);
  logoRig.position.y=3*Math.sin(phase);
  logoRig.scale.setScalar(1+.015*Math.sin(phase));
  logoRig.updateMatrixWorld(true);
  const logoMatrix=new THREE.Matrix4().makeTranslation(824,128,0).multiply(logoRig.matrixWorld);
  const m=logoMatrix.elements;
  const logoTransform=`matrix(${m[0]} ${m[1]} ${m[4]} ${m[5]} ${m[12]} ${m[13]})`;
  const bg=dark?'#0d1117':'#f8fafc';
  const fg=dark?'#f0f6fc':'#0f172a';
  const muted=dark?'#94a3b8':'#475569';
  const accent=dark?'#38bdf8':'#0875c5';
  const panel=dark?'#111b29':'#eaf1f8';
  const border=dark?'#233247':'#cbd5e1';
  const name='Nguyen Bui Anh Tuan',role='AI Software Engineer';
  const tagline='AI applications · Backend services · API integration';
  const count=(start,length,step=1)=>staticText?length:Math.min(length,Math.max(0,(frame-start+1)*step));
  const counts=[count(0,name.length,2),count(10,role.length,2),count(20,tagline.length,4)];
  const complete=counts[2]===tagline.length;
  const active=frame<10?0:frame<20?1:frame<33?2:-1;
  const line=(value,index,y,size,weight,color)=>{
    const caret=!staticText && active===index && frame%6<4?'|':'';
    return `<text x="44" y="${y}" font-family="JetBrains Mono,monospace" font-size="${size}" font-weight="${weight}" fill="${color}">${xmlEscape(value.slice(0,counts[index]))}<tspan fill="${accent}" font-weight="400">${caret}</tspan></text>`;
  };
  const progress=staticText?1:Math.min(1,(counts[0]+counts[1]+counts[2])/(name.length+role.length+tagline.length));
  const grid=[];
  for(let x=20;x<1000;x+=32)grid.push(`<path d="M${x} 31V270"/>`);
  for(let y=46;y<270;y+=32)grid.push(`<path d="M0 ${y}H1000"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0875c5"/><stop offset="1" stop-color="#22d3ee"/></linearGradient><clipPath id="clip"><rect width="1000" height="270" rx="18"/></clipPath></defs>
<g clip-path="url(#clip)"><rect width="1000" height="270" fill="${bg}"/>
<g stroke="${accent}" stroke-width=".5" opacity=".045">${grid.join('')}</g>
<path d="M0 0H1000V31H0Z" fill="${panel}"/><path d="M0 31H1000" stroke="${border}"/>
<g fill="${accent}"><circle cx="18" cy="15" r="3" opacity=".35"/><circle cx="30" cy="15" r="3" opacity=".55"/><circle cx="42" cy="15" r="3" opacity=".8"/></g>
<text x="58" y="19" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600" letter-spacing="1.5" fill="${muted}">PROFILE SIMULATOR</text>
<circle cx="877" cy="15" r="2.5" fill="${accent}"/><text x="888" y="19" font-family="JetBrains Mono,monospace" font-size="9" font-weight="500" letter-spacing="1" fill="${muted}">SIMULATION</text>
<path d="M690 51V212" stroke="${border}"/>
<g fill="none" stroke="${accent}" opacity=".3"><path d="M718 70V56H732M916 56H930V70M718 186V200H732M916 200H930V186"/><ellipse cx="824" cy="128" rx="111" ry="47" stroke-dasharray="2 8" opacity=".4"/></g>
<text x="797" y="52" font-family="JetBrains Mono,monospace" font-size="8" font-weight="500" letter-spacing="2" fill="${muted}">PYTHON</text>
<g transform="${logoTransform}"><svg x="-67" y="-67" width="134" height="134" viewBox="0 0 128 128">${pythonLogo}</svg></g>
<text x="778" y="214" font-family="JetBrains Mono,monospace" font-size="8" letter-spacing="1" fill="${muted}">AI + BACKEND</text>
<text x="44" y="64" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600" letter-spacing="2.5" fill="${accent}">HELLO, I'M TUAN</text>
${line(name,0,112,36,600,fg)}
${line(role,1,150,22,500,accent)}
${line(tagline,2,184,13,400,muted)}
<text x="44" y="209" font-family="JetBrains Mono,monospace" font-size="9" font-weight="500" letter-spacing="1" fill="${muted}">${complete || staticText?'PROFILE READY':'INITIALIZING PROFILE'}</text>
<rect x="44" y="219" width="480" height="1.5" fill="${border}"/><rect x="44" y="219" width="${(480*progress).toFixed(2)}" height="1.5" fill="${accent}" opacity=".65"/>
<path d="${wave(phase,.7,10,3,243)}" fill="url(#wave)" opacity=".16"/>
<path d="${wave(phase,0,8,2,258)}" fill="url(#wave)" opacity=".84"/>
</g><rect x=".5" y=".5" width="999" height="269" rx="18" fill="none" stroke="${border}"/></svg>`;
}

for (const theme of ['dark','light']) {
  const target=path.join(FRAME_DIR,theme);
  await fs.mkdir(target,{recursive:true});
  const still=frameSvg(0,theme==='dark',true);
  await fs.writeFile(path.join(target,'still.svg'),still);
  await sharp(Buffer.from(still)).png().toFile(path.join(target,'still.png'));
  for (let n=0;n<FRAMES;n++) {
    const svg=frameSvg(n,theme==='dark');
    await sharp(Buffer.from(svg)).png().toFile(path.join(target,`${String(n).padStart(3,'0')}.png`));
  }
  process.stdout.write(`Rendered ${theme}: ${FRAMES} Three.js frames, ${WIDTH} × ${HEIGHT}\n`);
}
