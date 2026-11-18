# NY KURICHI STICKER COLLECTION

Static page for `https://vsw.co.jp/kurichi-stickers2/`. Open `index.html` through a local HTTP server or serve this directory at `/kurichi-stickers2/`.

## Content

- `assets/characters.json` is the editable character data. `assets/characters.js` exposes the same array to the static page as `window.NY_CHARACTERS`; keep them in sync when editing.
- The HTML contains an 11-person `<noscript>` profile fallback. Update it when character copy changes.
- The 11 profiles are based on `output/imagegen/ny-cyber-kurichi-voxel-hold-20261118/character-bible.json`.
- The product image and favicon are reused from the existing `../kurichi-stickers/assets/` directory.

## Artwork paths

The final illustrated assets are included at these paths:

- `assets/hero-city.webp`
- `assets/01-character.webp` through `assets/11-character.webp` (the hero uses 01, 11, and 04)
- `assets/stickers/01-front.webp`, `01-back.webp`, `01-thumb.webp` through the corresponding `11-*.webp`
- `assets/og-image.jpg` (1200 × 630)

Sticker cards and the dialog retain a typographic fallback for image-loading failures. The collection uses the large front image; thumbs remain available for future responsive variants.

## Behavior

Filter by borough; the dialog's previous/next controls wrap inside the active filter. Related-character links open that person, resetting the filter if needed. Escape closes the native dialog; arrow keys move between people. Reduced-motion settings disable transitions.

## Validation

JavaScript syntax and local asset references checked. Browser QA at desktop and 390px mobile covered borough filters, front/back switching, previous/next wrapping, related characters, and dialog scroll reset. Print-production assets and white masks are delivered separately under `output/imagegen/ny-cyber-kurichi-voxel-hold-20261118/`; they are not part of the public website.

## Current artwork

All 11 main characters retain the approved approximately 2.2-head proportions. One of the two side voxel hedgehogs holds a single Whoopie Kurichi product; there is no separate product beside the front title. The chosen holder and filling are recorded in `product_holder` and `favorite_kurichi`. The held product belongs to the character color layer and its aligned white mask.

The front title is `NYクリチ` plus the character name, stored as `front_title`. It follows a circular arch in DotGothic16 lettering with stepped block extrusion, black outlines and a pale outer edge. The font is rasterized locally; the font file is not included in the delivered assets. The name print layer contains only lettering and its outline/extrusion.

Each reverse includes 住む街, 仕事, 好きなこと and 好きなクリチ. The names, settings, stories and favorite flavors are retained. Updated portraits are used on both sides and in the hero. Image/data cache version: `voxel-hold-20261118`.

The separate print delivery is `output/imagegen/ny-cyber-kurichi-voxel-hold-20261118/ny-crew-voxel-hold-print-delivery.zip`. It contains full-aligned background, character and name PNGs, one white mask each, back artwork and proofs; print files are not deployed to the public site.
