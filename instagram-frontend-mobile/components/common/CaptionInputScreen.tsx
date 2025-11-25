import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import HashtagSuggestions from './HashtagSuggestions';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CaptionInputScreenProps {
  visible: boolean;
  initialCaption?: string;
  onSave: (caption: string, hashtags: string[]) => void;
  onClose: () => void;
}

const CaptionInputScreen: React.FC<CaptionInputScreenProps> = ({
  visible,
  initialCaption = '',
  onSave,
  onClose,
}) => {
  const [caption, setCaption] = useState(initialCaption);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentHashtagQuery, setCurrentHashtagQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setCaption(initialCaption);
      setShowSuggestions(false);
      setCurrentHashtagQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, initialCaption]);

  // Detect hashtag when caption or cursor changes
  useEffect(() => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      const hasSpace = textAfterHash.includes(' ') || textAfterHash.includes('\n');
      
      if (!hasSpace) {
        setCurrentHashtagQuery(textAfterHash);
        setShowSuggestions(true);
        console.log('[CaptionInput] useEffect - Showing suggestions with query:', textAfterHash);
      } else {
        setShowSuggestions(false);
        setCurrentHashtagQuery('');
      }
    } else {
      setShowSuggestions(false);
      setCurrentHashtagQuery('');
    }
  }, [caption, cursorPosition]);

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const handleTextChange = (text: string) => {
    setCaption(text);
    // Cursor position will be updated by onSelectionChange
    // useEffect will handle hashtag detection
  };

  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    setCursorPosition(selection.start);
    // useEffect will handle hashtag detection
  };

  const handleHashtagSelect = (tag: string) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const textAfterCursor = caption.substring(cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const beforeHash = caption.substring(0, lastHashIndex);
      const newCaption = `${beforeHash}#${tag} ${textAfterCursor}`;
      setCaption(newCaption);
      
      // Move cursor after inserted hashtag
      const newCursorPos = lastHashIndex + tag.length + 2; // +2 for # and space
      setCursorPosition(newCursorPos);
      
      // Update cursor position in TextInput
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: { start: newCursorPos, end: newCursorPos },
        });
      }, 0);
    }
    
    setShowSuggestions(false);
    setCurrentHashtagQuery('');
  };

  const handleSave = () => {
    const hashtags = extractHashtags(caption);
    onSave(caption, hashtags);
  };

  console.log('[CaptionInput] Render state:', { 
    showSuggestions, 
    currentHashtagQuery, 
    caption,
    cursorPosition 
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <BlurView 
          intensity={30} 
          tint="light" 
          style={[styles.blurContainer, { paddingTop: insets.top }]}
        >
          <View style={styles.modalInner}>
            <View 
              style={styles.header}
              onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Chú thích</Text>
              
              <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Thêm chú thích..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
              multiline
              maxLength={2200}
            />

            {showSuggestions && (
              <View style={[
                styles.suggestionsOverlay, 
                { top: headerHeight + inputHeight }
              ]}>
                <HashtagSuggestions
                  query={currentHashtagQuery}
                  onSelect={handleHashtagSelect}
                  onClose={() => setShowSuggestions(false)}
                />
              </View>
            )}
          </View>
        </BlurView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
  modalInner: {
    position: 'relative',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  okText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  suggestionsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    maxHeight: SCREEN_HEIGHT * 0.5,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default CaptionInputScreen;
