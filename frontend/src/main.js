import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import router from './router';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import './styles/global.css';
import { settingsAPI } from '@/services/api';
import { savePreferences } from '@/services/preferences';

async function bootstrap() {
  const app = createApp(App);
  app.use(Antd);
  app.use(router);
  // 更新站点标题
  try { document.title = '借款还款管理平台'; } catch (_) {}

  // 在应用挂载前，从后端加载系统设置并写入本地缓存
  try {
    const serverPrefs = await settingsAPI.getAll();
    if (serverPrefs && Object.keys(serverPrefs).length > 0) {
      savePreferences(serverPrefs);
    }
  } catch (e) {
    // 忽略后端不可达或无设置的情况，使用默认偏好
    console.warn('加载后端系统设置失败，使用本地默认值');
  }

  app.mount('#app');
}

bootstrap();

// 设置 dayjs 中文
dayjs.locale('zh-cn');