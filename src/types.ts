export type UserRole = 'admin' | 'vendor' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  whatsapp?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  storeName: string;
  ownerEmail: string;
  ownerUid?: string;
  whatsapp: string;
  category: string;
  description: string;
  district: string;
  address?: string;
  bannerUrl?: string;
  logoUrl?: string;
  isDemo: boolean;
  isApproved: boolean;
  isBlocked: boolean;
  totalSales?: number;
  totalOrders?: number;
  createdAt: string;
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  altText: string;
  schemaJson?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  storeName: string;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  primaryImage: string;
  additionalImages?: string[];
  tags: string[];
  isDemo: boolean;
  status: 'active' | 'draft' | 'archived';
  rating?: number;
  reviewsCount?: number;
  seo?: ProductSEO;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface CustomerLead {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  cartItemsCount: number;
  cartTotal: number;
  cartItemsSummary?: string;
  status: 'captured' | 'converted' | 'abandoned';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  primaryImage: string;
  vendorId: string;
  storeName: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  whatsapp: string;
  address: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad';
  paymentPhone?: string;
  trxId?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  isDemo: boolean;
  vendorId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  vendorId: string;
  customerEmail: string;
  customerName: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  isVerifiedBuyer: boolean;
  createdAt: string;
}
