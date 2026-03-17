/**
 * 美学色彩系统
 * 基于现代设计趋势的配色方案
 */

// 主色调 - 渐变紫色系
export const PRIMARY_GRADIENT = {
  from: '#667eea',  // 柔和的紫蓝色
  to: '#764ba2'     // 深邃的紫色
};

// 辅助色系
export const COLOR_PALETTE = {
  // 主色
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95'
  },
  
  // 成功色 - 自然的绿色
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  
  // 警告色 - 温暖的橙色
  warning: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  
  // 错误色 - 柔和的红色
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  
  // 信息色 - 清新的蓝色
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  }
};

// 中性色系
export const NEUTRAL_COLORS = {
  // 白色到灰色渐变
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  black: '#000000'
};

// 背景渐变
export const BACKGROUNDS = {
  // 主背景 - 柔和的灰白渐变
  main: 'linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%)',
  
  // 卡片背景
  card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
  
  // 卡片头部
  cardHeader: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 249, 250, 0.5) 100%)',
  
  // 模态框头部
  modalHeader: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)',
  
  // 表格头部
  tableHeader: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)',
  
  // 悬停背景
  hover: 'linear-gradient(90deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.02) 100%)'
};

// 阴影系统
export const SHADOWS = {
  // 轻微阴影 - 用于卡片
  sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
  
  // 中等阴影 - 用于悬停
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  
  // 深度阴影 - 用于模态框
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  
  // 强调阴影 - 用于按钮
  xl: '0 12px 48px rgba(0, 0, 0, 0.15)',
  
  // 彩色阴影 - 主色按钮
  primary: '0 4px 12px rgba(102, 126, 234, 0.3)',
  primaryHover: '0 6px 16px rgba(102, 126, 234, 0.4)',
  
  // 成功阴影
  success: '0 4px 12px rgba(34, 197, 94, 0.3)',
  
  // 警告阴影
  warning: '0 4px 12px rgba(249, 115, 22, 0.3)',
  
  // 错误阴影
  error: '0 4px 12px rgba(239, 68, 68, 0.3)'
};

// 圆角系统
export const BORDER_RADIUS = {
  sm: '6px',    // 小圆角 - 标签
  md: '8px',    // 中等圆角 - 按钮、输入框
  lg: '12px',   // 大圆角 - 卡片
  xl: '16px',   // 超大圆角 - 模态框
  full: '9999px' // 完全圆角 - 头像
};

// 间距系统
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px'
};

// 字体系统
export const TYPOGRAPHY = {
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji'`,
  
  fontSizes: {
    xs: '12px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
    '5xl': '36px'
  },
  
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  },
  
  letterSpacing: {
    tight: '-0.5px',
    normal: '0',
    wide: '0.5px',
    wider: '1px'
  }
};

// 动画系统
export const ANIMATIONS = {
  // 缓动函数
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
    leave: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // 持续时间
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  
  // 动画效果
  effects: {
    fadeIn: 'fadeIn 0.3s ease-in-out',
    fadeOut: 'fadeOut 0.3s ease-in-out',
    slideUp: 'slideUp 0.3s ease-out',
    slideDown: 'slideDown 0.3s ease-out',
    scaleUp: 'scaleUp 0.2s ease-out',
    scaleDown: 'scaleDown 0.2s ease-out'
  }
};

// 图表配色
export const CHART_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', 
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#fa709a', '#fee140', '#30cfd0', '#330867'
];

// 状态颜色映射
export const STATUS_COLORS = {
  paid: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#22c55e',
    border: 'rgba(34, 197, 94, 0.2)'
  },
  unpaid: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.2)'
  },
  upcoming: {
    bg: 'rgba(249, 115, 22, 0.1)',
    text: '#f97316',
    border: 'rgba(249, 115, 22, 0.2)'
  },
  normal: {
    bg: 'rgba(102, 126, 234, 0.1)',
    text: '#667eea',
    border: 'rgba(102, 126, 234, 0.2)'
  }
};

// 导出完整主题
export const theme = {
  colors: {
    primary: PRIMARY_GRADIENT,
    palette: COLOR_PALETTE,
    neutral: NEUTRAL_COLORS,
    backgrounds: BACKGROUNDS,
    status: STATUS_COLORS
  },
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  animations: ANIMATIONS,
  charts: CHART_COLORS
};

export default theme;
