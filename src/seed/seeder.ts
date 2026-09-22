import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DEMO_VENDORS, DEMO_PRODUCTS } from './seedData';
import { CustomerLead, Order, Review } from '../types';

export async function seedAllDemoData(onProgress?: (msg: string) => void): Promise<{ success: boolean; message: string }> {
  try {
    onProgress?.('Seeding 10 Real-like Demo Vendors into Firestore...');

    // 1. Seed Vendors
    for (const vendor of DEMO_VENDORS) {
      await setDoc(doc(db, 'vendors', vendor.id), {
        ...vendor,
        createdAt: vendor.createdAt || new Date().toISOString(),
      });
    }

    onProgress?.('Seeding Real-like Demo Products with automated SEO schemas...');

    // 2. Seed Products
    for (const product of DEMO_PRODUCTS) {
      await setDoc(doc(db, 'products', product.id), {
        ...product,
        createdAt: product.createdAt || new Date().toISOString(),
      });
    }

    onProgress?.('Seeding initial verified buyer reviews & customer leads...');

    // 3. Seed Sample Verified Reviews for initial social proof
    const sampleReviews: Review[] = [
      {
        id: 'rev-01',
        productId: 'prod-gents-panjabi-01',
        vendorId: 'vendor-gents-wardrobe',
        customerEmail: 'tanjim.ahmed@gmail.com',
        customerName: 'Tanjim Ahmed',
        rating: 5,
        comment: 'Assembled and delivered in 2 days to Uttara. The cotton quality is unbelievably soft and the navy color is gorgeous!',
        isVerifiedBuyer: true,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'rev-02',
        productId: 'prod-organic-honey-01',
        vendorId: 'vendor-organic-food',
        customerEmail: 'nazia.khan@gmail.com',
        customerName: 'Nazia Khan',
        rating: 5,
        comment: 'Genuine wild raw honey! It has that distinct floral aroma from the Sundarbans. Highly recommended for kids and family.',
        isVerifiedBuyer: true,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'rev-03',
        productId: 'prod-watch-naviforce-01',
        vendorId: 'vendor-chronos-watches',
        customerEmail: 'farhan.hasan@gmail.com',
        customerName: 'Farhan Hasan',
        rating: 5,
        comment: 'Solid weight, premium stainless steel finish. Came with the warranty card and original box.',
        isVerifiedBuyer: true,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ];

    for (const rev of sampleReviews) {
      await setDoc(doc(db, 'reviews', rev.id), rev);
    }

    // 4. Seed initial realistic leads for Lead Database demonstration
    const sampleLeads: CustomerLead[] = [
      {
        id: 'lead-01',
        fullName: 'Mahmudul Hasan',
        email: 'mahmud.bd@gmail.com',
        whatsapp: '01718899221',
        cartItemsCount: 2,
        cartTotal: 4400,
        cartItemsSummary: 'Egyptian Cotton Panjabi, Pure Linen Shirt',
        status: 'converted',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'lead-02',
        fullName: 'Shaila Parveen',
        email: 'shaila.parveen@gmail.com',
        whatsapp: '01819922334',
        cartItemsCount: 1,
        cartTotal: 5950,
        cartItemsSummary: 'Handwoven Dhakai Jamdani Saree',
        status: 'captured',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'lead-03',
        fullName: 'Arifur Rahman',
        email: 'arif.rahman.cse@gmail.com',
        whatsapp: '01912233445',
        cartItemsCount: 1,
        cartTotal: 3890,
        cartItemsSummary: 'AuraMech K68 Mechanical Keyboard',
        status: 'abandoned',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ];

    for (const lead of sampleLeads) {
      await setDoc(doc(db, 'leads', lead.id), lead);
    }

    // 5. Seed initial order
    const sampleOrder: Order = {
      id: 'ord-1001',
      customerEmail: 'mahmud.bd@gmail.com',
      customerName: 'Mahmudul Hasan',
      whatsapp: '01718899221',
      address: 'House 14, Road 7, Sector 4, Uttara',
      city: 'Dhaka',
      items: [
        {
          productId: 'prod-gents-panjabi-01',
          title: 'Premium Egyptian Cotton Embroidered Panjabi - Royal Navy',
          price: 2450,
          quantity: 1,
          primaryImage: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80',
          vendorId: 'vendor-gents-wardrobe',
          storeName: 'Gents Wardrobe BD',
        },
      ],
      subtotal: 2450,
      shippingFee: 60,
      total: 2510,
      paymentMethod: 'cod',
      status: 'completed',
      isDemo: true,
      vendorId: 'vendor-gents-wardrobe',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    };
    await setDoc(doc(db, 'orders', sampleOrder.id), sampleOrder);

    onProgress?.('Seeding complete! 10 Vendors, 14+ Products, Reviews, and Leads stored in Firestore.');
    return { success: true, message: 'Seeded 10 demo vendors and products successfully!' };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Seeding failed' };
  }
}

export async function clearDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    // Soft delete or remove demo products
    const prodsSnapshot = await getDocs(collection(db, 'products'));
    for (const docSnap of prodsSnapshot.docs) {
      if (docSnap.data().isDemo) {
        await deleteDoc(doc(db, 'products', docSnap.id));
      }
    }
    return { success: true, message: 'All demo items removed successfully.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'products');
  }
}
