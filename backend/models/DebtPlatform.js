const { query } = require('../config/database');

class DebtPlatform {
  // 获取所有负债平台
  static async getAll() {
    const sql = 'SELECT * FROM debt_platforms ORDER BY name';
    return await query(sql);
  }

  // 根据ID获取平台
  static async getById(id) {
    const sql = 'SELECT * FROM debt_platforms WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // 创建新平台
  static async create({ name, billing_day, repayment_day }) {
    const sql = 'INSERT INTO debt_platforms (name, billing_day, repayment_day) VALUES (?, ?, ?)';
    const result = await query(sql, [name, billing_day, repayment_day]);
    return result.insertId;
  }

  // 更新平台信息
  static async update(id, { name, billing_day, repayment_day }) {
    const sql = 'UPDATE debt_platforms SET name = ?, billing_day = ?, repayment_day = ? WHERE id = ?';
    await query(sql, [name, billing_day, repayment_day, id]);
    return true;
  }

  // 删除平台
  static async delete(id) {
    const sql = 'DELETE FROM debt_platforms WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  // 获取平台统计信息
  static async getPlatformStats() {
    const sql = `
      SELECT 
        dp.id,
        dp.name,
        COUNT(b.id) as total_bills,
        SUM(CASE WHEN b.is_paid = FALSE THEN b.amount ELSE 0 END) as total_unpaid,
        SUM(CASE WHEN b.is_paid = TRUE THEN b.amount ELSE 0 END) as total_paid
      FROM debt_platforms dp
      LEFT JOIN bills b ON dp.id = b.platform_id
      GROUP BY dp.id, dp.name
      ORDER BY dp.name
    `;
    return await query(sql);
  }
}

module.exports = DebtPlatform;