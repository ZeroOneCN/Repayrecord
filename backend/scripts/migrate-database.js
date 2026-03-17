const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDatabase() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('连接到数据库成功');

    // 1. 为 debt_platforms 表添加额度字段
    console.log('正在更新 debt_platforms 表...');
    try {
      await connection.execute(`
        ALTER TABLE debt_platforms 
        ADD COLUMN credit_limit DECIMAL(10, 2) DEFAULT 0 COMMENT '额度' AFTER repayment_day
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('credit_limit 字段已存在，跳过');
    }

    // 2. 为 bills 表添加利息字段
    console.log('正在更新 bills 表...');
    try {
      await connection.execute(`
        ALTER TABLE bills 
        ADD COLUMN interest DECIMAL(10, 2) DEFAULT 0 COMMENT '利息' AFTER is_paid
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('interest 字段已存在，跳过');
    }

    // 3. 为 repayment_records 表添加利息字段
    console.log('正在更新 repayment_records 表...');
    try {
      await connection.execute(`
        ALTER TABLE repayment_records 
        ADD COLUMN interest DECIMAL(10, 2) DEFAULT 0 COMMENT '还款利息' AFTER amount
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('repayment_records.interest 字段已存在，跳过');
    }

    console.log('数据库迁移完成！');
    await connection.end();
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };
