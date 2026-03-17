const mysql = require('mysql2/promise');
require('dotenv').config();

async function addIndexes() {
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

    // 1. 为 debt_platforms 表添加索引
    console.log('正在为 debt_platforms 表添加索引...');
    try {
      await connection.execute(`
        ALTER TABLE debt_platforms
        ADD INDEX idx_name (name),
        ADD INDEX idx_created_at (created_at)
      `);
      console.log('debt_platforms 表索引添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('debt_platforms 表索引已存在，跳过');
      } else {
        throw error;
      }
    }

    // 2. 为 bills 表添加索引
    console.log('正在为 bills 表添加索引...');
    try {
      await connection.execute(`
        ALTER TABLE bills
        ADD INDEX idx_platform_id (platform_id),
        ADD INDEX idx_billing_month (billing_month),
        ADD INDEX idx_due_date (due_date),
        ADD INDEX idx_is_paid (is_paid),
        ADD INDEX idx_created_at (created_at)
      `);
      console.log('bills 表索引添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('bills 表部分索引已存在，跳过');
      } else {
        throw error;
      }
    }

    // 3. 为 repayment_records 表添加索引
    console.log('正在为 repayment_records 表添加索引...');
    try {
      await connection.execute(`
        ALTER TABLE repayment_records
        ADD INDEX idx_bill_id (bill_id),
        ADD INDEX idx_repayment_date (repayment_date),
        ADD INDEX idx_created_at (created_at)
      `);
      console.log('repayment_records 表索引添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('repayment_records 表索引已存在，跳过');
      } else {
        throw error;
      }
    }

    console.log('数据库索引优化完成！');
    await connection.end();
    
  } catch (error) {
    console.error('数据库索引优化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addIndexes();
}

module.exports = { addIndexes };
