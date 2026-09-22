import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface ProductPageProps {
  params: Promise<{
    storeSlug: string;
    productId: string;
  }>;
}

// Server-side helper to initialize Firestore
function getDb() {
  const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0811373568',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  };

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

// Transform product image to Cloudinary fast CDN URL with OpenGraph dimensions (1200x630)
function getCloudinaryProductOgImage(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&auto=format&fit=crop&q=80';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/');
  }
  return url;
}

// 1. Dynamic Server-Side SEO & OpenGraph Generation for Facebook/WhatsApp/Googlebot
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const db = getDb();

  try {
    const pRef = doc(db, 'products', productId);
    const pSnap = await getDoc(pRef);

    if (!pSnap.exists()) {
      return {
        title: 'Product Not Found | Dokani',
        description: 'The requested product is unavailable or has been removed.',
      };
    }

    const prod = pSnap.data();
    const ogImage = getCloudinaryProductOgImage(prod.imageUrl);
    const title = `${prod.title} – ৳${prod.price?.toLocaleString('en-BD')} | ${prod.vendorName || 'Dokani'}`;
    const description = prod.description
      ? prod.description.slice(0, 160)
      : `Buy ${prod.title} with Cash on Delivery nationwide in Bangladesh.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: prod.title,
          },
        ],
        type: 'website',
        locale: 'bn_BD',
        siteName: 'Dokani',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (err) {
    console.error('Error generating product metadata:', err);
    return {
      title: 'Product | Dokani',
    };
  }
}

// 2. Server Component Page
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const db = getDb();

  const pRef = doc(db, 'products', productId);
  const pSnap = await getDoc(pRef);

  if (!pSnap.exists()) {
    notFound();
  }

  const product = pSnap.data();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
        {/* Product Image Stage */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Details & Ordering */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{product.vendorName || 'Verified Merchant'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.title}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-600">
                ৳{product.price?.toLocaleString('en-BD')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  ৳{product.originalPrice?.toLocaleString('en-BD')}
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Product Overview
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Quality product sold by verified merchant on Dokani platform.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              Order with Cash on Delivery
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Free returns & Cash on Delivery available anywhere in Bangladesh.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
