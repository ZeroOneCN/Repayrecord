const { query } = require('../config/database');

class RepaymentRecord {
  // 获取所有还款记录（联合账单与平台，避免前端多次请求）
  static async getAllWithPlatform() {
    const sql = `
      SELECT rr.*, rr.interest, dp.name as platform_name
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      JOIN debt_platforms dp ON b.platform_id = dp.id
      ORDER BY rr.repayment_date DESC, rr.id DESC
    `;
    return await query(sql);
  }

  static async getAllWithPlatformPaged(page = 1, pageSize = 10, filters = {}) {
    const currentPage = Number(page);
    const currentSize = Number(pageSize);
    const safePage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
    const safeSize = Number.isInteger(currentSize) && currentSize > 0 ? currentSize : 10;
    const where = [];
    const params = [];
    if (filters.platform_id) {
      where.push('b.platform_id = ?');
      params.push(filters.platform_id);
    }
    if (filters.start_date && filters.end_date) {
      where.push('rr.repayment_date BETWEEN ? AND ?');
      params.push(filters.start_date, filters.end_date);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countSql = `
      SELECT COUNT(*) as total
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      ${whereSql}
    `;
    const countRows = await query(countSql, params);
    const total = countRows[0]?.total || 0;
    const offset = Math.max(0, Math.floor((safePage - 1) * safeSize));
    const limit = Math.floor(safeSize);
    const sql = `
      SELECT rr.*, rr.interest, dp.name as platform_name
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      JOIN debt_platforms dp ON b.platform_id = dp.id
      ${whereSql}
      ORDER BY rr.repayment_date DESC, rr.id DESC
      LIMIT ${offset}, ${limit}
    `;
    const items = await query(sql, params);
    return { items, total, page: safePage, pageSize: safeSize };
  }
  static async getAllWithPlatformFiltered(filters = {}) {
    const where = [];
    const params = [];
    if (filters.platform_id) {
      where.push('b.platform_id = ?');
      params.push(filters.platform_id);
    }
    if (filters.start_date && filters.end_date) {
      where.push('rr.repayment_date BETWEEN ? AND ?');
      params.push(filters.start_date, filters.end_date);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT rr.*, rr.interest, dp.name as platform_name
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      JOIN debt_platforms dp ON b.platform_id = dp.id
      ${whereSql}
      ORDER BY rr.repayment_date DESC, rr.id DESC
    `;
    return await query(sql, params);
  }
  // 获取账单的所有还款记录
  static async getByBillId(bill_id) {
    const sql = 'SELECT * FROM repayment_records WHERE bill_id = ? ORDER BY repayment_date DESC';
    return await query(sql, [bill_id]);
  }

  // 创建还款记录
  static async create({ bill_id, amount, repayment_date, interest, notes }) {
    const sql = 'INSERT INTO repayment_records (bill_id, amount, repayment_date, interest, notes) VALUES (?, ?, ?, ?, ?)';
    const result = await query(sql, [bill_id, amount, repayment_date, interest || 0, notes]);
    return result.insertId;
  }

  // 删除还款记录
  static async delete(id) {
    const sql = 'DELETE FROM repayment_records WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  // 获取月度还款统计
  static async getMonthlyRepaymentStats(month) {
    const sql = `
      SELECT 
        DATE_FORMAT(repayment_date, '%Y-%m') as repayment_month,
        COUNT(*) as total_repayments,
        SUM(amount) as total_amount
      FROM repayment_records
      WHERE DATE_FORMAT(repayment_date, '%Y-%m') = ?
      GROUP BY repayment_month
    `;
    const results = await query(sql, [month]);
    return results[0] || { total_repayments: 0, total_amount: 0 };
  }

  // 获取平台还款统计
  static async getPlatformRepaymentStats(platform_id, start_date, end_date) {
    const sql = `
      SELECT 
        dp.name as platform_name,
        COUNT(rr.id) as total_repayments,
        SUM(rr.amount) as total_amount
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE dp.id = ? AND rr.repayment_date BETWEEN ? AND ?
      GROUP BY dp.name
    `;
    return await query(sql, [platform_id, start_date, end_date]);
  }

  // 获取每日还款趋势（按天汇总）
  static async getDailyRepaymentTrend(start_date, end_date, platform_id = null) {
    // 支持按平台筛选的每日趋势
    let sql = `
      SELECT 
        DATE(rr.repayment_date) as date,
        SUM(rr.amount) as total_amount,
        COUNT(rr.id) as total_count
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      WHERE rr.repayment_date BETWEEN ? AND ?
    `;
    const params = [start_date, end_date];
    if (platform_id) {
      sql += ' AND b.platform_id = ?';
      params.push(platform_id);
    }
    sql += ' GROUP BY DATE(rr.repayment_date) ORDER BY DATE(rr.repayment_date)';
    return await query(sql, params);
  }

  // 按日期范围获取还款记录列表
  static async getByDateRange(start_date, end_date, platform_id = null) {
    let sql = `
      SELECT rr.*, dp.name as platform_name
      FROM repayment_records rr
      JOIN bills b ON rr.bill_id = b.id
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE rr.repayment_date BETWEEN ? AND ?
    `;
    const params = [start_date, end_date];
    if (platform_id) {
      sql += ' AND b.platform_id = ?';
      params.push(platform_id);
    }
    sql += ' ORDER BY rr.repayment_date DESC, rr.id DESC';
    return await query(sql, params);
  }
}

module.exports = RepaymentRecord;
