import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'ShopBig - Nền Tảng Bán Hàng Ngoại Sàn Tự Động Hóa 100%',
  description: 'Giải pháp bán hàng độc lập: Giữ trọn 100% doanh thu, VietQR tự động 1s, đẩy đơn GHN/GHTK 1-chạm và đo lường Meta/TikTok CAPI chuẩn xác.',
  icons: {
    icon: [
      { url: '/images/logo.png' },
      { url: '/icon.png', sizes: '256x256', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/images/logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={jakarta.variable}>
      <body className={jakarta.className} style={{ backgroundColor: '#080a12', margin: 0, padding: 0 }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13161f',
              color: '#f8fafc',
              border: '1px solid #232838',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#13161f',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#13161f',
              },
            },
          }}
        />
      </body>
    </html>
  );
}