let instance;

/**
 * 统一的音效管理器
 */
class Music {
  constructor() {
    if (instance) return instance;

    instance = this;

    if (window.isWechatGame) {
      this.bgmAudio = wx.createInnerAudioContext();
      this.shootAudio = wx.createInnerAudioContext();
      this.boomAudio = wx.createInnerAudioContext();
      this.bgmAudio.loop = true; // 背景音乐循环播放
      this.bgmAudio.autoplay = true; // 背景音乐自动播放
      this.bgmAudio.src = 'audio/bgm.mp3';
      this.shootAudio.src = 'audio/bullet.mp3';
      this.boomAudio.src = 'audio/boom.mp3';
    } else if (typeof window !== 'undefined') {
      // 浏览器环境
      this.bgmAudio = new Audio('audio/bgm.mp3');
      this.shootAudio = new Audio('audio/bullet.mp3');
      this.boomAudio = new Audio('audio/boom.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.autoplay = true;
    }
  }



  playShoot() {
    this.shootAudio.currentTime = 0;
    this.shootAudio.play();
  }

  playExplosion() {
    if (this.boomAudio) {
      this.boomAudio.currentTime = 0;
      this.boomAudio.play();
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
