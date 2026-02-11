const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { initializeDatabase } = require('./scripts/init-database');
const debtPlatformRoutes = require('./routes/debtPlatforms');
const billRoutes = require('./routes/bills');
const repaymentRoutes = require('./routes/repayments');
const notifyRoutes = require('./routes/notify');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.SERVER_PORT || 9502;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'OK',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// API路由
app.use('/api/debt-platforms', debtPlatformRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/settings', settingsRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  
  // 自动初始化数据库
  try {
    console.log('正在初始化数据库...');
    await initializeDatabase();
    console.log('数据库初始化完成');
    
    // 测试数据库连接
    const connected = await testConnection();
    if (connected) {
      console.log('数据库连接成功');
    } else {
      console.log('数据库连接失败');
    }
  } catch (error) {
    console.error('数据库初始化或连接失败:', error);
  }
});

module.exports = app;