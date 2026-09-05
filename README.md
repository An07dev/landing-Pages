# ShopBig Landing Page

Dự án Landing Page độc lập của ShopBig, được clone 100% đầy đủ giao diện, tính năng, hiệu ứng và tài nguyên.

## Cài đặt & Chạy ứng dụng

```bash
# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi chạy server phát triển (Development)
npm run dev

# Build bản sản xuất (Production)
npm run build

# Chạy bản sản xuất
npm start
```

## Cấu trúc thư mục

- `src/app/page.tsx`: Giao diện Landing Page chính (đường dẫn `/`)
- `src/app/landing/page.tsx`: Đường dẫn phụ `/landing`
- `src/app/page.module.css`: Toàn bộ CSS giao diện Landing Page
- `src/components/ui/`: Các component giao diện (ImageCarouselHero, Demo, Button...)
- `src/components/magicui/`: Hiệu ứng động MagicUI (AnimatedList, CoolMode, OrbitingCircles)
- `src/app/api/landing-leads/`: API thu thập đăng ký gói & sinh mã đơn
- `public/images/`: Toàn bộ hình ảnh, biểu tượng, mockups, logo đối tác