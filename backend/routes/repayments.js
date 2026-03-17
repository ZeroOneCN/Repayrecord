const express = require('express');
const RepaymentRecord = require('../models/RepaymentRecord');
const Bill = require('../models/Bill');
const { isPositiveInt, isPositiveNumber, isValidDate, isValidMonth } = require('../utils/validators');

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

// 一次性获取所有还款记录（含平台名）
router.get('/records', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const pageSize = req.query.page_size ? parseInt(req.query.page_size, 10) : null;
    const platformId = req.query.platform_id ? parseInt(req.query.platform_id, 10) : null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    if (platformId && !isPositiveInt(platformId)) {
      return res.status(400).json({ error: '平台参数不合法' });
    }
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({ error: '需要开始日期和结束日期' });
    }
    if (startDate && endDate) {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({ error: '日期格式不合法' });
      }
    }
    const filters = {
      platform_id: platformId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    };
    if (page && pageSize) {
      if (!isPositiveInt(page) || !isPositiveInt(pageSize)) {
        return res.status(400).json({ error: '分页参数不合法' });
      }
      const result = await RepaymentRecord.getAllWithPlatformPaged(page, pageSize, filters);
      return res.json(result);
    }
    const rows = (filters.platform_id || filters.start_date)
      ? await RepaymentRecord.getAllWithPlatformFiltered(filters)
      : await RepaymentRecord.getAllWithPlatform();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取账单的所有还款记录
router.get('/bill/:bill_id', async (req, res) => {
  try {
    if (!isPositiveInt(req.params.bill_id)) {
      return res.status(400).json({ error: '账单参数不合法' });
    }
    const records = await RepaymentRecord.getByBillId(req.params.bill_id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建还款记录
router.post('/', async (req, res) => {
  try {
    const { bill_id, amount, repayment_date, interest, notes } = req.body;
    
    if (!bill_id || !amount || !repayment_date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!isPositiveInt(bill_id)) {
      return res.status(400).json({ error: '账单参数不合法' });
    }
    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ error: '金额必须大于 0' });
    }
    if (!isValidDate(repayment_date)) {
      return res.status(400).json({ error: '还款日期格式不合法' });
    }
    const bill = await Bill.getById(parseInt(bill_id, 10));
    if (!bill) {
      return res.status(400).json({ error: '账单不存在' });
    }

    const recordId = await RepaymentRecord.create({
      bill_id: parseInt(bill_id, 10),
      amount: parseFloat(amount),
      repayment_date,
      interest: parseFloat(interest) || 0,
      notes: notes || ''
    });

    res.status(201).json({ 
      id: recordId, 
      message: '还款记录创建成功' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除还款记录
router.delete('/:id', async (req, res) => {
  try {
    await RepaymentRecord.delete(req.params.id);
    res.json({ message: '还款记录删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取月度还款统计
router.get('/stats/monthly/:month', async (req, res) => {
  try {
    const month = req.params.month;
    if (!isValidMonth(month)) {
      return res.status(400).json({ error: '月份格式不合法' });
    }
    const cacheKey = `repay:monthly:${month}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const stats = await RepaymentRecord.getMonthlyRepaymentStats(month);
    setCache(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台还款统计
router.get('/stats/platform/:platform_id', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '需要开始日期和结束日期' });
    }
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ error: '日期格式不合法' });
    }
    if (!isPositiveInt(req.params.platform_id)) {
      return res.status(400).json({ error: '平台参数不合法' });
    }

    const cacheKey = `repay:platform:${req.params.platform_id}:${start_date}:${end_date}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const stats = await RepaymentRecord.getPlatformRepaymentStats(
      parseInt(req.params.platform_id, 10),
      start_date,
      end_date
    );
    setCache(cacheKey, stats);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取每日还款趋势（按天汇总）
router.get('/stats/daily', async (req, res) => {
  try {
    const { start_date, end_date, platform_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: '需要开始日期和结束日期' });
    }
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ error: '日期格式不合法' });
    }

    const pid = platform_id ? parseInt(platform_id, 10) : null;
    if (platform_id && !isPositiveInt(platform_id)) {
      return res.status(400).json({ error: '平台参数不合法' });
    }
    const cacheKey = `repay:daily:${start_date}:${end_date}:${pid || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const trend = await RepaymentRecord.getDailyRepaymentTrend(start_date, end_date, pid);
    setCache(cacheKey, trend);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 按日期范围获取还款记录列表（用于联动展示）
router.get('/records/by-date', async (req, res) => {
  try {
    const { start_date, end_date, platform_id } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '需要开始日期和结束日期' });
    }
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ error: '日期格式不合法' });
    }
    if (platform_id && !isPositiveInt(platform_id)) {
      return res.status(400).json({ error: '平台参数不合法' });
    }
    const pid = platform_id ? parseInt(platform_id, 10) : null;
    const rows = await RepaymentRecord.getByDateRange(start_date, end_date, pid);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
