/**
 * 成就管理器
 * 处理游戏中的成就系统
 */
class AchievementManager {
  constructor() {
    // 成就定义
    this.achievements = {
      // 分数成就
      score: {
        firstStep: {
          id: 'firstStep',
          name: '初出茅庐',
          description: '获得第1分',
          icon: '🎯',
          condition: { type: 'score', target: 1 },
          reward: { beanPieces: 1 },
          unlocked: false,
          unlockedAt: null
        },
        rookie: {
          id: 'rookie',
          name: '新手玩家',
          description: '累计获得100分',
          icon: '🌟',
          condition: { type: 'score', target: 100 },
          reward: { beanPieces: 5 },
          unlocked: false,
          unlockedAt: null
        },
        expert: {
          id: 'expert',
          name: '高手玩家',
          description: '累计获得500分',
          icon: '⭐',
          condition: { type: 'score', target: 500 },
          reward: { beanPieces: 10, items: { shield: 1 } },
          unlocked: false,
          unlockedAt: null
        },
        master: {
          id: 'master',
          name: '大师玩家',
          description: '累计获得1000分',
          icon: '💫',
          condition: { type: 'score', target: 1000 },
          reward: { beanPieces: 20, items: { shield: 2, rainbow: 1 } },
          unlocked: false,
          unlockedAt: null
        },
        legend: {
          id: 'legend',
          name: '传奇玩家',
          description: '累计获得5000分',
          icon: '👑',
          condition: { type: 'score', target: 5000 },
          reward: { beanPieces: 50, items: { shield: 5, rainbow: 3, doubleScore: 2 } },
          unlocked: false,
          unlockedAt: null
        }
      },
      
      // 跳跃成就
      jump: {
        firstJump: {
          id: 'firstJump',
          name: '第一次跳跃',
          description: '完成第一次跳跃',
          icon: '🦘',
          condition: { type: 'jump', target: 1 },
          reward: { beanPieces: 1 },
          unlocked: false,
          unlockedAt: null
        },
        jumper: {
          id: 'jumper',
          name: '跳跃达人',
          description: '累计跳跃100次',
          icon: '🏃',
          condition: { type: 'jump', target: 100 },
          reward: { beanPieces: 5 },
          unlocked: false,
          unlockedAt: null
        },
        superJumper: {
          id: 'superJumper',
          name: '超级跳跃者',
          description: '累计跳跃500次',
          icon: '🚀',
          condition: { type: 'jump', target: 500 },
          reward: { beanPieces: 15, items: { extraBean: 2 } },
          unlocked: false,
          unlockedAt: null
        }
      },
      
      // 收集成就
      collection: {
        firstCollect: {
          id: 'firstCollect',
          name: '初次收集',
          description: '收集第1颗拼豆',
          icon: '🫘',
          condition: { type: 'collect', target: 1 },
          reward: { beanPieces: 1 },
          unlocked: false,
          unlockedAt: null
        },
        collector: {
          id: 'collector',
          name: '收集爱好者',
          description: '累计收集50颗拼豆',
          icon: '💎',
          condition: { type: 'collect', target: 50 },
          reward: { beanPieces: 10 },
          unlocked: false,
          unlockedAt: null
        },
        masterCollector: {
          id: 'masterCollector',
          name: '收集大师',
          description: '累计收集200颗拼豆',
          icon: '🏆',
          condition: { type: 'collect', target: 200 },
          reward: { beanPieces: 30, items: { rainbow: 2 } },
          unlocked: false,
          unlockedAt: null
        }
      },
      
      // 消除成就
      match: {
        firstMatch: {
          id: 'firstMatch',
          name: '初次消除',
          description: '完成第一次消除',
          icon: '✨',
          condition: { type: 'match', target: 1 },
          reward: { beanPieces: 2 },
          unlocked: false,
          unlockedAt: null
        },
        matcher: {
          id: 'matcher',
          name: '消除达人',
          description: '累计消除20次',
          icon: '🎨',
          condition: { type: 'match', target: 20 },
          reward: { beanPieces: 15 },
          unlocked: false,
          unlockedAt: null
        },
        masterMatcher: {
          id: 'masterMatcher',
          name: '消除大师',
          description: '累计消除100次',
          icon: '🌈',
          condition: { type: 'match', target: 100 },
          reward: { beanPieces: 40, items: { doubleScore: 3 } },
          unlocked: false,
          unlockedAt: null
        }
      },
      
      // 图鉴成就
      gallery: {
        firstItem: {
          id: 'firstItem',
          name: '图鉴开启',
          description: '收集第1个图鉴道具',
          icon: '📖',
          condition: { type: 'gallery', target: 1 },
          reward: { beanPieces: 5 },
          unlocked: false,
          unlockedAt: null
        },
        galleryCollector: {
          id: 'galleryCollector',
          name: '图鉴收藏家',
          description: '收集10个图鉴道具',
          icon: '📚',
          condition: { type: 'gallery', target: 10 },
          reward: { beanPieces: 20, items: { extraBean: 3 } },
          unlocked: false,
          unlockedAt: null
        },
        galleryMaster: {
          id: 'galleryMaster',
          name: '图鉴大师',
          description: '收集30个图鉴道具',
          icon: '🏅',
          condition: { type: 'gallery', target: 30 },
          reward: { beanPieces: 50, items: { shield: 3, rainbow: 2, doubleScore: 2, extraBean: 3 } },
          unlocked: false,
          unlockedAt: null
        }
      },
      
      // 特殊成就
      special: {
        survivalist: {
          id: 'survivalist',
          name: '生存专家',
          description: '使用护盾成功保护自己',
          icon: '🛡️',
          condition: { type: 'shield', target: 1 },
          reward: { beanPieces: 5 },
          unlocked: false,
          unlockedAt: null
        },
        rainbowMaster: {
          id: 'rainbowMaster',
          name: '彩虹大师',
          description: '使用彩虹道具消除拼豆',
          icon: '🌈',
          condition: { type: 'rainbow', target: 1 },
          reward: { beanPieces: 5 },
          unlocked: false,
          unlockedAt: null
        },
        doubleScoreMaster: {
          id: 'doubleScoreMaster',
          name: '双倍大师',
          description: '在双倍分数期间获得100分',
          icon: '2️⃣',
          condition: { type: 'doubleScore', target: 100 },
          reward: { beanPieces: 10 },
          unlocked: false,
          unlockedAt: null
        },
        perfectJump: {
          id: 'perfectJump',
          name: '完美跳跃',
          description: '单次跳跃获得50分以上',
          icon: '🎯',
          condition: { type: 'perfectJump', target: 50 },
          reward: { beanPieces: 15, items: { shield: 1 } },
          unlocked: false,
          unlockedAt: null
        }
      }
    };
    
    // 成就统计数据
    this.stats = {
      totalScore: 0,
      totalJumps: 0,
      totalCollects: 0,
      totalMatches: 0,
      totalGalleryItems: 0,
      shieldUsed: 0,
      rainbowUsed: 0,
      doubleScoreGained: 0,
      maxSingleJumpScore: 0
    };
    
    // 待通知的成就队列
    this.notificationQueue = [];
    
    // 从本地存储加载成就数据
    this.loadAchievements();
  }
  
