import React, { useState } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { userService } from '../../services/user.service';

const BUTTON_VARIANTS = {
    primary: {
        backgroundColor: '#4D5DF7',
        textColor: '#FFFFFF',
        followingBackgroundColor: '#F2F1F7',
        followingTextColor: '#000000',
    },
    grey: {
        backgroundColor: '#F2F1F7',
        textColor: '#000000',
        followingBackgroundColor: '#F2F1F7',
        followingTextColor: '#000000',
    },
    transparent: {
        backgroundColor: 'transparent',
        textColor: '#000000',
        followingBackgroundColor: 'transparent',
        followingTextColor: '#000000',
    },
} as const;

interface FollowButtonProps {
    userId: string;
    initialIsFollowing: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
    variant?: 'primary' | 'grey' | 'transparent';
    size?: 'small' | 'medium' | 'large';
    backgroundColor?: string;
    textColor?: string;
    followingBackgroundColor?: string;
    followingTextColor?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
    userId,
    initialIsFollowing,
    onFollowChange,
    variant = 'primary',
    size = 'medium',
    backgroundColor,
    textColor,
    followingBackgroundColor,
    followingTextColor,
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const variantConfig = BUTTON_VARIANTS[variant];

    const handleToggleFollow = async () => {
        if (loading) return;

        const previousState = isFollowing;
        const newState = !isFollowing;
        setIsFollowing(newState);
        setLoading(true);

        console.log('[FollowButton] Toggling follow for userId:', userId);

        try {
            const response = await userService.toggleFollow(userId);
            console.log('[FollowButton] Toggle follow response:', response);

            const finalState = response.followingByCurrentUser;
            setIsFollowing(finalState);
            onFollowChange?.(finalState);
        } catch (error) {
            console.error('[FollowButton] Error toggling follow:', error);
            setIsFollowing(previousState);
        } finally {
            setLoading(false);
        }
    };

    const getBackgroundColor = () => {
        if (isFollowing) {
            return followingBackgroundColor || variantConfig.followingBackgroundColor;
        }
        return backgroundColor || variantConfig.backgroundColor;
    };

    const getTextColor = () => {
        if (isFollowing) {
            return followingTextColor || variantConfig.followingTextColor;
        }
        return textColor || variantConfig.textColor;
    };

    const getPadding = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 6, paddingHorizontal: 12 };
            case 'medium':
                return { paddingVertical: 8, paddingHorizontal: 16 };
            case 'large':
                return { paddingVertical: 10, paddingHorizontal: 20 };
            default:
                return { paddingVertical: 8, paddingHorizontal: 16 };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small':
                return 13;
            case 'medium':
                return 14;
            case 'large':
                return 16;
            default:
                return 14;
        }
    };

    const getButtonText = () => {
        return isFollowing ? 'Đang theo dõi' : 'Theo dõi';
    };

    const shouldShowBorder = () => {
        return variant === 'transparent' || variant === 'grey' || isFollowing;
    };

    return (
        <TouchableOpacity
            onPress={handleToggleFollow}
            disabled={loading}
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderWidth: shouldShowBorder() ? 1 : 0,
                    borderColor: variant === 'transparent' ? '#DBDBDB' : '#E0E0E0',
                    ...getPadding(),
                },
                style,
            ]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <Text
                    style={[
                        styles.text,
                        {
                            color: getTextColor(),
                            fontSize: getFontSize(),
                        },
                        textStyle,
                    ]}
                >
                    {getButtonText()}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    text: {
        fontWeight: '600',
    },
});
