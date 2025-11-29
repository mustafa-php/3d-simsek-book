/**
 * SimsekBook - 3D FlipBook JavaScript Library
 * Modern, full-featured 3D page-flipping flipbook
 * 
 * @version 1.0.0
 * @author SimsekBook Contributors
 * @license MIT
 */

import { PageFlip } from './modules/page-flip.js';
import { PDFLoader } from './modules/pdf-loader.js';
import { ImageGallery } from './modules/image-gallery.js';
import { AudioManager } from './modules/audio-manager.js';
import { ZoomController } from './modules/zoom-controller.js';
import { BookmarkManager } from './modules/bookmark-manager.js';
import { ThumbnailPanel } from './modules/thumbnail-panel.js';
import { KeyboardNav } from './modules/keyboard-nav.js';

export class SimsekBook {
  /**
   * SimsekBook constructor
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    // Container setup
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }
    
    if (!this.container) {
      throw new Error('SimsekBook: Container element not found');
    }
    
    // Default options
    this.options = {
      // Page sources
      pages: options.pages || [],
      
      // Dimensions
      width: options.width || 800,
      height: options.height || 600,
      
      // Animation
      pageFlipDuration: options.pageFlipDuration || 1000,
      
      // Sound
      enableSound: options.enableSound !== false,
      soundVolume: options.soundVolume || 0.5,
      pageFlipSound: options.pageFlipSound || null,
      
      // Zoom
      enableZoom: options.enableZoom !== false,
      zoomMin: options.zoomMin || 1,
      zoomMax: options.zoomMax || 3,
      
      // Bookmarks
      enableBookmarks: options.enableBookmarks !== false,
      bookId: options.bookId || this._generateBookId(),
      
      // Thumbnails
      enableThumbnails: options.enableThumbnails !== false,
      
      // Keyboard
      enableKeyboard: options.enableKeyboard !== false,
      
      // Touch/Swipe
      enableSwipe: options.enableSwipe !== false,
      
      // Fullscreen
      enableFullscreen: options.enableFullscreen !== false,
      
      // Auto-play
      autoPlay: options.autoPlay || false,
      autoPlayInterval: options.autoPlayInterval || 5000,
      
      // RTL (Right-to-Left)
      rtl: options.rtl || false,
      
      // Callbacks
      onPageFlip: options.onPageFlip || null,
      onZoom: options.onZoom || null,
      onBookmark: options.onBookmark || null,
      onReady: options.onReady || null,
      onError: options.onError || null,
      
      ...options
    };
    
    // State
    this.isReady = false;
    this.isFullscreen = false;
    this.autoPlayTimer = null;
    this.pageContents = [];
    
    // Modules
    this.pageFlip = null;
    this.pdfLoader = null;
    this.imageGallery = null;
    this.audioManager = null;
    this.zoomController = null;
    this.bookmarkManager = null;
    this.thumbnailPanel = null;
    this.keyboardNav = null;
    
    // Initialize
    this._init();
  }
  
  async _init() {
    try {
      this._setupContainer();
      this._initModules();
      await this._loadPages();
      this._setupControls();
      this._setupTouchEvents();
      this._setupFullscreen();
      
      this.isReady = true;
      
      if (this.options.onReady) {
        this.options.onReady(this);
      }
      
      // Auto-play
      if (this.options.autoPlay) {
        this.startAutoPlay();
      }
    } catch (error) {
      console.error('SimsekBook initialization error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }
  
  _generateBookId() {
    const pages = this.options?.pages;
    if (typeof pages === 'string') {
      return pages.replace(/[^a-zA-Z0-9]/g, '_');
    }
    // Use crypto.randomUUID if available, otherwise fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `book_${crypto.randomUUID()}`;
    }
    return `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  _setupContainer() {
    this.container.classList.add('simsek-book');
    
    this.container.style.cssText = `
      position: relative;
      width: ${this.options.width}px;
      height: ${this.options.height}px;
      max-width: 100%;
      margin: 0 auto;
      background: var(--simsek-book-bg, #2a2a2a);
      border-radius: var(--simsek-border-radius, 8px);
      overflow: hidden;
      box-shadow: var(--simsek-shadow, 0 10px 40px rgba(0,0,0,0.3));
      user-select: none;
    `;
    
    // Main book area
    this.bookArea = document.createElement('div');
    this.bookArea.className = 'simsek-book-area';
    this.bookArea.style.cssText = `
      position: relative;
      width: 100%;
      height: calc(100% - 50px);
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 2000px;
    `;
    
    // Book container (for pages)
    this.bookContainer = document.createElement('div');
    this.bookContainer.className = 'simsek-book-container';
    this.bookContainer.style.cssText = `
      position: relative;
      width: 90%;
      height: 90%;
      transform-style: preserve-3d;
    `;
    
    this.bookArea.appendChild(this.bookContainer);
    this.container.appendChild(this.bookArea);
    
    // Controls area
    this.controlsArea = document.createElement('div');
    this.controlsArea.className = 'simsek-controls';
    this.controlsArea.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: var(--simsek-controls-bg, rgba(0,0,0,0.8));
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0 15px;
    `;
    
    this.container.appendChild(this.controlsArea);
  }
  
  _initModules() {
    // Audio Manager
    this.audioManager = new AudioManager({
      enabled: this.options.enableSound,
      volume: this.options.soundVolume,
      pageFlipSound: this.options.pageFlipSound
    });
    
    // Bookmark Manager
    this.bookmarkManager = new BookmarkManager({
      enabled: this.options.enableBookmarks,
      bookId: this.options.bookId,
      onBookmark: (page, isBookmarked) => {
        if (this.options.onBookmark) {
          this.options.onBookmark(page, isBookmarked);
        }
      }
    });
    
    // Thumbnail Panel
    this.thumbnailPanel = new ThumbnailPanel(this.container, {
      enabled: this.options.enableThumbnails,
      onPageSelect: (page) => {
        this.goToPage(page);
        this.thumbnailPanel.close();
      }
    });
    this.thumbnailPanel.create();
    
    // Keyboard Navigation
    this.keyboardNav = new KeyboardNav({
      enabled: this.options.enableKeyboard,
      onNext: () => this.nextPage(),
      onPrev: () => this.prevPage(),
      onFirst: () => this.goToPage(0),
      onLast: () => this.goToPage(this.getTotalPages() - 1),
      onZoomIn: () => this.zoomIn(),
      onZoomOut: () => this.zoomOut(),
      onEscape: () => this._handleEscape(),
      onToggleThumbnails: () => this.toggleThumbnails(),
      onToggleBookmarks: () => this.toggleBookmarks(),
      onToggleFullscreen: () => this.toggleFullscreen()
    });
    
    // Page Flip Engine
    this.pageFlip = new PageFlip(this.bookContainer, {
      duration: this.options.pageFlipDuration,
      onFlipStart: (page, direction) => {
        this.audioManager.playPageFlip();
      },
      onFlipEnd: (page, direction) => {
        this._updateUI();
        if (this.options.onPageFlip) {
          this.options.onPageFlip(page);
        }
      }
    });
  }
  
  async _loadPages() {
    const pages = this.options.pages;
    
    if (!pages || (Array.isArray(pages) && pages.length === 0)) {
      console.warn('SimsekBook: No pages provided');
      return;
    }
    
    // PDF check
    if (typeof pages === 'string' && pages.toLowerCase().endsWith('.pdf')) {
      await this._loadPDF(pages);
    } else if (Array.isArray(pages)) {
      await this._loadImages(pages);
    }
    
    // Load pages into PageFlip
    this.pageFlip.loadPages(this.pageContents);
    
    // Setup zoom after pages are loaded
    if (this.options.enableZoom) {
      this.zoomController = new ZoomController(this.bookContainer, {
        enabled: this.options.enableZoom,
        minZoom: this.options.zoomMin,
        maxZoom: this.options.zoomMax,
        onZoom: (level) => {
          if (this.options.onZoom) {
            this.options.onZoom(level);
          }
        }
      });
    }
    
    // Load thumbnails
    if (this.options.enableThumbnails) {
      this._loadThumbnails();
    }
  }
  
  async _loadPDF(url) {
    this.pdfLoader = new PDFLoader({
      scale: 1.5
    });
    
    try {
      await this.pdfLoader.load(url);
      const canvases = await this.pdfLoader.renderAllPages({
        onProgress: (current, total) => {
          console.log(`Loading PDF: ${current}/${total}`);
        }
      });
      
      this.pageContents = canvases;
    } catch (error) {
      console.error('Failed to load PDF:', error);
      throw error;
    }
  }
  
  async _loadImages(images) {
    this.imageGallery = new ImageGallery({
      lazyLoad: true,
      preloadCount: 2
    });
    
    await this.imageGallery.load(images);
    this.pageContents = this.imageGallery.getAllPageContents();
  }
  
  _loadThumbnails() {
    const pages = this.options.pages;
    
    if (Array.isArray(pages)) {
      this.thumbnailPanel.loadThumbnails(pages, (container, index) => {
        if (this.imageGallery) {
          this.imageGallery._loadImage(index).then((img) => {
            if (img) {
              const clone = img.cloneNode(true);
              clone.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
              container.innerHTML = '';
              container.appendChild(clone);
            }
          });
        }
      });
    } else if (this.pdfLoader) {
      const numPages = this.pdfLoader.getNumPages();
      const pageNumbers = Array.from({ length: numPages }, (_, i) => i);
      
      this.thumbnailPanel.loadThumbnails(pageNumbers, async (container, index) => {
        try {
          const canvas = await this.pdfLoader.createThumbnail(index + 1, 100);
          container.innerHTML = '';
          container.appendChild(canvas);
        } catch (e) {
          container.innerHTML = `<span style="color: #999;">Page ${index + 1}</span>`;
        }
      });
    }
  }
  
  _setupControls() {
    // Left navigation button
    const prevBtn = this._createButton('❮', 'Previous page', () => this.prevPage());
    prevBtn.className = 'simsek-btn simsek-btn-nav simsek-btn-prev';
    
    // Thumbnails button
    const thumbBtn = this._createButton('📑', 'Thumbnails', () => this.toggleThumbnails());
    thumbBtn.className = 'simsek-btn simsek-btn-thumb';
    
    // Bookmarks button
    const bookmarkBtn = this._createButton('🔖', 'Toggle bookmark', () => this.toggleBookmark());
    bookmarkBtn.className = 'simsek-btn simsek-btn-bookmark';
    
    // Page indicator
    this.pageIndicator = document.createElement('span');
    this.pageIndicator.className = 'simsek-page-indicator';
    this.pageIndicator.style.cssText = `
      color: var(--simsek-text-light, #fff);
      font-size: 14px;
      min-width: 80px;
      text-align: center;
    `;
    this._updatePageIndicator();
    
    // Zoom buttons
    const zoomOutBtn = this._createButton('−', 'Zoom out', () => this.zoomOut());
    zoomOutBtn.className = 'simsek-btn simsek-btn-zoom';
    
    const zoomInBtn = this._createButton('+', 'Zoom in', () => this.zoomIn());
    zoomInBtn.className = 'simsek-btn simsek-btn-zoom';
    
    // Sound button
    this.soundBtn = this._createButton('🔊', 'Toggle sound', () => this.toggleSound());
    this.soundBtn.className = 'simsek-btn simsek-btn-sound';
    
    // Fullscreen button
    const fullscreenBtn = this._createButton('⛶', 'Fullscreen', () => this.toggleFullscreen());
    fullscreenBtn.className = 'simsek-btn simsek-btn-fullscreen';
    
    // Right navigation button
    const nextBtn = this._createButton('❯', 'Next page', () => this.nextPage());
    nextBtn.className = 'simsek-btn simsek-btn-nav simsek-btn-next';
    
    // Add to controls
    this.controlsArea.appendChild(prevBtn);
    this.controlsArea.appendChild(thumbBtn);
    this.controlsArea.appendChild(bookmarkBtn);
    this.controlsArea.appendChild(zoomOutBtn);
    this.controlsArea.appendChild(this.pageIndicator);
    this.controlsArea.appendChild(zoomInBtn);
    this.controlsArea.appendChild(this.soundBtn);
    this.controlsArea.appendChild(fullscreenBtn);
    this.controlsArea.appendChild(nextBtn);
    
    // Navigation arrows on book area
    this._createNavigationArrows();
  }
  
  _createButton(text, title, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    
    btn.style.cssText = `
      background: var(--simsek-btn-bg, rgba(255,255,255,0.1));
      border: none;
      color: var(--simsek-text-light, #fff);
      width: 36px;
      height: 36px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--simsek-btn-hover-bg, rgba(255,255,255,0.2))';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'var(--simsek-btn-bg, rgba(255,255,255,0.1))';
    });
    
    btn.addEventListener('click', onClick);
    
    return btn;
  }
  
  _createNavigationArrows() {
    // Left arrow
    const leftArrow = document.createElement('div');
    leftArrow.className = 'simsek-nav-arrow simsek-nav-left';
    leftArrow.innerHTML = '❮';
    leftArrow.style.cssText = `
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--simsek-nav-arrow-bg, rgba(0,0,0,0.3));
      color: var(--simsek-text-light, #fff);
      font-size: 24px;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
    `;
    leftArrow.addEventListener('click', () => this.prevPage());
    
    // Right arrow
    const rightArrow = document.createElement('div');
    rightArrow.className = 'simsek-nav-arrow simsek-nav-right';
    rightArrow.innerHTML = '❯';
    rightArrow.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--simsek-nav-arrow-bg, rgba(0,0,0,0.3));
      color: var(--simsek-text-light, #fff);
      font-size: 24px;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
    `;
    rightArrow.addEventListener('click', () => this.nextPage());
    
    // Show on hover
    this.bookArea.addEventListener('mouseenter', () => {
      leftArrow.style.opacity = '1';
      rightArrow.style.opacity = '1';
    });
    
    this.bookArea.addEventListener('mouseleave', () => {
      leftArrow.style.opacity = '0';
      rightArrow.style.opacity = '0';
    });
    
    this.bookArea.appendChild(leftArrow);
    this.bookArea.appendChild(rightArrow);
  }
  
  _setupTouchEvents() {
    if (!this.options.enableSwipe) return;
    
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    
    this.bookArea.addEventListener('touchstart', (e) => {
      if (this.zoomController && this.zoomController.getZoom() > 1) return;
      
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });
    
    this.bookArea.addEventListener('touchend', (e) => {
      if (this.zoomController && this.zoomController.getZoom() > 1) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const duration = Date.now() - startTime;
      
      // Swipe detection
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && duration < 500) {
        if (diffX > 0) {
          this.options.rtl ? this.nextPage() : this.prevPage();
        } else {
          this.options.rtl ? this.prevPage() : this.nextPage();
        }
      }
    }, { passive: true });
  }
  
  _setupFullscreen() {
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this._updateFullscreenUI();
    });
  }
  
  _updateFullscreenUI() {
    if (this.isFullscreen) {
      this.container.style.width = '100vw';
      this.container.style.height = '100vh';
      this.container.style.maxWidth = 'none';
      this.container.style.borderRadius = '0';
    } else {
      this.container.style.width = `${this.options.width}px`;
      this.container.style.height = `${this.options.height}px`;
      this.container.style.maxWidth = '100%';
      this.container.style.borderRadius = 'var(--simsek-border-radius, 8px)';
    }
  }
  
  _updateUI() {
    this._updatePageIndicator();
    
    if (this.thumbnailPanel) {
      this.thumbnailPanel.setActivePage(this.getCurrentPage());
    }
  }
  
  _updatePageIndicator() {
    if (this.pageIndicator) {
      const current = this.getCurrentPage() + 1;
      const total = this.getTotalPages();
      this.pageIndicator.textContent = `${current}-${Math.min(current + 1, total)} / ${total}`;
    }
  }
  
  _handleEscape() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else if (this.thumbnailPanel && this.thumbnailPanel.isVisible()) {
      this.thumbnailPanel.close();
    } else if (this.zoomController && this.zoomController.getZoom() > 1) {
      this.zoomController.reset();
    }
  }
  
  // ============ Public API ============
  
  /**
   * Go to next page
   * @returns {Promise<boolean>}
   */
  async nextPage() {
    if (!this.pageFlip) return false;
    return await this.pageFlip.nextPage();
  }
  
