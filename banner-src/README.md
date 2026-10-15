# Python terminal profile banner

The banner uses JetBrains Mono for a terminal appearance and a blue/yellow Python emblem on the right. Three.js transforms animate the emblem; frames are rendered through SVG and Sharp, then encoded with Pillow. GitHub displays the resulting GIF without running JavaScript.

- 1000 × 270 pixels, 90 frames, six-second loop.
- The name, role, and description finish typing in about 2.2 seconds, then remain visible.
- Light and dark versions; reduced-motion preferences select fully typed static PNGs.
- Contact links remain separate and clickable.

To regenerate from this directory:

```sh
npm install
python -m pip install Pillow
npm run frames
python encode-banner.py
```

Output: `../assets/header-python-dark.gif`, `../assets/header-python-light.gif`, and matching PNGs.

JetBrains Mono is bundled under the SIL Open Font License (`fonts/OFL-JetBrainsMono.txt`). Python artwork comes from the existing Devicon asset (`../assets/tool-python.svg`, license in `../assets/DEVICON_LICENSE.txt`). Three.js r170 uses the included MIT license. Sharp and Pillow are build dependencies only.
