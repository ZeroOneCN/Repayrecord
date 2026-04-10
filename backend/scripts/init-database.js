const mysql = require('mysql2/promise');
require('dotenv').config();

// 日志输出辅助函数
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  table: (name) => console.log(`\x1b[35m[TABLE]\x1b[0m ${name}`)
};

// 分隔线
const divider = '━'.repeat(50);

async function initializeDatabase() {
  let connection;
  
  try {
    console.log(`\n${divider}`);
    log.info('开始初始化数据库...');
    console.log(`${divider}\n`);

    // 创建数据库连接（不指定数据库名）
    log.info('连接 MySQL 服务器...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    log.success('MySQL 服务器连接成功');

    // 创建数据库
    log.info(`创建数据库：${process.env.DB_NAME}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    log.success(`数据库 ${process.env.DB_NAME} 创建成功`);

    // 关闭当前连接，重新连接到指定数据库
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log(`\n${divider}`);
    log.info('开始创建数据表...');
    console.log(`${divider}\n`);

    // 创建负债平台表
    log.table('创建表：debt_platforms');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS debt_platforms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        billing_day INT NOT NULL COMMENT '账单出账日',
        repayment_day INT NOT NULL COMMENT '还款日',
        credit_limit DECIMAL(10, 2) DEFAULT 0 COMMENT '额度',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_created_at (created_at)
      )
    `);
    log.success('debt_platforms 表创建成功 ✓');

    // 创建账单表
    log.table('创建表：bills');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        billing_month VARCHAR(7) NOT NULL COMMENT '账单月份，格式：YYYY-MM',
        due_date DATE NOT NULL COMMENT '还款截止日期',
        is_paid BOOLEAN DEFAULT FALSE,
        paid_date DATE NULL,
        interest DECIMAL(10, 2) DEFAULT 0 COMMENT '利息',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (platform_id) REFERENCES debt_platforms(id) ON DELETE CASCADE,
        INDEX idx_platform_id (platform_id),
        INDEX idx_billing_month (billing_month),
        INDEX idx_due_date (due_date),
        INDEX idx_is_paid (is_paid),
        INDEX idx_created_at (created_at)
      )
    `);
    log.success('bills 表创建成功 ✓');

    // 创建还款记录表
    log.table('创建表：repayment_records');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS repayment_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        repayment_date DATE NOT NULL,
        interest DECIMAL(10, 2) DEFAULT 0 COMMENT '还款利息',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        INDEX idx_bill_id (bill_id),
        INDEX idx_repayment_date (repayment_date),
        INDEX idx_created_at (created_at)
      )
    `);
    log.success('repayment_records 表创建成功 ✓');

    // 创建系统设置表
    log.table('创建表：system_settings');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    log.success('system_settings 表创建成功 ✓');

    console.log(`\n${divider}`);
    log.success('数据库初始化完成！');
    console.log(`${divider}\n`);
    
    console.log('已创建的数据表:');
    console.log('  └─ debt_platforms    (借款平台表)');
    console.log('  └─ bills            (账单表)');
    console.log('  └─ repayment_records (还款记录表)');
    console.log('  └─ system_settings  (系统设置表)\n');

    await connection.end();

  } catch (error) {
    console.log(`\n${divider}`);
    log.error('数据库初始化失败！');
    log.error(`错误信息：${error.message}`);
    console.log(`${divider}\n`);
    if (connection) await connection.end();
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
