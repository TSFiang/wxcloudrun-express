/**
 * 用户认证管理器
 * 处理微信小游戏的用户授权登录
 */
class AuthManager {
  constructor() {
    this.userInfo = null;
    this.isLoggedIn = false;
    this.openId = null;
    this.sessionKey = null;
    
    // 从本地存储加载用户信息
    this.loadUserInfo();
  }
  
  /**
   * 从本地存储加载用户信息
   */
  loadUserInfo() {
    try {
      if (window.isWechatGame) {
        const userInfo = wx.getStorageSync('userInfo');
        const openId = wx.getStorageSync('openId');
        
        if (userInfo && openId) {
          this.userInfo = JSON.parse(userInfo);
          this.openId = openId;
          this.isLoggedIn = true;
          console.log('从本地存储加载用户信息成功');
        }
      } else {
        // 浏览器环境，使用localStorage
        const userInfo = localStorage.getItem('userInfo');
        const openId = localStorage.getItem('openId');
        
        if (userInfo && openId) {
          this.userInfo = JSON.parse(userInfo);
          this.openId = openId;
          this.isLoggedIn = true;
          console.log('从本地存储加载用户信息成功（浏览器环境）');
        }
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  }
  
  /**
   * 保存用户信息到本地存储
   */
  saveUserInfo() {
    try {
      if (window.isWechatGame) {
        wx.setStorageSync('userInfo', JSON.stringify(this.userInfo));
        wx.setStorageSync('openId', this.openId);
        console.log('用户信息已保存到本地存储');
      } else {
        // 浏览器环境，使用localStorage
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
        localStorage.setItem('openId', this.openId);
        console.log('用户信息已保存到本地存储（浏览器环境）');
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }
  
  /**
   * 清除用户信息
   */
  clearUserInfo() {
    this.userInfo = null;
    this.isLoggedIn = false;
    this.openId = null;
    this.sessionKey = null;
    
    try {
      if (window.isWechatGame) {
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('openId');
      } else {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('openId');
      }
      console.log('用户信息已清除');
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }
  }
  
  /**
   * 检查用户是否已授权
   */
  checkAuthStatus() {
    if (!window.isWechatGame) {
      // 浏览器环境，返回已登录状态（模拟）
      return Promise.resolve(this.isLoggedIn);
    }
    
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userInfo']) {
            // 用户已授权
            this.getUserInfo().then(() => {
              resolve(true);
            }).catch(reject);
          } else {
            // 用户未授权
            resolve(false);
          }
        },
        fail: reject
      });
    });
  }
  
  /**
   * 获取用户信息
   */
  getUserInfo() {
    if (!window.isWechatGame) {
      // 浏览器环境，返回模拟用户信息
      this.userInfo = {
        nickName: '测试用户',
        avatarUrl: 'images/default-avatar.png',
        gender: 1,
        city: '北京',
        province: '北京',
        country: '中国'
      };
      this.isLoggedIn = true;
      return Promise.resolve(this.userInfo);
    }
    
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => {
          this.userInfo = res.userInfo;
          this.isLoggedIn = true;
          this.saveUserInfo();
          console.log('获取用户信息成功:', this.userInfo);
          resolve(this.userInfo);
        },
        fail: (error) => {
          console.error('获取用户信息失败:', error);
          reject(error);
        }
      });
    });
  }
  
  /**
   * 微信登录
   */
  login() {
    if (!window.isWechatGame) {
      // 浏览器环境，模拟登录
      this.openId = 'browser_test_openid_' + Date.now();
      this.isLoggedIn = true;
      this.userInfo = {
        nickName: '浏览器测试用户',
        avatarUrl: 'images/default-avatar.png',
        gender: 1,
        city: '北京',
        province: '北京',
        country: '中国'
      };
      this.saveUserInfo();
      return Promise.resolve({
        userInfo: this.userInfo,
        openId: this.openId
      });
    }
    
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 获取到code，需要发送到服务器换取openId和session_key
            console.log('微信登录成功，code:', res.code);
            this.loginToServer(res.code).then(resolve).catch(reject);
          } else {
            console.error('微信登录失败:', res.errMsg);
            reject(new Error(res.errMsg));
          }
        },
        fail: reject
      });
    });
  }
  
  /**
   * 将code发送到服务器换取openId和session_key
   * 注意：这里需要您自己的服务器接口
   */
  loginToServer(code) {
    // 这里需要替换为您自己的服务器接口地址
    const serverUrl = 'https://your-server.com/api/login';
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: serverUrl,
        method: 'POST',
        data: {
          code: code
        },
        success: (res) => {
          if (res.data && res.data.openId) {
            this.openId = res.data.openId;
            this.sessionKey = res.data.session_key;
            this.saveUserInfo();
            console.log('服务器登录成功，openId:', this.openId);
            resolve({
              userInfo: this.userInfo,
              openId: this.openId
            });
          } else {
            reject(new Error('服务器返回数据格式错误'));
          }
        },
        fail: (error) => {
          console.error('服务器登录失败:', error);
          // 开发环境，模拟登录成功
          this.openId = 'dev_test_openid_' + Date.now();
          this.isLoggedIn = true;
          this.saveUserInfo();
          resolve({
            userInfo: this.userInfo,
            openId: this.openId
          });
        }
      });
    });
  }
  
  /**
   * 创建授权按钮（微信小游戏环境）
   */
  createAuthButton() {
    if (!window.isWechatGame) {
      console.log('浏览器环境，无法创建授权按钮');
      return null;
    }
    
    const button = wx.createUserInfoButton({
      type: 'text',
      text: '授权登录',
      style: {
        left: 10,
        top: 76,
        width: 200,
        height: 40,
        lineHeight: 40,
        backgroundColor: '#FFB6C1',
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 16,
        borderRadius: 20
      },
      withCredentials: true,
      lang: 'zh_CN'
    });
    
    button.onTap((res) => {
      if (res.userInfo) {
        this.userInfo = res.userInfo;
        this.isLoggedIn = true;
        this.saveUserInfo();
        console.log('用户授权成功:', this.userInfo);
        
        // 触发登录成功事件
        if (GameGlobal.databus) {
          GameGlobal.databus.emit('loginSuccess', this.userInfo);
        }
      } else {
        console.log('用户拒绝授权');
      }
    });
    
    return button;
  }
  
  /**
   * 显示授权弹窗（引导用户授权）
   */
  showAuthModal() {
    if (!window.isWechatGame) {
      // 浏览器环境，直接模拟登录
      return this.login();
    }
    
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '授权提示',
        content: '为了更好的游戏体验，请授权您的用户信息',
        confirmText: '去授权',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户点击去授权，创建授权按钮
            const authButton = this.createAuthButton();
            resolve(authButton);
          } else {
            // 用户取消
            reject(new Error('用户取消授权'));
          }
        },
        fail: reject
      });
    });
  }
  
  /**
   * 检查登录状态并自动登录
   */
  checkAndAutoLogin() {
    if (this.isLoggedIn) {
      return Promise.resolve(this.userInfo);
    }
    
    return this.checkAuthStatus().then((hasAuth) => {
      if (hasAuth) {
        return this.userInfo;
      } else {
        return this.showAuthModal();
      }
    });
  }
  
  /**
   * 获取用户昵称
   */
  getNickName() {
    return this.userInfo ? this.userInfo.nickName : '游客';
  }
  
  /**
   * 获取用户头像
   */
  getAvatarUrl() {
    return this.userInfo ? this.userInfo.avatarUrl : 'images/default-avatar.png';
  }
  
  /**
   * 获取用户ID
   */
  getUserId() {
    return this.openId || 'guest_' + Date.now();
  }
}

// 创建全局实例
const authManager = new AuthManager();

// 挂载到全局对象
if (typeof window !== 'undefined') {
  window.AuthManager = AuthManager;
  window.authManager = authManager;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.AuthManager = AuthManager;
  GameGlobal.authManager = authManager;
}
