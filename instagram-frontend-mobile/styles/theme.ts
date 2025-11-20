import { colors, ColorTheme } from './colors';

export interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    placeholder: string;
    divider: string;
    overlay: string;
    tabBar: string;
    tabBarInactive: string;
    danger: string;
    success: string;
    warning: string;
    info: string;
    like: string;
    blue: string;
    white: string;
    black: string;
    transparent: string;
  };
  chat: {
    bubbleIn: string;
    bubbleOut: string;
    bubbleText: string;
    headerBg: string;
    headerText: string;
    tint: string;
    fabBg: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  iconSize: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 14, // thu gọn nhịp cho mobile
  lg: 20,
  xl: 28,
  xxl: 44,
};

const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
};

const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  full: 9999,
};

const iconSize = {
  sm: 18,
  md: 22,
  lg: 28,
  xl: 44,
};

const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const lightTheme: Theme = {
  colors: {
    ...colors.light,
    ...colors.common,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
  },
  // preset chat “hồng” mặc định (có thể override theo conversation.themeColor)
  chat: {
    bubbleIn: '#F4F5F7',
    bubbleOut: '#6D85FF',
    bubbleText: '#0F1115',
    headerBg: '#FFFFFF',
    headerText: '#111418',
    tint: '#F48FB1',
    fabBg: '#FFFFFF',
  },
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  shadows,
};

export const darkTheme: Theme = {
  colors: {
    ...colors.dark,
    ...colors.common,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
  },
  chat: {
    bubbleIn: '#22252C',
    bubbleOut: '#7C4DFF',
    bubbleText: '#FFFFFF',
    headerBg: '#121419',
    headerText: '#FFFFFF',
    tint: '#A78BFA',
    fabBg: '#2B2F3A',
  },
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  shadows,
};

export const getTheme = (colorTheme: ColorTheme): Theme => {
  return colorTheme === 'dark' ? darkTheme : lightTheme;
};
