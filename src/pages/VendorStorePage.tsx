import React, { useState, useEffect } from 'react';
import { Vendor, Product, Review } from '../types';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Star,
  ShieldCheck,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';

interface VendorStorePageProps {
  vendorId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function VendorStorePage({ vendorId, onBack, onSelectProduct }: VendorStorePageProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorAndProducts = async () => {
      setLoading(true);
      try {
        // Fetch vendor
        const vRef = doc(db, 'vendors', vendorId);
        const vSnap = await getDoc(vRef);
        if (vSnap.exists()) {
          setVendor({ id: vSnap.id, ...(vSnap.data() as any) });
        }

        // Fetch products
        const pQuery = query(collection(db, 'products'), where('vendorId', '==', vendorId));
        const pSnap = await getDocs(pQuery);
        const pList: Product[] = [];
        pSnap.forEach((d) => pList.push({ id: d.id, ...(d.data() as any) }));
        setProducts(pList);
      } catch (err) {
        console.error('Error fetching vendor storefront:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorAndProducts();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-semibold">Loading Vendor Storefront...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Store Not Found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to All Stores</span>
      </button>

      {/* Store Banner & Bio */}
      <div className="relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl">
        {vendor.bannerUrl && (
          <div className="absolute inset-0 opacity-30">
            <img src={vendor.bannerUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative p-6 sm:p-10 z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden">
              <img
                src={vendor.logoUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80'}
                alt={vendor.storeName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {vendor.storeName}
                </h1>
                {vendor.isApproved && (
                  <span className="p-1 bg-emerald-500 text-white rounded-full" title="Verified Bangladeshi Merchant">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
                {vendor.isDemo && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-md">
                    Demo Store
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {vendor.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {vendor.district}, Bangladesh
                </span>
                <span>•</span>
                <span className="text-slate-400">{vendor.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                  {vendor.whatsapp}
                </span>
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/${vendor.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(
              `Hello ${vendor.storeName}, I am browsing your products on Dokani and have an inquiry.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Products from {vendor.storeName} ({products.length})</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            No products available from this store currently.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
