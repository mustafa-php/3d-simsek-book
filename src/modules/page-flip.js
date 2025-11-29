/**
 * PageFlip - 3D Page Flip Engine
 * Realistic page flipping effect using CSS3 3D transforms
 */
export class PageFlip {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      duration: options.duration || 1000,
      onFlipStart: options.onFlipStart || null,
      onFlipEnd: options.onFlipEnd || null,
      ...options
    };
    
    this.currentPage = 0;
    this.totalPages = 0;
    this.isFlipping = false;
    this.pages = [];
    this.bookElement = null;
    
    this._init();
  }
  
  _init() {
    this._createBookStructure();
    this._setupStyles();
  }
  
  _createBookStructure() {
    this.bookElement = document.createElement('div');
    this.bookElement.className = 'simsek-book-inner';
    this.container.appendChild(this.bookElement);
  }
  
  _setupStyles() {
    this.bookElement.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      perspective: 2000px;
      transform-style: preserve-3d;
    `;
  }
  
  /**
   * Sayfaları yükle
   * @param {Array} pageContents - Sayfa içerikleri (HTML veya img elements)
   */
  loadPages(pageContents) {
    this.pages = [];
    this.bookElement.innerHTML = '';
    this.totalPages = pageContents.length;
    
    // Sayfaları çiftler halinde oluştur (sol ve sağ)
    for (let i = 0; i < pageContents.length; i += 2) {
      const spread = this._createSpread(
        pageContents[i],
        pageContents[i + 1] || null,
        i
      );
      this.bookElement.appendChild(spread);
      this.pages.push(spread);
    }
    
    this._updatePageVisibility();
  }
  
  _createSpread(leftContent, rightContent, index) {
    const spread = document.createElement('div');
    spread.className = 'simsek-spread';
    spread.dataset.index = Math.floor(index / 2);
    
    spread.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      transform-style: preserve-3d;
      transition: transform ${this.options.duration}ms cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Sol sayfa
    const leftPage = this._createPage(leftContent, 'left', index);
    spread.appendChild(leftPage);
    
    // Sağ sayfa
    if (rightContent) {
      const rightPage = this._createPage(rightContent, 'right', index + 1);
      spread.appendChild(rightPage);
    }
    
    return spread;
  }
  
  _createPage(content, side, pageNumber) {
    const page = document.createElement('div');
    page.className = `simsek-page simsek-page-${side}`;
    page.dataset.pageNumber = pageNumber;
    
    page.style.cssText = `
      position: relative;
      width: 50%;
      height: 100%;
      background: var(--simsek-page-bg, #fff);
      box-shadow: ${side === 'left' ? '-2px' : '2px'} 0 10px rgba(0,0,0,0.1);
      overflow: hidden;
      transform-style: preserve-3d;
      backface-visibility: hidden;
    `;
    
    const inner = document.createElement('div');
    inner.className = 'simsek-page-inner';
    inner.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;
    
    if (typeof content === 'string') {
      if (content.startsWith('<')) {
        inner.innerHTML = content;
      } else {
        const img = document.createElement('img');
        img.src = content;
        img.alt = `Page ${pageNumber + 1}`;
        img.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        `;
        inner.appendChild(img);
      }
    } else if (content instanceof HTMLElement) {
      inner.appendChild(content.cloneNode(true));
    } else if (content instanceof HTMLCanvasElement) {
      inner.appendChild(content);
    }
    
    // Sayfa numarası
    const pageNum = document.createElement('div');
    pageNum.className = 'simsek-page-number';
    pageNum.textContent = pageNumber + 1;
    pageNum.style.cssText = `
      position: absolute;
      bottom: 10px;
      ${side === 'left' ? 'left' : 'right'}: 15px;
      font-size: 12px;
      color: var(--simsek-page-number-color, #666);
    `;
    
    page.appendChild(inner);
    page.appendChild(pageNum);
    
    return page;
  }
  
  _updatePageVisibility() {
    const currentSpread = Math.floor(this.currentPage / 2);
    
    this.pages.forEach((spread, index) => {
      if (index === currentSpread) {
        spread.style.display = 'flex';
        spread.style.zIndex = '10';
        spread.style.transform = 'rotateY(0deg)';
      } else if (index < currentSpread) {
        spread.style.display = 'flex';
        spread.style.zIndex = String(index);
        spread.style.transform = 'rotateY(-180deg)';
        spread.style.transformOrigin = 'left center';
      } else {
        spread.style.display = 'flex';
        spread.style.zIndex = String(this.pages.length - index);
        spread.style.transform = 'rotateY(0deg)';
      }
    });
  }
  
  /**
   * Sonraki sayfaya git
   * @returns {boolean} - Başarılı mı
   */
  async nextPage() {
    if (this.isFlipping || this.currentPage >= this.totalPages - 2) {
      return false;
    }
    
    this.isFlipping = true;
    const currentSpread = Math.floor(this.currentPage / 2);
    
    if (this.options.onFlipStart) {
      this.options.onFlipStart(this.currentPage, 'next');
    }
    
    const spread = this.pages[currentSpread];
    if (spread) {
      spread.style.transformOrigin = 'left center';
      spread.style.zIndex = '100';
      
      // Flip animasyonu
      await this._animateFlip(spread, 0, -180);
      
      this.currentPage += 2;
      this._updatePageVisibility();
    }
    
    this.isFlipping = false;
    
    if (this.options.onFlipEnd) {
      this.options.onFlipEnd(this.currentPage, 'next');
    }
    
    return true;
  }
  
  /**
   * Önceki sayfaya git
   * @returns {boolean} - Başarılı mı
   */
  async prevPage() {
    if (this.isFlipping || this.currentPage <= 0) {
      return false;
    }
    
    this.isFlipping = true;
    this.currentPage -= 2;
    const currentSpread = Math.floor(this.currentPage / 2);
    
    if (this.options.onFlipStart) {
      this.options.onFlipStart(this.currentPage, 'prev');
    }
    
    const spread = this.pages[currentSpread];
    if (spread) {
      spread.style.transformOrigin = 'left center';
      spread.style.zIndex = '100';
      
      // Flip animasyonu (tersten)
      await this._animateFlip(spread, -180, 0);
      
      this._updatePageVisibility();
    }
    
    this.isFlipping = false;
    
    if (this.options.onFlipEnd) {
      this.options.onFlipEnd(this.currentPage, 'prev');
    }
    
    return true;
  }
  
  /**
   * Belirli bir sayfaya git
   * @param {number} pageNumber - Sayfa numarası (0-indexed)
   */
  async goToPage(pageNumber) {
    if (this.isFlipping) return false;
    
    pageNumber = Math.max(0, Math.min(pageNumber, this.totalPages - 1));
    
    // Çift sayıya yuvarla
    pageNumber = Math.floor(pageNumber / 2) * 2;
    
    if (pageNumber === this.currentPage) return true;
    
    this.currentPage = pageNumber;
    this._updatePageVisibility();
    
    if (this.options.onFlipEnd) {
      this.options.onFlipEnd(this.currentPage, 'goto');
    }
    
    return true;
  }
  
  _animateFlip(element, fromAngle, toAngle) {
    return new Promise((resolve) => {
      element.style.transform = `rotateY(${fromAngle}deg)`;
      
      // Force reflow
      element.offsetHeight;
      
      element.style.transform = `rotateY(${toAngle}deg)`;
      
      setTimeout(resolve, this.options.duration);
    });
  }
  
  /**
   * Mevcut sayfa numarasını al
   * @returns {number}
   */
  getCurrentPage() {
    return this.currentPage;
  }
  
  /**
   * Toplam sayfa sayısını al
   * @returns {number}
   */
  getTotalPages() {
    return this.totalPages;
  }
  
  /**
   * Flip işlemi devam ediyor mu
   * @returns {boolean}
   */
  isAnimating() {
    return this.isFlipping;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    if (this.bookElement) {
      this.bookElement.remove();
    }
    this.pages = [];
  }
}
