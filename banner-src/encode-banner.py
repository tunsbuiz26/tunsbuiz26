from pathlib import Path
import argparse
import shutil
from PIL import Image, ImageChops

parser = argparse.ArgumentParser()
parser.add_argument('--frames-dir',type=Path,default=Path(__file__).resolve().parent/'.frames')
parser.add_argument('--out-dir',type=Path,default=Path(__file__).resolve().parent.parent/'assets')
parser.add_argument('--prefix',default='header-simulation')
args=parser.parse_args()
args.out_dir.mkdir(parents=True,exist_ok=True)

for theme in ['dark','light']:
    paths=sorted((args.frames_dir/theme).glob('[0-9][0-9][0-9].png'))
    frames=[]
    for p in paths:
        rgba=Image.open(p).convert('RGBA')
        base=Image.new('RGBA',rgba.size,'#0d1117' if theme=='dark' else '#ffffff')
        base.alpha_composite(rgba)
        frames.append(base.convert('RGB'))
    assert len(frames)==150
    # One shared palette prevents flicker in the stationary text and background.
    samples=[frames[i].resize((500,135)) for i in range(0,len(frames),10)]
    sample=Image.new('RGB',(500,135*len(samples)))
    for i,frame in enumerate(samples):sample.paste(frame,(0,i*135))
    palette=sample.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
    converted=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    target=args.out_dir/f'{args.prefix}-{theme}.gif'
    # GIF timing is in 10 ms units: 70/60/70 ms repeats give a ten-second loop.
    converted[0].save(target,save_all=True,append_images=converted[1:],loop=0,
        duration=[70,60,70]*50,optimize=True,disposal=1)
    with Image.open(target) as gif:
        assert gif.n_frames==150 and gif.size==(1000,270)
        assert gif.info.get('loop')==0
        gif.seek(0); first=gif.convert('RGB')
        gif.seek(90); middle=gif.convert('RGB')
        assert ImageChops.difference(first,middle).getbbox()
        # After typing finishes, the personal information remains stable and readable.
        gif.seek(105); hold1=gif.convert('RGB')
        gif.seek(135); hold2=gif.convert('RGB')
        assert ImageChops.difference(hold1.crop((35,76,675,192)),hold2.crop((35,76,675,192))).getbbox() is None
    print(f'{target}: {target.stat().st_size/1024:.0f} KB, 150 frames, 10 seconds, typewriter intro + readable hold')
    shutil.copy2(args.frames_dir/theme/'still.png',args.out_dir/f'{args.prefix}-{theme}.png')
