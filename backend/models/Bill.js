const { query } = require('../config/database');

class Bill {
  // 获取所有账单
  static async getAll(filters = {}) {
    let sql = `
      SELECT b.*, dp.name as platform_name, dp.billing_day, dp.repayment_day
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.platform_id) {
      sql += ' AND b.platform_id = ?';
      params.push(filters.platform_id);
    }

    if (filters.billing_month) {
      sql += ' AND b.billing_month = ?';
      params.push(filters.billing_month);
    }

    if (filters.is_paid !== undefined) {
      sql += ' AND b.is_paid = ?';
      params.push(filters.is_paid);
    }

    // 默认按还款截止日期倒序（最新在前），其次按ID倒序
    sql += ' ORDER BY b.due_date DESC, b.id DESC';
    
    return await query(sql, params);
  }

  static async getPaged(filters = {}, page = 1, pageSize = 10) {
    const currentPage = Number(page);
    const currentSize = Number(pageSize);
    const safePage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
    const safeSize = Number.isInteger(currentSize) && currentSize > 0 ? currentSize : 10;
    let whereSql = 'WHERE 1=1';
    const params = [];

    if (filters.platform_id) {
      whereSql += ' AND b.platform_id = ?';
      params.push(filters.platform_id);
    }

    if (filters.billing_month) {
      whereSql += ' AND b.billing_month = ?';
      params.push(filters.billing_month);
    }

    if (filters.is_paid !== undefined) {
      whereSql += ' AND b.is_paid = ?';
      params.push(filters.is_paid);
    }

    const countSql = `SELECT COUNT(*) as total FROM bills b ${whereSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0]?.total || 0;
    const offset = Math.max(0, Math.floor((safePage - 1) * safeSize));
    const limit = Math.floor(safeSize);

    const listSql = `
      SELECT b.*, dp.name as platform_name, dp.billing_day, dp.repayment_day
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      ${whereSql}
      ORDER BY b.due_date DESC, b.id DESC
      LIMIT ${offset}, ${limit}
    `;
    const items = await query(listSql, params);

    return { items, total, page: safePage, pageSize: safeSize };
  }

  // 根据ID获取账单
  static async getById(id) {
    const sql = `
      SELECT b.*, dp.name as platform_name, dp.billing_day, dp.repayment_day
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE b.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // 创建新账单
  static async create({ platform_id, amount, billing_month, due_date, interest, notes }) {
    const sql = 'INSERT INTO bills (platform_id, amount, billing_month, due_date, interest, notes) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await query(sql, [platform_id, amount, billing_month, due_date, interest || 0, notes]);
    return result.insertId;
  }

  // 更新账单信息
  static async update(id, { amount, due_date, interest, notes }) {
    const sql = 'UPDATE bills SET amount = ?, due_date = ?, interest = ?, notes = ? WHERE id = ?';
    await query(sql, [amount, due_date, interest || 0, notes, id]);
    return true;
  }

  // 标记账单为已还款
  static async markAsPaid(id, paid_date) {
    const sql = 'UPDATE bills SET is_paid = TRUE, paid_date = ? WHERE id = ?';
    await query(sql, [paid_date, id]);
    return true;
  }

  // 删除账单
  static async delete(id) {
    const sql = 'DELETE FROM bills WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  // 获取月度统计
  static async getMonthlyStats(month) {
    const sql = `
      SELECT 
        billing_month,
        COUNT(*) as total_bills,
        SUM(amount) as total_amount,
        SUM(CASE WHEN is_paid = TRUE THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN is_paid = FALSE THEN amount ELSE 0 END) as unpaid_amount,
        SUM(interest) as total_interest
      FROM bills
      WHERE billing_month = ?
      GROUP BY billing_month
    `;
    const results = await query(sql, [month]);
    return results[0] || { total_bills: 0, total_amount: 0, paid_amount: 0, unpaid_amount: 0, total_interest: 0 };
  }

  // 获取指定月份各平台借款总额
  static async getMonthlyPlatformSums(month) {
    const sql = `
      SELECT 
        dp.id as platform_id,
        dp.name as platform_name,
        SUM(b.amount) as total_amount,
        COUNT(b.id) as bill_count
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE b.billing_month = ?
      GROUP BY dp.id, dp.name
      ORDER BY dp.name
    `;
    return await query(sql, [month]);
  }

  // 获取即将到期的账单
  static async getUpcomingBills(days = 7) {
    const sql = `
      SELECT b.*, dp.name as platform_name
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE b.is_paid = FALSE 
      AND b.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY b.due_date
    `;
    return await query(sql, [days]);
  }

  static async getAlertSummary(upcomingDays = 3) {
    const overdueCountSql = `
      SELECT COUNT(*) as count, COALESCE(SUM(b.amount), 0) as total_amount
      FROM bills b
      WHERE b.is_paid = FALSE AND b.due_date < CURDATE()
    `;
    const upcomingCountSql = `
      SELECT COUNT(*) as count, COALESCE(SUM(b.amount), 0) as total_amount
      FROM bills b
      WHERE b.is_paid = FALSE 
      AND b.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    `;
    const overdueItemsSql = `
      SELECT b.*, dp.name as platform_name
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE b.is_paid = FALSE AND b.due_date < CURDATE()
      ORDER BY b.due_date ASC, b.id ASC
      LIMIT 5
    `;
    const upcomingItemsSql = `
      SELECT b.*, dp.name as platform_name
      FROM bills b
      JOIN debt_platforms dp ON b.platform_id = dp.id
      WHERE b.is_paid = FALSE 
      AND b.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY b.due_date ASC, b.id ASC
      LIMIT 5
    `;

    const [overdueCount] = await query(overdueCountSql);
    const [upcomingCount] = await query(upcomingCountSql, [upcomingDays]);
    const overdueItems = await query(overdueItemsSql);
    const upcomingItems = await query(upcomingItemsSql, [upcomingDays]);

    return {
      overdue: {
        count: overdueCount?.count || 0,
        total_amount: overdueCount?.total_amount || 0,
        items: overdueItems
      },
      upcoming: {
        count: upcomingCount?.count || 0,
        total_amount: upcomingCount?.total_amount || 0,
        items: upcomingItems
      }
    };
  }
}

module.exports = Bill;
