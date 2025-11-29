/**
 * AudioManager - Sound Effects Module
 * Page flip sounds and audio controls
 */
export class AudioManager {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      volume: Math.max(0, Math.min(1, options.volume || 0.5)),
      pageFlipSound: options.pageFlipSound || null,
      ...options
    };
    
    this.enabled = this.options.enabled;
    this.volume = this.options.volume;
    this.sounds = new Map();
    this.audioContext = null;
    
    this._init();
  }
  
  _init() {
    // Web Audio API context oluştur
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API is not supported');
    }
    
    // Varsayılan ses dosyasını yükle
    if (this.options.pageFlipSound) {
      this.loadSound('pageFlip', this.options.pageFlipSound);
    }
  }
  
  /**
   * Ses dosyası yükle
   * @param {string} name - Ses adı
   * @param {string} url - Ses dosyası URL'si
   * @returns {Promise<void>}
   */
  async loadSound(name, url) {
    try {
      const audio = new Audio();
      audio.src = url;
      audio.volume = this.volume;
      audio.preload = 'auto';
      
      // Yükleme bekle
      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve;
        audio.onerror = reject;
      });
      
      this.sounds.set(name, audio);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }
  
  /**
   * Programatik olarak ses oluştur (fallback)
   * @param {string} name - Ses adı
   * @param {number} frequency - Frekans
   * @param {number} duration - Süre (ms)
   */
  createSyntheticSound(name, frequency = 800, duration = 100) {
    if (!this.audioContext) return;
    
    this.sounds.set(name, {
      type: 'synthetic',
      frequency,
      duration
    });
  }
  
  /**
   * Ses çal
   * @param {string} name - Ses adı
   * @returns {Promise<void>}
   */
  async play(name) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(name);
    
    if (!sound) {
      // Fallback: sentetik ses çal
      this._playSyntheticFlipSound();
      return;
    }
    
    if (sound.type === 'synthetic') {
      this._playSyntheticSound(sound.frequency, sound.duration);
    } else {
      // HTML5 Audio
      try {
        const audio = sound.cloneNode(true);
        audio.volume = this.volume;
        await audio.play();
      } catch (error) {
        // Autoplay engellenmiş olabilir
        console.warn('Audio playback failed:', error);
      }
    }
  }
  
  /**
   * Sayfa çevirme sesi çal
   */
  async playPageFlip() {
    await this.play('pageFlip');
  }
  
  _playSyntheticSound(frequency, duration) {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Synthetic sound playback failed:', error);
    }
  }
  
  _playSyntheticFlipSound() {
    if (!this.audioContext) return;
    
    try {
      // Sayfa çevirme benzeri bir ses oluştur
      const duration = 0.15;
      const now = this.audioContext.currentTime;
      
      // Gürültü bufferı oluştur
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Filtre ekle
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(this.volume * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(now);
    } catch (error) {
      console.warn('Synthetic flip sound playback failed:', error);
    }
  }
  
  /**
   * Ses seviyesini ayarla
   * @param {number} volume - Ses seviyesi (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Mevcut seslerin volume'unu güncelle
    this.sounds.forEach((sound) => {
      if (sound instanceof Audio) {
        sound.volume = this.volume;
      }
    });
  }
  
  /**
   * Ses seviyesini al
   * @returns {number}
   */
  getVolume() {
    return this.volume;
  }
  
  /**
   * Ses etkinliğini aç/kapat
   * @param {boolean} enabled - Etkin mi
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  /**
   * Ses etkinliğini al
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Toggle ses
   * @returns {boolean} - Yeni durum
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  
  /**
   * AudioContext'i resume et (kullanıcı etkileşimi sonrası gerekebilir)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  /**
   * Kaynakları temizle
   */
  destroy() {
    this.sounds.forEach((sound) => {
      if (sound instanceof Audio) {
        sound.pause();
        sound.src = '';
      }
    });
    
    this.sounds.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
