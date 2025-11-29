/**
 * PDFLoader - PDF Loading and Display Module
 * Integration with PDF.js for rendering PDF documents
 */
export class PDFLoader {
  constructor(options = {}) {
    this.options = {
      workerSrc: options.workerSrc || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      scale: options.scale || 1.5,
      ...options
    };
    
    this.pdfDocument = null;
    this.pageCache = new Map();
    this.isLoading = false;
  }
  
  /**
   * PDF dosyasını yükle
   * @param {string|ArrayBuffer} source - PDF URL veya ArrayBuffer
   * @returns {Promise<Object>} - PDF metadata
   */
  async load(source) {
    if (this.isLoading) {
      throw new Error('A PDF is already being loaded');
    }
    
    this.isLoading = true;
    
    try {
      // PDF.js kütüphanesini kontrol et
      if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library is not loaded. Please include pdf.js before using PDF features.');
      }
      
      // Worker ayarla
      pdfjsLib.GlobalWorkerOptions.workerSrc = this.options.workerSrc;
      
      // PDF'i yükle
      const loadingTask = pdfjsLib.getDocument(source);
      this.pdfDocument = await loadingTask.promise;
      
      // Metadata al
      const metadata = await this.getMetadata();
      
      this.isLoading = false;
      
      return metadata;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }
  
  /**
   * PDF metadata al
   * @returns {Promise<Object>}
   */
  async getMetadata() {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }
    
    const info = await this.pdfDocument.getMetadata();
    
    return {
      numPages: this.pdfDocument.numPages,
      title: info.info?.Title || 'Untitled',
      author: info.info?.Author || 'Unknown',
      subject: info.info?.Subject || '',
      creator: info.info?.Creator || '',
      producer: info.info?.Producer || '',
      creationDate: info.info?.CreationDate || null,
      modificationDate: info.info?.ModDate || null
    };
  }
  
  /**
   * Belirli bir sayfayı canvas olarak render et
   * @param {number} pageNumber - Sayfa numarası (1-indexed)
   * @param {Object} options - Render seçenekleri
   * @returns {Promise<HTMLCanvasElement>}
   */
  async renderPage(pageNumber, options = {}) {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }
    
    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    
    const scale = options.scale || this.options.scale;
    const cacheKey = `${pageNumber}-${scale}`;
    
    // Cache kontrolü
    if (this.pageCache.has(cacheKey)) {
      return this.pageCache.get(cacheKey).cloneNode(true);
    }
    
    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Cache'e ekle
    this.pageCache.set(cacheKey, canvas);
    
    return canvas;
  }
  
  /**
   * Tüm sayfaları canvas olarak render et
   * @param {Object} options - Render seçenekleri
   * @returns {Promise<HTMLCanvasElement[]>}
   */
  async renderAllPages(options = {}) {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }
    
    const pages = [];
    const numPages = this.pdfDocument.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const canvas = await this.renderPage(i, options);
      pages.push(canvas);
      
      // Progress callback
      if (options.onProgress) {
        options.onProgress(i, numPages);
      }
    }
    
    return pages;
  }
  
  /**
   * Thumbnail oluştur
   * @param {number} pageNumber - Sayfa numarası (1-indexed)
   * @param {number} maxWidth - Maksimum genişlik
   * @returns {Promise<HTMLCanvasElement>}
   */
  async createThumbnail(pageNumber, maxWidth = 150) {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }
    
    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / viewport.width;
    
    return this.renderPage(pageNumber, { scale });
  }
  
  /**
   * Sayfa sayısını al
   * @returns {number}
   */
  getNumPages() {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
    this.pageCache.clear();
  }
}
