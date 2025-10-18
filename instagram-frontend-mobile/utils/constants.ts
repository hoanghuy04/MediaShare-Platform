export const COLORS = {
  primary: '#405DE6',
  secondary: '#5851DB',
  accent: '#833AB4',
  danger: '#ED4956',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#262626',
    textSecondary: '#8E8E8E',
    border: '#DBDBDB',
    placeholder: '#C7C7C7',
  },
  
  // Dark theme
  dark: {
    background: '#000000',
    surface: '#121212',
    text: '#FFFFFF',
    textSecondary: '#A8A8A8',
    border: '#262626',
    placeholder: '#737373',
  },
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Font sizes
  fontXs: 10,
  fontSm: 12,
  fontMd: 14,
  fontLg: 16,
  fontXl: 20,
  fontXxl: 24,
  
  // Border radius
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusFull: 9999,
  
  // Icon sizes
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
};

export const LAYOUT = {
  screenPadding: SIZES.md,
  maxContentWidth: 600,
  tabBarHeight: 60,
  headerHeight: 56,
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};

export const VALIDATION = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9._]+$/,
  },
  password: {
    minLength: 6,
    maxLength: 100,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  caption: {
    maxLength: 2200,
  },
  bio: {
    maxLength: 150,
  },
};

export const FILE = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 60, // seconds
    allowedTypes: ['video/mp4', 'video/quicktime'],
  },
};