  /**
   * 从本地存储加载成就数据
   */
  loadAchievements() {
    try {
      if (window.isWechatGame) {
        const achievementsData = wx.getStorageSync('achievements');
        const statsData = wx.getStorageSync('achievementStats');
        
        if (achievementsData) {
          const savedAchievements = JSON.parse(achievementsData);
          this.mergeAchievements(savedAchievements);
        }
        
        if (statsData) {
          this.stats = JSON.parse(statsData);
        }
      } else {
        // 浏览器环境
        const achievementsData = localStorage.getItem('achievements');
        const statsData = localStorage.getItem('achievementStats');
        
        if (achievementsData) {
          const savedAchievements = JSON.parse(achievementsData);
          this.mergeAchievements(savedAchievements);
        }
        
        if (statsData) {
          this.stats = JSON.parse(statsData);
        }
      }
      
      console.log('成就数据加载成功');
    } catch (error) {
      console.error('加载成就数据失败:', error);
    }
  }
  
  /**
   * 合并保存的成就数据
   */
  mergeAchievements(savedAchievements) {
    for (const category in savedAchievements) {
      if (this.achievements[category]) {
        for (const achievementId in savedAchievements[category]) {
          if (this.achievements[category][achievementId]) {
            this.achievements[category][achievementId].unlocked = savedAchievements[category][achievementId].unlocked;
            this.achievements[category][achievementId].unlockedAt = savedAchievements[category][achievementId].unlockedAt;
          }
        }
      }
    }
  }
  
