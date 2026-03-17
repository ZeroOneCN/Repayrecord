const express = require('express');
const DebtPlatform = require('../models/DebtPlatform');
const { isValidDayOfMonth } = require('../utils/validators');

const router = express.Router();

// 获取所有负债平台
router.get('/', async (req, res) => {
  try {
    const platforms = await DebtPlatform.getAll();
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个平台
router.get('/:id', async (req, res) => {
  try {
    const platform = await DebtPlatform.getById(req.params.id);
    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }
    res.json(platform);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新平台
router.post('/', async (req, res) => {
  try {
    const { name, billing_day, repayment_day, credit_limit } = req.body;
    
    if (!name || !billing_day || !repayment_day) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!isValidDayOfMonth(billing_day) || !isValidDayOfMonth(repayment_day)) {
      return res.status(400).json({ error: '账单出账日和还款日需在 1-31 之间' });
    }

    const platformId = await DebtPlatform.create({
      name: String(name).trim(),
      billing_day: parseInt(billing_day, 10),
      repayment_day: parseInt(repayment_day, 10),
      credit_limit: parseFloat(credit_limit) || 0
    });

    res.status(201).json({ 
      id: platformId, 
      message: '平台创建成功' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新平台
router.put('/:id', async (req, res) => {
  try {
    const { name, billing_day, repayment_day, credit_limit } = req.body;
    
    if (!name || !billing_day || !repayment_day) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!isValidDayOfMonth(billing_day) || !isValidDayOfMonth(repayment_day)) {
      return res.status(400).json({ error: '账单出账日和还款日需在 1-31 之间' });
    }

    await DebtPlatform.update(req.params.id, {
      name: String(name).trim(),
      billing_day: parseInt(billing_day, 10),
      repayment_day: parseInt(repayment_day, 10),
      credit_limit: parseFloat(credit_limit) || 0
    });

    res.json({ message: '平台更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除平台
router.delete('/:id', async (req, res) => {
  try {
    await DebtPlatform.delete(req.params.id);
    res.json({ message: '平台删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await DebtPlatform.getPlatformStats();
    const platformStats = stats.find(stat => stat.id === parseInt(req.params.id));
    
    if (!platformStats) {
      return res.status(404).json({ error: '平台统计信息不存在' });
    }

    res.json(platformStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有平台统计
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await DebtPlatform.getPlatformStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
