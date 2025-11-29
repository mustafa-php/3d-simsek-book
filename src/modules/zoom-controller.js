/**
 * ZoomController - Zoom Control Module
 * Pinch-to-zoom, mouse wheel zoom, double-tap zoom
 */
export class ZoomController {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enabled: options.enabled !== false,
      minZoom: options.minZoom || 1,
      maxZoom: options.maxZoom || 3,
      zoomStep: options.zoomStep || 0.25,
      doubleTapZoom: options.doubleTapZoom || 2,
      onZoom: options.onZoom || null,
      ...options
    };
    
    this.currentZoom = 1;
    this.targetZoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };
    this.lastTap = 0;
    
    // Touch tracking
    this.touchStartDistance = 0;
    this.touchStartZoom = 1;
    
    // Animation frame
    this.animationFrame = null;
    
    this._init();
  }
  
  _init() {
    if (!this.options.enabled) return;
    
    this._createZoomContainer();
    this._bindEvents();
  }
  
  _createZoomContainer() {
    // Zoom wrapper oluştur
    this.zoomWrapper = document.createElement('div');
    this.zoomWrapper.className = 'simsek-zoom-wrapper';
    this.zoomWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: grab;
    `;
    
    this.zoomContent = document.createElement('div');
    this.zoomContent.className = 'simsek-zoom-content';
    this.zoomContent.style.cssText = `
      width: 100%;
      height: 100%;
      transform-origin: center center;
      transition: transform 0.2s ease-out;
      will-change: transform;
    `;
    
    // Container içeriğini zoom content'e taşı
    while (this.container.firstChild) {
      this.zoomContent.appendChild(this.container.firstChild);
    }
    
    this.zoomWrapper.appendChild(this.zoomContent);
    this.container.appendChild(this.zoomWrapper);
  }
  
  _bindEvents() {
    // Mouse wheel zoom
    this.zoomWrapper.addEventListener('wheel', this._handleWheel.bind(this), { passive: false });
    
    // Double click zoom
    this.zoomWrapper.addEventListener('dblclick', this._handleDoubleClick.bind(this));
    
    // Touch events
    this.zoomWrapper.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
    this.zoomWrapper.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
    this.zoomWrapper.addEventListener('touchend', this._handleTouchEnd.bind(this));
    
    // Mouse pan events
    this.zoomWrapper.addEventListener('mousedown', this._handleMouseDown.bind(this));
    document.addEventListener('mousemove', this._handleMouseMove.bind(this));
    document.addEventListener('mouseup', this._handleMouseUp.bind(this));
  }
  
  _handleWheel(e) {
    if (!this.options.enabled) return;
    
    e.preventDefault();
    
    const delta = -Math.sign(e.deltaY) * this.options.zoomStep;
    const newZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.currentZoom + delta)
    );
    
    // Zoom merkezi mouse pozisyonuna göre ayarla
    const rect = this.zoomWrapper.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    
    this._zoomToPoint(newZoom, mouseX, mouseY);
  }
  
  _handleDoubleClick(e) {
    if (!this.options.enabled) return;
    
    const rect = this.zoomWrapper.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    
    // Toggle zoom
    const newZoom = this.currentZoom > 1 ? 1 : this.options.doubleTapZoom;
    
    this._zoomToPoint(newZoom, clickX, clickY);
  }
  
  _handleTouchStart(e) {
    if (!this.options.enabled) return;
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      this.touchStartDistance = this._getTouchDistance(e.touches);
      this.touchStartZoom = this.currentZoom;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Double tap detection
      const now = Date.now();
      if (now - this.lastTap < 300) {
        const rect = this.zoomWrapper.getBoundingClientRect();
        const touchX = (e.touches[0].clientX - rect.left) / rect.width;
        const touchY = (e.touches[0].clientY - rect.top) / rect.height;
        
        const newZoom = this.currentZoom > 1 ? 1 : this.options.doubleTapZoom;
        this._zoomToPoint(newZoom, touchX, touchY);
        
        e.preventDefault();
      }
      this.lastTap = now;
      
      // Pan start (zoomed durumda)
      if (this.currentZoom > 1) {
        this.isPanning = true;
        this.startPan = {
          x: e.touches[0].clientX - this.panX,
          y: e.touches[0].clientY - this.panY
        };
      }
    }
  }
  
  _handleTouchMove(e) {
    if (!this.options.enabled) return;
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = this._getTouchDistance(e.touches);
      const scale = distance / this.touchStartDistance;
      const newZoom = Math.max(
        this.options.minZoom,
        Math.min(this.options.maxZoom, this.touchStartZoom * scale)
      );
      
      this.setZoom(newZoom);
      e.preventDefault();
    } else if (e.touches.length === 1 && this.isPanning) {
      // Pan
      this.panX = e.touches[0].clientX - this.startPan.x;
      this.panY = e.touches[0].clientY - this.startPan.y;
      
      this._constrainPan();
      this._applyTransform();
      e.preventDefault();
    }
  }
  
  _handleTouchEnd(e) {
    this.isPanning = false;
  }
  
  _handleMouseDown(e) {
    if (!this.options.enabled || this.currentZoom <= 1) return;
    
    this.isPanning = true;
    this.startPan = {
      x: e.clientX - this.panX,
      y: e.clientY - this.panY
    };
    this.zoomWrapper.style.cursor = 'grabbing';
  }
  
  _handleMouseMove(e) {
    if (!this.isPanning) return;
    
    this.panX = e.clientX - this.startPan.x;
    this.panY = e.clientY - this.startPan.y;
    
    this._constrainPan();
    this._applyTransform();
  }
  
  _handleMouseUp() {
    this.isPanning = false;
    if (this.zoomWrapper) {
      this.zoomWrapper.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
    }
  }
  
  _getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  _zoomToPoint(newZoom, pointX, pointY) {
    const oldZoom = this.currentZoom;
    this.currentZoom = newZoom;
    
    if (newZoom === 1) {
      // Reset pan on zoom out
      this.panX = 0;
      this.panY = 0;
    } else {
      // Pan'ı zoom noktasına göre ayarla
      const rect = this.zoomWrapper.getBoundingClientRect();
      const centerX = 0.5;
      const centerY = 0.5;
      
      const dx = (pointX - centerX) * rect.width;
      const dy = (pointY - centerY) * rect.height;
      
      const scaleFactor = (newZoom - oldZoom) / oldZoom;
      
      this.panX -= dx * scaleFactor;
      this.panY -= dy * scaleFactor;
    }
    
    this._constrainPan();
    this._applyTransform();
    
    if (this.options.onZoom) {
      this.options.onZoom(this.currentZoom);
    }
    
    // Cursor güncelle
    this.zoomWrapper.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
  }
  
  _constrainPan() {
    if (this.currentZoom <= 1) {
      this.panX = 0;
      this.panY = 0;
      return;
    }
    
    const rect = this.zoomWrapper.getBoundingClientRect();
    const maxPanX = (rect.width * (this.currentZoom - 1)) / 2;
    const maxPanY = (rect.height * (this.currentZoom - 1)) / 2;
    
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));
  }
  
  _applyTransform() {
    if (!this.zoomContent) return;
    
    this.zoomContent.style.transform = 
      `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
  }
  
  /**
   * Zoom seviyesini ayarla
   * @param {number} zoom - Zoom seviyesi
   */
  setZoom(zoom) {
    this.currentZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, zoom)
    );
    
    if (this.currentZoom === 1) {
      this.panX = 0;
      this.panY = 0;
    }
    
    this._constrainPan();
    this._applyTransform();
    
    if (this.options.onZoom) {
      this.options.onZoom(this.currentZoom);
    }
    
    if (this.zoomWrapper) {
      this.zoomWrapper.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
    }
  }
  
  /**
   * Zoom in
   */
  zoomIn() {
    this.setZoom(this.currentZoom + this.options.zoomStep);
  }
  
  /**
   * Zoom out
   */
  zoomOut() {
    this.setZoom(this.currentZoom - this.options.zoomStep);
  }
  
  /**
   * Zoom reset
   */
  reset() {
    this.setZoom(1);
  }
  
  /**
   * Mevcut zoom seviyesini al
   * @returns {number}
   */
  getZoom() {
    return this.currentZoom;
  }
  
  /**
   * Zoom etkin mi
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.enabled;
  }
  
  /**
   * Zoom etkinliğini ayarla
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    
    if (!enabled) {
      this.reset();
    }
  }
  
  /**
   * İçerik elementini al
   * @returns {HTMLElement}
   */
  getContentElement() {
    return this.zoomContent;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    document.removeEventListener('mousemove', this._handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this._handleMouseUp.bind(this));
    
    if (this.zoomWrapper) {
      // İçeriği geri taşı
      while (this.zoomContent.firstChild) {
        this.container.appendChild(this.zoomContent.firstChild);
      }
      this.zoomWrapper.remove();
    }
  }
}
