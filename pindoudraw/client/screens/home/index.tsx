/**
 * 首页 - 图片上传
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useSafeRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading] = useState(false);

  // 选中的图片 URI，用于传递给编辑页
  const [imageUri, setImageUri] = useState<string>('');

  // 打开图片选择器
  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          '需要权限',
          '请允许访问相册以选择图片',
          [{ text: '确定' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  }, []);

  // 拍照上传
  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          '需要权限',
          '请允许访问相机以拍摄照片',
          [{ text: '确定' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  }, []);

  // 跳转到编辑页面
  const goToEditor = useCallback(() => {
    if (!imageUri) {
      Alert.alert('提示', '请先选择一张图片');
      return;
    }
    router.push('/editor', { imageUri });
  }, [imageUri, router]);

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>拼豆图纸大师</Text>
        <Text style={styles.subtitle}>将任意图片转换为拼豆图纸</Text>
      </View>

      {/* Upload Area */}
      <TouchableOpacity
        style={[styles.uploadArea, selectedImage && styles.uploadAreaSelected]}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text style={styles.uploadText}>点击上传图片</Text>
            <Text style={styles.uploadHint}>或拖拽图片到这里</Text>
            <Text style={styles.uploadFormats}>支持 JPG / PNG / GIF</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={takePhoto}
        >
          <Ionicons name="camera" size={20} color="#4B5563" />
          <Text style={styles.secondaryButtonText}> 拍照</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={pickImage}
        >
          <Ionicons name="images" size={20} color="#4B5563" />
          <Text style={styles.secondaryButtonText}> 相册</Text>
        </TouchableOpacity>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          !imageUri && styles.generateButtonDisabled
        ]}
        onPress={goToEditor}
        disabled={!imageUri || isLoading}
        activeOpacity={0.8}
      >
        <Ionicons name="color-palette" size={24} color="#FFFFFF" />
        <Text style={styles.generateButtonText}> 开始制作</Text>
      </TouchableOpacity>

      {/* Supported Brands */}
      <View style={styles.brandsSection}>
        <Text style={styles.brandsTitle}>支持的色号品牌</Text>
        <View style={styles.brandsList}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>Mard</Text>
          </View>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>Perler</Text>
          </View>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>Hama</Text>
          </View>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>Nabbi</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>小贴士</Text>
        <Text style={styles.tipsText}>• 像素越少，难度越低，适合新手入门</Text>
        <Text style={styles.tipsText}>• 开启色号转换，可匹配官方品牌色</Text>
        <Text style={styles.tipsText}>• 建议选择对比度高的图片效果更好</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  uploadArea: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadAreaSelected: {
    borderColor: '#FF6B4A',
    borderStyle: 'solid',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  uploadFormats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  generateButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B4A',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  brandsSection: {
    marginBottom: 24,
  },
  brandsTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  brandsList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  brandBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});
