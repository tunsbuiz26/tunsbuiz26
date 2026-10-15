# Pixel simulation profile banner

The banner uses SVN-Coder's Crux pixel lettering and the original rotating Three.js network. The network is projected to SVG and rasterized with Sharp; Pillow encodes the GIFs. GitHub does not need to run JavaScript.

- 1000 × 270 pixels, 90 frames, six-second loop.
- The typewriter sequence finishes in about 2.2 seconds, followed by a readable hold.
- Light and dark versions; reduced-motion preferences use fully typed static PNGs.
- Contact links remain separate and clickable.

To regenerate, download SVN-Coder's Crux from the publisher and place the OTF file in `banner-src/.local-fonts/`. The font binary is not redistributed in this repository. Publisher and font use terms: https://www.svnfont.com/viet-hoa-svn-codes-crux/ (free for personal use).

```sh
npm install
python -m pip install Pillow
npm run frames
python encode-banner.py
```

Output: `../assets/header-crux-network-dark.gif`, `../assets/header-crux-network-light.gif`, and matching PNGs.

Three.js r170 uses the included MIT license. Sharp and Pillow are build dependencies only.
