// components/messages/LinkableText.tsx
import React from 'react';
import { Text, StyleSheet, Linking, Alert } from 'react-native';

interface LinkableTextProps {
  text: string;
  style?: any;
  linkStyle?: any;
}

// Regex để detect URLs (bắt đầu với http:// hoặc https://)
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const LinkableText: React.FC<LinkableTextProps> = ({
  text,
  style,
  linkStyle,
}) => {
  const handlePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lỗi', 'Không thể mở link này');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Lỗi', 'Không thể mở link');
    }
  };

  const parseTextWithLinks = () => {
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(text)) !== null) {
      const url = match[0];
      const startIndex = match.index;

      // Add text before the URL
      if (startIndex > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={style}>
            {text.substring(lastIndex, startIndex)}
          </Text>
        );
      }

      // Add the URL as clickable link
      parts.push(
        <Text
          key={`link-${startIndex}`}
          style={[style, linkStyle, styles.link]}
          onPress={() => handlePress(url)}
        >
          {url}
        </Text>
      );

      lastIndex = startIndex + url.length;
    }

    // Add remaining text after last URL
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? parts : <Text style={style}>{text}</Text>;
  };

  return <Text style={style}>{parseTextWithLinks()}</Text>;
};

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});
