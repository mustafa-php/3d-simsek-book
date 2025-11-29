# 📚 SimsekBook - 3D FlipBook JavaScript Library

Modern, full-featured 3D page-flipping flipbook JavaScript library. Zero dependencies, smooth animations, touch support, and comprehensive features.

[English](#english) | [Türkçe](#türkçe)

---

## English

### ✨ Features

- **3D Page Flip Animation** - Realistic page turning with CSS3 3D transforms
- **Touch Support** - Swipe gestures for mobile devices
- **Responsive Design** - Adapts to all screen sizes
- **Vanilla JavaScript** - No external dependencies
- **Performance Optimized** - Smooth 60fps animations
- **PDF Support** - Load and display PDF documents (with PDF.js)
- **Image Gallery** - View multiple images as a flipbook
- **Sound Effects** - Realistic page flip sounds
- **Zoom Control** - Pinch-to-zoom, mouse wheel, double-tap
- **Bookmarks** - Mark and save favorite pages
- **Thumbnails** - Quick page navigation panel
- **Keyboard Navigation** - Full keyboard control
- **Dark/Light Theme** - Customizable themes
- **Fullscreen Mode** - Immersive reading experience

### 📦 Installation

#### NPM
```bash
npm install 3d-simsek-book
```

#### CDN
```html
<link rel="stylesheet" href="https://unpkg.com/3d-simsek-book/src/styles/simsek-book.css">
<script type="module">
  import { SimsekBook } from 'https://unpkg.com/3d-simsek-book/src/simsek-book.js';
</script>
```

#### Manual
Download and include the files:
```html
<link rel="stylesheet" href="src/styles/simsek-book.css">
<script type="module" src="src/simsek-book.js"></script>
```

### 🚀 Quick Start

```html
<div id="book-container"></div>

<script type="module">
  import { SimsekBook } from './src/simsek-book.js';

  const book = new SimsekBook('#book-container', {
    pages: [
      'images/page1.jpg',
      'images/page2.jpg',
      'images/page3.jpg',
      // ... more pages
    ],
    width: 900,
    height: 600
  });
</script>
```

### 📖 API Documentation

#### Constructor

```javascript
const book = new SimsekBook(container, options);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `string \| HTMLElement` | CSS selector or DOM element |
| `options` | `Object` | Configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pages` | `Array<string> \| string` | `[]` | Array of image URLs or PDF file path |
| `width` | `number` | `800` | Book width in pixels |
| `height` | `number` | `600` | Book height in pixels |
| `pageFlipDuration` | `number` | `1000` | Page flip animation duration (ms) |
| `enableSound` | `boolean` | `true` | Enable page flip sounds |
| `soundVolume` | `number` | `0.5` | Sound volume (0-1) |
| `pageFlipSound` | `string` | `null` | Custom page flip sound URL |
| `enableZoom` | `boolean` | `true` | Enable zoom functionality |
| `zoomMin` | `number` | `1` | Minimum zoom level |
| `zoomMax` | `number` | `3` | Maximum zoom level |
| `enableBookmarks` | `boolean` | `true` | Enable bookmarking |
| `enableThumbnails` | `boolean` | `true` | Enable thumbnail panel |
| `enableKeyboard` | `boolean` | `true` | Enable keyboard navigation |
| `enableSwipe` | `boolean` | `true` | Enable swipe gestures |
| `enableFullscreen` | `boolean` | `true` | Enable fullscreen mode |
| `autoPlay` | `boolean` | `false` | Auto-play page flipping |
| `autoPlayInterval` | `number` | `5000` | Auto-play interval (ms) |
| `rtl` | `boolean` | `false` | Right-to-left mode |
| `bookId` | `string` | auto | Unique ID for bookmark storage |

#### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onPageFlip` | `(pageNumber)` | Called when page is flipped |
| `onZoom` | `(zoomLevel)` | Called when zoom changes |
| `onBookmark` | `(pageNumber, isBookmarked)` | Called when bookmark changes |
| `onReady` | `(instance)` | Called when book is ready |
| `onError` | `(error)` | Called on error |

#### Methods

```javascript
// Navigation
book.nextPage();              // Go to next page
book.prevPage();              // Go to previous page
book.goToPage(5);             // Go to specific page (0-indexed)
book.getCurrentPage();        // Get current page number
book.getTotalPages();         // Get total page count

// Zoom
book.zoom(1.5);               // Set zoom level
book.zoomIn();                // Zoom in
book.zoomOut();               // Zoom out
book.resetZoom();             // Reset zoom to 1
book.getZoom();               // Get current zoom level

// Bookmarks
book.toggleBookmark();        // Toggle bookmark on current page
book.isBookmarked();          // Check if current page is bookmarked
book.getBookmarks();          // Get all bookmarked pages

// Panels
book.toggleThumbnails();      // Toggle thumbnail panel

// Sound
book.toggleSound();           // Toggle sound on/off
book.setVolume(0.5);          // Set volume (0-1)

// Fullscreen
book.enterFullscreen();       // Enter fullscreen
book.exitFullscreen();        // Exit fullscreen
book.toggleFullscreen();      // Toggle fullscreen

// Auto-play
book.startAutoPlay();         // Start auto-play
book.stopAutoPlay();          // Stop auto-play

// Utilities
book.resize(width, height);   // Resize book
book.destroy();               // Destroy instance
```

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate pages |
| `Home` / `End` | First / Last page |
| `Page Up` / `Page Down` | Previous / Next page |
| `Space` | Next page |
| `Shift + Space` | Previous page |
| `+` / `-` | Zoom in / out |
| `Escape` | Exit fullscreen / Close panels |
| `Ctrl + T` | Toggle thumbnails |
| `Ctrl + B` | Toggle bookmarks |
| `Ctrl + F` | Toggle fullscreen |

### 🎨 CSS Customization

Use CSS custom properties to customize the appearance:

```css
:root {
  /* Colors */
  --simsek-primary: #007bff;
  --simsek-book-bg: #2a2a2a;
  --simsek-page-bg: #ffffff;
  
  /* Controls */
  --simsek-controls-bg: rgba(0, 0, 0, 0.85);
  --simsek-btn-bg: rgba(255, 255, 255, 0.1);
  
  /* Effects */
  --simsek-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  --simsek-border-radius: 8px;
}
```

### 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| iOS Safari | 12+ |
| Android Chrome | 60+ |

### 📄 PDF Support

To use PDF support, include PDF.js library:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>

<script type="module">
  import { SimsekBook } from './src/simsek-book.js';

  const book = new SimsekBook('#container', {
    pages: 'document.pdf',
    width: 900,
    height: 650
  });
</script>
```

---

## Türkçe

### ✨ Özellikler

- **3D Sayfa Çevirme Animasyonu** - CSS3 3D dönüşümleri ile gerçekçi sayfa çevirme
- **Dokunmatik Destek** - Mobil cihazlarda kaydırma hareketleri
- **Duyarlı Tasarım** - Tüm ekran boyutlarına uyum
- **Saf JavaScript** - Dış bağımlılık yok
- **Performans Optimizasyonu** - Akıcı 60fps animasyonlar
- **PDF Desteği** - PDF belgelerini yükle ve görüntüle (PDF.js ile)
- **Resim Galerisi** - Birden fazla resmi flipbook olarak görüntüle
- **Ses Efektleri** - Gerçekçi sayfa çevirme sesleri
- **Zoom Kontrolü** - Pinch-to-zoom, fare tekerleği, çift dokunma
- **Yer İmleri** - Favori sayfaları işaretle ve kaydet
- **Küçük Resimler** - Hızlı sayfa navigasyon paneli
- **Klavye Navigasyonu** - Tam klavye kontrolü
- **Koyu/Açık Tema** - Özelleştirilebilir temalar
- **Tam Ekran Modu** - Sürükleyici okuma deneyimi

### 📦 Kurulum

#### NPM
```bash
npm install 3d-simsek-book
```

#### CDN
```html
<link rel="stylesheet" href="https://unpkg.com/3d-simsek-book/src/styles/simsek-book.css">
<script type="module">
  import { SimsekBook } from 'https://unpkg.com/3d-simsek-book/src/simsek-book.js';
</script>
```

#### Manuel
Dosyaları indirip dahil edin:
```html
<link rel="stylesheet" href="src/styles/simsek-book.css">
<script type="module" src="src/simsek-book.js"></script>
```

### 🚀 Hızlı Başlangıç

```html
<div id="book-container"></div>

<script type="module">
  import { SimsekBook } from './src/simsek-book.js';

  const book = new SimsekBook('#book-container', {
    pages: [
      'images/sayfa1.jpg',
      'images/sayfa2.jpg',
      'images/sayfa3.jpg',
      // ... daha fazla sayfa
    ],
    width: 900,
    height: 600
  });
</script>
```

### 📖 API Dokümantasyonu

#### Yapıcı

```javascript
const book = new SimsekBook(container, options);
```

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `container` | `string \| HTMLElement` | CSS seçici veya DOM elementi |
| `options` | `Object` | Yapılandırma seçenekleri |

#### Seçenekler

| Seçenek | Tip | Varsayılan | Açıklama |
|---------|-----|------------|----------|
| `pages` | `Array<string> \| string` | `[]` | Resim URL'leri dizisi veya PDF dosya yolu |
| `width` | `number` | `800` | Kitap genişliği (piksel) |
| `height` | `number` | `600` | Kitap yüksekliği (piksel) |
| `pageFlipDuration` | `number` | `1000` | Sayfa çevirme animasyon süresi (ms) |
| `enableSound` | `boolean` | `true` | Sayfa çevirme seslerini etkinleştir |
| `soundVolume` | `number` | `0.5` | Ses seviyesi (0-1) |
| `enableZoom` | `boolean` | `true` | Zoom işlevini etkinleştir |
| `zoomMin` | `number` | `1` | Minimum zoom seviyesi |
| `zoomMax` | `number` | `3` | Maksimum zoom seviyesi |
| `enableBookmarks` | `boolean` | `true` | Yer imlerini etkinleştir |
| `enableThumbnails` | `boolean` | `true` | Küçük resim panelini etkinleştir |
| `enableKeyboard` | `boolean` | `true` | Klavye navigasyonunu etkinleştir |
| `enableSwipe` | `boolean` | `true` | Kaydırma hareketlerini etkinleştir |
| `rtl` | `boolean` | `false` | Sağdan sola modu |

#### Metodlar

```javascript
// Navigasyon
book.nextPage();              // Sonraki sayfaya git
book.prevPage();              // Önceki sayfaya git
book.goToPage(5);             // Belirli sayfaya git (0'dan başlar)
book.getCurrentPage();        // Mevcut sayfa numarasını al
book.getTotalPages();         // Toplam sayfa sayısını al

// Zoom
book.zoom(1.5);               // Zoom seviyesini ayarla
book.zoomIn();                // Yakınlaştır
book.zoomOut();               // Uzaklaştır
book.resetZoom();             // Zoom'u sıfırla
book.getZoom();               // Mevcut zoom seviyesini al

// Yer İmleri
book.toggleBookmark();        // Mevcut sayfada yer imi aç/kapat
book.isBookmarked();          // Mevcut sayfa işaretli mi kontrol et
book.getBookmarks();          // Tüm işaretli sayfaları al

// Paneller
book.toggleThumbnails();      // Küçük resim panelini aç/kapat

// Ses
book.toggleSound();           // Sesi aç/kapat
book.setVolume(0.5);          // Ses seviyesini ayarla (0-1)

// Tam Ekran
book.enterFullscreen();       // Tam ekrana gir
book.exitFullscreen();        // Tam ekrandan çık
book.toggleFullscreen();      // Tam ekranı aç/kapat

// Yardımcılar
book.resize(width, height);   // Kitabı yeniden boyutlandır
book.destroy();               // Örneği yok et
```

### ⌨️ Klavye Kısayolları

| Tuş | Eylem |
|-----|-------|
| `←` `→` | Sayfalarda gezin |
| `Home` / `End` | İlk / Son sayfa |
| `Page Up` / `Page Down` | Önceki / Sonraki sayfa |
| `Space` | Sonraki sayfa |
| `Shift + Space` | Önceki sayfa |
| `+` / `-` | Yakınlaştır / Uzaklaştır |
| `Escape` | Tam ekrandan çık / Panelleri kapat |
| `Ctrl + T` | Küçük resimleri aç/kapat |
| `Ctrl + B` | Yer imlerini aç/kapat |
| `Ctrl + F` | Tam ekranı aç/kapat |

---

## 📁 Project Structure

```
3d-simsek-book/
├── src/
│   ├── simsek-book.js          # Main library file
│   ├── modules/
│   │   ├── page-flip.js        # 3D page flip engine
│   │   ├── pdf-loader.js       # PDF support module
│   │   ├── image-gallery.js    # Image gallery module
│   │   ├── audio-manager.js    # Sound effects module
│   │   ├── zoom-controller.js  # Zoom control module
│   │   ├── bookmark-manager.js # Bookmark module
│   │   ├── thumbnail-panel.js  # Thumbnail module
│   │   └── keyboard-nav.js     # Keyboard navigation module
│   └── styles/
│       └── simsek-book.css     # Styles
├── examples/
│   ├── basic.html              # Basic usage example
│   ├── pdf-viewer.html         # PDF viewer example
│   ├── image-gallery.html      # Image gallery example
│   └── full-featured.html      # Full features example
├── assets/
│   └── sounds/
│       └── README.md           # Sound file info
├── README.md                   # Documentation
├── package.json
└── LICENSE
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/mustafa-php/3d-simsek-book/issues) page.