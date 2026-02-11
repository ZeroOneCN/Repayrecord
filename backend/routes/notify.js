const express = require('express');
const router = express.Router();
const axios = require('axios');

// 代理企业微信机器人Webhook，解决浏览器端CORS问题
router.post('/wecom/send', async (req, res) => {
  try {
    const { webhookUrl, content } = req.body || {};
    if (!webhookUrl || !content) {
      return res.status(400).json({ error: '缺少 webhookUrl 或 content' });
    }
    const payload = { msgtype: 'text', text: { content } };
    const resp = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = resp.data || {};
    if (typeof data.errcode !== 'undefined' && data.errcode !== 0) {
      return res.status(400).json({ error: '企业微信返回错误', details: data });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('WeCom 发送失败:', err?.response?.data || err.message);
    res.status(500).json({ error: '发送失败', details: err?.response?.data || err.message });
  }
});

// 发送企业微信模板卡片消息（text_notice），用于更美观的提醒展示
router.post('/wecom/card', async (req, res) => {
  try {
    const { webhookUrl, title, sub_title, items, emphasis, url } = req.body || {};
    if (!webhookUrl || !title) {
      return res.status(400).json({ error: '缺少 webhookUrl 或 title' });
    }

    const template_card = {
      card_type: 'text_notice',
      main_title: {
        title: String(title),
        desc: sub_title ? String(sub_title) : ''
      },
      emphasis_content: emphasis ? { title: String(emphasis.title || ''), desc: String(emphasis.desc || '') } : undefined,
      horizontal_content_list: Array.isArray(items)
        ? items.map(it => ({ keyname: String(it.key || ''), value: String(it.value || '') }))
        : [],
      jump_list: url ? [{ type: 1, url: String(url) }] : [],
      card_action: url ? { type: 1, url: String(url) } : { type: 0 }
    };

    const payload = { msgtype: 'template_card', template_card };
    const resp = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = resp.data || {};
    if (typeof data.errcode !== 'undefined' && data.errcode !== 0) {
      return res.status(400).json({ error: '企业微信返回错误', details: data });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('WeCom 卡片消息发送失败:', err?.response?.data || err.message);
    res.status(500).json({ error: '发送失败', details: err?.response?.data || err.message });
  }
});

// 发送企业微信 Markdown 消息（群机器人 Webhook）
router.post('/wecom/markdown', async (req, res) => {
  try {
    const { webhookUrl, content } = req.body || {};
    if (!webhookUrl || !content) {
      return res.status(400).json({ error: '缺少 webhookUrl 或 content' });
    }
    const payload = { msgtype: 'markdown', markdown: { content: String(content) } };
    const resp = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = resp.data || {};
    if (typeof data.errcode !== 'undefined' && data.errcode !== 0) {
      return res.status(400).json({ error: '企业微信返回错误', details: data });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('WeCom Markdown 发送失败:', err?.response?.data || err.message);
    res.status(500).json({ error: '发送失败', details: err?.response?.data || err.message });
  }
});

// 企业微信应用消息接口已移除，统一通过群机器人 Webhook 发送

module.exports = router;
