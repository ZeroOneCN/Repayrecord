const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  try {
    // 创建数据库连接（不指定数据库名）
    let connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('连接到MySQL服务器成功');

    // 创建数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`数据库 ${process.env.DB_NAME} 创建成功`);

    // 使用数据库（重新创建连接指定数据库）
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // 创建负债平台表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS debt_platforms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        billing_day INT NOT NULL COMMENT '账单出账日',
        repayment_day INT NOT NULL COMMENT '还款日',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('负债平台表创建成功');

    // 创建账单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        billing_month VARCHAR(7) NOT NULL COMMENT '账单月份，格式: YYYY-MM',
        due_date DATE NOT NULL COMMENT '还款截止日期',
        is_paid BOOLEAN DEFAULT FALSE,
        paid_date DATE NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (platform_id) REFERENCES debt_platforms(id) ON DELETE CASCADE
      )
    `);
    console.log('账单表创建成功');

    // 创建还款记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS repayment_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        repayment_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
      )
    `);
    console.log('还款记录表创建成功');

    // 创建系统设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('系统设置表创建成功');

    console.log('数据库初始化完成！');
    await connection.end();
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };