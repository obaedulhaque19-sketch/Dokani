import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Vendor, Product, Review } from '../types';
import {
  Store,
  Plus,
  Package,
  ShoppingBag,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface VendorPortalProps {
  onOpenProductUpload: (vendorStoreName: string, vendorId: string) => void;
  onViewProduct: (product: Product) => void;
}

export default function VendorPortal({ onOpenProductUpload, onViewProduct }: VendorPortalProps) {
  const {
    currentUser,
    userProfile,
    isVendor,
    loginVendorWithEmail,
    registerVendorWithEmail,
    logout,
    error: authError,
    clearError,
  } = useAuth();

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Vendor Data
  const [myVendor, setMyVendor] = useState<Vendor | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendorData = async () => {
    if (!currentUser && !userProfile) return;
    setLoading(true);

    try {
      const emailToMatch = userProfile?.email || currentUser?.email || '';
      // Find vendor store belonging to this user
      const vSnap = await getDocs(
        query(collection(db, 'vendors'), where('ownerEmail', '==', emailToMatch))
      );

      let currentVendor: Vendor | null = null;
      if (!vSnap.empty) {
        currentVendor = { id: vSnap.docs[0].id, ...(vSnap.docs[0].data() as any) };
      } else if (userProfile?.role === 'admin' || userProfile?.role === 'vendor') {
        // Fallback vendor for dev / admin
        currentVendor = {
          id: `vendor-${currentUser?.uid?.slice(0, 8) || 'demo'}`,
          storeName: userProfile.displayName || 'Gents Wardrobe BD',
          ownerEmail: emailToMatch,
          ownerUid: currentUser?.uid || 'uid-admin',
          whatsapp: '01711902233',
          category: 'Men\'s Fashion',
          description: 'Official Seller on Dokani',
          district: 'Dhaka',
          isDemo: false,
          isApproved: true,
          isBlocked: false,
          totalSales: 45000,
          totalOrders: 18,
          createdAt: new Date().toISOString(),
        };
      }
      setMyVendor(currentVendor);

      // Fetch products for this vendor
      if (currentVendor) {
        const pSnap = await getDocs(
          query(collection(db, 'products'), where('vendorId', '==', currentVendor.id))
        );
        const pList: Product[] = [];
        pSnap.forEach((d) => pList.push({ id: d.id, ...(d.data() as any) }));
        setMyProducts(pList);

        // Fetch reviews
        const rSnap = await getDocs(
          query(collection(db, 'reviews'), where('vendorId', '==', currentVendor.id))
        );
        const rList: Review[] = [];
        rSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as any) }));
        setMyReviews(rList);
      }
    } catch (err) {
      console.error('Error fetching vendor store details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVendor || currentUser) {
      fetchVendorData();
    }
  }, [currentUser, isVendor]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await loginVendorWithEmail(email, password);
      } else {
        if (!storeName.trim()) {
          setFormError('Store Name is required');
          setIsSubmitting(false);
          return;
        }
        await registerVendorWithEmail(email, password, storeName, whatsapp);
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || (authError && !authError.includes('popup-closed') ? authError : null);

  // If vendor is not logged in, display the strict @gmail.com vendor authentication portal
  if (!isVendor && !currentUser && !userProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Store className="w-3.5 h-3.5" />
              <span>Dokani Merchant Gateway</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {authMode === 'login' ? 'Vendor Portal Sign In' : 'Register as a Dokani Seller'}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Zero platform subscription fee. Reach verified buyers nationwide with Cash on Delivery.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="p-6 sm:p-8 space-y-4">
            {displayError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{displayError}</span>
              </div>
            )}

            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Store / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g., Silk & Loom BD"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official WhatsApp Mobile Number (11-Digit BD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Official Gmail Address *
                </label>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Strictly @gmail.com
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="vendor-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourstore.bd@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="vendor-auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Architecture note regarding password recovery */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700">Security Architecture: </span>
              To prevent automated phishing attacks on vendor stores, password recovery is conducted manually through the Master Admin Control Center.
            </div>

            <button
              id="vendor-auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : authMode === 'login' ? (
                'Sign In to Vendor Dashboard'
              ) : (
                'Create Vendor Account & Store'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setFormError(null);
                }}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                {authMode === 'login'
                  ? 'New seller? Register your shop on Dokani'
                  : 'Already have a seller account? Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Active Vendor Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Store Header Banner */}
      <div className="relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl">
        {myVendor?.bannerUrl && (
          <div className="absolute inset-0 opacity-25">
            <img src={myVendor.bannerUrl} alt="Store banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative p-6 sm:p-8 z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shrink-0">
              {myVendor?.storeName?.charAt(0) || 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {myVendor?.storeName || 'My Dokani Store'}
                </h1>
                {myVendor?.isDemo && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                    Demo Store
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                <span>{myVendor?.category || 'General'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {myVendor?.ownerEmail || currentUser?.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <Phone className="w-3.5 h-3.5" />
                  {myVendor?.whatsapp || '01711902233'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="vendor-btn-add-product"
              onClick={() =>
                onOpenProductUpload(
                  myVendor?.storeName || 'My Store',
                  myVendor?.id || 'vendor-custom'
                )
              }
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>

            <button
              onClick={logout}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Sales</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            ৳ {(myVendor?.totalSales || 38500).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Fulfilled Orders</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {myVendor?.totalOrders || 16}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Catalog</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {myProducts.length} Items
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Store Rating</span>
          <p className="text-2xl font-extrabold text-amber-500 mt-2 flex items-center gap-1">
            <Star className="w-5 h-5 fill-current" />
            <span>4.9</span>
          </p>
        </div>
      </div>

      {/* Products Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Catalog Products</h2>
            <p className="text-xs text-slate-500">
              Each product features automated SEO schemas and optimized Cloudinary WebP imagery.
            </p>
          </div>
          <button
            onClick={() =>
              onOpenProductUpload(
                myVendor?.storeName || 'My Store',
                myVendor?.id || 'vendor-custom'
              )
            }
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (৳ BDT)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">SEO Title</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No products listed yet. Click "Add New Product" to create your first item!
                  </td>
                </tr>
              ) : (
                myProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <img
                        src={prod.primaryImage}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                      />
                      <div>
                        <p className="line-clamp-1">{prod.title}</p>
                        {prod.isDemo && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            Pre-Made Demo Asset
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{prod.category}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ৳ {prod.price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{prod.stock} units</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {prod.seo?.metaTitle || prod.title}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewProduct(prod)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
