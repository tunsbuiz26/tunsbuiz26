# Simulation profile banner

The banner uses a Three.js scene with a rotating icosahedral network, a simulation interface, and a typewriter introduction. Each frame is projected to SVG and rasterized with Sharp; Pillow encodes the frames into GIFs. This is an offline Three.js animation, not live JavaScript inside the GitHub README.

- 1000 × 270 pixels, 150 frames, ten-second loop.
- Inter font, bundled under the SIL Open Font License in `fonts/`.
- Name, role, and description appear in sequence, then remain fully visible for several seconds.
- Light and dark versions. GIFs are embedded with a `picture` element; reduced-motion preferences select fully typed PNGs instead.
- Contact links remain separate from the animation so they stay clickable.

To regenerate from this directory (Node.js and Python required):

```sh
npm install
python -m pip install Pillow
npm run frames
python encode-banner.py
```

Output files: `../assets/header-simulation-dark.gif`, `../assets/header-simulation-light.gif`, and matching static PNGs.

Three.js: r170, MIT license (included). Inter: SIL Open Font License (included). Sharp and Pillow are build dependencies only. Generated assets do not load scripts, fonts, or third-party services at runtime.