  /**
   * Go to previous page
   * @returns {Promise<boolean>}
   */
  async prevPage() {
    if (!this.pageFlip) return false;
    return await this.pageFlip.prevPage();
  }
  
  /**
   * Go to specific page
   * @param {number} pageNumber - Page number (0-indexed)
   * @returns {Promise<boolean>}
   */
  async goToPage(pageNumber) {
    if (!this.pageFlip) return false;
    const result = await this.pageFlip.goToPage(pageNumber);
    this._updateUI();
    return result;
  }
  
  /**
   * Get current page number
   * @returns {number}
   */
  getCurrentPage() {
    return this.pageFlip ? this.pageFlip.getCurrentPage() : 0;
  }
  
  /**
   * Get total page count
   * @returns {number}
   */
  getTotalPages() {
    return this.pageFlip ? this.pageFlip.getTotalPages() : 0;
  }
  
  /**
   * Set zoom level
   * @param {number} level - Zoom level
   */
  zoom(level) {
    if (this.zoomController) {
      this.zoomController.setZoom(level);
    }
  }
  
  /**
   * Zoom in
   */
  zoomIn() {
    if (this.zoomController) {
      this.zoomController.zoomIn();
    }
  }
  
  /**
   * Zoom out
   */
  zoomOut() {
    if (this.zoomController) {
      this.zoomController.zoomOut();
    }
  }
  
