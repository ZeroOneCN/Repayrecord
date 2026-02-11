const express = require('express');
const Bill = require('../models/Bill');
const DebtPlatform = require('../models/DebtPlatform');
const { isPositiveInt, isPositiveNumber, isValidMonth, isValidDate } = require('../utils/validators');

const router = express.Router();
const statsCache = new Map();
const cacheTTL = 60000;

const getCache = (key) => {
  const entry = statsCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    statsCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value) => {
  statsCache.set(key, { value, expiresAt: Date.now() + cacheTTL });
};

// 获取所有账单（支持筛选）
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.platform_id) {
      if (!isPositiveInt(req.query.platform_id)) {
        return res.status(400).json({ error: '平台参数不合法' });
      }
      filters.platform_id = parseInt(req.query.platform_id, 10);
    }
    
    if (req.query.billing_month) {
      if (!isValidMonth(req.query.billing_month)) {
        return res.status(400).json({ error: '账单月份格式不合法' });
      }
      filters.billing_month = req.query.billing_month;
    }
    
    if (req.query.is_paid !== undefined) {
      filters.is_paid = req.query.is_paid === 'true';
    }

    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const pageSize = req.query.page_size ? parseInt(req.query.page_size, 10) : null;
    if (page && pageSize) {
      if (!isPositiveInt(page) || !isPositiveInt(pageSize)) {
        return res.status(400).json({ error: '分页参数不合法' });
      }
      const result = await Bill.getPaged(filters, page, pageSize);
      return res.json(result);
    }
    const bills = await Bill.getAll(filters);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个账单
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.getById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: '账单不存在' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新账单
router.post('/', async (req, res) => {
  try {
    const { platform_id, amount, billing_month, due_date, notes } = req.body;
    
    if (!platform_id || !amount || !billing_month) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!isPositiveInt(platform_id)) {
      return res.status(400).json({ error: '平台参数不合法' });
    }
    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ error: '金额必须大于 0' });
    }
    if (!isValidMonth(billing_month)) {
      return res.status(400).json({ error: '账单月份格式不合法' });
    }
    if (due_date && !isValidDate(due_date)) {
      return res.status(400).json({ error: '还款截止日期格式不合法' });
    }

    // 如果未提供还款截止日，则根据平台设置自动计算
    let finalDueDate = due_date;
    if (!finalDueDate) {
      const platform = await DebtPlatform.getById(parseInt(platform_id, 10));
      if (!platform) {
        return res.status(400).json({ error: '平台不存在或未配置' });
      }
      const repDay = parseInt(platform.repayment_day, 10);
      const [yearStr, monthStr] = String(billing_month).split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const day = Number.isFinite(repDay) ? Math.min(repDay, daysInMonth) : daysInMonth;
      const mm = String(monthNum).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      finalDueDate = `${year}-${mm}-${dd}`;
    }

    const billId = await Bill.create({
      platform_id: parseInt(platform_id, 10),
      amount: parseFloat(amount),
      billing_month,
      due_date: finalDueDate,
      notes: notes || ''
    });

    res.status(201).json({ 
      id: billId, 
      message: '账单创建成功' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新账单信息
router.put('/:id', async (req, res) => {
  try {
    const { amount, due_date, notes } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: '缺少必要参数: amount' });
    }
    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ error: '金额必须大于 0' });
    }
    if (due_date && !isValidDate(due_date)) {
      return res.status(400).json({ error: '还款截止日期格式不合法' });
    }

    // 如果未提供 due_date，则根据账单所属平台与账单月份自动计算
    let finalDueDate = due_date;
    if (!finalDueDate) {
      const bill = await Bill.getById(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: '账单不存在' });
      }
      const repDay = parseInt(bill.repayment_day, 10);
      const [yearStr, monthStr] = String(bill.billing_month).split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const day = Number.isFinite(repDay) ? Math.min(repDay, daysInMonth) : daysInMonth;
      const mm = String(monthNum).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      finalDueDate = `${year}-${mm}-${dd}`;
    }

    await Bill.update(req.params.id, {
      amount: parseFloat(amount),
      due_date: finalDueDate,
      notes: notes || ''
    });

    res.json({ message: '账单更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 标记账单为已还款
router.patch('/:id/pay', async (req, res) => {
  try {
    const { paid_date } = req.body;
    const paymentDate = paid_date || new Date().toISOString().split('T')[0];
    
    if (paid_date && !isValidDate(paid_date)) {
      return res.status(400).json({ error: '还款日期格式不合法' });
    }
    await Bill.markAsPaid(req.params.id, paymentDate);
    res.json({ message: '账单已标记为已还款' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除账单
router.delete('/:id', async (req, res) => {
  try {
    await Bill.delete(req.params.id);
    res.json({ message: '账单删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取月度统计
router.get('/stats/monthly/:month', async (req, res) => {
  try {
    const month = req.params.month;
    if (!isValidMonth(month)) {
      return res.status(400).json({ error: '月份格式不合法' });
    }
    const cacheKey = `bill:monthly:${month}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const stats = await Bill.getMonthlyStats(month);
    setCache(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取指定月份各平台借款总额
router.get('/stats/monthly/platform/:month', async (req, res) => {
  try {
    const month = req.params.month;
    if (!isValidMonth(month)) {
      return res.status(400).json({ error: '月份格式不合法' });
    }
    const cacheKey = `bill:monthly-platform:${month}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const rows = await Bill.getMonthlyPlatformSums(month);
    setCache(cacheKey, rows);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取即将到期的账单
router.get('/upcoming/:days?', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const bills = await Bill.getUpcomingBills(days);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取到期与逾期提醒摘要
router.get('/alerts', async (req, res) => {
  try {
    const days = req.query.upcoming_days ? parseInt(req.query.upcoming_days, 10) : 3;
    if (!isPositiveInt(days) && days !== 0) {
      return res.status(400).json({ error: '提醒天数不合法' });
    }
    const cacheKey = `bill:alerts:${days}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const summary = await Bill.getAlertSummary(days);
    setCache(cacheKey, summary);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
