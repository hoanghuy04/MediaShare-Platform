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

    // text color
    bubbleText: string;      // alias cho bubbleTextOut (compat chỗ khác đang dùng)
    bubbleTextIn: string;    // text trong bubble nhận
    bubbleTextOut: string;   // text trong bubble gửi

    // 3 màu gradient cho bubbleOut + nút chính
    gradientHigh: string;
    gradientMedium: string;
    gradientLow: string;

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
  md: 14,
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
  chat: {
    bubbleIn: colors.chat.light.bubbleIn,
    bubbleOut: colors.chat.light.bubbleOut,

    bubbleTextIn: colors.chat.light.bubbleTextIn,
    bubbleTextOut: colors.chat.light.bubbleTextOut,
    bubbleText: colors.chat.light.bubbleTextOut,

    gradientHigh: colors.chat.light.gradientHigh,
    gradientMedium: colors.chat.light.gradientMedium,
    gradientLow: colors.chat.light.gradientLow,

    headerBg: colors.chat.light.headerBg,
    headerText: colors.chat.light.headerText,
    tint: colors.chat.light.tint,
    fabBg: colors.chat.light.fabBg,
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
    bubbleIn: colors.chat.dark.bubbleIn,
    bubbleOut: colors.chat.dark.bubbleOut,

    bubbleTextIn: colors.chat.dark.bubbleTextIn,
    bubbleTextOut: colors.chat.dark.bubbleTextOut,
    bubbleText: colors.chat.dark.bubbleTextOut,

    gradientHigh: colors.chat.dark.gradientHigh,
    gradientMedium: colors.chat.dark.gradientMedium,
    gradientLow: colors.chat.dark.gradientLow,

    headerBg: colors.chat.dark.headerBg,
    headerText: colors.chat.dark.headerText,
    tint: colors.chat.dark.tint,
    fabBg: colors.chat.dark.fabBg,
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
