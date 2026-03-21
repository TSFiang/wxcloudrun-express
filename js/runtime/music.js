let musicInstance;

class Music {
  constructor() {
    if (musicInstance) return musicInstance;

    musicInstance = this;
    
    this.hasInteracted = false; // 用户是否已交互

    if (window.isWechatGame) {
      this.bgmAudio = wx.createInnerAudioContext();
      this.bgmAudio.loop = true;
      this.bgmAudio.autoplay = false;
      this.bgmAudio.src = 'audio/bgm.mp3';
    } else if (typeof window !== 'undefined') {
      this.bgmAudio = new Audio('audio/bgm.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.autoplay = false;
    }
  }
  
  // 用户首次交互后调用此方法
  onUserInteract() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    this.syncWithSettings();
  }
  
  // 同步音频状态与设置
  syncWithSettings() {
    if (!this.hasInteracted) {
      console.log('用户尚未交互，跳过音乐同步');
      return;
    }
    
    const databus = typeof GameGlobal !== 'undefined' ? GameGlobal.databus : null;
    if (databus && databus.settings) {
      if (databus.settings.music) {
        this.play();
      } else {
        this.pause();
      }
    }
  }
  
  // 播放背景音乐
  play() {
    if (this.bgmAudio) {
      if (window.isWechatGame) {
        this.bgmAudio.play();
      } else {
        this.bgmAudio.play().catch(err => {
          console.log('音频播放失败:', err);
        });
      }
      console.log('背景音乐播放');
    }
  }
  
  // 暂停背景音乐
  pause() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      console.log('背景音乐暂停');
    }
  }
  
  // 停止背景音乐
  stop() {
    if (this.bgmAudio) {
      if (window.isWechatGame) {
        this.bgmAudio.stop();
      } else {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      }
      console.log('背景音乐停止');
    }
  }
  
  // 设置音量
  setVolume(volume) {
    if (this.bgmAudio) {
      if (window.isWechatGame) {
        this.bgmAudio.volume = volume;
      } else {
        this.bgmAudio.volume = volume;
      }
      console.log('音量设置为:', volume);
    }
  }
  
  // 切换播放/暂停
  toggle() {
    if (this.bgmAudio) {
      if (window.isWechatGame) {
        if (this.bgmAudio.paused) {
          this.play();
        } else {
          this.pause();
        }
      } else {
        if (this.bgmAudio.paused) {
          this.play();
        } else {
          this.pause();
        }
      }
    }
  }
}

// 将Music类挂载到全局对象
if (typeof window !== 'undefined') {
  window.Music = Music;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.Music = Music;
}