  /**
   * Reset zoom
   */
  resetZoom() {
    if (this.zoomController) {
      this.zoomController.reset();
    }
  }
  
  /**
   * Get current zoom level
   * @returns {number}
   */
  getZoom() {
    return this.zoomController ? this.zoomController.getZoom() : 1;
  }
  
  /**
   * Toggle bookmark for current page
   * @returns {boolean} - New bookmark state
   */
  toggleBookmark() {
    if (!this.bookmarkManager) return false;
    return this.bookmarkManager.toggle(this.getCurrentPage());
  }
  
  /**
   * Check if current page is bookmarked
   * @returns {boolean}
   */
  isBookmarked() {
    if (!this.bookmarkManager) return false;
    return this.bookmarkManager.has(this.getCurrentPage());
  }
  
  /**
   * Get all bookmarks
   * @returns {Array<number>}
   */
  getBookmarks() {
    return this.bookmarkManager ? this.bookmarkManager.getAll() : [];
  }
  
  /**
   * Toggle thumbnails panel
   * @returns {boolean} - Panel visibility
   */
  toggleThumbnails() {
    if (this.thumbnailPanel) {
      return this.thumbnailPanel.toggle();
    }
    return false;
  }
  
  /**
   * Toggle bookmarks panel
   */
  toggleBookmarks() {
    // Could implement a bookmarks panel similar to thumbnails
    console.log('Bookmarks:', this.getBookmarks());
  }
  
