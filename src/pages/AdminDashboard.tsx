import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Vendor, CustomerLead, Order, Product, Review } from '../types';
import { seedAllDemoData, clearDemoData } from '../seed/seeder';
import {
  Shield,
  Users,
  ShoppingBag,
  TrendingUp,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  Search,
  ExternalLink,
  Edit3,
  AlertTriangle,
  Lock,
  MessageSquare,
  Database,
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, userProfile } = useAuth();

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'overview' | 'vendors' | 'leads' | 'products' | 'reviews' | 'seeding'
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'leads' | 'products' | 'reviews' | 'seeding'>('overview');

  // Search filter
  const [filterQuery, setFilterQuery] = useState('');

  // Password Reset Modal State
  const [passwordResetVendor, setPasswordResetVendor] = useState<Vendor | null>(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Ownership Transfer Modal State
  const [transferVendor, setTransferVendor] = useState<Vendor | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Seeding Status
  const [seedingLog, setSeedingLog] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Vendors
      const vSnap = await getDocs(collection(db, 'vendors'));
      const vList: Vendor[] = [];
      vSnap.forEach((d) => vList.push({ id: d.id, ...(d.data() as any) }));
      setVendors(vList);

      // Fetch Leads
      const lSnap = await getDocs(collection(db, 'leads'));
      const lList: CustomerLead[] = [];
      lSnap.forEach((d) => lList.push({ id: d.id, ...(d.data() as any) }));
      lList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(lList);

      // Fetch Orders
      const oSnap = await getDocs(collection(db, 'orders'));
      const oList: Order[] = [];
      oSnap.forEach((d) => oList.push({ id: d.id, ...(d.data() as any) }));
      setOrders(oList);

      // Fetch Products
      const pSnap = await getDocs(collection(db, 'products'));
      const pList: Product[] = [];
      pSnap.forEach((d) => pList.push({ id: d.id, ...(d.data() as any) }));
      setProducts(pList);

      // Fetch Reviews
      const rSnap = await getDocs(collection(db, 'reviews'));
      const rList: Review[] = [];
      rSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as any) }));
      setReviews(rList);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const totalVendorsCount = vendors.length;
  const totalLeadsCount = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((convertedLeads / totalLeadsCount) * 100) : 0;

  // Toggle Vendor Approved / Blocked
  const toggleVendorStatus = async (vendor: Vendor, field: 'isApproved' | 'isBlocked') => {
    const nextVal = !vendor[field];
    try {
      await updateDoc(doc(db, 'vendors', vendor.id), { [field]: nextVal });
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, [field]: nextVal } : v))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${vendor.id}`);
    }
  };

  // Vendor Password Reset (Admin Manual Reset as specified in spec)
  const openPasswordReset = (vendor: Vendor) => {
    setPasswordResetVendor(vendor);
    // Generate secure randomized password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Dk!';
    for (let i = 0; i < 9; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewGeneratedPassword(pass);
    setPasswordResetSuccess(false);
  };

  const handleConfirmPasswordReset = async () => {
    if (!passwordResetVendor) return;
    try {
      // Record reset in vendor profile
      await updateDoc(doc(db, 'vendors', passwordResetVendor.id), {
        tempPassword: newGeneratedPassword,
        passwordResetAt: new Date().toISOString(),
      });
      setPasswordResetSuccess(true);
    } catch (err) {
      console.error('Failed to reset vendor password:', err);
    }
  };

  // Ownership Transfer (Admin can edit Demo Shop's email/phone to transfer to a real seller)
  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferVendor) return;

    setTransferError(null);
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(newOwnerEmail.trim())) {
      setTransferError('Owner Email must be an official @gmail.com address.');
      return;
    }

    const bdPhoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(newOwnerPhone.trim())) {
      setTransferError('Invalid BD phone number. Must be 11 digits (e.g., 01712345678).');
      return;
    }

    try {
      await updateDoc(doc(db, 'vendors', transferVendor.id), {
        ownerEmail: newOwnerEmail.trim(),
        whatsapp: newOwnerPhone.trim(),
        isDemo: false, // Transferred to real vendor
        transferredAt: new Date().toISOString(),
      });

      // Also update isDemo flag on all this vendor's products
      const vendorProds = products.filter((p) => p.vendorId === transferVendor.id);
      for (const p of vendorProds) {
        await updateDoc(doc(db, 'products', p.id), { isDemo: false });
      }

      setTransferVendor(null);
      fetchData();
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    }
  };

  // Bulk Demo Control
  const handleBulkDemoToggle = async (softDelete: boolean) => {
    if (!confirm(softDelete ? 'Are you sure you want to delete demo products from Firestore?' : 'Toggle demo items?')) return;
    try {
      if (softDelete) {
        await clearDemoData();
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // One-click Seed Trigger
  const runSeeder = async () => {
    setIsSeeding(true);
    setSeedingLog([]);
    const logProgress = (msg: string) => {
      setSeedingLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const res = await seedAllDemoData(logProgress);
    setIsSeeding(false);
    if (res.success) {
      fetchData();
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Permanently delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  // Delete review
  const handleDeleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono mb-2 border border-amber-500/30">
            <Shield className="w-3.5 h-3.5" />
            <span>Dokani Master Control Center (Route: /x97-control-center-bd82)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Logged in as: <span className="text-amber-300 font-mono font-semibold">{userProfile?.email || 'obaedulhaque19@gmail.com'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('seeding')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Demo Seeder & DB</span>
          </button>
        </div>
      </div>

      {/* Live Analytics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalOrdersCount}</span>
            <span className="text-xs text-emerald-600 font-medium ml-2">Live Orders</span>
          </div>
        </div>

        {/* Daily Revenue (BDT) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">৳ {totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">BDT</span>
          </div>
        </div>

        {/* Total Vendors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vendors</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalVendorsCount}</span>
            <span className="text-xs text-purple-600 font-medium ml-2">Stores</span>
          </div>
        </div>

        {/* Lead Conversion Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Conversion</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{conversionRate}%</span>
            <span className="text-xs text-slate-500 font-medium">({convertedLeads}/{totalLeadsCount} Leads)</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview & Live Orders
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'vendors'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Vendor Management ({vendors.length})
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'leads'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Lead Capture Database ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Product Moderation ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Review Moderation ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('seeding')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'seeding'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Demo Seeder & Transfer
        </button>
      </div>

      {/* Search within tab */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter current view..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* TAB 1: OVERVIEW & LIVE ORDERS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Customer Orders</h3>
                <p className="text-xs text-slate-500">
                  Real-time orders placed for both Demo and Live shops land directly here for manual fulfillment.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                {orders.length} Total Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Delivery Address</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Total (BDT)</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No customer orders received yet. Place an order in checkout to test live order processing!
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {o.id}
                          {o.isDemo && (
                            <span className="block text-[10px] text-amber-700 font-medium">Demo Order</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{o.customerName}</p>
                          <p className="text-[11px] text-slate-500">{o.customerEmail}</p>
                          <a
                            href={`https://wa.me/${o.whatsapp.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {o.whatsapp}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="line-clamp-2">{o.address}, {o.city}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{o.items?.length || 1} items</span>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {o.items?.map((i) => i.title).join(', ')}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                          ৳ {o.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-[11px]">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              o.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR MANAGEMENT & PASSWORD RESET */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vendor Management & Security</h3>
              <p className="text-xs text-slate-500">
                Approve, block, or reset vendor passwords manually. Ownership transfer allows selling pre-built stores to real Bangladeshi sellers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Owner Gmail</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors
                  .filter((v) =>
                    !filterQuery ||
                    v.storeName.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    v.ownerEmail.toLowerCase().includes(filterQuery.toLowerCase())
                  )
                  .map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {vendor.storeName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {vendor.ownerEmail}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://wa.me/${vendor.whatsapp.replace(/\+/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          {vendor.whatsapp}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">{vendor.district}</td>
                      <td className="py-3.5 px-4">
                        {vendor.isDemo ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-md">
                            Demo Shop
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                            Real Seller
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {vendor.isBlocked ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 rounded-md">
                            Blocked
                          </span>
                        ) : vendor.isApproved ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* Password Reset Manual Button */}
                        <button
                          onClick={() => openPasswordReset(vendor)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1"
                          title="Reset Vendor Password"
                        >
                          <Key className="w-3 h-3 text-amber-600" />
                          <span>Reset Pass</span>
                        </button>

                        {/* Ownership Transfer */}
                        <button
                          onClick={() => {
                            setTransferVendor(vendor);
                            setNewOwnerEmail(vendor.ownerEmail);
                            setNewOwnerPhone(vendor.whatsapp);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1"
                          title="Transfer Shop Ownership to Real Seller"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>

                        {/* Block/Approve Toggle */}
                        <button
                          onClick={() => toggleVendorStatus(vendor, 'isBlocked')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            vendor.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {vendor.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEAD CAPTURE DATABASE */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Captured Customer Leads (Pre-Checkout)</h3>
              <p className="text-xs text-slate-500">
                Early lead capture logs Name, Gmail, and WhatsApp before checkout completion for SMS/WhatsApp retargeting.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {leads.length} Leads Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Verified Gmail</th>
                  <th className="py-3 px-4">WhatsApp (BD)</th>
                  <th className="py-3 px-4">Cart Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Captured Time</th>
                  <th className="py-3 px-4 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No leads captured yet. Leads will automatically appear here when customers enter their details in checkout!
                    </td>
                  </tr>
                ) : (
                  leads
                    .filter((l) =>
                      !filterQuery ||
                      l.fullName.toLowerCase().includes(filterQuery.toLowerCase()) ||
                      l.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
                      l.whatsapp.includes(filterQuery)
                    )
                    .map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{lead.fullName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">{lead.email}</td>
                        <td className="py-3.5 px-4 font-medium">{lead.whatsapp}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          ৳ {lead.cartTotal.toLocaleString()}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {lead.cartItemsCount} {lead.cartItemsCount === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.status === 'converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.status === 'captured'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(
                              `Hello ${lead.fullName}, thank you for visiting Dokani! Can we help you complete your order for ৳${lead.cartTotal}?`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[11px] transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp Lead</span>
                          </a>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Product Catalog Moderation</h3>
              <p className="text-xs text-slate-500">
                Inspect live products, SEO tags, and remove spam or unauthorized listings.
              </p>
            </div>
            <button
              onClick={() => handleBulkDemoToggle(true)}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-xl border border-rose-200"
            >
              Purge Demo Products
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (BDT)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">SEO Title</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products
                  .filter((p) =>
                    !filterQuery ||
                    p.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    p.storeName.toLowerCase().includes(filterQuery.toLowerCase())
                  )
                  .map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <img
                          src={product.primaryImage}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0"
                        />
                        <div className="max-w-xs">
                          <p className="truncate font-bold">{product.title}</p>
                          {product.isDemo && (
                            <span className="text-[10px] text-amber-700 font-semibold">Demo Item</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">{product.storeName}</td>
                      <td className="py-3.5 px-4">{product.category}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">৳ {product.price.toLocaleString()}</td>
                      <td className="py-3.5 px-4">{product.stock}</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {product.seo?.metaTitle || product.title}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Customer Reviews & Ratings Moderation</h3>
              <p className="text-xs text-slate-500">
                Reviews with "Verified Buyer" badge are checked against completed customer orders.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Comment</th>
                  <th className="py-3 px-4">Verified Purchase</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No reviews submitted yet.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.customerName}
                        <span className="block text-[11px] text-slate-400 font-normal">{r.customerEmail}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-500">
                        ★ {r.rating} / 5
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">{r.comment}</td>
                      <td className="py-3.5 px-4">
                        {r.isVerifiedBuyer ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            Verified Buyer
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DEMO SEEDER & TRANSFER CONTROLS */}
      {activeTab === 'seeding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seeder Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cold-Start Seeding Engine</h3>
                <p className="text-xs text-slate-500">
                  Populate 10 Real-like Demo Vendors across diverse categories into Firestore.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will write 10 realistic Bangladeshi shops (Gents Wardrobe, Lady Style BD, Chronos Watches, Gadget Sphere, Footwear Nation, Organic Food, Kids Mart, Beauty Secrets, Home Comforts, Tech Hub BD) with 14+ products, automated SEO metadata, and initial leads.
            </p>

            <button
              onClick={runSeeder}
              disabled={isSeeding}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-60 cursor-pointer"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Seeding 10 Vendors to Firestore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Seed: 10 Real-Like Vendors & Catalogs</span>
                </>
              )}
            </button>

            {seedingLog.length > 0 && (
              <div className="mt-4 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl max-h-48 overflow-y-auto space-y-1">
                {seedingLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Demo Toggle Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Demo Data Controls</h3>
                <p className="text-xs text-slate-500">
                  Manage `isDemo: true` products and search engine indexing.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All demo shops are marked with <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">isDemo: true</code>. Product detail pages for demo items automatically include <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">&lt;meta name="robots" content="noindex, nofollow"&gt;</code> so test data does not pollute live Google search indexes.
            </p>

            <button
              onClick={() => handleBulkDemoToggle(true)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Soft-Delete / Remove All Demo Catalog Items</span>
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-800 font-bold mb-3">
              <Key className="w-5 h-5 text-amber-600" />
              <h3>Admin Manual Password Reset</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Per platform security architecture, vendors have no self-service password reset. The Admin manually generates and issues new credentials for <strong className="text-slate-900">{passwordResetVendor.storeName}</strong> ({passwordResetVendor.ownerEmail}).
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                New Generated Password:
              </span>
              <div className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                {newGeneratedPassword}
              </div>
            </div>

            {passwordResetSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated in vendor profile! Provide this password to the seller.</span>
              </div>
            ) : (
              <button
                onClick={handleConfirmPasswordReset}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors mb-3 cursor-pointer"
              >
                Confirm & Issue Temporary Password
              </button>
            )}

            <button
              onClick={() => setPasswordResetVendor(null)}
              className="w-full py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Ownership Transfer Modal */}
      {transferVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-purple-900 font-bold mb-3">
              <Edit3 className="w-5 h-5 text-purple-600" />
              <h3>Transfer Demo Shop Ownership</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Transfer <strong className="text-slate-900">{transferVendor.storeName}</strong> and all its pre-made SEO products to a real Bangladeshi vendor.
            </p>

            {transferError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl mb-3">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferOwnership} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Seller Gmail Address (@gmail.com) *
                </label>
                <input
                  type="email"
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="seller@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Seller WhatsApp Number (BD 11-digit) *
                </label>
                <input
                  type="tel"
                  required
                  value={newOwnerPhone}
                  onChange={(e) => setNewOwnerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors mt-2 cursor-pointer"
              >
                Transfer Shop & SEO Assets
              </button>
              <button
                type="button"
                onClick={() => setTransferVendor(null)}
                className="w-full py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
