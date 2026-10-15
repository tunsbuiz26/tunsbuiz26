# Animated profile banner

The banner uses a Three.js scene with a rotating icosahedral network. Each frame is projected to SVG and rasterized with Sharp; Pillow encodes the frames into GIFs. This is an offline Three.js animation, not live JavaScript inside the GitHub README.

- 1000 × 270 pixels, 90 frames, six-second seamless loop.
- Light and dark versions; stationary typography.
- GIFs are embedded with a `picture` element. Reduced-motion preferences select the static SVGs instead.
- Contact links remain separate from the animation so they stay clickable.

To regenerate from this directory (Node.js and Python required):

```sh
npm install
python -m pip install Pillow
npm run frames
python encode-banner.py
```

Output files: `../assets/header-dark.gif` and `../assets/header-light.gif`.

Three.js: r170, MIT license (included). Sharp and Pillow are build dependencies only. Generated assets do not load scripts, fonts, or third-party services at runtime.
