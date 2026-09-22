/**
 * Dokani Standalone Database Seeder (seed.js)
 * Automatically populates 10 Real-like Bangladeshi Demo Vendors & Products into Firebase Firestore
 * Run via: node seed.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Read config
const configPath = './firebase-applet-config.json';
if (!fs.existsSync(configPath)) {
  console.error('firebase-applet-config.json not found!');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DEMO_VENDORS = [
  {
    id: 'vendor-gents-wardrobe',
    storeName: 'Gents Wardrobe BD',
    ownerEmail: 'gents.demo@gmail.com',
    ownerUid: 'uid-gents-demo',
    whatsapp: '01711902233',
    category: 'Men\'s Fashion',
    description: 'Premier menswear boutique specializing in premium cotton Panjabis and shirts in Dhaka.',
    district: 'Dhaka',
    address: 'Police Plaza Concord, Gulshan 1, Dhaka',
    bannerUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-lady-style',
    storeName: 'Lady Style BD',
    ownerEmail: 'ladystyle.demo@gmail.com',
    ownerUid: 'uid-ladystyle-demo',
    whatsapp: '01819445566',
    category: 'Women\'s Fashion',
    description: 'Authentic Tangail & Dhakai Jamdani sarees, boutique kurtis, and designer 3-piece sets.',
    district: 'Chittagong',
    address: 'Afmi Plaza, Nasirabad, Chittagong',
    bannerUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-chronos-watches',
    storeName: 'Chronos Watches BD',
    ownerEmail: 'chronos.demo@gmail.com',
    ownerUid: 'uid-chronos-demo',
    whatsapp: '01912889900',
    category: 'Watches & Accessories',
    description: '100% genuine wristwatches, chronograph timepieces, and modern AMOLED smartwatches.',
    district: 'Sylhet',
    address: 'Al-Hamra Shopping City, Zindabazar, Sylhet',
    bannerUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-gadget-sphere',
    storeName: 'Gadget Sphere',
    ownerEmail: 'gadgetsphere.demo@gmail.com',
    ownerUid: 'uid-gadgetsphere-demo',
    whatsapp: '01611334455',
    category: 'Mobile & Electronics',
    description: 'Smart lifestyle gear, wireless earbuds, magnetic power banks, and fast charging docks.',
    district: 'Dhaka',
    address: 'Eastern Plaza, Hatirpool, Dhaka',
    bannerUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-footwear-nation',
    storeName: 'Footwear Nation',
    ownerEmail: 'footwearnation.demo@gmail.com',
    ownerUid: 'uid-footwear-demo',
    whatsapp: '01712556677',
    category: 'Footwear',
    description: 'Handcrafted genuine leather formal shoes, breathable running sneakers, and sandals.',
    district: 'Gazipur',
    address: 'Tongi Bazar, Gazipur',
    bannerUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-organic-food',
    storeName: 'Organic Food BD',
    ownerEmail: 'organicfood.demo@gmail.com',
    ownerUid: 'uid-organic-demo',
    whatsapp: '01815667788',
    category: 'Groceries & Organic',
    description: '100% natural foods: Sundarban floral raw honey, mustard oil, and village cow ghee.',
    district: 'Rajshahi',
    address: 'Shaheb Bazar Zero Point, Rajshahi',
    bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-kids-mart',
    storeName: 'Kids Mart BD',
    ownerEmail: 'kidsmart.demo@gmail.com',
    ownerUid: 'uid-kidsmart-demo',
    whatsapp: '01918334422',
    category: 'Baby & Kids',
    description: 'Non-toxic, ultra-soft newborn infant wear, toys, and baby feeding accessories.',
    district: 'Dhaka',
    address: 'Shimanto Square, Dhanmondi 2, Dhaka',
    bannerUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-beauty-secrets',
    storeName: 'Beauty Secrets BD',
    ownerEmail: 'beautysecrets.demo@gmail.com',
    ownerUid: 'uid-beauty-demo',
    whatsapp: '01719223311',
    category: 'Beauty & Skincare',
    description: 'Halal, organic, chemical-free herbal skincare formulated for South Asian skin.',
    district: 'Bogura',
    address: 'Nawab Bari Road, Bogura',
    bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-home-comforts',
    storeName: 'Home Comforts',
    ownerEmail: 'homecomforts.demo@gmail.com',
    ownerUid: 'uid-home-demo',
    whatsapp: '01811442299',
    category: 'Home & Living',
    description: '300TC Egyptian cotton bed linens, cozy handloom throw cushions, and kitchenware.',
    district: 'Cumilla',
    address: 'Kandirpar Commercial Complex, Cumilla',
    bannerUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-tech-hub',
    storeName: 'Tech Hub BD',
    ownerEmail: 'techhub.demo@gmail.com',
    ownerUid: 'uid-techhub-demo',
    whatsapp: '01619887700',
    category: 'Computer & Peripherals',
    description: 'Mechanical hot-swappable keyboards, lightweight esports mice, and desk accessories.',
    district: 'Dhaka',
    address: 'Multiplan Center, New Elephant Road, Dhaka',
    bannerUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    isDemo: true,
    isApproved: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  },
];

const DEMO_PRODUCTS = [
  {
    id: 'prod-gents-panjabi-01',
    vendorId: 'vendor-gents-wardrobe',
    storeName: 'Gents Wardrobe BD',
    title: 'Premium Egyptian Cotton Embroidered Panjabi - Royal Navy',
    description: '100% fine Egyptian combed cotton with intricate neckline resham thread embroidery. Breathable and tailored for Eid celebrations and formal Bangladeshi gatherings.',
    category: 'Men\'s Fashion',
    price: 2450,
    discountPrice: 2150,
    stock: 45,
    primaryImage: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80',
    tags: ['Panjabi', 'Cotton', 'Eid Collection', 'Gents Fashion', 'Dhaka'],
    isDemo: true,
    status: 'active',
    rating: 4.9,
    reviewsCount: 28,
    seo: {
      metaTitle: 'Premium Egyptian Cotton Embroidered Panjabi | Best Price in Bangladesh - Gents Wardrobe BD',
      metaDescription: 'Buy authentic Premium Egyptian Cotton Embroidered Panjabi online from Gents Wardrobe BD at ৳2150 BDT. 100% genuine quality, cash on delivery, and fast home delivery across Bangladesh.',
      altText: 'Buy Premium Egyptian Cotton Embroidered Panjabi online from Gents Wardrobe BD Bangladesh',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-lady-jamdani-01',
    vendorId: 'vendor-lady-style',
    storeName: 'Lady Style BD',
    title: 'Handwoven Dhakai Jamdani Saree (84 Count Cotton) - Crimson Red',
    description: 'Authentic 84-count handloom Dhakai Jamdani saree woven by master artisans in Demra, Narayanganj. Traditional floral motifs with matching unstitched blouse piece.',
    category: 'Women\'s Fashion',
    price: 5950,
    discountPrice: 5200,
    stock: 12,
    primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    tags: ['Jamdani', 'Saree', 'Dhakai Jamdani', 'Handloom', 'Chittagong'],
    isDemo: true,
    status: 'active',
    rating: 5.0,
    reviewsCount: 34,
    seo: {
      metaTitle: 'Handwoven Dhakai Jamdani Saree (84 Count) | Best Price in Bangladesh - Lady Style BD',
      metaDescription: 'Buy authentic Handwoven Dhakai Jamdani Saree online from Lady Style BD at ৳5200 BDT. 100% genuine quality, cash on delivery, and fast home delivery across Bangladesh.',
      altText: 'Buy Handwoven Dhakai Jamdani Saree online from Lady Style BD Bangladesh',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-watch-naviforce-01',
    vendorId: 'vendor-chronos-watches',
    storeName: 'Chronos Watches BD',
    title: 'Naviforce Dual Movement Quartz Chronograph Stainless Steel Watch',
    description: 'Heavy duty 30M waterproof men wristwatch with digital-analog dual display, luminous hands, and 1-year official brand warranty card included.',
    category: 'Watches & Accessories',
    price: 2850,
    discountPrice: 2490,
    stock: 30,
    primaryImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    tags: ['Watches', 'Naviforce', 'Chronograph', 'Men Watch', 'Sylhet'],
    isDemo: true,
    status: 'active',
    rating: 4.8,
    reviewsCount: 19,
    seo: {
      metaTitle: 'Naviforce Dual Movement Chronograph Watch | Best Price in Bangladesh - Chronos Watches BD',
      metaDescription: 'Buy authentic Naviforce Dual Movement Chronograph Watch online from Chronos Watches BD at ৳2490 BDT. Official warranty and cash on delivery in Bangladesh.',
      altText: 'Buy Naviforce Dual Movement Chronograph Watch online from Chronos Watches BD Bangladesh',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-organic-honey-01',
    vendorId: 'vendor-organic-food',
    storeName: 'Organic Food BD',
    title: 'Raw Floral Sundarbans Honey (Khalisha Flower Extract) - 500g',
    description: '100% pure unfiltered raw honey collected by traditional Mouwals from deep Sundarban mangrove forests. Lab tested zero added sugar or preservatives.',
    category: 'Groceries & Organic',
    price: 850,
    discountPrice: 750,
    stock: 100,
    primaryImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
    tags: ['Honey', 'Sundarbans', 'Organic Food', 'Raw Honey', 'Rajshahi'],
    isDemo: true,
    status: 'active',
    rating: 5.0,
    reviewsCount: 42,
    seo: {
      metaTitle: 'Raw Floral Sundarbans Honey 500g | Best Price in Bangladesh - Organic Food BD',
      metaDescription: 'Buy authentic Raw Floral Sundarbans Honey online from Organic Food BD at ৳750 BDT. 100% natural, cash on delivery, and fast home delivery across Bangladesh.',
      altText: 'Buy Raw Floral Sundarbans Honey online from Organic Food BD Bangladesh',
    },
    createdAt: new Date().toISOString(),
  }
];

async function seed() {
  console.log('Seeding 10 Dokani Demo Vendors to Firestore...');
  for (const v of DEMO_VENDORS) {
    await setDoc(doc(db, 'vendors', v.id), v);
    console.log(`✓ Seeded vendor: ${v.storeName} (${v.ownerEmail})`);
  }

  console.log('Seeding Products to Firestore...');
  for (const p of DEMO_PRODUCTS) {
    await setDoc(doc(db, 'products', p.id), p);
    console.log(`✓ Seeded product: ${p.title}`);
  }

  console.log('Done seeding!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
