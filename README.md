# Vendor Portal Iframe POC

This is a small React app that renders vendor portal views inside an iframe.
It provides tabs for a few example pages and injects query parameters so the
portal can detect it is embedded.

## Query parameters used

- `lang` for language (example: `en`, `ar`)
- `view` for the requested portal view
- `embed=1` to indicate iframe usage

## Local development

```bash
cd iframe-poc
npm install
npm run dev
```

### Configuration

Create a `.env` file if you want defaults:

```bash
VITE_VENDOR_PORTAL_BASE_URL=https://staging.vendor-portal.example.com
VITE_VENDOR_PORTAL_LANG=en
```

## Build

```bash
npm run build
```

## Hosting (free options)

Netlify and Vercel are the easiest options for a static Vite app.
Both give you a free subdomain so you can test cross-domain iframe behavior.

### Netlify

1. New site from Git
2. Base directory: `iframe-poc`
3. Build command: `npm run build`
4. Publish directory: `dist`

### Vercel

1. Import the repo
2. Root directory: `iframe-poc`
3. Build command: `npm run build`
4. Output directory: `dist`

Cloudflare Pages works as well with the same build and output settings.

## Troubleshooting

If the iframe does not load, check the vendor portal response headers:

- `Content-Security-Policy` must allow your host in `frame-ancestors`
- `X-Frame-Options` should not be `DENY` or `SAMEORIGIN`
- Auth cookies may need `SameSite=None; Secure` for cross-domain iframes
