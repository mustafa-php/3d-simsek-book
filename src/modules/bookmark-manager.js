/**
 * BookmarkManager - Page Bookmarking Module
 * Persist bookmarks to LocalStorage
 */
export class BookmarkManager {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      storageKey: options.storageKey || 'simsek-book-bookmarks',
      bookId: options.bookId || 'default',
      onBookmark: options.onBookmark || null,
      onRemove: options.onRemove || null,
      ...options
    };
    
    this.bookmarks = new Set();
    
    this._init();
  }
  
  _init() {
    if (this.options.enabled) {
      this._loadFromStorage();
    }
  }
  
  _getStorageKey() {
    return `${this.options.storageKey}-${this.options.bookId}`;
  }
  
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(this._getStorageKey());
      if (stored) {
        const bookmarks = JSON.parse(stored);
        this.bookmarks = new Set(bookmarks);
      }
    } catch (error) {
      console.warn('Failed to load bookmarks from localStorage:', error);
    }
  }
  
  _saveToStorage() {
    try {
      const bookmarks = Array.from(this.bookmarks);
      localStorage.setItem(this._getStorageKey(), JSON.stringify(bookmarks));
    } catch (error) {
      console.warn('Failed to save bookmarks to localStorage:', error);
    }
  }
  
  /**
   * Sayfa işaretle
   * @param {number} pageNumber - Sayfa numarası
   * @returns {boolean} - Başarılı mı
   */
  add(pageNumber) {
    if (!this.options.enabled) return false;
    
    if (!this.bookmarks.has(pageNumber)) {
      this.bookmarks.add(pageNumber);
      this._saveToStorage();
      
      if (this.options.onBookmark) {
        this.options.onBookmark(pageNumber, true);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * İşareti kaldır
   * @param {number} pageNumber - Sayfa numarası
   * @returns {boolean} - Başarılı mı
   */
  remove(pageNumber) {
    if (!this.options.enabled) return false;
    
    if (this.bookmarks.has(pageNumber)) {
      this.bookmarks.delete(pageNumber);
      this._saveToStorage();
      
      if (this.options.onRemove) {
        this.options.onRemove(pageNumber, false);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Toggle bookmark
   * @param {number} pageNumber - Sayfa numarası
   * @returns {boolean} - Yeni durum (işaretli mi)
   */
  toggle(pageNumber) {
    if (this.has(pageNumber)) {
      this.remove(pageNumber);
      return false;
    } else {
      this.add(pageNumber);
      return true;
    }
  }
  
  /**
   * Sayfa işaretli mi
   * @param {number} pageNumber - Sayfa numarası
   * @returns {boolean}
   */
  has(pageNumber) {
    return this.bookmarks.has(pageNumber);
  }
  
  /**
   * Tüm işaretleri al
   * @returns {Array<number>} - Sıralı sayfa numaraları
   */
  getAll() {
    return Array.from(this.bookmarks).sort((a, b) => a - b);
  }
  
  /**
   * İşaret sayısını al
   * @returns {number}
   */
  getCount() {
    return this.bookmarks.size;
  }
  
  /**
   * Tüm işaretleri temizle
   */
  clear() {
    this.bookmarks.clear();
    this._saveToStorage();
  }
  
  /**
   * Bookmark UI elementi oluştur
   * @param {number} pageNumber - Sayfa numarası
   * @param {Object} options - UI seçenekleri
   * @returns {HTMLElement}
   */
  createBookmarkIndicator(pageNumber, options = {}) {
    const indicator = document.createElement('div');
    indicator.className = 'simsek-bookmark-indicator';
    
    const isBookmarked = this.has(pageNumber);
    
    indicator.style.cssText = `
      position: absolute;
      top: ${options.top || '5px'};
      right: ${options.right || '5px'};
      width: 24px;
      height: 30px;
      cursor: pointer;
      z-index: 100;
      transition: transform 0.2s ease;
    `;
    
    indicator.innerHTML = `
      <svg viewBox="0 0 24 30" fill="${isBookmarked ? 'var(--simsek-bookmark-color, #ff4444)' : 'none'}" 
           stroke="var(--simsek-bookmark-color, #ff4444)" stroke-width="2">
        <path d="M2 2h20v26l-10-8-10 8V2z"/>
      </svg>
    `;
    
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      const newState = this.toggle(pageNumber);
      indicator.querySelector('svg').setAttribute('fill', newState ? 'var(--simsek-bookmark-color, #ff4444)' : 'none');
    });
    
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'scale(1.1)';
    });
    
    indicator.addEventListener('mouseleave', () => {
      indicator.style.transform = 'scale(1)';
    });
    
    return indicator;
  }
  
  /**
   * Bookmark listesi paneli oluştur
   * @param {Function} onNavigate - Sayfaya git callback
   * @returns {HTMLElement}
   */
  createBookmarkPanel(onNavigate) {
    const panel = document.createElement('div');
    panel.className = 'simsek-bookmark-panel';
    
    panel.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      width: 250px;
      height: 100%;
      background: var(--simsek-panel-bg, #fff);
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    const header = document.createElement('div');
    header.className = 'simsek-bookmark-panel-header';
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid var(--simsek-border-color, #eee);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>📑 Bookmarks (${this.getCount()})</span>
      <button class="simsek-panel-close" style="
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--simsek-text-color, #333);
      ">&times;</button>
    `;
    
    const list = document.createElement('div');
    list.className = 'simsek-bookmark-list';
    
    this._renderBookmarkList(list, onNavigate);
    
    panel.appendChild(header);
    panel.appendChild(list);
    
    // Close button
    header.querySelector('.simsek-panel-close').addEventListener('click', () => {
      panel.style.transform = 'translateX(100%)';
    });
    
    return panel;
  }
  
  _renderBookmarkList(container, onNavigate) {
    container.innerHTML = '';
    
    const bookmarks = this.getAll();
    
    if (bookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        padding: 20px;
        text-align: center;
        color: var(--simsek-text-muted, #999);
      `;
      empty.textContent = 'No bookmarks yet';
      container.appendChild(empty);
      return;
    }
    
    bookmarks.forEach((pageNumber) => {
      const item = document.createElement('div');
      item.className = 'simsek-bookmark-item';
      item.style.cssText = `
        padding: 12px 15px;
        border-bottom: 1px solid var(--simsek-border-color, #eee);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.2s ease;
      `;
      
      item.innerHTML = `
        <span>📖 Page ${pageNumber + 1}</span>
        <button class="simsek-bookmark-remove" style="
          background: none;
          border: none;
          color: var(--simsek-danger, #ff4444);
          cursor: pointer;
          font-size: 16px;
        ">🗑️</button>
      `;
      
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('simsek-bookmark-remove')) {
          if (onNavigate) onNavigate(pageNumber);
        }
      });
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--simsek-hover-bg, #f5f5f5)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      
      item.querySelector('.simsek-bookmark-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove(pageNumber);
        this._renderBookmarkList(container, onNavigate);
      });
      
      container.appendChild(item);
    });
  }
  
  /**
   * Bookmark etkinliğini ayarla
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
  }
  
  /**
   * Bookmark etkin mi
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.enabled;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    // Storage'a son durumu kaydet
    this._saveToStorage();
  }
}