  /**
   * 保存成就数据到本地存储
   */
  saveAchievements() {
    try {
      if (window.isWechatGame) {
        wx.setStorageSync('achievements', JSON.stringify(this.achievements));
        wx.setStorageSync('achievementStats', JSON.stringify(this.stats));
      } else {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
        localStorage.setItem('achievementStats', JSON.stringify(this.stats));
      }
    } catch (error) {
      console.error('保存成就数据失败:', error);
    }
  }
  
  /**
   * 更新统计数据
   */
  updateStats(type, value = 1) {
    switch (type) {
      case 'score':
        this.stats.totalScore += value;
        break;
      case 'jump':
        this.stats.totalJumps += value;
        break;
      case 'collect':
        this.stats.totalCollects += value;
        break;
      case 'match':
        this.stats.totalMatches += value;
        break;
      case 'gallery':
        this.stats.totalGalleryItems += value;
        break;
      case 'shield':
        this.stats.shieldUsed += value;
        break;
      case 'rainbow':
        this.stats.rainbowUsed += value;
        break;
      case 'doubleScore':
        this.stats.doubleScoreGained += value;
        break;
      case 'perfectJump':
        if (value > this.stats.maxSingleJumpScore) {
          this.stats.maxSingleJumpScore = value;
        }
        break;
    }
    
    // 检查成就
    this.checkAchievements(type, value);
    
    // 保存数据
    this.saveAchievements();
  }
  
  /**
   * 检查成就是否达成
   */
  checkAchievements(type, value = 0) {
    const categories = Object.keys(this.achievements);
    
    for (const category of categories) {
      const categoryAchievements = this.achievements[category];
      
      for (const achievementId in categoryAchievements) {
        const achievement = categoryAchievements[achievementId];
        
        // 跳过已解锁的成就
        if (achievement.unlocked) {
          continue;
        }
        
        // 检查条件类型是否匹配
        if (achievement.condition.type !== type) {
          continue;
        }
        
        // 检查是否达成条件
        let currentValue = 0;
        switch (type) {
          case 'score':
            currentValue = this.stats.totalScore;
            break;
          case 'jump':
            currentValue = this.stats.totalJumps;
            break;
          case 'collect':
            currentValue = this.stats.totalCollects;
            break;
          case 'match':
            currentValue = this.stats.totalMatches;
            break;
          case 'gallery':
            currentValue = this.stats.totalGalleryItems;
            break;
          case 'shield':
            currentValue = this.stats.shieldUsed;
            break;
          case 'rainbow':
            currentValue = this.stats.rainbowUsed;
            break;
          case 'doubleScore':
            currentValue = this.stats.doubleScoreGained;
            break;
          case 'perfectJump':
            currentValue = this.stats.maxSingleJumpScore;
            break;
        }
        
        if (currentValue >= achievement.condition.target) {
          this.unlockAchievement(achievement);
        }
      }
    }
  }
  
