export const colors = {
  // Instagram brand colors
  primary: '#405DE6',
  secondary: '#5851DB',
  accent: '#833AB4',
  gradient: {
    start: '#405DE6',
    middle: '#5851DB',
    end: '#833AB4',
  },

  // Status colors
  danger: '#ED4956',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',

  // Light theme colors
  light: {
    primary: '#405DE6',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    text: '#262626',
    textSecondary: '#8E8E8E',
    textTertiary: '#C7C7C7',
    border: '#DBDBDB',
    placeholder: '#C7C7C7',
    divider: '#EFEFEF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarInactive: '#8E8E8E',
  },

  // Dark theme colors
  dark: {
    primary: '#405DE6',
    background: '#000000',
    surface: '#121212',
    card: '#1C1C1C',
    text: '#FFFFFF',
    textSecondary: '#A8A8A8',
    textTertiary: '#737373',
    border: '#262626',
    placeholder: '#737373',
    divider: '#262626',
    overlay: 'rgba(255, 255, 255, 0.1)',
    tabBar: '#000000',
    tabBarInactive: '#A8A8A8',
  },

  // Chat-specific palettes cho từng theme
  chat: {
    light: {
      bubbleIn: '#f3f3f3ff', // bong bóng nhận (xám nhạt)
      bubbleOut: '#8c1aff',  // bong bóng gửi (màu chính)

      // 3 mức màu dùng cho gradient (top-left -> bottom-right)
      gradientHigh: '#ac4abbff',   // sáng hơn
      gradientMedium: '#8333d3ff', // trung bình (màu chính)
      gradientLow: '#4a00c3',    // đậm hơn

      bubbleTextIn: '#2e2e2eff',
      bubbleTextOut: '#FFFFFF',
      headerBg: '#FFFFFF',
      headerText: '#000000',
      tint: '#8c1aff',
      fabBg: '#FFFFFF',
      inputBg: '#FAFAFA',
      inputBorder: '#DBDBDB',
      timestamp: '#8E8E8E',
      seenText: '#8E8E8E',
    },
    dark: {
      bubbleIn: '#262626',
      bubbleOut: '#3797F0',

      // 3 mức màu dùng cho gradient (top-left -> bottom-right)
      gradientHigh: '#5eb8ff',
      gradientMedium: '#3797F0',
      gradientLow: '#1b4f80',

      bubbleTextIn: '#FFFFFF',
      bubbleTextOut: '#FFFFFF',
      headerBg: '#000000',
      headerText: '#FFFFFF',
      tint: '#3797F0',
      fabBg: '#262626',
      inputBg: '#121212',
      inputBorder: '#262626',
      timestamp: '#A8A8A8',
      seenText: '#A8A8A8',
    },
  },

  // Common colors (theme independent)
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    like: '#ED4956',
    blue: '#0095F6',
  },
};

export type ColorTheme = 'light' | 'dark';
