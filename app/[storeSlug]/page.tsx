import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

interface PageProps {
  params: Promise<{
    storeSlug: string;
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

// Transform image to Cloudinary fast CDN URL
function getCloudinaryOgImage(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&auto=format&fit=crop&q=80';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/');
  }
  return url;
}

// 1. Dynamic Server-Side SEO & OpenGraph Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  const db = getDb();

  try {
    const q = query(collection(db, 'vendors'), where('id', '==', storeSlug));
    const snap = await getDocs(q);

    if (snap.empty) {
      return {
        title: 'Store Not Found | Dokani',
        description: 'The requested store could not be located on the Dokani marketplace.',
      };
    }

    const store = snap.docs[0].data();
    const ogImage = getCloudinaryOgImage(store.logoUrl || store.bannerUrl);

    return {
      title: `${store.storeName} – Official Store`,
      description: store.description || `Browse quality products from ${store.storeName} on Dokani with Cash on Delivery nationwide.`,
      openGraph: {
        title: `${store.storeName} – Official Store | Dokani`,
        description: store.description || `Explore genuine products from ${store.storeName}.`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: store.storeName,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${store.storeName} – Official Store | Dokani`,
        description: store.description || `Explore genuine products from ${store.storeName}.`,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating store metadata:', error);
    return {
      title: 'Store | Dokani',
    };
  }
}

// 2. Server Component Page
export default async function StorePage({ params }: PageProps) {
  const { storeSlug } = await params;
  const db = getDb();

  const q = query(collection(db, 'vendors'), where('id', '==', storeSlug));
  const snap = await getDocs(q);

  if (snap.empty) {
    notFound();
  }

  const store = snap.docs[0].data();

  // Fetch products for this vendor
  const pQuery = query(collection(db, 'products'), where('vendorId', '==', storeSlug));
  const pSnap = await getDocs(pQuery);
  const products = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Store Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Verified Bangladeshi Merchant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{store.storeName}</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">{store.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>District: <strong className="text-white">{store.district || 'Dhaka'}</strong></span>
            <span>Category: <strong className="text-white">{store.category || 'General'}</strong></span>
            <span>Support: <strong className="text-emerald-400">{store.whatsapp}</strong></span>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          All Products ({products.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((prod: any) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                <img
                  src={prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                  alt={prod.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{prod.title}</h3>
                <p className="text-emerald-600 font-extrabold text-base mt-1">
                  ৳{prod.price?.toLocaleString('en-BD')}
                </p>
                <a
                  href={`/${storeSlug}/${prod.id}`}
                  className="mt-3 block text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View Details & Order
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