  /**
   * 解锁成就
   */
  unlockAchievement(achievement) {
    if (achievement.unlocked) {
      return;
    }
    
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    
    console.log(`成就解锁: ${achievement.name} - ${achievement.description}`);
    
    // 发放奖励
    this.grantReward(achievement.reward);
    
    // 添加到通知队列
    this.notificationQueue.push(achievement);
    
    // 保存数据
    this.saveAchievements();
    
    // 触发成就解锁事件
    if (GameGlobal.databus) {
      GameGlobal.databus.emit('achievementUnlocked', achievement);
    }
  }
  
  /**
   * 发放奖励
   */
  grantReward(reward) {
    if (!reward) {
      return;
    }
    
    const databus = GameGlobal.databus;
    if (!databus) {
      return;
    }
    
    // 发放拼豆碎片
    if (reward.beanPieces) {
      databus.beanPieces += reward.beanPieces;
      console.log(`获得拼豆碎片: ${reward.beanPieces}`);
    }
    
    // 发放道具
    if (reward.items) {
      for (const itemType in reward.items) {
        databus.items[itemType] += reward.items[itemType];
        console.log(`获得道具: ${itemType} x${reward.items[itemType]}`);
      }
    }
  }
  
  /**
   * 获取待通知的成就
   */
  getNotification() {
    if (this.notificationQueue.length > 0) {
      return this.notificationQueue.shift();
    }
    return null;
  }
  
  /**
   * 获取所有成就
   */
  getAllAchievements() {
    const allAchievements = [];
    
    for (const category in this.achievements) {
      for (const achievementId in this.achievements[category]) {
        allAchievements.push(this.achievements[category][achievementId]);
      }
    }
    
    return allAchievements;
  }
  
  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements() {
    return this.getAllAchievements().filter(a => a.unlocked);
  }
  
  /**
   * 获取未解锁的成就
   */
  getLockedAchievements() {
    return this.getAllAchievements().filter(a => !a.unlocked);
  }
  
  /**
   * 获取成就进度
   */
  getAchievementProgress(achievement) {
    let current = 0;
    const type = achievement.condition.type;
    
    switch (type) {
      case 'score':
        current = this.stats.totalScore;
        break;
      case 'jump':
        current = this.stats.totalJumps;
        break;
      case 'collect':
        current = this.stats.totalCollects;
        break;
      case 'match':
        current = this.stats.totalMatches;
        break;
      case 'gallery':
        current = this.stats.totalGalleryItems;
        break;
      case 'shield':
        current = this.stats.shieldUsed;
        break;
      case 'rainbow':
        current = this.stats.rainbowUsed;
        break;
      case 'doubleScore':
        current = this.stats.doubleScoreGained;
        break;
      case 'perfectJump':
        current = this.stats.maxSingleJumpScore;
        break;
    }
    
    return {
      current: current,
      target: achievement.condition.target,
      percentage: Math.min((current / achievement.condition.target) * 100, 100)
    };
  }
  
  /**
   * 重置所有成就（仅用于测试）
   */
  resetAllAchievements() {
    // 重置成就状态
    for (const category in this.achievements) {
      for (const achievementId in this.achievements[category]) {
        this.achievements[category][achievementId].unlocked = false;
        this.achievements[category][achievementId].unlockedAt = null;
      }
    }
    
    // 重置统计数据
    this.stats = {
      totalScore: 0,
      totalJumps: 0,
      totalCollects: 0,
      totalMatches: 0,
      totalGalleryItems: 0,
      shieldUsed: 0,
      rainbowUsed: 0,
      doubleScoreGained: 0,
      maxSingleJumpScore: 0
    };
    
    // 清空通知队列
    this.notificationQueue = [];
    
    // 保存数据
    this.saveAchievements();
    
    console.log('所有成就已重置');
  }
}

// 创建全局实例
const achievementManager = new AchievementManager();

// 挂载到全局对象
if (typeof window !== 'undefined') {
  window.AchievementManager = AchievementManager;
  window.achievementManager = achievementManager;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.AchievementManager = AchievementManager;
  GameGlobal.achievementManager = achievementManager;
}
