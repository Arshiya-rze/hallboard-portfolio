# Shared team portrait component

All team cards use the same tilt controller in `team-cards.js`. Cards with a
`data-portrait-src` opt into the single `#team-portrait-template` in `index.html`
and the floating animation in `css/team-portrait.css`. Do not copy that template
or create member-specific animation CSS.

## Add the next approved character

1. Export its upright portrait into `assets/team/` (4:5, ideally 800×1000).
2. Keep the existing static `.team-card-visual > img` as the no-JS/loading fallback.
   Replace its source too if the new pose should appear in the resting state.
3. Add `data-portrait-src="./assets/team/member-3d-portrait.webp"` to the article.
4. For an opaque portrait, add `data-portrait-mask="./assets/team/member-mask.svg"`
   or an exactly aligned alpha image. Omit this for a genuine transparent cutout.
   The optional mask is applied to both images, so they must share framing.
5. Keep the article's `aria-labelledby` pointing at its unique name heading.

Only source/mask configuration changes between members. The component constructs
unique control IDs, lazy-decodes the character, handles hover/touch/keyboard,
keeps controls above the silhouette, limits lift near the header, respects reduced
motion, and resets offscreen. A failed character load preserves the static image.
Without JavaScript, the original HTML portrait remains readable.

## Asset contract

- Upright head/neck, level eyes and shoulders; never inherit a tilted photo pose.
- Same black blazer/turtleneck, small purple Hallboard pin and cyan/violet rim light.
- Full hairstyle, about 7% headroom; eyes near32% and chin near53% of image height.
- Preserve each person's identity; do not borrow the style reference person's face.
- Real alpha or an aligned display mask; a painted checkerboard is not transparency.

Reza Taba's approved upright render is also his static image so the card no longer
shows the old tilted pose. Vahid also uses his upright character-sheet-based render
in both states. Parsa also uses his upright character-sheet-based render in both
states. Hamid uses his upright render with his reference eyeglasses in both states.
Arshia retains his existing static/character pair.
The effect is CSS layered perspective, not a freely rotatable 3D mesh.

## Browser checks

Run `node tests/team-portraits.browser.mjs` with Node22+, Python3 and
`/usr/bin/google-chrome` installed. It starts owned loopback-only test services
on ports5517/9227, discovers all configured cards and checks desktop and touch viewports,
keyboard, matching motion, reduced motion and fallback behavior, then stops them.
Screenshots are saved as `/tmp/hallboard-team-*.png`.
