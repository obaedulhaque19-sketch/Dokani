import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onCheckoutClick: () => void;
}

export default function CartDrawer({ onCheckoutClick }: CartDrawerProps) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Shopping Cart</h2>
                <p className="text-xs text-slate-500">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover authentic items from trusted Bangladeshi vendors and add them to your cart.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const effectivePrice = item.product.discountPrice ?? item.product.price;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3.5 p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                  >
                    <img
                      src={item.product.primaryImage}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-lg bg-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                            {item.product.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          {item.product.storeName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-white text-slate-600 rounded-l-md transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-white text-slate-600 rounded-r-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900">
                            ৳ {(effectivePrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Section */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">৳ {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery (BD)</span>
                  <span className="text-emerald-600 font-semibold">Calculated at Checkout</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span className="text-emerald-700">৳ {cartTotal.toLocaleString()} BDT</span>
                </div>
              </div>

              <button
                id="cart-drawer-checkout-btn"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onCheckoutClick();
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Friction Fast Ordering with WhatsApp confirmation</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
