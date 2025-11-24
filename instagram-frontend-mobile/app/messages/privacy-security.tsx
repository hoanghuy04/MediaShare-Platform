// app/messages/privacy-security.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function ConversationPrivacySecurityScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  // Local states – hiện tại chỉ lưu cục bộ, nếu sau này có API thì map sang DTO
  const [hideActiveStatus, setHideActiveStatus] = useState(false);
  const [limitStrangers, setLimitStrangers] = useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<7 | 30 | 90>(30);
  const [blockUnknownLinks, setBlockUnknownLinks] = useState(false);
  const [blurSensitiveMedia, setBlurSensitiveMedia] = useState(false);

  const onBack = () => router.back();

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Quyền riêng tư &amp; An toàn
      </Text>

      <View style={styles.headerBtn} />
    </View>
  );

  const renderAutoDeleteChip = (label: string, days: 7 | 30 | 90) => {
    const selected = autoDeleteDays === days;
    return (
      <TouchableOpacity
        key={days}
        style={[
          styles.chip,
          {
            backgroundColor: selected
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
        onPress={() => setAutoDeleteDays(days)}
        disabled={!autoDeleteEnabled}
      >
        <Text
          style={[
            styles.chipText,
            { color: selected ? theme.colors.white : theme.colors.text },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {Header}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <View style={styles.heroCard}>
            <Image
              source={{
                uri: 'https://picsum.photos/600/260?random=101',
              }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>An toàn trong từng tin nhắn</Text>
              <Text style={styles.heroSubtitle}>
                Chúng tôi sử dụng mã hóa, giới hạn truy cập và nhiều lớp bảo
                vệ khác để giữ cho cuộc trò chuyện của bạn luôn riêng tư.
              </Text>
            </View>
          </View>

          {/* 1. Bảo vệ dữ liệu cá nhân */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                1. Bảo vệ dữ liệu cá nhân
              </Text>
            </View>

            <Image
              source={{
                uri: 'https://picsum.photos/400/220?random=102',
              }}
              style={styles.sectionImage}
            />

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Thông tin cá nhân như tên, email, avatar và hoạt động tài khoản
              của bạn được lưu trữ an toàn trên hệ thống. Dữ liệu này chỉ được
              sử dụng để vận hành các tính năng cốt lõi (ví dụ: hiển thị hồ sơ,
              hiển thị tên trong cuộc trò chuyện) và không được bán cho bên thứ
              ba.
            </Text>

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Bạn có thể yêu cầu chỉnh sửa hoặc xóa tài khoản theo chính sách
              dữ liệu. Khi xóa, những thông tin nhận diện trực tiếp sẽ được ẩn
              hoặc xóa khỏi hệ thống theo đúng quy định.
            </Text>
          </View>

          {/* 2. Mã hóa nội dung trò chuyện */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                2. Mã hóa nội dung trò chuyện
              </Text>
            </View>

            <Image
              source={{
                uri: 'https://picsum.photos/400/220?random=103',
              }}
              style={styles.sectionImage}
            />

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Mọi tin nhắn, hình ảnh và video được truyền qua mạng đều đi qua
              kết nối an toàn. Điều này giúp hạn chế việc nội dung bị xem trộm
              trên đường truyền.
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Nội dung tin nhắn không được sử dụng cho mục đích quảng cáo hành
              vi, cũng không bị đọc thủ công bởi đội ngũ vận hành, trừ các
              trường hợp xử lý khiếu nại hoặc theo yêu cầu pháp lý.
            </Text>
          </View>

          {/* 3. Cài đặt hiển thị & trạng thái */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="eye-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                3. Hiển thị &amp; trạng thái hoạt động
              </Text>
            </View>

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Bạn có thể kiểm soát việc người khác có thấy trạng thái hoạt
              động gần đây, đang nhập hoặc đang gõ của mình hay không.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Ẩn trạng thái đang hoạt động
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Người khác sẽ không thấy bạn đang trực tuyến, nhưng bạn cũng
                  sẽ không thấy trạng thái của họ.
                </Text>
              </View>
              <Switch
                value={hideActiveStatus}
                onValueChange={setHideActiveStatus}
              />
            </View>
          </View>

          {/* 4. Giới hạn tin nhắn lạ */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="people-circle-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                4. Giới hạn tin nhắn từ người lạ
              </Text>
            </View>

            <Image
              source={{
                uri: 'https://picsum.photos/400/220?random=104',
              }}
              style={styles.sectionImage}
            />

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Để tránh spam, bạn có thể giới hạn tin nhắn từ người không nằm
              trong danh sách theo dõi hoặc bạn bè. Tin nhắn từ những tài khoản
              này sẽ được đưa vào mục "Yêu cầu tin nhắn" thay vì hiển thị trực
              tiếp.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Chỉ nhận tin nhắn trực tiếp từ người bạn theo dõi
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Tin nhắn từ người khác sẽ được chuyển vào mục yêu cầu để bạn
                  chủ động chấp nhận hoặc từ chối.
                </Text>
              </View>
              <Switch
                value={limitStrangers}
                onValueChange={setLimitStrangers}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Chặn liên kết đáng ngờ
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Ẩn trước các đường dẫn nghi ngờ lừa đảo, chỉ hiển thị sau khi
                  bạn nhấn xem.
                </Text>
              </View>
              <Switch
                value={blockUnknownLinks}
                onValueChange={setBlockUnknownLinks}
              />
            </View>
          </View>

          {/* 5. Nội dung nhạy cảm */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="warning-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                5. Nội dung nhạy cảm
              </Text>
            </View>

            <Image
              source={{
                uri: 'https://picsum.photos/400/220?random=105',
              }}
              style={styles.sectionImage}
            />

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Hình ảnh có khả năng chứa nội dung nhạy cảm hoặc bạo lực có thể
              được làm mờ trước khi hiển thị. Bạn có thể bật hoặc tắt tùy chọn
              này theo nhu cầu của mình.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Làm mờ media nhạy cảm
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Hình ảnh/video được nghi ngờ là nhạy cảm sẽ bị làm mờ cho đến
                  khi bạn nhấn xem.
                </Text>
              </View>
              <Switch
                value={blurSensitiveMedia}
                onValueChange={setBlurSensitiveMedia}
              />
            </View>
          </View>

          {/* 6. Tự động xóa tin nhắn */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="time-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                6. Tự động xóa tin nhắn
              </Text>
            </View>

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              Bạn có thể bật chế độ tự động xóa tin nhắn sau một khoảng thời
              gian nhất định. Tính năng này giúp cuộc trò chuyện luôn gọn gàng
              và giảm rủi ro lộ thông tin cũ.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Bật tự động xóa
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Khi bật, tin nhắn cũ hơn thời gian bạn chọn sẽ được xóa tự
                  động khỏi thiết bị và máy chủ.
                </Text>
              </View>
              <Switch
                value={autoDeleteEnabled}
                onValueChange={setAutoDeleteEnabled}
              />
            </View>

            <View style={styles.chipRow}>
              {renderAutoDeleteChip('7 ngày', 7)}
              {renderAutoDeleteChip('30 ngày', 30)}
              {renderAutoDeleteChip('90 ngày', 90)}
            </View>
          </View>

          {/* 7. Khuyến nghị an toàn */}
          <View style={[styles.section, { marginBottom: 28 }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                7. Khuyến nghị an toàn
              </Text>
            </View>

            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary },
              ]}
            >
              • Không chia sẻ mật khẩu, mã OTP hoặc thông tin tài chính qua
              tin nhắn.{'\n'}
              • Cẩn trọng với những lời mời đầu tư, cho vay, trúng thưởng.{'\n'}
              • Nếu thấy nội dung có dấu hiệu lừa đảo, hãy báo cáo ngay để
              chúng tôi có thể xử lý.
            </Text>

            <Text
              style={[
                styles.sectionBody,
                {
                  color: theme.colors.textSecondary,
                  marginTop: 6,
                  fontStyle: 'italic',
                },
              ]}
            >
              Nếu bạn cần hỗ trợ khẩn cấp liên quan đến an toàn, hãy liên hệ
              đội ngũ hỗ trợ qua mục Trợ giúp hoặc email support@socialtrio.app.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTextWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#f3f4f6',
    fontSize: 13,
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },

  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
