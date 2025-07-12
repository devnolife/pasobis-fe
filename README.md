# Dashboard Registrasi Universitas

Dashboard modern dan responsif untuk sistem registrasi mahasiswa universitas.

## 🎯 Fitur Utama

- **Registrasi Mahasiswa** - Formulir pendaftaran mahasiswa baru dengan pilihan program studi
- **Generator Sapaan** - Pembuat sapaan personal untuk mahasiswa yang terdaftar
- **Dashboard Responsif** - Tampilan yang optimal di semua perangkat
- **UI/UX Modern** - Antarmuka yang bersih dan intuitif

## 🛠️ Teknologi

- **Next.js 14** - Framework React untuk produksi
- **TypeScript** - Type safety dan developer experience
- **Tailwind CSS** - Styling yang efisien dan responsif
- **Radix UI** - Komponen UI yang accessible
- **Lucide React** - Icons modern dan konsisten

## 🚀 Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd pasobis-fe
```

2. Install dependencies:
```bash
npm install
# atau
pnpm install
```

3. Jalankan development server:
```bash
npm run dev
# atau
pnpm dev
```

4. Buka [http://localhost:3000](http://localhost:3000) di browser

## 📱 Responsivitas

Dashboard ini dirancang untuk bekerja optimal di:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Layout Terbaru

### Perbaikan yang Dilakukan:
- ✅ **Mengatasi overlapping elements** - Layout sidebar dan konten utama tidak lagi saling menimpa
- ✅ **Responsivitas yang lebih baik** - Sidebar yang dapat di-collapse di mobile
- ✅ **Struktur yang lebih bersih** - Mengurangi kompleksitas provider dan context
- ✅ **Performance yang lebih baik** - Layout yang lebih efisien dengan less re-renders
- ✅ **Accessibility** - Focus management dan keyboard navigation

### Struktur Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                     Header (Sticky)                        │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│   Sidebar   │            Main Content                       │
│  (Fixed)    │              (Scrollable)                     │
│             │                                               │
│             │  ┌─────────────────────────────────────────┐  │
│             │  │              Card                       │  │
│             │  │                                         │  │
│             │  │         Form Content                    │  │
│             │  │                                         │  │
│             │  └─────────────────────────────────────────┘  │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

## 🔧 Komponen

### Layout Components:
- **Sidebar Navigation** - Menu navigasi dengan state management
- **Header** - Top bar dengan search dan user actions
- **Main Content** - Area konten utama dengan card wrapper

### Form Components:
- **Student Registration Form** - Formulir registrasi mahasiswa
- **Greeting Generator Form** - Generator sapaan personal

## 📋 Development Notes

### CSS Structure:
- Base styles menggunakan Tailwind CSS variables
- Custom utilities untuk scrollbar dan animations
- Responsive breakpoints yang konsisten
- Focus management untuk accessibility

### State Management:
- Local state dengan React hooks
- Context API untuk sharing data antar komponen
- Optimistic updates untuk better UX

## 🎯 Roadmap

- [ ] Dark mode support
- [ ] Data persistence dengan database
- [ ] Advanced form validation
- [ ] Export data functionality
- [ ] Multi-language support

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Dashboard Registrasi Universitas** - Sistem registrasi mahasiswa modern dan responsif 🎓
