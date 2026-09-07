const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
  let connection;
  
  try {
    console.log('\n========== 数据库表结构检查 ==========\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log(`数据库：${process.env.DB_NAME}`);
    console.log(`主机：${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`用户：${process.env.DB_USER}\n`);
    
    // 检查所有表是否存在
    const tables = ['debt_platforms', 'bills', 'repayment_records', 'system_settings'];
    const missingTables = [];
    
    for (const table of tables) {
      const [rows] = await connection.execute(
        `SHOW TABLES LIKE ?`,
        [table]
      );
      
      if (rows.length === 0) {
        missingTables.push(table);
        console.log(`❌ 表 ${table} 不存在`);
      } else {
        console.log(`✓ 表 ${table} 存在`);
        
        // 显示表结构
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`   列数：${columns.length}`);
        columns.forEach(col => {
          console.log(`     - ${col.Field} (${col.Type})`);
        });
        console.log('');
      }
    }
    
    if (missingTables.length > 0) {
      console.log('\n========== 修复建议 ==========\n');
      console.log(`发现 ${missingTables.length} 个表缺失：${missingTables.join(', ')}`);
      console.log('请运行以下命令初始化数据库：');
      console.log('  node scripts/init-database.js\n');
    } else {
      console.log('\n========== 检查结果 ==========\n');
      console.log('✓ 所有表结构正常，无需修复\n');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('\n检查失败:', error.message);
    console.error('\n请检查：');
    console.error('1. 数据库是否已创建');
    console.error('2. .env 配置是否正确');
    console.error('3. MySQL 服务是否运行\n');
    if (connection) await connection.end();
    process.exit(1);
  }
}

if (require.main === module) {
  checkTableStructure();
}

module.exports = { checkTableStructure };