  /**
   * Toggle sound
   * @returns {boolean} - Sound enabled state
   */
  toggleSound() {
    if (this.audioManager) {
      const enabled = this.audioManager.toggle();
      if (this.soundBtn) {
        this.soundBtn.textContent = enabled ? '🔊' : '🔇';
      }
      return enabled;
    }
    return false;
  }
  
  /**
   * Set sound volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    if (this.audioManager) {
      this.audioManager.setVolume(volume);
    }
  }
  
  /**
   * Enter fullscreen mode
   */
  async enterFullscreen() {
    try {
      await this.container.requestFullscreen();
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }
  
  /**
   * Exit fullscreen mode
   */
  async exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  }
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }
  
  /**
   * Start auto-play
   */
  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      if (this.getCurrentPage() >= this.getTotalPages() - 2) {
        this.goToPage(0);
      } else {
        this.nextPage();
      }
    }, this.options.autoPlayInterval);
  }
  
  /**
   * Stop auto-play
   */
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
  
  /**
   * Resize the book
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    
    if (!this.isFullscreen) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }
  }
  
  /**
   * Destroy the instance and clean up
   */
  destroy() {
    this.stopAutoPlay();
    
    if (this.pageFlip) this.pageFlip.destroy();
    if (this.pdfLoader) this.pdfLoader.destroy();
    if (this.imageGallery) this.imageGallery.destroy();
    if (this.audioManager) this.audioManager.destroy();
    if (this.zoomController) this.zoomController.destroy();
    if (this.bookmarkManager) this.bookmarkManager.destroy();
    if (this.thumbnailPanel) this.thumbnailPanel.destroy();
    if (this.keyboardNav) this.keyboardNav.destroy();
    
    this.container.innerHTML = '';
    this.container.classList.remove('simsek-book');
  }
}

// Export modules for individual use
export { PageFlip } from './modules/page-flip.js';
export { PDFLoader } from './modules/pdf-loader.js';
export { ImageGallery } from './modules/image-gallery.js';
export { AudioManager } from './modules/audio-manager.js';
export { ZoomController } from './modules/zoom-controller.js';
export { BookmarkManager } from './modules/bookmark-manager.js';
export { ThumbnailPanel } from './modules/thumbnail-panel.js';
export { KeyboardNav } from './modules/keyboard-nav.js';

// UMD export for script tag usage
if (typeof window !== 'undefined') {
  window.SimsekBook = SimsekBook;
}
