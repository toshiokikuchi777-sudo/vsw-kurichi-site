# NY KURICHI STICKER COLLECTION

Static page for `https://vsw.co.jp/kurichi-stickers2/`. Open `index.html` through a local HTTP server or serve this directory at `/kurichi-stickers2/`.

## Content

- `assets/characters.json` is the editable character data. `assets/characters.js` exposes the same array to the static page as `window.NY_CHARACTERS`; keep them in sync when editing.
- The HTML contains an 11-person `<noscript>` profile fallback. Update it when character copy changes.
- The 11 profiles and approved front-title settings are recorded in `output/imagegen/ny-cyber-kurichi-solid-hashtag-20261118/character-bible.json`.
- The product image and favicon are reused from the existing `../kurichi-stickers/assets/` directory.

## Artwork paths

Public artwork is referenced at these paths:

- `assets/hero-city.webp`
- `assets/01-character.webp` through `assets/11-character.webp` (the hero uses 01, 11, and 04)
- `assets/stickers/01-front.webp`, `01-back.webp`, `01-thumb.webp` through the corresponding `11-*.webp`
- `assets/og-image.jpg` (1200 × 630)

Sticker cards and the dialog retain a typographic fallback for image-loading failures. The collection uses the large front image; thumbs remain available for future responsive variants.

## Behavior

Filter by borough; the dialog's previous/next controls wrap inside the active filter. Related-character links open that person, resetting the filter if needed. Escape closes the native dialog; arrow keys move between people. Reduced-motion settings disable transitions.

## Validation

JavaScript syntax and local asset references have been checked. Previous browser QA at desktop and 390px mobile covered borough filters, front/back switching, previous/next wrapping, related characters, and dialog scroll reset. All 11 updated front layouts and the name-only contact sheet were visually checked after the final color-group correction. Print-production assets and white masks are delivered separately under `output/imagegen/ny-cyber-kurichi-solid-hashtag-20261118/`; they are not part of the public website.

## Current artwork

All 11 main characters retain the approved approximately 2.2-head proportions. Each front uses its character's own color treatment. The `＃クリチ` substring is one matching color group, including front faces, highlights and extruded sides; `NY` and the kanji name use the character's other color. One of the two side voxel hedgehogs holds a single Whoopie Kurichi product; there is no separate product beside the front title. The chosen holder and filling are recorded in `product_holder` and `favorite_kurichi`. The held product belongs to the character color layer and its aligned white mask.

The front title is `NY＃クリチ` plus the existing kanji name, stored as `front_title`. The large custom block logo follows a shallow arc, with thick black outlines and dark, deep extruded sides. Each character's reading is typeset directly beneath the kanji name. The logo reference is `output/imagegen/ny-kurichi-solid-logo-20261118/ny-kurichi-milo-logo.png`. The name print layer contains the accurately composed title, reading, and their outlines/extrusion.

Each reverse includes 住む街, 仕事, 好きなこと and 好きなクリチ. The names, settings, stories, favorite flavors, back art and hero portraits are retained. The new front and thumbnail image URLs use cache version `solid-hashtag-20261118`; back and hero image URLs retain `voxel-hold-20261118`.

The separate print delivery is `output/imagegen/ny-cyber-kurichi-solid-hashtag-20261118/ny-crew-solid-hashtag-print-delivery.zip`. It contains full-aligned background, character and name PNGs, one white mask each, back artwork and proofs; print files are not deployed to the public site.
