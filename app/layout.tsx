import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dokani.onrender.com'),
  title: {
    default: 'Dokani – Multi-Vendor E-Commerce Platform Bangladesh',
    template: '%s | Dokani',
  },
  description: '100% Genuine Bangladeshi Stores. Zero-friction checkout with Cash on Delivery and bKash nationwide.',
  openGraph: {
    title: 'Dokani – Multi-Vendor E-Commerce Platform',
    description: '100% Genuine Bangladeshi Stores. Zero-friction checkout with Cash on Delivery and bKash nationwide.',
    siteName: 'Dokani',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dokani – Multi-Vendor E-Commerce Platform',
    description: '100% Genuine Bangladeshi Stores. Zero-friction checkout with Cash on Delivery and bKash nationwide.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFC] text-slate-900 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
        {children}
      </body>
    </html>
  );
}
