let resourceLoaderInstance;

class ResourceLoader {
  constructor() {
    if (resourceLoaderInstance) return resourceLoaderInstance;
    resourceLoaderInstance = this;
    
    this.resources = {};
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isLoading = false;
    this.onProgress = null;
    this.onComplete = null;
  }
  
  // 资源列表
  resourceList = {
    images: [
      { key: 'background', src: 'images/image_695435480469248.png' },
      { key: 'player', src: 'images/image_720350330364146.png' }
    ],
    audio: [
      { key: 'bgm', src: 'audio/bgm.mp3' }
    ]
  };
  
  // 开始加载所有资源
  loadAll(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.loadedCount = 0;
    this.isLoading = true;
    
    const allResources = [
      ...this.resourceList.images.map(r => ({ ...r, type: 'image' })),
      ...this.resourceList.audio.map(r => ({ ...r, type: 'audio' }))
    ];
    
    this.totalCount = allResources.length;
    
    if (this.totalCount === 0) {
      this.isLoading = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    
    allResources.forEach(resource => {
      this.loadResource(resource);
    });
  }
  
  // 加载单个资源
  loadResource(resource) {
    if (resource.type === 'image') {
      this.loadImage(resource);
    } else if (resource.type === 'audio') {
      this.loadAudio(resource);
    }
  }
  
  // 加载图片
  loadImage(resource) {
    let img;
    
    if (window.isWechatGame) {
      img = wx.createImage();
    } else {
      img = new Image();
    }
    
    img.onload = () => {
      this.resources[resource.key] = img;
      this.onResourceLoaded();
    };
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${resource.src}`);
      this.onResourceLoaded();
    };
    
    img.src = resource.src;
  }
  
  // 加载音频
  loadAudio(resource) {
    if (window.isWechatGame) {
      const audio = wx.createInnerAudioContext();
      audio.src = resource.src;
      audio.onCanplay(() => {
        this.resources[resource.key] = audio;
        this.onResourceLoaded();
      });
      audio.onError(() => {
        console.warn(`Failed to load audio: ${resource.src}`);
        this.onResourceLoaded();
      });
    } else {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.resources[resource.key] = audio;
        this.onResourceLoaded();
      };
      audio.onerror = () => {
        console.warn(`Failed to load audio: ${resource.src}`);
        this.onResourceLoaded();
      };
      audio.src = resource.src;
    }
  }
  
  // 资源加载完成回调
  onResourceLoaded() {
    this.loadedCount++;
    
    if (this.onProgress) {
      const progress = this.loadedCount / this.totalCount;
      this.onProgress(progress, this.loadedCount, this.totalCount);
    }
    
    if (this.loadedCount >= this.totalCount) {
      this.isLoading = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }
  
  // 获取资源
  get(key) {
    return this.resources[key];
  }
  
  // 获取加载进度
  getProgress() {
    return {
      loaded: this.loadedCount,
      total: this.totalCount,
      progress: this.totalCount > 0 ? this.loadedCount / this.totalCount : 1,
      isLoading: this.isLoading
    };
  }
}

if (typeof window !== 'undefined') {
  window.ResourceLoader = ResourceLoader;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.ResourceLoader = ResourceLoader;
}
