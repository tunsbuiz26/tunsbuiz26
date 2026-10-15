import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FRAME_DIR = process.env.BANNER_FRAME_DIR || path.join(ROOT, '.frames-python-story');
const FONT_CACHE = process.env.BANNER_FONT_CACHE || path.join(ROOT, '.font-cache');
await fs.mkdir(FONT_CACHE,{recursive:true});
const fontDirs=[path.join(ROOT,'fonts'),path.join(ROOT,'.local-fonts'), ...(process.platform==='win32'?['C:/Windows/Fonts']:process.platform==='darwin'?['/System/Library/Fonts','/Library/Fonts']:['/usr/share/fonts','/usr/local/share/fonts'])];
const xmlEscape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const fontConfig=path.join(FONT_CACHE,'fonts.conf');
await fs.writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>${fontDirs.map(d=>`<dir>${xmlEscape(d)}</dir>`).join('')}<cachedir>${xmlEscape(FONT_CACHE)}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=fontConfig;
// Windows native font libraries read the process environment at startup.
// Restart once so the configured banner font is registered before Sharp is loaded.
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
const WIDTH = 1000, HEIGHT = 270, FRAMES = 150;

// Preserve the supplied comic unchanged and embed it directly in the rendered frames.
const comicData = (await fs.readFile(path.join(ROOT, '../assets/xkcd-python-user.png'))).toString('base64');

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
    return `<text x="44" y="${y}" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="${size}" font-weight="${weight}" fill="${color}">${xmlEscape(value.slice(0,counts[index]))}<tspan fill="${accent}" font-weight="400">${caret}</tspan></text>`;
  };
  const progress=staticText?1:Math.min(1,(counts[0]+counts[1]+counts[2])/(name.length+role.length+tagline.length));
  const grid=[];
  for(let x=20;x<1000;x+=32)grid.push(`<path d="M${x} 31V270"/>`);
  for(let y=46;y<270;y+=32)grid.push(`<path d="M0 ${y}H1000"/>`);
  const codeAlpha=staticText?0:Math.max(0,Math.min(1,(60-frame)/6));
  const comicAlpha=staticText?1:Math.max(0,Math.min(1,(frame-54)/6));
  const typed=(text,start)=>text.slice(0,Math.min(text.length,Math.max(0,(frame-start+1)*2)));
  const hello='print("Hello, world!")', magic='import antigravity';
  const cursor=start=>frame>=start && frame%6<4?'_':'';
  const consoleText=(y,value,color=fg)=>`<text x="724" y="${y}" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="24" fill="${color}">${value}</text>`;
  const terminal=`<g opacity="${codeAlpha.toFixed(3)}">
    <rect x="706" y="62" width="276" height="142" rx="8" fill="${panel}" stroke="${border}"/>
    <text x="724" y="49" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="16" letter-spacing="1" fill="${muted}">PYTHON CONSOLE</text>
    ${consoleText(94,`<tspan fill="${accent}">&gt;&gt;&gt; </tspan>${xmlEscape(typed(hello,0))}${frame<11?cursor(0):''}`)}
    ${frame>=14?consoleText(122,'Hello, world!',muted):''}
    ${frame>=24?consoleText(164,`<tspan fill="${accent}">&gt;&gt;&gt; </tspan>${xmlEscape(typed(magic,24))}${frame<40?cursor(24):''}`):''}
    ${frame>=41?'<circle cx="728" cy="186" r="2" fill="'+accent+'"/><text x="740" y="190" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="16" fill="'+muted+'">OPENING XKCD...</text>':''}
  </g>`;
  const comic=`<g opacity="${comicAlpha.toFixed(3)}">
    <image x="764" y="40" width="157" height="179" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${comicData}"/>
    <text x="843" y="231" text-anchor="middle" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="14" fill="${muted}">xkcd.com/353 · Randall Munroe</text>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0875c5"/><stop offset="1" stop-color="#22d3ee"/></linearGradient><clipPath id="clip"><rect width="1000" height="270" rx="18"/></clipPath></defs>
<g clip-path="url(#clip)"><rect width="1000" height="270" fill="${bg}"/>
<g stroke="${accent}" stroke-width=".5" opacity=".045">${grid.join('')}</g>
<path d="M0 0H1000V31H0Z" fill="${panel}"/><path d="M0 31H1000" stroke="${border}"/>
<g fill="${accent}"><circle cx="18" cy="15" r="3" opacity=".35"/><circle cx="30" cy="15" r="3" opacity=".55"/><circle cx="42" cy="15" r="3" opacity=".8"/></g>
<text x="58" y="19" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="16" font-weight="400" letter-spacing="1.5" fill="${muted}">PROFILE SIMULATOR</text>
<circle cx="877" cy="15" r="2.5" fill="${accent}"/><text x="888" y="19" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="16" font-weight="400" letter-spacing="1" fill="${muted}">SIMULATION</text>
<path d="M690 51V212" stroke="${border}"/>
${terminal}${comic}
<text x="44" y="64" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="20" font-weight="400" letter-spacing="2.5" fill="${accent}">HELLO, I'M TUAN</text>
${line(name,0,112,64,400,fg)}
${line(role,1,150,40,400,accent)}
${line(tagline,2,184,24,400,muted)}
<text x="44" y="209" font-family="&quot;SVN-Coder&apos;s Crux&quot;,monospace" font-size="16" font-weight="400" letter-spacing="1" fill="${muted}">${complete || staticText?'PROFILE READY':'INITIALIZING PROFILE'}</text>
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
  process.stdout.write(`Rendered ${theme}: ${FRAMES} banner frames, ${WIDTH} × ${HEIGHT}\n`);
}
