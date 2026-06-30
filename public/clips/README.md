# Capability clips (Scene 2 — "the demonstration")

Drop your egocentric footage here. Files are served from the site root, e.g.
`public/clips/diamond.mp4` → `/clips/diamond.mp4`.

The 2×2 grid in the hero looks for these exact filenames (see `components/Cinematic.tsx` → `EGO`):

| Tile                     | File                          |
| ------------------------ | ----------------------------- |
| egocentric · diamond     | `public/clips/diamond.mp4`     |
| egocentric · refinery    | `public/clips/refinery.mp4`    |
| egocentric · assembly    | `public/clips/assembly.mp4`    |
| egocentric · residential | `public/clips/residential.mp4` |

Notes:
- Use **.mp4 (H.264/AAC)** for broadest browser support. `.webm` also works —
  just change the `src` extension in `EGO`.
- Clips auto-play **muted, looped**, cropped to fill (object-cover), and are
  rendered in the grayscale cinematic treatment. Keep them short (5–15s loops).
- Until a file exists, that tile shows the "footage soon" placeholder — no
  broken media. To rename/add/remove tiles, edit the `EGO` array in
  `components/Cinematic.tsx`.

## Scene 3 — humanoid background (optional)
Drop `public/inheritance/robot.mp4` to fill the final scene behind the
`Praxis.` / Request access overlay. If you have a still image instead of a
video, tell the dev and we'll switch that slot to an image.
