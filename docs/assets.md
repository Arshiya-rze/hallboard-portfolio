# Image asset inventory

Updated 2026-09-13. Runtime references were checked in HTML, CSS, JavaScript and SVG, including portrait data attributes and masks. Historical prompt records are kept in `docs/team-portraits/`, not deployment images.

## Folders

- `assets/brand/`: logo and touch/favicon images (root `favicon.ico` stays for browser discovery).
- `assets/hero/`: desktop/mobile cinematic backgrounds.
- `assets/technologies/`: technology and category icons.
- `assets/projects/`: project screenshots and active dashboard illustration.
- `assets/team/`: active portraits and display masks.
- `assets/fonts/`: existing fonts, unchanged by this image cleanup.

39 images moved; 26 unused images removed (7357298 bytes, about 7.36 MB). All removed images are recoverable from Git at commit `f7db085`. Moving/removing deployable files does not shrink existing Git history. No originals outside this repository were deleted.

## Removed images

- `assets/elasticsearch.svg`
- `assets/favicon-512.png`
- `assets/logo.png`
- `assets/nestjs.svg`
- `assets/project-api-architecture.svg`
- `assets/project-cloud-platform.svg`
- `assets/project-commerce-platform.svg`
- `assets/project-mobile-experience.svg`
- `assets/project-placeholder.svg`
- `assets/react.svg`
- `assets/tailwind.svg`
- `assets/team/arshia-rezaei-3d-character-sheet-suit.png`
- `assets/team/arshia-rezaei-3d-character-sheet-suit.webp`
- `assets/team/arshia-rezaei-3d-character-sheet.png`
- `assets/team/arshia-rezaei-3d-character-sheet.webp`
- `assets/team/arshia-rezaei-3d-portrait-v2.webp`
- `assets/team/arshia-rezaei-3d-portrait.webp`
- `assets/team/hamid-rahimi.webp`
- `assets/team/parsa-joghfari.webp`
- `assets/team/reza-taba.webp`
- `assets/team/turntable/arshia-rezaei-back.webp`
- `assets/team/turntable/arshia-rezaei-front.webp`
- `assets/team/turntable/arshia-rezaei-side-return.webp`
- `assets/team/turntable/arshia-rezaei-side.webp`
- `assets/team/vahid-hayatipour.webp`
- `assets/terraform.svg`

## Verification

Run `node tests/assets.test.mjs` to check image references and unused images. This static audit covers literal asset paths; if future code constructs filenames dynamically, extend the audit before deleting assets.

Existing unrelated issue: `css/base.css` references `Vazirmatn-Light.ttf`, which was already absent before cleanup. Font files/styles were left unchanged.

