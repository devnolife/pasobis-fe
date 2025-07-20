# WhatsApp Broadcast Manager

Fitur WhatsApp Broadcast Manager adalah sistem terintegrasi untuk mengelola broadcast pesan WhatsApp ke mahasiswa berdasarkan data dari file Excel atau CSV.

## Fitur Utama

### 1. Upload File Data Mahasiswa
- **Format yang didukung**: .xlsx, .xls, .csv
- **Maksimal ukuran file**: 10MB
- **Drag & drop support**: Ya
- **Auto-detection field**: Ya

### 2. Field Detection Otomatis
System akan otomatis mendeteksi kolom-kolom berikut:
- `nama` / `name` → Nama mahasiswa
- `nomor_hp` / `no_hp` / `phone` → Nomor WhatsApp
- `pilihan1` / `choice1` → Pilihan program studi pertama
- `pilihan2` / `choice2` → Pilihan program studi kedua
- `pilihan3` / `choice3` → Pilihan program studi ketiga
- `prodi` / `program` → Program studi yang lulus

### 3. Preview & Selection
- Tampilan data mahasiswa dalam bentuk card
- Checkbox untuk memilih mahasiswa yang akan di-broadcast
- Search & filter functionality
- Preview pesan sebelum dikirim

### 4. Broadcast Settings
- **Delay antar pesan**: 1-60 detik (default: 3 detik)
- **Batch size**: 1-50 nomor per batch (default: 10)
- **Template pesan**: Customizable dengan placeholder

### 5. Template Pesan
Gunakan placeholder berikut dalam template pesan:
- `{nama}` → Nama mahasiswa
- `{pilihan1}` → Pilihan program studi 1
- `{pilihan2}` → Pilihan program studi 2
- `{pilihan3}` → Pilihan program studi 3
- `{prodi_lulus}` → Program studi yang lulus

Contoh template:
```
Halo {nama}, terima kasih telah mendaftar. Pilihan program studi Anda: {pilihan1}, {pilihan2}, {pilihan3}.
```

### 6. Real-time Broadcast
- Progress tracking
- Batch monitoring
- Status individual (pending, sending, sent, failed)
- Pause/resume functionality
- Stop & reset capability

## Format File Sample

Download file contoh: `sample-mahasiswa-data.csv`

```csv
nama,nomor_hp,pilihan1,pilihan2,pilihan3,email
Ahmad Budi,08123456789,Teknik Informatika,Sistem Informasi,Teknik Elektro,ahmad.budi@email.com
Siti Rahma,08234567890,Manajemen,Akuntansi,Ekonomi,siti.rahma@email.com
```

## Workflow

1. **Upload File**
   - Drag & drop atau klik untuk upload
   - System akan validasi format dan ukuran file
   - Auto-detection field akan berjalan

2. **Preview Data**
   - Review data yang ter-detect
   - Atur pengaturan broadcast (delay, batch size)
   - Customize template pesan
   - Pilih mahasiswa yang akan di-broadcast

3. **Broadcast**
   - Monitor progress real-time
   - Pause/resume jika diperlukan
   - Lihat status individual mahasiswa
   - Summary hasil broadcast

## Error Handling

- Validasi format file
- Validasi ukuran file
- Error handling untuk API WhatsApp
- Retry mechanism
- Logging untuk debugging

## API Integration

Saat ini menggunakan simulasi API. Untuk integrasi dengan WhatsApp Business API yang sesungguhnya, ganti fungsi `sendWhatsAppMessage` di komponen dengan implementasi API yang sebenarnya.

## Technical Details

- **Framework**: Next.js 14, React 18
- **UI Library**: Tailwind CSS, shadcn/ui
- **File Processing**: XLSX.js untuk Excel, native text parsing untuk CSV
- **State Management**: React useState, useCallback
- **Error Handling**: Try-catch dengan toast notifications
- **Type Safety**: Full TypeScript support
