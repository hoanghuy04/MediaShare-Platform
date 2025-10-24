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
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

const iconSize = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  shadows,
};

export const getTheme = (colorTheme: ColorTheme): Theme => {
  return colorTheme === 'dark' ? darkTheme : lightTheme;
};

