const { query, executeTransaction } = require('../config/database');

class Setting {
  static async ensureTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await query(sql);
  }

  static async getAll() {
    await this.ensureTable();
    const rows = await query('SELECT `key`, `value` FROM system_settings');
    const result = {};
    for (const row of rows) {
      const raw = row.value;
      try {
        result[row.key] = JSON.parse(raw);
      } catch (_) {
        result[row.key] = raw;
      }
    }
    return result;
  }

  static async get(key) {
    await this.ensureTable();
    const rows = await query('SELECT `key`, `value` FROM system_settings WHERE `key` = ?', [key]);
    if (!rows || rows.length === 0) return null;
    const raw = rows[0].value;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return raw;
    }
  }

  static async setMany(map) {
    await this.ensureTable();
    const operations = [];
    for (const [key, value] of Object.entries(map || {})) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      operations.push({
        sql: 'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        params: [key, serialized]
      });
    }
    if (operations.length > 0) {
      await executeTransaction(operations);
    }
    return true;
  }
}

module.exports = Setting;