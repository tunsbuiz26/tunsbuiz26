# Python console and comic profile banner

SVN-Coder's Crux pixel lettering is retained. The right panel types `print("Hello, world!")`, displays its output, then types `import antigravity`. After a brief pause, the console fades into the user's supplied Python comic. The image is embedded unchanged, fitted without cropping.

- 1000 × 400 pixels, 180 frames, twelve-second loop.
- The left introduction completes in about 2.2 seconds.
- The right console crossfades to the full comic around 3.6–4 seconds; the comic remains visible for eight seconds.
- The comic is approximately 1.7 times larger in each dimension than the original 270-pixel-tall layout.
- Light and dark GIFs; reduced-motion PNGs show the complete introduction and comic.
- Contact links remain separate and clickable.

To regenerate, download SVN-Coder's Crux from https://www.svnfont.com/viet-hoa-svn-codes-crux/ and put the OTF file in `.local-fonts/`. The font binary is not redistributed here.

```sh
npm install
python -m pip install Pillow
npm run frames
python encode-banner.py
```

Output: `../assets/header-python-story-tall-{dark,light}.{gif,png}`.

Comic: [Python, xkcd #353](https://xkcd.com/353/) by Randall Munroe, [CC BY-NC 2.5](https://creativecommons.org/licenses/by-nc/2.5/). The source PNG was provided by the user. The credit is visible in the banner and linked from the profile README. Python's `antigravity` module opens this comic: https://github.com/python/cpython/blob/main/Lib/antigravity.py.

Sharp and Pillow are build dependencies only. GitHub displays the resulting assets without running JavaScript.
