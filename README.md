# A2O Anlæg & Entreprise – 3D pitch-demo

Enkeltsides demo: "Tegning bliver til byggeri". En fast 3D-scene (procedural, ingen assets) bygges op, mens man scroller.
Vite + React + TypeScript + Tailwind + three / @react-three/fiber + motion.

## Kør
```bash
npm install
npm run dev       # udvikling
npm run build     # tsc + vite build
npm run preview   # server den byggede version
npm run lint
```
Nyttigt flag: `?webgl=off` tvinger SVG-fallback i hero.

## Indhold og status
Alt indhold ligger i `src/content.ts` og er rigtigt (ingen pladsholder-markering længere). Fotos ligger som webp i `public/photos/` (kilder i `public/photos/_raw`, bliver i repoet men ikke brugt direkte).
- Åbne punkter: kunden skal bekræfte brug af fotos (hero-site, home-1, svc-toemrere ser polerede ud, svc-banearbejdere er stock), og Yalcin Aydin mangler et rigtigt foto (viser initialer "YA")
- Kontaktformularen er IKKE koblet til noget: `submit()` i `src/lib/contact.ts` er en stub (`// TODO: wire to email/API`)
- Målinger/tal i 3D-scenen er illustrative

## Næste skridt
1. Bekræft tekster og fotorettigheder, foto af Yalcin
2. Formular: Formspree, eller Supabase Edge Function + Resend (behold honeypot-feltet; ingen nøgler i klienten)
3. Domæne og hosting
4. Analytics og cookie-samtykke
5. Evt. CMS til tekster og team

## Struktur
`src/content.ts` tekster · `src/scene/` 3D (`site.ts` geometri, `HeroScene.tsx` kamera og loop) · `src/components/` sektioner, `Photo` (billeder), `SiteIllustration` (SVG-fallback) · `src/lib/` scroll, formular, miljø.

## QA-hook for 3D-scenen (`window.__a2o`)

Kun med `?debug` (hero-scenen, `src/scene/HeroScene.tsx`).

URL-flag: `?webgl=off` (SVG-fallback), `?debug`. Tidslinjen (vinduer i p) ligger i `src/scene/timeline.ts` og bruges af hero-scenen og SVG-fallback.

## Asset sources (check before launch)
- `public/video/hero-*.mp4`: **stock footage** supplied for the pitch. Confirm the licence, or replace it with A2O's own footage before going live.
- `public/photos/svc-banearbejdere-*`: stock. Replace with a real A2O track photo.
- Brolæggere, Tømrere and Maskinførere photos: branded but possibly AI-edited. Confirm the client owns them.
- Originals are in `photo-sources/` (not shipped).
