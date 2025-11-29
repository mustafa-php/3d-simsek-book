/**
 * ImageGallery - Birden fazla resmi flipbook olarak görüntüleme
 * Lazy loading ile performans optimizasyonu
 */
export class ImageGallery {
  constructor(options = {}) {
    this.options = {
      lazyLoad: options.lazyLoad !== false,
      preloadCount: options.preloadCount || 2,
      onLoad: options.onLoad || null,
      onError: options.onError || null,
      ...options
    };
    
    this.images = [];
    this.loadedImages = new Map();
    this.loadingPromises = new Map();
    this.observer = null;
  }
  
  /**
   * Resimleri yükle
   * @param {Array<string>} sources - Resim URL'leri
   * @returns {Promise<Array>}
   */
  async load(sources) {
    this.images = sources.map((src, index) => ({
      src: src,
      index: index,
      loaded: false,
      element: null
    }));
    
    if (this.options.lazyLoad) {
      this._setupLazyLoading();
    } else {
      await this._loadAllImages();
    }
    
    return this.images;
  }
  
  _setupLazyLoading() {
    // Intersection Observer kullanarak lazy loading
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.dataset.index, 10);
              this._loadImage(index);
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  }
  
  async _loadAllImages() {
    const promises = this.images.map((_, index) => this._loadImage(index));
    await Promise.all(promises);
  }
  
  /**
   * Belirli bir resmi yükle
   * @param {number} index - Resim indeksi
   * @returns {Promise<HTMLImageElement>}
   */
  async _loadImage(index) {
    if (index < 0 || index >= this.images.length) {
      return null;
    }
    
    const imageData = this.images[index];
    
    // Zaten yüklendi mi?
    if (this.loadedImages.has(index)) {
      return this.loadedImages.get(index);
    }
    
    // Yükleniyor mu?
    if (this.loadingPromises.has(index)) {
      return this.loadingPromises.get(index);
    }
    
    // Yükleme işlemi başlat
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        imageData.loaded = true;
        imageData.element = img;
        this.loadedImages.set(index, img);
        this.loadingPromises.delete(index);
        
        if (this.options.onLoad) {
          this.options.onLoad(index, img);
        }
        
        resolve(img);
      };
      
      img.onerror = (error) => {
        this.loadingPromises.delete(index);
        
        if (this.options.onError) {
          this.options.onError(index, error);
        }
        
        reject(error);
      };
      
      img.src = imageData.src;
    });
    
    this.loadingPromises.set(index, loadPromise);
    return loadPromise;
  }
  
  /**
   * Sayfa için içerik al (lazy loading ile)
   * @param {number} index - Sayfa indeksi
   * @returns {string|HTMLImageElement}
   */
  getPageContent(index) {
    if (index < 0 || index >= this.images.length) {
      return null;
    }
    
    // Yüklü ise resmi döndür
    if (this.loadedImages.has(index)) {
      const img = this.loadedImages.get(index);
      const clone = img.cloneNode(true);
      clone.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
      return clone;
    }
    
    // Placeholder oluştur
    const placeholder = document.createElement('div');
    placeholder.className = 'simsek-image-placeholder';
    placeholder.dataset.index = index;
    placeholder.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--simsek-placeholder-bg, #f0f0f0);
    `;
    
    const spinner = document.createElement('div');
    spinner.className = 'simsek-spinner';
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 3px solid var(--simsek-spinner-color, #ddd);
      border-top-color: var(--simsek-primary, #007bff);
      border-radius: 50%;
      animation: simsek-spin 1s linear infinite;
    `;
    
    placeholder.appendChild(spinner);
    
    // Resmi arka planda yükle
    this._loadImage(index).then((img) => {
      if (placeholder.parentNode) {
        const clone = img.cloneNode(true);
        clone.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
        placeholder.innerHTML = '';
        placeholder.appendChild(clone);
      }
    }).catch(() => {
      placeholder.innerHTML = '<span style="color: #999;">Failed to load image</span>';
    });
    
    // Observer'a ekle
    if (this.observer) {
      this.observer.observe(placeholder);
    }
    
    return placeholder;
  }
  
  /**
   * Tüm sayfa içeriklerini al
   * @returns {Array}
   */
  getAllPageContents() {
    return this.images.map((_, index) => this.getPageContent(index));
  }
  
  /**
   * Belirli sayfaları önceden yükle
   * @param {number} currentIndex - Mevcut sayfa indeksi
   */
  preloadAround(currentIndex) {
    const count = this.options.preloadCount;
    
    for (let i = -count; i <= count; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < this.images.length) {
        this._loadImage(index);
      }
    }
  }
  
  /**
   * Thumbnail oluştur
   * @param {number} index - Resim indeksi
   * @param {number} maxWidth - Maksimum genişlik
   * @returns {Promise<HTMLCanvasElement>}
   */
  async createThumbnail(index, maxWidth = 150) {
    const img = await this._loadImage(index);
    
    if (!img) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = maxWidth / img.naturalWidth;
    canvas.width = maxWidth;
    canvas.height = img.naturalHeight * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return canvas;
  }
  
  /**
   * Resim sayısını al
   * @returns {number}
   */
  getCount() {
    return this.images.length;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.images = [];
    this.loadedImages.clear();
    this.loadingPromises.clear();
  }
}
