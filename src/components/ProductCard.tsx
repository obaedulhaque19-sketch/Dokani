import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { getOptimizedImageUrl } from '../cloudinary';
import { Star, ShoppingCart, Check, Store } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onVendorClick?: (vendorId: string) => void;
}

export default function ProductCard({ product, onSelect, onVendorClick }: ProductCardProps) {
  const { addToCart, cart } = useCart();
  const isInCart = cart.some((i) => i.product.id === product.id);

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const effectivePrice = product.discountPrice ?? product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Image & Badges */}
      <div 
        onClick={() => onSelect(product)}
        className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer"
      >
        <img
          src={getOptimizedImageUrl(product.primaryImage, { width: 500, height: 500, crop: 'fill' })}
          alt={product.seo?.altText || product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges container */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 text-[11px] font-extrabold text-white bg-rose-600 rounded-md shadow-xs">
              -{discountPercent}% OFF
            </span>
          )}
          {product.isDemo && (
            <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-900 bg-amber-200/90 backdrop-blur-xs rounded-md shadow-xs border border-amber-300">
              Demo Store
            </span>
          )}
        </div>

        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-medium text-slate-700 bg-white/90 backdrop-blur-xs rounded-md border border-slate-200">
          {product.category}
        </span>
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Name */}
          <div className="flex items-center gap-1 text-slate-500 text-[11px] mb-1">
            <Store className="w-3 h-3 text-emerald-600" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onVendorClick) onVendorClick(product.vendorId);
              }}
              className="hover:text-emerald-700 hover:underline truncate max-w-[160px] text-left"
            >
              {product.storeName}
            </button>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onSelect(product)}
            className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-2 leading-snug cursor-pointer transition-colors"
          >
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 font-bold text-slate-800 text-xs">
                {product.rating ? product.rating.toFixed(1) : '4.8'}
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              ({product.reviewsCount || 15} reviews)
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-extrabold text-slate-900">
              ৳ {effectivePrice.toLocaleString()}
            </div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through -mt-0.5">
                ৳ {product.price.toLocaleString()}
              </div>
            )}
          </div>

          <button
            id={`btn-add-to-cart-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className={`p-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isInCart
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
            }`}
            title="Add to Cart"
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
