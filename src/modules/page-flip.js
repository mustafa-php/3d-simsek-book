/**
 * PageFlip - 3D Page Flip Engine with Realistic Page Curl Effect
 * Advanced page flipping with realistic curling, shadows, and interactive drag support
 */
export class PageFlip {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      duration: options.duration || 800,
      perspective: options.perspective || 2500,
      pageThickness: options.pageThickness || 2,
      enablePageCurl: options.enablePageCurl !== false,
      curlIntensity: options.curlIntensity || 0.3,
      shadowIntensity: options.shadowIntensity || 0.4,
      enableDragFlip: options.enableDragFlip !== false,
      pageBackColor: options.pageBackColor || '#f5f5dc',
      onFlipStart: options.onFlipStart || null,
      onFlipEnd: options.onFlipEnd || null,
      ...options
    };
    
    this.currentPage = 0;
    this.totalPages = 0;
    this.isFlipping = false;
    this.pages = [];
    this.bookElement = null;
    
    // Drag state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurrentX = 0;
    this.dragCurrentY = 0;
    this.dragPage = null;
    this.dragDirection = null;
    this.dragProgress = 0;
    
    // Animation frame
    this.animationFrame = null;
    
    // Bound event handlers
    this._boundHandleMouseDown = this._handleMouseDown.bind(this);
    this._boundHandleMouseMove = this._handleMouseMove.bind(this);
    this._boundHandleMouseUp = this._handleMouseUp.bind(this);
    this._boundHandleTouchStart = this._handleTouchStart.bind(this);
    this._boundHandleTouchMove = this._handleTouchMove.bind(this);
    this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
    
    this._init();
  }
  
  _init() {
    this._createBookStructure();
    this._setupStyles();
    if (this.options.enableDragFlip) {
      this._setupDragEvents();
    }
  }
  
  _createBookStructure() {
    this.bookElement = document.createElement('div');
    this.bookElement.className = 'simsek-book-inner simsek-3d-book';
    this.container.appendChild(this.bookElement);
  }
  
  _setupStyles() {
    this.bookElement.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      perspective: ${this.options.perspective}px;
      transform-style: preserve-3d;
    `;
  }
  
  _setupDragEvents() {
    // Mouse events
    this.bookElement.addEventListener('mousedown', this._boundHandleMouseDown);
    document.addEventListener('mousemove', this._boundHandleMouseMove);
    document.addEventListener('mouseup', this._boundHandleMouseUp);
    
    // Touch events
    this.bookElement.addEventListener('touchstart', this._boundHandleTouchStart, { passive: false });
    document.addEventListener('touchmove', this._boundHandleTouchMove, { passive: false });
    document.addEventListener('touchend', this._boundHandleTouchEnd);
  }
  
  _handleMouseDown(e) {
    if (this.isFlipping) return;
    
    const rect = this.bookElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this._startDrag(x, y, rect.width, rect.height);
  }
  
  _handleMouseMove(e) {
    if (!this.isDragging) return;
    
    const rect = this.bookElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this._updateDrag(x, y, rect.width, rect.height);
  }
  
  _handleMouseUp(e) {
    if (!this.isDragging) return;
    this._endDrag();
  }
  
  _handleTouchStart(e) {
    if (this.isFlipping) return;
    
    const touch = e.touches[0];
    const rect = this.bookElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this._startDrag(x, y, rect.width, rect.height);
  }
  
  _handleTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = this.bookElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this._updateDrag(x, y, rect.width, rect.height);
  }
  
  _handleTouchEnd(e) {
    if (!this.isDragging) return;
    this._endDrag();
  }
  
  _startDrag(x, y, width, height) {
    const cornerSize = Math.min(width, height) * 0.2;
    const isRightEdge = x > width * 0.6;
    const isLeftEdge = x < width * 0.4;
    
    // Determine drag direction based on which side was clicked
    if (isRightEdge && this.currentPage < this.totalPages - 2) {
      this.dragDirection = 'next';
      this.dragPage = this._getFlippingPage('next');
    } else if (isLeftEdge && this.currentPage > 0) {
      this.dragDirection = 'prev';
      this.dragPage = this._getFlippingPage('prev');
    } else {
      return;
    }
    
    if (!this.dragPage) return;
    
    this.isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;
    this.dragCurrentX = x;
    this.dragCurrentY = y;
    this.dragProgress = 0;
    
    // Prepare page for dragging
    this.dragPage.classList.add('simsek-page-dragging');
    this.dragPage.style.transition = 'none';
    this.dragPage.style.zIndex = '100';
  }
  
  _updateDrag(x, y, width, height) {
    this.dragCurrentX = x;
    this.dragCurrentY = y;
    
    const deltaX = this.dragCurrentX - this.dragStartX;
    const halfWidth = width / 2;
    
    // Calculate progress based on drag distance
    if (this.dragDirection === 'next') {
      this.dragProgress = Math.max(0, Math.min(1, -deltaX / halfWidth));
    } else {
      this.dragProgress = Math.max(0, Math.min(1, deltaX / halfWidth));
    }
    
    // Apply the curl effect
    this._applyCurlEffect(this.dragProgress);
  }
  
  _endDrag() {
    if (!this.isDragging) return;
    
    const shouldComplete = this.dragProgress > 0.3;
    
    if (shouldComplete) {
      // Complete the flip
      this._completeFlip();
    } else {
      // Cancel the flip
      this._cancelFlip();
    }
    
    this.isDragging = false;
  }
  
  _getFlippingPage(direction) {
    if (direction === 'next') {
      const currentSpread = Math.floor(this.currentPage / 2);
      return this.pages[currentSpread];
    } else {
      const prevSpread = Math.floor(this.currentPage / 2) - 1;
      return this.pages[prevSpread];
    }
  }
  
  _applyCurlEffect(progress) {
    if (!this.dragPage) return;
    
    const angle = this.dragDirection === 'next' 
      ? -progress * 180 
      : -180 + progress * 180;
    
    // Apply transform with curl effect
    this.dragPage.style.transformOrigin = this.dragDirection === 'next' 
      ? 'right center' 
      : 'left center';
    this.dragPage.style.transform = `rotateY(${angle}deg)`;
    
    // Update shadow based on progress
    this._updateDynamicShadow(progress, angle);
  }
  
  _updateDynamicShadow(progress, angle) {
    if (!this.dragPage) return;
    
    const shadowIntensity = Math.abs(Math.sin(angle * Math.PI / 180)) * this.options.shadowIntensity;
    const shadowBlur = 20 + (shadowIntensity * 30);
    const shadowOpacity = 0.1 + (shadowIntensity * 0.3);
    
    // Apply dynamic shadow to the shadow element
    const shadowEl = this.dragPage.querySelector('.simsek-page-shadow');
    if (shadowEl) {
      shadowEl.style.opacity = shadowOpacity.toString();
    }
    
    // Update curl overlay
    const curlOverlay = this.dragPage.querySelector('.simsek-curl-overlay');
    if (curlOverlay) {
      curlOverlay.style.opacity = (progress * 0.6).toString();
    }
  }
  
  async _completeFlip() {
    if (!this.dragPage) return;
    
    this.isFlipping = true;
    
    if (this.options.onFlipStart) {
      this.options.onFlipStart(this.currentPage, this.dragDirection);
    }
    
    // Animate to completion
    const targetAngle = this.dragDirection === 'next' ? -180 : 0;
    await this._animateToAngle(this.dragPage, targetAngle);
    
    // Update page state
    if (this.dragDirection === 'next') {
      this.currentPage += 2;
    } else {
      this.currentPage -= 2;
    }
    
    this._cleanupDragPage();
    this._updatePageVisibility();
    
    this.isFlipping = false;
    
    if (this.options.onFlipEnd) {
      this.options.onFlipEnd(this.currentPage, this.dragDirection);
    }
  }
  
  async _cancelFlip() {
    if (!this.dragPage) return;
    
    // Animate back to start
    const targetAngle = this.dragDirection === 'next' ? 0 : -180;
    await this._animateToAngle(this.dragPage, targetAngle);
    
    this._cleanupDragPage();
    this._updatePageVisibility();
  }
  
  _cleanupDragPage() {
    if (this.dragPage) {
      this.dragPage.classList.remove('simsek-page-dragging');
      this.dragPage.style.transition = '';
      this.dragPage = null;
    }
    this.dragDirection = null;
    this.dragProgress = 0;
  }
  
  _animateToAngle(element, targetAngle) {
    return new Promise((resolve) => {
      const handleTransitionEnd = (e) => {
        if (e.propertyName === 'transform') {
          element.removeEventListener('transitionend', handleTransitionEnd);
          resolve();
        }
      };
      
      element.addEventListener('transitionend', handleTransitionEnd);
      element.style.transition = `transform ${this.options.duration * 0.5}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      element.style.transform = `rotateY(${targetAngle}deg)`;
      
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(() => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      }, this.options.duration * 0.5 + 50);
    });
  }
  
  /**
   * Load pages into the book
   * @param {Array} pageContents - Page contents (HTML or img elements)
   */
  loadPages(pageContents) {
    this.pages = [];
    this.bookElement.innerHTML = '';
    this.totalPages = pageContents.length;
    
    // Create pages in pairs (left and right)
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
    spread.className = 'simsek-spread simsek-3d-spread';
    spread.dataset.index = Math.floor(index / 2);
    
    spread.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      transform-style: preserve-3d;
      transition: transform ${this.options.duration}ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: transform;
    `;
    
    // Left page (front side)
    const leftPage = this._createPage(leftContent, 'left', index);
    spread.appendChild(leftPage);
    
    // Right page (front side)
    if (rightContent) {
      const rightPage = this._createPage(rightContent, 'right', index + 1);
      spread.appendChild(rightPage);
    }
    
    // Add back side of the spread (visible when flipped)
    const backSide = this._createBackSide(index);
    spread.appendChild(backSide);
    
    // Add shadow layer
    const shadow = this._createShadowLayer();
    spread.appendChild(shadow);
    
    // Add curl overlay for visual effect
    if (this.options.enablePageCurl) {
      const curlOverlay = this._createCurlOverlay();
      spread.appendChild(curlOverlay);
    }
    
    // Add corner curl hint for hover effect
    if (this.options.enableDragFlip) {
      this._addCornerHints(spread, index);
    }
    
    return spread;
  }
  
  _createPage(content, side, pageNumber) {
    const page = document.createElement('div');
    page.className = `simsek-page simsek-page-${side} simsek-3d-page`;
    page.dataset.pageNumber = pageNumber;
    
    page.style.cssText = `
      position: relative;
      width: 50%;
      height: 100%;
      background: var(--simsek-page-bg, #fff);
      box-shadow: ${side === 'left' 
        ? 'inset -15px 0 30px -15px rgba(0,0,0,0.15)' 
        : 'inset 15px 0 30px -15px rgba(0,0,0,0.15)'};
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
      padding: 10px;
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
      inner.appendChild(content);
    } else if (content instanceof HTMLCanvasElement) {
      inner.appendChild(content);
    }
    
    // Page number
    const pageNum = document.createElement('div');
    pageNum.className = 'simsek-page-number';
    pageNum.textContent = pageNumber + 1;
    pageNum.style.cssText = `
      position: absolute;
      bottom: 10px;
      ${side === 'left' ? 'left' : 'right'}: 15px;
      font-size: 12px;
      color: var(--simsek-page-number-color, #666);
      font-weight: 500;
    `;
    
    // Add page texture gradient
    const texture = document.createElement('div');
    texture.className = 'simsek-page-texture';
    texture.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background: linear-gradient(
        ${side === 'left' ? '90deg' : '270deg'},
        transparent 0%,
        rgba(0,0,0,0.02) 50%,
        rgba(0,0,0,0.05) 100%
      );
    `;
    
    page.appendChild(inner);
    page.appendChild(pageNum);
    page.appendChild(texture);
    
    return page;
  }
  
  _createBackSide(index) {
    const back = document.createElement('div');
    back.className = 'simsek-spread-back';
    back.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${this.options.pageBackColor};
      transform: rotateY(180deg);
      backface-visibility: hidden;
      display: flex;
      border-radius: 0 4px 4px 0;
    `;
    
    // Left back page
    const leftBack = document.createElement('div');
    leftBack.className = 'simsek-back-left';
    leftBack.style.cssText = `
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, 
        ${this.options.pageBackColor} 0%,
        ${this._adjustColor(this.options.pageBackColor, -10)} 100%
      );
      box-shadow: inset -10px 0 20px -10px rgba(0,0,0,0.1);
    `;
    
    // Right back page
    const rightBack = document.createElement('div');
    rightBack.className = 'simsek-back-right';
    rightBack.style.cssText = `
      width: 50%;
      height: 100%;
      background: linear-gradient(270deg, 
        ${this.options.pageBackColor} 0%,
        ${this._adjustColor(this.options.pageBackColor, -10)} 100%
      );
      box-shadow: inset 10px 0 20px -10px rgba(0,0,0,0.1);
    `;
    
    // Add subtle paper texture pattern to back
    const pattern = document.createElement('div');
    pattern.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    `;
    
    back.appendChild(leftBack);
    back.appendChild(rightBack);
    back.appendChild(pattern);
    
    return back;
  }
  
  _createShadowLayer() {
    const shadow = document.createElement('div');
    shadow.className = 'simsek-page-shadow';
    shadow.style.cssText = `
      position: absolute;
      top: 5%;
      left: 0;
      width: 100%;
      height: 90%;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(
        to right,
        rgba(0,0,0,0.3) 0%,
        rgba(0,0,0,0.1) 10%,
        transparent 50%
      );
      transition: opacity 0.3s ease;
    `;
    return shadow;
  }
  
  _createCurlOverlay() {
    const curl = document.createElement('div');
    curl.className = 'simsek-curl-overlay';
    curl.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 100%;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(
        to left,
        rgba(0,0,0,0.15) 0%,
        rgba(0,0,0,0) 5%,
        rgba(255,255,255,0.1) 15%,
        rgba(0,0,0,0.05) 50%,
        transparent 100%
      );
      transition: opacity 0.3s ease;
    `;
    return curl;
  }
  
  _addCornerHints(spread, index) {
    // Top-right corner hint
    const cornerHint = document.createElement('div');
    cornerHint.className = 'simsek-corner-hint simsek-corner-top-right';
    cornerHint.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 60px;
      height: 60px;
      cursor: pointer;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Corner curl visual
    const curlVisual = document.createElement('div');
    curlVisual.className = 'simsek-corner-curl';
    curlVisual.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 40px 40px 0;
      border-color: transparent ${this.options.pageBackColor} transparent transparent;
      transition: border-width 0.3s ease;
      filter: drop-shadow(-2px 2px 3px rgba(0,0,0,0.2));
    `;
    
    cornerHint.appendChild(curlVisual);
    spread.appendChild(cornerHint);
    
    // Hover effects
    spread.addEventListener('mouseenter', () => {
      if (!this.isDragging && !this.isFlipping) {
        cornerHint.style.opacity = '1';
      }
    });
    
    spread.addEventListener('mouseleave', () => {
      cornerHint.style.opacity = '0';
      curlVisual.style.borderWidth = '0 40px 40px 0';
    });
    
    cornerHint.addEventListener('mouseenter', () => {
      curlVisual.style.borderWidth = '0 60px 60px 0';
    });
    
    cornerHint.addEventListener('mouseleave', () => {
      curlVisual.style.borderWidth = '0 40px 40px 0';
    });
    
    // Store references for cleanup - attach to spread element
    spread._cornerHintListeners = {
      spreadEnter: () => {
        if (!this.isDragging && !this.isFlipping) {
          cornerHint.style.opacity = '1';
        }
      },
      spreadLeave: () => {
        cornerHint.style.opacity = '0';
        curlVisual.style.borderWidth = '0 40px 40px 0';
      }
    };
  }
  
  _adjustColor(color, amount) {
    // Simple color adjustment for lighter/darker shades
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return color;
  }
  
  _updatePageVisibility() {
    const currentSpread = Math.floor(this.currentPage / 2);
    
    this.pages.forEach((spread, index) => {
      // Reset transition
      spread.style.transition = `transform ${this.options.duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      
      if (index === currentSpread) {
        spread.style.display = 'flex';
        spread.style.zIndex = '10';
        spread.style.transform = 'rotateY(0deg)';
        spread.style.transformOrigin = 'right center';
      } else if (index < currentSpread) {
        spread.style.display = 'flex';
        spread.style.zIndex = String(index);
        spread.style.transform = 'rotateY(-180deg)';
        spread.style.transformOrigin = 'right center';
      } else {
        spread.style.display = 'flex';
        spread.style.zIndex = String(this.pages.length - index);
        spread.style.transform = 'rotateY(0deg)';
        spread.style.transformOrigin = 'right center';
      }
    });
  }
  
  /**
   * Go to next page
   * @returns {boolean} - Success status
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
      spread.style.transformOrigin = 'right center';
      spread.style.zIndex = '100';
      
      // Show curl overlay during animation
      const curlOverlay = spread.querySelector('.simsek-curl-overlay');
      const shadowEl = spread.querySelector('.simsek-page-shadow');
      
      if (curlOverlay) {
        curlOverlay.style.opacity = '0.6';
      }
      if (shadowEl) {
        shadowEl.style.opacity = '0.4';
      }
      
      // Flip animation
      await this._animateFlip(spread, 0, -180);
      
      // Reset overlays
      if (curlOverlay) {
        curlOverlay.style.opacity = '0';
      }
      if (shadowEl) {
        shadowEl.style.opacity = '0';
      }
      
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
   * Go to previous page
   * @returns {boolean} - Success status
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
      spread.style.transformOrigin = 'right center';
      spread.style.zIndex = '100';
      
      // Show curl overlay during animation
      const curlOverlay = spread.querySelector('.simsek-curl-overlay');
      const shadowEl = spread.querySelector('.simsek-page-shadow');
      
      if (curlOverlay) {
        curlOverlay.style.opacity = '0.6';
      }
      if (shadowEl) {
        shadowEl.style.opacity = '0.4';
      }
      
      // Flip animation (reverse)
      await this._animateFlip(spread, -180, 0);
      
      // Reset overlays
      if (curlOverlay) {
        curlOverlay.style.opacity = '0';
      }
      if (shadowEl) {
        shadowEl.style.opacity = '0';
      }
      
      this._updatePageVisibility();
    }
    
    this.isFlipping = false;
    
    if (this.options.onFlipEnd) {
      this.options.onFlipEnd(this.currentPage, 'prev');
    }
    
    return true;
  }
  
  /**
   * Go to specific page
   * @param {number} pageNumber - Page number (0-indexed)
   */
  async goToPage(pageNumber) {
    if (this.isFlipping) return false;
    
    pageNumber = Math.max(0, Math.min(pageNumber, this.totalPages - 1));
    
    // Round to even number
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
      const handleTransitionEnd = (e) => {
        if (e.propertyName === 'transform') {
          element.removeEventListener('transitionend', handleTransitionEnd);
          resolve();
        }
      };
      
      // Set initial state
      element.style.transition = 'none';
      element.style.transform = `rotateY(${fromAngle}deg)`;
      
      // Force reflow
      element.offsetHeight;
      
      // Add transition listener
      element.addEventListener('transitionend', handleTransitionEnd);
      
      // Animate with smooth easing
      element.style.transition = `transform ${this.options.duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      element.style.transform = `rotateY(${toAngle}deg)`;
      
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(() => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      }, this.options.duration + 50);
    });
  }
  
  /**
   * Get current page number
   * @returns {number}
   */
  getCurrentPage() {
    return this.currentPage;
  }
  
  /**
   * Get total page count
   * @returns {number}
   */
  getTotalPages() {
    return this.totalPages;
  }
  
  /**
   * Check if flip animation is in progress
   * @returns {boolean}
   */
  isAnimating() {
    return this.isFlipping;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners from document
    if (this.options.enableDragFlip) {
      this.bookElement.removeEventListener('mousedown', this._boundHandleMouseDown);
      document.removeEventListener('mousemove', this._boundHandleMouseMove);
      document.removeEventListener('mouseup', this._boundHandleMouseUp);
      this.bookElement.removeEventListener('touchstart', this._boundHandleTouchStart);
      document.removeEventListener('touchmove', this._boundHandleTouchMove);
      document.removeEventListener('touchend', this._boundHandleTouchEnd);
    }
    
    // Cancel any pending animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clear page references to allow garbage collection
    this.pages.forEach(spread => {
      spread._cornerHintListeners = null;
    });
    this.pages = [];
    
    // Remove book element from DOM
    if (this.bookElement) {
      this.bookElement.remove();
      this.bookElement = null;
    }
    
    // Clear drag state
    this.dragPage = null;
  }
}
