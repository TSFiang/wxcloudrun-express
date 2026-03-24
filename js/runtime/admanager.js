let adManagerInstance;

/**
 * 广告管理器（单例模式）
 * @class AdManager
 * @description 统一管理微信小游戏广告，包括Banner广告、激励视频广告、插屏广告
 * 
 * 接入前准备：
 * 1. 在微信公众平台开通流量主
 * 2. 创建广告位获取广告单元ID
 * 3. 在 game.json 中配置广告相关权限
 */
class AdManager {
  constructor() {
    if (adManagerInstance) return adManagerInstance;
    adManagerInstance = this;
    
    // 广告单元ID（需要在微信公众平台申请）
    this.adUnitIds = {
      banner: 'adunit-xxxxxxxxxx',      // Banner广告单元ID
      rewarded: 'adunit-xxxxxxxxxx',    // 激励视频广告单元ID
      interstitial: 'adunit-xxxxxxxxxx' // 插屏广告单元ID
    };
    
    // 广告实例
    this.bannerAd = null;
    this.rewardedVideoAd = null;
    this.interstitialAd = null;
    
    // 广告状态
    this.isBannerShowing = false;
    this.isRewardedVideoLoaded = false;
    this.isInterstitialLoaded = false;
    
    // 回调函数
    this.onRewardedSuccess = null;
    this.onRewardedFailed = null;
    
    // 是否在微信环境
    this.isWechatGame = typeof wx !== 'undefined' && typeof wx.createRewardedVideoAd === 'function';
    
    if (this.isWechatGame) {
      this.initAds();
    }
  }
  
  /**
   * 初始化广告
   */
  initAds() {
    if (!this.isWechatGame) return;
    
    // 初始化激励视频广告
    this.initRewardedVideoAd();
    
    // 初始化插屏广告
    this.initInterstitialAd();
    
    console.log('[AdManager] 广告初始化完成');
  }
  
  /**
   * 初始化激励视频广告
   */
  initRewardedVideoAd() {
    if (!this.isWechatGame) return;
    
    try {
      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: this.adUnitIds.rewarded
      });
      
      // 广告加载成功
      this.rewardedVideoAd.onLoad(() => {
        this.isRewardedVideoLoaded = true;
        console.log('[AdManager] 激励视频广告加载成功');
      });
      
      // 广告加载失败
      this.rewardedVideoAd.onError((err) => {
        this.isRewardedVideoLoaded = false;
        console.error('[AdManager] 激励视频广告加载失败:', err);
      });
      
