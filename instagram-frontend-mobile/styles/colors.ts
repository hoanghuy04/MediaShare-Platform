export const colors = {
  // Instagram brand colors
  primary: '#4D5DF8',
  secondary: '#5851DB',
  accent: '#833AB4',
  gradient: {
    start: '#4D5DF8',
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
    primary: '#4D5DF8',
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
    primary: '#4D5DF8',
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

