# Arshia's living portrait

Generated using the built-in imagegen tool for the team-card prototype. The matching bust framing and subdued cyan/violet light are designed for a crossfade from the existing portrait. The final asset uses a solid dark studio background, blended into the card with CSS; it is a rendered image, not a 3D mesh.

Output: `arshia-rezaei-3d-portrait.webp`.

References: `arshia-rezaei.webp` (pose, identity, clothes and lapel pin), `arshia-rezaei-3d-character-sheet-suit.png` (approved character style).

## Portrait prompt

Use case: style-transfer / identity-preserve.
Asset type: ONE transparent bust portrait for a website team card that crossfades from Image 1 into this 3D animated portrait.
Input images: Image 1 is the EDIT TARGET, the current real portrait and exact composition, pose, clothing, lighting and identity reference. Image 2 is the existing approved 3D character sheet of the SAME man, a supporting facial identity and stylization reference only.
Primary request: Render the man from Image 1 as a premium mature stylized 3D animated-film character consistent with the character in Image 2. Match Image 1's pose and framing extremely closely so facial landmarks align during a crossfade. One portrait only, no sheet. Same slightly turned shoulders, head nearly frontal with slight turn toward viewer's left, eyes looking at camera, calm approachable closed-mouth expression. Preserve his specific face structure, defined jaw, nose, swept-back voluminous black hair, thick eyebrows, dark brown eyes, neat short beard, skin tone and apparent adult age. Modest eye exaggeration and subtly softened facial planes; polished stylized skin and detailed hair, never a generic face or child.
Clothing: EXACTLY Image 1's tailored black blazer and black turtleneck, same tiny purple geometric Hallboard H lapel pin in same location and shape. Do not copy Image 2's button shirt.
Composition: portrait aspect ratio 4:5, same camera and crop as Image 1, from above hair to mid torso. Whole hairstyle and both shoulders visible, hair top around 6% from top, eyes around 32%, chin around 53%, body down to bottom edge. Head position centered just as Image 1. Both shoulders end at lower side edges. No hands, no legs, no props.
Lighting: restrained cyan rim on viewer's left, violet rim on viewer's right to match Image 1, soft flattering neutral face light; premium high-end 3D skin shading and global illumination.
Background: genuinely transparent alpha, clean cutout with detailed hair edges. NO checkerboard drawn into image, no environment, no opaque background, no frame, text or watermark.

## Final background edit prompt

Use case: precise-object-edit / background replacement. Edit the supplied 3D portrait. Replace ONLY the entire checkerboard background with a completely uniform solid deep navy background EXACT COLOR #101322 (RGB 16,19,34). Opaque background is intentional. No transparency, no checkerboard of any kind, no scenery, no texture, no halo painted on background. Keep the man exactly unchanged: exact identity, pose, framing, head size, hair, facial expression, tailored black jacket, black turtleneck, purple geometric lapel pin and cyan/violet rim lights. Preserve detailed silhouette edges, especially hair. Keep the same 4:5 portrait composition and crop, do not zoom or move the subject. One final clean premium 3D portrait on a perfectly flat dark navy #101322 background for compositing in a website card.
