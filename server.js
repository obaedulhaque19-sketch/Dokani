import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Firebase server instance for SSR OpenGraph metadata fetching
let db = null;
try {
  let firebaseConfig = null;
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    firebaseConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    };
  }

  if (firebaseConfig && firebaseConfig.projectId) {
    const fbApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || undefined);
    console.log('[Dokani Server] Firestore SSR initialized successfully');
  }
} catch (err) {
  console.warn('[Dokani Server] Firebase initialization warning:', err);
}

// 1. Health API for Render Web Service health checks
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'dokani-web-service',
    platform: 'Render / Cloud Run',
    timestamp: new Date().toISOString(),
  });
});

// 2. Cloudinary Upload Signature API (Keeps API Secret safe on server)
app.post('/api/cloudinary/sign', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dokani_preset';

    res.json({
      timestamp,
      cloudName,
      uploadPreset,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Cloudinary signature generation failed' });
  }
});

// Helper to escape HTML attributes for safe meta tag injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Transform Cloudinary image for high-speed WebP social cards
function formatCloudinaryCardImage(url) {
  if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/');
  }
  return url;
}

// Dynamic OpenGraph / SSR injector for store and product links
async function injectDynamicMetadata(html, req) {
  const host = req.get('host') || 'dokani.onrender.com';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;

  let title = 'Dokani – Multi-Vendor E-Commerce Platform Bangladesh';
  let description = '100% Genuine Bangladeshi Stores. Cash on Delivery and bKash available nationwide.';
  let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80';

  try {
    const urlParts = req.path.split('/').filter(Boolean);

    // Case 1: Product route (e.g., /shop-slug/product-id or /product/product-id)
    if (urlParts.length >= 2 && db) {
      const productId = urlParts[1];
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const prodData = productSnap.data();
        title = `${prodData.title} – ৳${Number(prodData.price || 0).toLocaleString('en-BD')} | ${prodData.vendorName || 'Dokani'}`;
        description = prodData.description
          ? prodData.description.slice(0, 160)
          : `Order ${prodData.title} online with Cash on Delivery in Bangladesh.`;
        if (prodData.imageUrl) {
          imageUrl = formatCloudinaryCardImage(prodData.imageUrl);
        }
      }
    } 
    // Case 2: Store route (e.g., /shop-slug or /store/shop-slug)
    else if (urlParts.length === 1 && !urlParts[0].startsWith('api') && db) {
      const slug = urlParts[0];
      const vQuery = query(collection(db, 'vendors'), where('id', '==', slug));
      const vSnap = await getDocs(vQuery);

      if (!vSnap.empty) {
        const vData = vSnap.docs[0].data();
        title = `${vData.storeName} – Official Seller on Dokani`;
        description = vData.description || `Browse products from ${vData.storeName} with nationwide Cash on Delivery.`;
        if (vData.logoUrl) {
          imageUrl = formatCloudinaryCardImage(vData.logoUrl);
        }
      }
    }
  } catch (err) {
    console.warn('[Dokani SSR] Error fetching OpenGraph metadata:', err);
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = escapeHtml(imageUrl);
  const safeUrl = escapeHtml(fullUrl);

  return html
    .replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${safeImg}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${safeDesc}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${safeImg}" />`);
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Custom middleware to handle SSR OpenGraph previews for crawlers / direct sharing
    app.use(async (req, res, next) => {
      const userAgent = req.get('user-agent') || '';
      const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Googlebot|bingbot/i.test(userAgent);

      if (isCrawler && req.accepts('html') && !req.path.startsWith('/@') && !req.path.includes('.')) {
        try {
          const templatePath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(templatePath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          const injectedHtml = await injectDynamicMetadata(template, req);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(injectedHtml);
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    // Production mode for Render "Deploy a Web Service"
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const rawHtml = fs.readFileSync(indexPath, 'utf-8');
          const injectedHtml = await injectDynamicMetadata(rawHtml, req);
          res.status(200).set({ 'Content-Type': 'text/html' }).send(injectedHtml);
        } else {
          res.sendFile(indexPath);
        }
      } catch (e) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dokani Web Service] Running on port ${PORT} (${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'})`);
  });
}

startServer();
