from pathlib import Path
import argparse
from PIL import Image, ImageChops

parser = argparse.ArgumentParser()
parser.add_argument('--frames-dir',type=Path,default=Path(__file__).resolve().parent/'.frames')
parser.add_argument('--out-dir',type=Path,default=Path(__file__).resolve().parent.parent/'assets')
args=parser.parse_args()
args.out_dir.mkdir(parents=True,exist_ok=True)

for theme in ['dark','light']:
    paths=sorted((args.frames_dir/theme).glob('*.png'))
    frames=[]
    for p in paths:
        rgba=Image.open(p).convert('RGBA')
        base=Image.new('RGBA',rgba.size,'#0d1117' if theme=='dark' else '#ffffff')
        base.alpha_composite(rgba)
        frames.append(base.convert('RGB'))
    assert len(frames)==90
    # One shared palette prevents flicker in the stationary text and background.
    samples=[frames[i].resize((500,135)) for i in range(0,len(frames),9)]
    sample=Image.new('RGB',(500,135*len(samples)))
    for i,frame in enumerate(samples):sample.paste(frame,(0,i*135))
    palette=sample.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
    converted=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    target=args.out_dir/f'header-{theme}.gif'
    # GIF timing is in 10 ms units: 70/60/70 ms repeats give a six-second loop.
    converted[0].save(target,save_all=True,append_images=converted[1:],loop=0,
        duration=[70,60,70]*30,optimize=True,disposal=1)
    with Image.open(target) as gif:
        assert gif.n_frames==90 and gif.size==(1000,270)
        assert gif.info.get('loop')==0
        gif.seek(0); first=gif.convert('RGB')
        gif.seek(45); middle=gif.convert('RGB')
        assert ImageChops.difference(first,middle).getbbox()
        # Motion must never change the headline, name, or supporting text.
        assert ImageChops.difference(first.crop((35,25,675,200)),middle.crop((35,25,675,200))).getbbox() is None
    print(f'{target}: {target.stat().st_size/1024:.0f} KB, 90 frames, 6 seconds, infinite loop')
