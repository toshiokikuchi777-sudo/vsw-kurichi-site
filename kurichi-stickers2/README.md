# NY KURICHI STICKER COLLECTION

Static page for `https://vsw.co.jp/kurichi-stickers2/`. Open `index.html` through a local HTTP server or serve this directory at `/kurichi-stickers2/`.

## Content

- `assets/characters.json` is the editable character data. `assets/characters.js` exposes the same array to the static page as `window.NY_CHARACTERS`; keep them in sync when editing.
- The HTML contains an 11-person `<noscript>` profile fallback. Update it when character copy changes.
- The 11 profiles are based on `output/ny-cyber-kurichi-character-settings-20261117/character-bible.json`.
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

JavaScript syntax and local asset references checked. Browser QA at desktop and 390px mobile covered borough filters, front/back switching, previous/next wrapping, related characters, and dialog scroll reset. Print-production assets and white masks are delivered separately under `output/imagegen/ny-cyber-kurichi-final-20261118/`; they are not part of the public website.

## Artwork update: 2.2-head version

All11 front/back portraits and hero characters use the approved approximately2.2-head proportions. The isolated lower-left Whoopie Kurichi product is now placed beside the front name on its right; it is included in the name print layer and matching white mask. Cache-version query:2p2-20261118. Print data: `output/imagegen/ny-cyber-kurichi-2p2-final-20261118/`.

## Favorite Kurichi field

Each character includes `favorite_kurichi`, matching the product depicted beside the front name. It is shown on the physical reverse, dialog profile, and no-script profile. Updated reverse artwork version: `favorites-20261118`.

## Front title design

The front title is `NYクリチ` plus the existing character name, stored as `front_title`. Headers follow a circular arch with bold outlined lettering; the favorite-flavor product remains to the right. Character portraits and printed backs are unchanged. Front/thumb/OG cache version: `ny-title-arc-20261118`.
