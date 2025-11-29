/**
 * KeyboardNav - Keyboard Navigation Module
 * Arrow keys, Home/End, Page Up/Down, Escape, +/- controls
 */
export class KeyboardNav {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      onNext: options.onNext || null,
      onPrev: options.onPrev || null,
      onFirst: options.onFirst || null,
      onLast: options.onLast || null,
      onZoomIn: options.onZoomIn || null,
      onZoomOut: options.onZoomOut || null,
      onEscape: options.onEscape || null,
      onToggleThumbnails: options.onToggleThumbnails || null,
      onToggleBookmarks: options.onToggleBookmarks || null,
      onToggleFullscreen: options.onToggleFullscreen || null,
      ...options
    };
    
    this._boundHandler = this._handleKeyDown.bind(this);
    
    this._init();
  }
  
  _init() {
    if (this.options.enabled) {
      this._bindEvents();
    }
  }
  
  _bindEvents() {
    document.addEventListener('keydown', this._boundHandler);
  }
  
  _unbindEvents() {
    document.removeEventListener('keydown', this._boundHandler);
  }
  
  _handleKeyDown(e) {
    if (!this.options.enabled) return;
    
    // Input/textarea içindeyse ignore et
    if (this._isInputElement(e.target)) return;
    
    switch (e.key) {
      // Sayfa navigasyonu
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        if (this.options.onNext) this.options.onNext();
        break;
        
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        if (this.options.onPrev) this.options.onPrev();
        break;
        
      case 'Home':
        e.preventDefault();
        if (this.options.onFirst) this.options.onFirst();
        break;
        
      case 'End':
        e.preventDefault();
        if (this.options.onLast) this.options.onLast();
        break;
        
      case 'PageDown':
        e.preventDefault();
        if (this.options.onNext) this.options.onNext();
        break;
        
      case 'PageUp':
        e.preventDefault();
        if (this.options.onPrev) this.options.onPrev();
        break;
        
      // Zoom kontrolü
      case '+':
      case '=':
        e.preventDefault();
        if (this.options.onZoomIn) this.options.onZoomIn();
        break;
        
      case '-':
      case '_':
        e.preventDefault();
        if (this.options.onZoomOut) this.options.onZoomOut();
        break;
        
      case '0':
        // Zoom reset
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (this.options.onZoomOut) this.options.onZoomOut();
        }
        break;
        
      // Escape - tam ekrandan çık veya panelleri kapat
      case 'Escape':
        e.preventDefault();
        if (this.options.onEscape) this.options.onEscape();
        break;
        
      // Kısayollar
      case 't':
      case 'T':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (this.options.onToggleThumbnails) this.options.onToggleThumbnails();
        }
        break;
        
      case 'b':
      case 'B':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (this.options.onToggleBookmarks) this.options.onToggleBookmarks();
        }
        break;
        
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (this.options.onToggleFullscreen) this.options.onToggleFullscreen();
        }
        break;
        
      // Space - sonraki sayfa
      case ' ':
        e.preventDefault();
        if (e.shiftKey) {
          if (this.options.onPrev) this.options.onPrev();
        } else {
          if (this.options.onNext) this.options.onNext();
        }
        break;
    }
  }
  
  _isInputElement(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           tagName === 'select' ||
           element.isContentEditable;
  }
  
  /**
   * Klavye navigasyonunu etkinleştir
   */
  enable() {
    if (!this.options.enabled) {
      this.options.enabled = true;
      this._bindEvents();
    }
  }
  
  /**
   * Klavye navigasyonunu devre dışı bırak
   */
  disable() {
    if (this.options.enabled) {
      this.options.enabled = false;
      this._unbindEvents();
    }
  }
  
  /**
   * Toggle
   * @returns {boolean} - Yeni durum
   */
  toggle() {
    if (this.options.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.options.enabled;
  }
  
  /**
   * Etkin mi
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.enabled;
  }
  
  /**
   * Callback güncelle
   * @param {string} name - Callback adı
   * @param {Function} callback - Callback fonksiyonu
   */
  setCallback(name, callback) {
    const key = `on${name.charAt(0).toUpperCase() + name.slice(1)}`;
    if (key in this.options) {
      this.options[key] = callback;
    }
  }
  
  /**
   * Klavye kısayolları bilgisi al
   * @returns {Object}
   */
  getShortcuts() {
    return {
      navigation: {
        'Arrow Right / Page Down / Space': 'Next page',
        'Arrow Left / Page Up / Shift+Space': 'Previous page',
        'Home': 'First page',
        'End': 'Last page'
      },
      zoom: {
        '+ / =': 'Zoom in',
        '- / _': 'Zoom out',
        'Ctrl+0': 'Reset zoom'
      },
      panels: {
        'Ctrl+T': 'Toggle thumbnails',
        'Ctrl+B': 'Toggle bookmarks',
        'Ctrl+F': 'Toggle fullscreen'
      },
      other: {
        'Escape': 'Exit fullscreen / Close panels'
      }
    };
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    this._unbindEvents();
  }
}
