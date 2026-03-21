const express = require('express');
const path = require('path');
const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 启动服务器
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});