# Momotaro Sushi — Next.js Migration Notes

## Environment variable renames (Vite → Next.js)

| Old (VITE_*)                  | New (NEXT_PUBLIC_*)                  |
|-------------------------------|--------------------------------------|
| VITE_API_URL_MENU             | NEXT_PUBLIC_API_URL_MENU             |
| VITE_API_KEY                  | NEXT_PUBLIC_API_KEY                  |
| VITE_TABLE_TAP_URL            | NEXT_PUBLIC_TABLE_TAP_URL            |
| VITE_APP_MODE                 | NEXT_PUBLIC_APP_MODE                 |
| VITE_API_GATEWAY_URL          | NEXT_PUBLIC_API_GATEWAY_URL          |
| VITE_STRIPE_PUBLISHABLE_KEY   | NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   |
| VITE_TABLE_ID                 | NEXT_PUBLIC_TABLE_ID                 |
| VITE_PAYMENT_API_URL          | NEXT_PUBLIC_PAYMENT_API_URL          |

## GitHub Actions / k8s changes

- Docker port: **3000** (was 80) — update your k8s Service and Ingress
- Remove `nginx-exporter` sidecar from deployment.yaml (Next.js serves directly)
- GitHub Actions build-args: rename all VITE_ → NEXT_PUBLIC_ in your workflow YAML
- k8s ingress targetPort: change 80 → 3000

## What's new in the UI

- **Header**: logo centered on mobile, logo + text on desktop; no cart button in header
- **Category nav**: horizontal pill nav (replaces Sidebar)
- **Cart**: sticky gold bar at bottom → bottom sheet (Option B from comparison)
- **Design system**: Cormorant Garamond + Outfit fonts, gold accent (#c8a96e), dark charcoal bg
- **Cart state**: Zustand store (no more prop drilling through App.tsx)
- **Table routing**: middleware.ts reads hostname/pathname (Phase 3 enhancement ready)

## Logo

Replace the `桃` placeholder in `components/ui/Header.tsx` with:
```tsx
<img src="/logo.png" alt="Momotaro Sushi" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
```
And add your logo PNG to the `/public` folder.

## Local dev

```bash
npm install
npm run dev          # http://localhost:3000
```
