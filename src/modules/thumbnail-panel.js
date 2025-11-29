/**
 * ThumbnailPanel - Sayfa önizleme modülü
 * Lazy loading thumbnails
 */
export class ThumbnailPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enabled: options.enabled !== false,
      thumbnailWidth: options.thumbnailWidth || 120,
      thumbnailHeight: options.thumbnailHeight || 160,
      lazyLoad: options.lazyLoad !== false,
      onPageSelect: options.onPageSelect || null,
      ...options
    };
    
    this.panel = null;
    this.thumbnails = [];
    this.observer = null;
    this.isOpen = false;
    this.currentPage = 0;
  }
  
  /**
   * Panel oluştur
   */
  create() {
    if (!this.options.enabled) return;
    
    this.panel = document.createElement('div');
    this.panel.className = 'simsek-thumbnail-panel';
    
    this.panel.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 180px;
      height: 100%;
      background: var(--simsek-panel-bg, #fff);
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      overflow-y: auto;
      overflow-x: hidden;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    `;
    
    // Header
    const header = document.createElement('div');
    header.className = 'simsek-thumbnail-header';
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid var(--simsek-border-color, #eee);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;
    header.innerHTML = `
      <span>📑 Pages</span>
      <button class="simsek-panel-close" style="
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--simsek-text-color, #333);
      ">&times;</button>
    `;
    
    // Thumbnail container
    this.thumbnailContainer = document.createElement('div');
    this.thumbnailContainer.className = 'simsek-thumbnail-container';
    this.thumbnailContainer.style.cssText = `
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    this.panel.appendChild(header);
    this.panel.appendChild(this.thumbnailContainer);
    this.container.appendChild(this.panel);
    
    // Close button
    header.querySelector('.simsek-panel-close').addEventListener('click', () => {
      this.close();
    });
    
    // Setup lazy loading
    if (this.options.lazyLoad) {
      this._setupLazyLoading();
    }
  }
  
  _setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this._loadThumbnail(entry.target);
            }
          });
        },
        { 
          root: this.panel,
          rootMargin: '50px' 
        }
      );
    }
  }
  
  _loadThumbnail(element) {
    const index = parseInt(element.dataset.index, 10);
    const thumbnailData = this.thumbnails[index];
    
    if (!thumbnailData || thumbnailData.loaded) return;
    
    // Placeholder'ı gerçek içerikle değiştir
    if (thumbnailData.loadCallback) {
      thumbnailData.loadCallback(element, index);
      thumbnailData.loaded = true;
    }
    
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }
  
  /**
   * Thumbnails yükle
   * @param {Array} pages - Sayfa içerikleri veya URLs
   * @param {Function} renderCallback - Her thumbnail için render callback
   */
  loadThumbnails(pages, renderCallback) {
    if (!this.thumbnailContainer) return;
    
    this.thumbnailContainer.innerHTML = '';
    this.thumbnails = [];
    
    pages.forEach((page, index) => {
      const thumbnail = this._createThumbnail(index, page, renderCallback);
      this.thumbnailContainer.appendChild(thumbnail);
      
      this.thumbnails.push({
        element: thumbnail,
        loaded: !this.options.lazyLoad,
        loadCallback: renderCallback
      });
      
      if (this.options.lazyLoad && this.observer) {
        this.observer.observe(thumbnail);
      } else if (renderCallback) {
        renderCallback(thumbnail.querySelector('.simsek-thumbnail-image'), index);
      }
    });
  }
  
  _createThumbnail(index, page, renderCallback) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'simsek-thumbnail';
    thumbnail.dataset.index = index;
    
    const isActive = index === this.currentPage;
    
    thumbnail.style.cssText = `
      width: 100%;
      cursor: pointer;
      border-radius: 4px;
      overflow: hidden;
      border: 2px solid ${isActive ? 'var(--simsek-primary, #007bff)' : 'transparent'};
      transition: border-color 0.2s ease, transform 0.2s ease;
      background: var(--simsek-thumbnail-bg, #f5f5f5);
    `;
    
    // Thumbnail image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'simsek-thumbnail-image';
    imageContainer.style.cssText = `
      width: 100%;
      height: ${this.options.thumbnailHeight}px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: var(--simsek-page-bg, #fff);
    `;
    
    // Placeholder veya içerik
    if (this.options.lazyLoad) {
      imageContainer.innerHTML = `
        <div class="simsek-thumbnail-placeholder" style="
          width: 40px;
          height: 40px;
          border: 3px solid var(--simsek-spinner-color, #ddd);
          border-top-color: var(--simsek-primary, #007bff);
          border-radius: 50%;
          animation: simsek-spin 1s linear infinite;
        "></div>
      `;
    } else if (typeof page === 'string') {
      if (page.startsWith('<')) {
        imageContainer.innerHTML = page;
      } else {
        const img = document.createElement('img');
        img.src = page;
        img.alt = `Page ${index + 1}`;
        img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
        imageContainer.appendChild(img);
      }
    }
    
    // Page number
    const pageNumber = document.createElement('div');
    pageNumber.className = 'simsek-thumbnail-number';
    pageNumber.style.cssText = `
      padding: 5px;
      text-align: center;
      font-size: 12px;
      color: var(--simsek-text-color, #333);
      background: var(--simsek-thumbnail-number-bg, #f8f8f8);
    `;
    pageNumber.textContent = `Page ${index + 1}`;
    
    thumbnail.appendChild(imageContainer);
    thumbnail.appendChild(pageNumber);
    
    // Events
    thumbnail.addEventListener('click', () => {
      if (this.options.onPageSelect) {
        this.options.onPageSelect(index);
      }
    });
    
    thumbnail.addEventListener('mouseenter', () => {
      thumbnail.style.transform = 'scale(1.02)';
    });
    
    thumbnail.addEventListener('mouseleave', () => {
      thumbnail.style.transform = 'scale(1)';
    });
    
    return thumbnail;
  }
  
  /**
   * Aktif sayfayı güncelle
   * @param {number} pageNumber - Aktif sayfa numarası
   */
  setActivePage(pageNumber) {
    this.currentPage = pageNumber;
    
    this.thumbnails.forEach((thumb, index) => {
      const isActive = index === pageNumber || index === pageNumber + 1;
      thumb.element.style.borderColor = isActive 
        ? 'var(--simsek-primary, #007bff)' 
        : 'transparent';
    });
    
    // Scroll to active
    const activeThumb = this.thumbnails[pageNumber];
    if (activeThumb && activeThumb.element) {
      activeThumb.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
  
  /**
   * Panel aç
   */
  open() {
    if (!this.panel) return;
    
    this.panel.style.transform = 'translateX(0)';
    this.isOpen = true;
  }
  
  /**
   * Panel kapat
   */
  close() {
    if (!this.panel) return;
    
    this.panel.style.transform = 'translateX(-100%)';
    this.isOpen = false;
  }
  
  /**
   * Panel toggle
   * @returns {boolean} - Yeni durum
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    return this.isOpen;
  }
  
  /**
   * Panel açık mı
   * @returns {boolean}
   */
  isVisible() {
    return this.isOpen;
  }
  
  /**
   * Panel etkinliğini ayarla
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    
    if (!enabled && this.panel) {
      this.close();
    }
  }
  
  /**
   * Panel etkin mi
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.enabled;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    
    this.thumbnails = [];
  }
}
