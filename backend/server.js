const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { initializeDatabase } = require('./scripts/init-database');
const debtPlatformRoutes = require('./routes/debtPlatforms');
const billRoutes = require('./routes/bills');
const repaymentRoutes = require('./routes/repayments');
const notifyRoutes = require('./routes/notify');
const settingsRoutes = require('./routes/settings');
const { startReminderScheduler } = require('./services/reminderScheduler');

const app = express();
const PORT = process.env.SERVER_PORT || 9502;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/debt-platforms', debtPlatformRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/settings', settingsRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

async function bootstrapServer() {
  try {
    console.log('正在检查数据库结构...');
    await initializeDatabase();
    console.log('数据库结构检查完成');
  } catch (error) {
    console.error('数据库结构检查失败:', error.message);
  }

  try {
    const connected = await testConnection();
    console.log(connected ? '数据库连接成功' : '数据库连接失败');
  } catch (error) {
    console.error('数据库连接检查失败:', error.message);
  }

  await startReminderScheduler({ port: PORT });
}

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  void bootstrapServer();
});

module.exports = app;
