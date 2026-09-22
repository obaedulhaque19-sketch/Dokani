import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useCart } from '../context/CartContext';
import { CustomerLead } from '../types';
import { ShieldCheck, Sparkles, AlertCircle, Phone, Mail, User, ArrowRight, X } from 'lucide-react';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadData: { fullName: string; email: string; whatsapp: string }) => void;
}

export const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
export const BD_PHONE_REGEX = /^(\+8801|01)[3-9]\d{8}$/;

export default function LeadCaptureModal({ isOpen, onClose, onSuccess }: LeadCaptureModalProps) {
  const { cart, cartTotal, cartCount, saveLeadLocally } = useCart();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [errors, setErrors] = useState<{ fullName?: string; email?: string; whatsapp?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { fullName?: string; email?: string; whatsapp?: string } = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = 'Please enter your full name (minimum 3 characters)';
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      newErrors.email = 'Gmail address is required';
    } else if (!GMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = 'Only valid @gmail.com addresses are permitted (e.g., yourname@gmail.com)';
    }

    const trimmedPhone = whatsapp.trim();
    if (!trimmedPhone) {
      newErrors.whatsapp = 'Bangladeshi WhatsApp number is required';
    } else if (!BD_PHONE_REGEX.test(trimmedPhone)) {
      newErrors.whatsapp = 'Invalid BD mobile number. Must be 11 digits (e.g., 01712345678 or +8801812345678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const formattedPhone = whatsapp.trim().startsWith('+88') ? whatsapp.trim() : `+88${whatsapp.trim()}`;
    const itemsSummary = cart.map((i) => `${i.product.title} (x${i.quantity})`).join(', ');

    const leadRecord: CustomerLead = {
      id: leadId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: formattedPhone,
      cartItemsCount: cartCount,
      cartTotal: cartTotal,
      cartItemsSummary: itemsSummary.slice(0, 500),
      status: 'captured',
      createdAt: new Date().toISOString(),
    };

    try {
      // Step 3: Instant Lead Generation in Firestore BEFORE final payment/placement
      await setDoc(doc(db, 'leads', leadId), leadRecord);

      // Step 4: Frictionless re-visits saved via browser LocalStorage
      saveLeadLocally({
        id: leadId,
        fullName: leadRecord.fullName,
        email: leadRecord.email,
        whatsapp: leadRecord.whatsapp,
      });

      setIsSubmitting(false);
      onSuccess({
        fullName: leadRecord.fullName,
        email: leadRecord.email,
        whatsapp: leadRecord.whatsapp,
      });
    } catch (err: any) {
      console.error('Lead capture error:', err);
      // Even if firestore network is momentarily constrained, preserve locally and proceed
      saveLeadLocally({
        fullName: leadRecord.fullName,
        email: leadRecord.email,
        whatsapp: leadRecord.whatsapp,
      });
      setIsSubmitting(false);
      onSuccess({
        fullName: leadRecord.fullName,
        email: leadRecord.email,
        whatsapp: leadRecord.whatsapp,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="lead-capture-modal-container"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Zero-Friction Checkout</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">Express Delivery Details</h3>
          <p className="text-emerald-100 text-xs mt-1">
            Fill once to unlock 1-Click order confirmation and real-time WhatsApp parcel tracking.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="lead-input-fullname"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="e.g., Tanvir Hasan"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.fullName ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>
            )}
          </div>

          {/* Official @gmail.com */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Official Gmail Address *
              </label>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                @gmail.com strictly verified
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="lead-input-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="e.g., tanvir.bd@gmail.com"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          {/* WhatsApp Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Bangladeshi WhatsApp Number *
              </label>
              <span className="text-[11px] text-slate-500">11 Digits</span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="lead-input-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                }}
                placeholder="017XXXXXXXX or +88018XXXXXXXX"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.whatsapp ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
            </div>
            {errors.whatsapp && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.whatsapp}</p>
            )}
          </div>

          {/* Order Snapshot Mini Summary */}
          <div className="pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Cart Total ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
            <span className="font-bold text-slate-900 text-sm">৳ {cartTotal.toLocaleString()} BDT</span>
          </div>

          {/* Submit Button */}
          <button
            id="lead-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Lead Verification & 100% Privacy Protection</span>
          </div>
        </form>
      </div>
    </div>
  );
}
