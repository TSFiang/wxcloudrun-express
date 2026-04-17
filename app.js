const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  // 静态文件服务
  app.use(express.static(path.join(__dirname, '.')));

  // 健康检查
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // 根路径返回游戏页面
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
  });

  return app;
}

module.exports = {
  createApp,
};