      // 广告关闭
      this.rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 用户完整观看了广告，发放奖励
          console.log('[AdManager] 用户完整观看广告，发放奖励');
          if (this.onRewardedSuccess) {
            this.onRewardedSuccess();
          }
        } else {
          // 用户未完整观看广告
          console.log('[AdManager] 用户未完整观看广告');
          if (this.onRewardedFailed) {
            this.onRewardedFailed('广告未观看完成');
          }
        }
        // 重新预加载广告
        this.rewardedVideoAd.load().catch(err => {
          console.error('[AdManager] 重新加载激励视频广告失败:', err);
        });
      });
      
      // 预加载广告
      this.rewardedVideoAd.load().catch(err => {
        console.error('[AdManager] 首次加载激励视频广告失败:', err);
      });
      
    } catch (err) {
      console.error('[AdManager] 创建激励视频广告失败:', err);
    }
  }
  
  /**
   * 初始化插屏广告
   */
  initInterstitialAd() {
    if (!this.isWechatGame) return;
    
    try {
      this.interstitialAd = wx.createInterstitialAd({
        adUnitId: this.adUnitIds.interstitial
      });
      
      this.interstitialAd.onLoad(() => {
        this.isInterstitialLoaded = true;
        console.log('[AdManager] 插屏广告加载成功');
      });
      
      this.interstitialAd.onError((err) => {
        this.isInterstitialLoaded = false;
        console.error('[AdManager] 插屏广告加载失败:', err);
      });
      
      this.interstitialAd.onClose(() => {
        this.isInterstitialLoaded = false;
        // 重新预加载
        this.interstitialAd.load().catch(err => {
          console.error('[AdManager] 重新加载插屏广告失败:', err);
        });
      });
      
      this.interstitialAd.load().catch(err => {
        console.error('[AdManager] 首次加载插屏广告失败:', err);
      });
      
    } catch (err) {
      console.error('[AdManager] 创建插屏广告失败:', err);
    }
  }
  
  /**
   * 显示Banner广告
   * @param {number} width - 广告宽度
   * @param {number} top - 广告顶部位置
   */
  showBannerAd(width = 375, top = 607) {
    if (!this.isWechatGame) {
      console.log('[AdManager] 非微信环境，跳过Banner广告');
      return false;
    }
    
    // 如果Banner广告已存在且正在显示，直接返回
    if (this.bannerAd && this.isBannerShowing) {
      console.log('[AdManager] Banner广告已在显示中');
      return true;
    }
    
    // 如果Banner广告已存在但未显示，尝试重新显示
    if (this.bannerAd && !this.isBannerShowing) {
      this.bannerAd.show().then(() => {
        this.isBannerShowing = true;
        console.log('[AdManager] Banner广告重新显示成功');
      }).catch(err => {
        console.error('[AdManager] Banner广告重新显示失败:', err);
        // 显示失败，销毁旧广告，创建新的
        this.bannerAd = null;
        this.showBannerAd(width, top);
      });
      return true;
    }
    
    try {
      // 创建新的Banner广告
      this.bannerAd = wx.createBannerAd({
        adUnitId: this.adUnitIds.banner,
        style: {
          width: width,
          top: top
        }
      });
      
      this.bannerAd.onResize((size) => {
        // 居中显示
        try {
          const systemInfo = wx.getSystemInfoSync();
          if (this.bannerAd) {
            this.bannerAd.style.left = (systemInfo.windowWidth - size.width) / 2;
          }
        } catch (err) {
          console.error('[AdManager] 调整Banner广告位置失败:', err);
        }
      });
      
      this.bannerAd.onError((err) => {
        console.error('[AdManager] Banner广告错误:', err);
        // 忽略特定的内部错误
        if (err.errMsg && err.errMsg.includes('not found')) {
          console.log('[AdManager] 忽略内部错误:', err.errMsg);
          return;
        }
        this.isBannerShowing = false;
      });
      
      this.bannerAd.show().then(() => {
        this.isBannerShowing = true;
        console.log('[AdManager] Banner广告显示成功');
      }).catch(err => {
        console.error('[AdManager] Banner广告显示失败:', err);
        this.isBannerShowing = false;
      });
      
      return true;
    } catch (err) {
      console.error('[AdManager] 创建Banner广告失败:', err);
      return false;
    }
  }
  
  /**
   * 隐藏Banner广告
   */
  hideBannerAd() {
    if (this.bannerAd) {
      try {
        // 先移除事件监听器，避免触发错误
        this.bannerAd.offResize();
        this.bannerAd.offError();
        
        // 延迟销毁，避免立即销毁导致的错误
        setTimeout(() => {
          try {
            if (this.bannerAd) {
              this.bannerAd.destroy();
              this.bannerAd = null;
              this.isBannerShowing = false;
              console.log('[AdManager] Banner广告已隐藏');
            }
          } catch (err) {
            console.error('[AdManager] 销毁Banner广告失败:', err);
            this.bannerAd = null;
            this.isBannerShowing = false;
          }
        }, 100);
      } catch (err) {
        console.error('[AdManager] 销毁Banner广告失败:', err);
        this.bannerAd = null;
        this.isBannerShowing = false;
      }
    }
  }
  
  /**
   * 显示激励视频广告
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onFailed - 失败回调
   */
  showRewardedVideoAd(onSuccess, onFailed) {
    this.onRewardedSuccess = onSuccess;
    this.onRewardedFailed = onFailed;
    
    if (!this.isWechatGame) {
      console.log('[AdManager] 非微信环境，模拟广告成功');
      // 非微信环境模拟成功
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 100);
      return;
    }
    
    if (!this.rewardedVideoAd) {
      console.error('[AdManager] 激励视频广告未初始化');
      if (onFailed) onFailed('广告未初始化');
      return;
    }
    
    this.rewardedVideoAd.show().then(() => {
      console.log('[AdManager] 激励视频广告显示成功');
    }).catch(err => {
      console.error('[AdManager] 激励视频广告显示失败:', err);
      // 尝试重新加载
      this.rewardedVideoAd.load().then(() => {
        return this.rewardedVideoAd.show();
      }).catch(loadErr => {
        console.error('[AdManager] 重新加载后仍无法显示:', loadErr);
        if (onFailed) onFailed('广告加载失败，请稍后重试');
      });
    });
  }
  
  /**
   * 显示插屏广告
   */
  showInterstitialAd() {
    if (!this.isWechatGame) {
      console.log('[AdManager] 非微信环境，跳过插屏广告');
      return false;
    }
    
    if (!this.interstitialAd) {
      console.error('[AdManager] 插屏广告未初始化');
      return false;
    }
    
    if (!this.isInterstitialLoaded) {
      console.log('[AdManager] 插屏广告未加载完成');
      return false;
    }
    
    this.interstitialAd.show().then(() => {
      console.log('[AdManager] 插屏广告显示成功');
      return true;
    }).catch(err => {
      console.error('[AdManager] 插屏广告显示失败:', err);
      return false;
    });
  }
  
  /**
   * 检查激励视频广告是否可用
   */
  isRewardedVideoAvailable() {
    return this.isWechatGame ? this.isRewardedVideoLoaded : true;
  }
  
  /**
   * 设置广告单元ID
   * @param {Object} ids - 广告单元ID对象
   */
  setAdUnitIds(ids) {
    if (ids.banner) this.adUnitIds.banner = ids.banner;
    if (ids.rewarded) this.adUnitIds.rewarded = ids.rewarded;
    if (ids.interstitial) this.adUnitIds.interstitial = ids.interstitial;
    console.log('[AdManager] 广告单元ID已更新:', this.adUnitIds);
  }
}

// 创建全局实例
const adManager = new AdManager();

if (typeof window !== 'undefined') {
  window.AdManager = AdManager;
  window.adManager = adManager;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.AdManager = AdManager;
  GameGlobal.adManager = adManager;
}
