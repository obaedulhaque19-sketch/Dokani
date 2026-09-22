# Dokani Platform – Render Web Service & Next.js Architecture Guide

This project is now **100% production-ready for Render "Deploy a Web Service"** and structured with Next.js (App Router) parity.

---

## 1. Render "Deploy a Web Service" Deployment Ready

When creating a new service on Render:
1. Choose **Deploy a Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter

### How It Operates:
- **Build (`npm run build`):**
  1. Compiles frontend assets to `dist/`.
  2. Compiles and bundles `server.ts` into a self-contained CommonJS Node server (`dist/server.cjs`).
- **Start (`npm start`):**
  - Runs `node dist/server.cjs` listening on `process.env.PORT || 3000` on host `0.0.0.0`.
- **Health Check Path:**
  - Set Render health check path to: `/api/health`

---

## 2. Dynamic Server-Side SEO & OpenGraph (SSR)

When links are shared on **Facebook**, **WhatsApp**, **Twitter**, **Telegram**, or crawled by **Googlebot**:
- The Node server intercepts crawler requests for stores (`/:storeSlug`) and products (`/:storeSlug/:productId`).
- Dynamically queries **Firestore** in real-time.
- Formats images using **Cloudinary's fast CDN** (`w_1200,h_630,c_fill,q_auto,f_auto`).
- Injects dynamic `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, and `<meta property="og:url">` tags before returning pre-rendered HTML.
- Regular browser users receive the full interactive Dokani web application with zero friction.

---

## 3. Cloudinary Integration

- **Client Uploads & Compression:**
  - Located in `src/cloudinary.ts`.
  - Automatically compresses images into modern **WebP** format in the browser before upload to minimize bandwidth and latency.
- **Server API:**
  - Endpoint `/api/cloudinary/sign` generates upload signatures securely on the server.
- **CDN Serving:**
  - URLs are served with automatic format and quality flags (`f_auto,q_auto`).

---

## 4. Next.js App Router File Structure

The project includes Next.js App Router route handlers in `/app`:

```
app/
├── layout.tsx                     # Root Layout with metadataBase, fonts, and OpenGraph
├── [storeSlug]/
│   ├── page.tsx                   # Store Page with generateMetadata & Firestore SSR
│   └── [productId]/
│       └── page.tsx               # Product Page with generateMetadata & Cloudinary SSR OpenGraph
└── api/
    └── cloudinary/
        └── route.ts               # Server API route handler for Cloudinary
```

### Next.js `generateMetadata` Example:
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { storeSlug, productId } = await params;
  const product = await fetchProductFromFirestore(productId);
  return {
    title: `${product.title} – ৳${product.price} | Dokani`,
    openGraph: {
      images: [formatCloudinaryUrl(product.imageUrl)],
    },
  };
}
```

---

## 5. Environment Variables Configuration

Set these variables in Render Dashboard (**Environment** tab):

| Variable | Description |
| :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Public Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned preset |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
