import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import LeadCaptureModal from './components/LeadCaptureModal';
import ProductUploadPage from './pages/ProductUploadPage';
import AdminDashboard from './pages/AdminDashboard';
import VendorPortal from './pages/VendorPortal';
import CheckoutPage from './pages/CheckoutPage';
import VendorStorePage from './pages/VendorStorePage';
import { Product, Vendor } from './types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { DEMO_PRODUCTS, DEMO_VENDORS } from './seed/seedData';
import { seedAllDemoData } from './seed/seeder';
import {
  Sparkles,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  Phone,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Search,
} from 'lucide-react';

const CATEGORIES = [
  'All Products',
  'Men\'s Fashion',
  'Women\'s Fashion',
  'Watches & Accessories',
  'Mobile & Electronics',
  'Footwear',
  'Groceries & Organic',
  'Baby & Kids',
  'Beauty & Skincare',
  'Home & Living',
  'Computer & Peripherals',
];

function MainContent() {
  const { isAdmin } = useAuth();
  const { savedLead } = useCart();

  // Navigation views: 'home' | 'vendor-portal' | 'product-upload' | 'admin' | 'checkout' | 'vendor-store'
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');

  // Products and Vendors from Firestore (fallback to local seed data for instant zero-latency loading)
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [vendors, setVendors] = useState<Vendor[]>(DEMO_VENDORS);
  const [loading, setLoading] = useState(false);

  // Modals
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // Vendor Upload helper params
  const [uploadStoreName, setUploadStoreName] = useState('My Store');
  const [uploadVendorId, setUploadVendorId] = useState('vendor-custom');

  // Check URL pathname for secret admin route: /x97-control-center-bd82
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('x97-control-center-bd82') || hash.includes('x97-control-center-bd82')) {
        setCurrentView('admin');
      }
    };
    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Fetch live products & vendors from Firestore
  const fetchMarketplaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const pSnap = await getDocs(collection(db, 'products'));
      if (!pSnap.empty) {
        const pList: Product[] = [];
        pSnap.forEach((docSnap) => {
          pList.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setProducts(pList);
      } else {
        // Automatically seed initial 10 vendors if Firestore is fresh
        seedAllDemoData();
      }

      // 2. Fetch Vendors
      const vSnap = await getDocs(collection(db, 'vendors'));
      if (!vSnap.empty) {
        const vList: Vendor[] = [];
        vSnap.forEach((docSnap) => {
          vList.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setVendors(vList);
      }
    } catch (err) {
      console.log('Using seeded data while Firestore syncs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  // Filter products based on search and selected category
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All Products' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Handle Checkout Click from Cart Drawer
  const handleProceedToCheckout = () => {
    // Zero-Friction rule: If customer already filled out lead details in this session / localStorage, skip modal!
    if (savedLead?.fullName && savedLead?.email && savedLead?.whatsapp) {
      setCurrentView('checkout');
    } else {
      setIsLeadModalOpen(true);
    }
  };

  const handleLeadCaptureSuccess = () => {
    setIsLeadModalOpen(false);
    setCurrentView('checkout');
  };

  const handleOpenProductUpload = (storeName: string, vendorId: string) => {
    setUploadStoreName(storeName);
    setUploadVendorId(vendorId);
    setCurrentView('product-upload');
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setCurrentView('home');
  };

  const handleVendorStoreClick = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setCurrentView('vendor-store');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin') {
            window.history.pushState({}, '', '/x97-control-center-bd82');
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentView !== 'home') setCurrentView('home');
        }}
      />

      {/* Cart Drawer Panel */}
      <CartDrawer onCheckoutClick={handleProceedToCheckout} />

      {/* Lead Capture Early Modal (Strict BD regex + @gmail.com) */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleLeadCaptureSuccess}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onVendorClick={handleVendorStoreClick}
        onBuyNowClick={() => {
          setActiveProduct(null);
          handleProceedToCheckout();
        }}
      />

      {/* Main Routed Views */}
      <main className="flex-1">
        {currentView === 'admin' && <AdminDashboard />}

        {currentView === 'vendor-portal' && (
          <VendorPortal
            onOpenProductUpload={handleOpenProductUpload}
            onViewProduct={(p) => setActiveProduct(p)}
          />
        )}

        {currentView === 'product-upload' && (
          <ProductUploadPage
            onBack={() => setCurrentView('vendor-portal')}
            onProductCreated={handleProductCreated}
            vendorStoreName={uploadStoreName}
            vendorId={uploadVendorId}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBack={() => setCurrentView('home')}
            onOrderSuccess={(orderId) => {
              console.log('Order completed:', orderId);
            }}
          />
        )}

        {currentView === 'vendor-store' && selectedVendorId && (
          <VendorStorePage
            vendorId={selectedVendorId}
            onBack={() => setCurrentView('home')}
            onSelectProduct={(p) => setActiveProduct(p)}
          />
        )}

        {/* HOME VIEW: The Marketplace */}
        {currentView === 'home' && (
          <div className="space-y-10 pb-16">
            {/* Hero Banner Section */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white relative overflow-hidden border-b border-emerald-900/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Zero-Friction Bangladeshi Multi-Vendor Hub</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Authentic Products from Trusted Bangladeshi Stores
                  </h1>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Shop direct from boutique weavers, electronics importers, and organic producers across Dhaka, Chittagong, Sylhet, and Rajshahi with Cash on Delivery and WhatsApp parcel tracking.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById('marketplace-catalog');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Browse All 10 Demo Stores
                    </button>

                    <button
                      onClick={() => setCurrentView('vendor-portal')}
                      className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-xs transition-colors cursor-pointer border border-white/10"
                    >
                      Open Your Shop (Zero Fees)
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Features Strip */}
              <div className="bg-slate-900/90 border-t border-slate-800/80 py-4 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cash on Delivery in 64 Districts</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verified Bangladeshi Merchants</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct WhatsApp Order Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>7-Day Return & Replacement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Bangladeshi Stores Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <span>Featured Stores & Boutiques</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    10 verified Bangladeshi merchant shops ready for shopping and ownership transfer
                  </p>
                </div>
              </div>

              {/* Horizontal Stores Scroll */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
                {vendors.slice(0, 10).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleVendorStoreClick(v.id)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/5 transition-all cursor-pointer group flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform">
                      <img
                        src={v.logoUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80'}
                        alt={v.storeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                      {v.storeName}
                    </h3>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {v.category}
                    </span>
                    <span className="mt-2 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {v.district}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div id="marketplace-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                </span>
                {selectedCategory !== 'All Products' && (
                  <button
                    onClick={() => setSelectedCategory('All Products')}
                    className="text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No items match your search</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for Panjabi, Jamdani, Earbuds, Watches, or Honey.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All Products');
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={(prod) => setActiveProduct(prod)}
                      onVendorClick={handleVendorStoreClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  দ
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Dokani<span className="text-emerald-500">.</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cost-efficient Multi-Vendor E-Commerce Platform built for Bangladeshi merchants and buyers. Cash on Delivery across 64 districts.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
                Popular Categories
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => setSelectedCategory('Men\'s Fashion')} className="hover:text-emerald-400">Men's Cotton Panjabi</button></li>
                <li><button onClick={() => setSelectedCategory('Women\'s Fashion')} className="hover:text-emerald-400">Tangail & Jamdani Sarees</button></li>
                <li><button onClick={() => setSelectedCategory('Groceries & Organic')} className="hover:text-emerald-400">Pure Sundarbans Honey</button></li>
                <li><button onClick={() => setSelectedCategory('Watches & Accessories')} className="hover:text-emerald-400">Chronograph Watches</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
                Seller Ecosystem
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => setCurrentView('vendor-portal')} className="hover:text-emerald-400">Seller Registration (@gmail.com)</button></li>
                <li><button onClick={() => setCurrentView('vendor-portal')} className="hover:text-emerald-400">Cloudinary WebP Uploads</button></li>
                <li><button onClick={() => setCurrentView('vendor-portal')} className="hover:text-emerald-400">Automated Google Shopping SEO</button></li>
                <li><span className="text-emerald-400">0% Platform Commission</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
                Security & Dev Access
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Built with Google Firebase Firestore, Hardened Master Gate Security Rules, and Cloudinary Image Delivery.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>Admin: obaedulhaque19@gmail.com</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Dokani Multi-Vendor Platform. All rights reserved.</p>
            <p>Developed with Zero-Cost Cloud Architecture for Bangladesh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainContent />
      </CartProvider>
    </AuthProvider>
  );
}
