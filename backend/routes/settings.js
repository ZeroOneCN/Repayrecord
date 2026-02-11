const express = require('express');
const Setting = require('../models/Setting');

const router = express.Router();

// 获取所有设置项
router.get('/', async (req, res) => {
  try {
    const all = await Setting.getAll();
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个设置项
router.get('/:key', async (req, res) => {
  try {
    const val = await Setting.get(req.params.key);
    if (val === null) {
      return res.status(404).json({ error: '设置项不存在' });
    }
    res.json({ key: req.params.key, value: val });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量保存设置项（覆盖同名键）
router.put('/', async (req, res) => {
  try {
    const data = req.body || {};
    await Setting.setMany(data);
    res.json({ message: '设置已保存' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;