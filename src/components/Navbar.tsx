import React, { useState } from 'react';
import { useAuth, ADMIN_PRIMARY_EMAIL } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from './AuthModal';
import {
  ShoppingBag,
  Store,
  Shield,
  Search,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { currentUser, userProfile, isAdmin, isVendor, loginWithGoogle, quickLoginAsAdmin, logout } = useAuth();
  const { cartCount, setIsCartDrawerOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner: Bangladeshi customer trust bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Genuine Bangladeshi Stores
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Cash on Delivery & bKash available</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {/* Secret Dev Quick Access Button */}
            <button
              id="admin-quick-access-btn"
              type="button"
              onClick={quickLoginAsAdmin}
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded transition-colors font-mono"
              title="Dev Quick Access as Admin (obaedulhaque19@gmail.com)"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Access</span>
            </button>
            <span className="text-slate-500">|</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Control Center
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
                দ
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center">
                  Dokani<span className="text-emerald-600">.</span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wide">
                  মাল্টি-ভেন্ডর প্ল্যাটফর্ম
                </p>
              </div>
            </button>
          </div>

          {/* Search Field */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Panjabi, Jamdani saree, gadgets, honey, watches..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Vendor Portal / Add Product */}
            <button
              id="nav-vendor-portal-btn"
              onClick={() => onNavigate('vendor-portal')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                currentView === 'vendor-portal'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Vendor Portal</span>
            </button>

            {/* Admin Panel (visible if admin) */}
            {isAdmin && (
              <button
                id="nav-admin-panel-btn"
                onClick={() => onNavigate('admin')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* Cart Button with Count Badge */}
            <button
              id="nav-cart-btn"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-xl transition-all cursor-pointer"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Google Login */}
            {currentUser || userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-medium text-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {userProfile?.displayName || currentUser?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {userProfile?.displayName || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {userProfile?.email || currentUser?.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-emerald-50 text-emerald-700">
                        Role: {userProfile?.role || 'Customer'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onNavigate('vendor-portal');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Store className="w-4 h-4 text-slate-500" />
                      <span>Vendor Dashboard</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>Admin Control Center</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>সাইন-ইন / নিবন্ধন</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, stores, categories..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-4 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home & All Categories
          </button>
          <button
            onClick={() => {
              onNavigate('vendor-portal');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
          >
            <Store className="w-4 h-4" />
            <span>Vendor Portal (Sell on Dokani)</span>
          </button>
          <button
            onClick={() => {
              onNavigate('admin');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Control Panel</span>
          </button>
        </div>
      )}

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}
