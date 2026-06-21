/**
 * 编辑器页面 - 调整参数并预览
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface ProcessedResult {
  id: string;
  width: number;
  height: number;
  totalBeads: number;
  colorCount: number;
  legend: Array<{
    id: string;
    hex: string;
    name: string;
    brand: string;
    count: number;
    percentage: number;
  }>;
}

const BRANDS = [
  { id: 'mard', name: 'Mard' },
  { id: 'perler', name: 'Perler' },
  { id: 'hama', name: 'Hama' },
  { id: 'nabbi', name: 'Nabbi' },
];

// 难度等级
const DIFFICULTY_LEVELS = [
  { label: '入门', value: 16, beads: '~256颗', color: '#10B981' },
  { label: '简单', value: 32, beads: '~1,024颗', color: '#22C55E' },
  { label: '进阶', value: 48, beads: '~2,304颗', color: '#84CC16' },
  { label: '中等', value: 64, beads: '~4,096颗', color: '#F59E0B' },
  { label: '困难', value: 80, beads: '~6,400颗', color: '#F97316' },
  { label: '大师', value: 96, beads: '~9,216颗', color: '#EF4444' },
  { label: '骨灰', value: 128, beads: '~16,384颗', color: '#DC2626' },
];

export default function EditorScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ imageUri: string }>();
  
  const [imageUri, setImageUri] = useState<string>('');
  const [pixelSize, setPixelSize] = useState(64);
  const [brand, setBrand] = useState<string>('mard');
  const [useColorMatching, setUseColorMatching] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (params.imageUri) {
      setImageUri(params.imageUri);
    }
  }, [params.imageUri]);

  // 获取当前难度
  const getCurrentDifficulty = useCallback(() => {
    return DIFFICULTY_LEVELS.find(level => level.value === pixelSize) || DIFFICULTY_LEVELS[3];
  }, [pixelSize]);

  // 辅助函数：将 URI 转换为 File 对象
  const uriToFile = async (uri: string, filename: string, mimeType: string) => {
    // Web 端处理 blob URL
    if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new File([blob], filename, { type: mimeType });
    }
    // React Native 端保持原样
    return {
      uri,
      name: filename,
      type: mimeType,
    } as any;
  };

  // 处理图片
  const handleProcessImage = useCallback(async () => {
    if (!imageUri) {
      Alert.alert('错误', '请先选择图片');
      return;
    }

    setIsProcessing(true);
    setIsGenerating(true);

    try {
      // 创建 FormData
      const formData = new FormData();
      
      // 获取文件信息
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // 添加文件（处理 Web 端 blob URL）
      const file = await uriToFile(imageUri, filename, type);
      formData.append('image', file);
      
      // 添加参数
      formData.append('targetSize', pixelSize.toString());
      formData.append('brand', brand);
      formData.append('useColorMatching', useColorMatching.toString());

      const response = await fetch(`${API_BASE}/api/v1/bead/process`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setProcessedResult(result.data);
        
        // 设置预览 URL
        const previewUrl = `${API_BASE}/api/v1/bead/preview/${result.data.id}?cellSize=8`;
        setPreviewUrl(previewUrl);
        
        // 保存到历史记录
        saveToHistory(result.data, imageUri);
        
        // 跳转到预览页
        router.push('/preview', { 
          imageId: result.data.id,
          imageUri: imageUri,
        });
      } else {
        Alert.alert('处理失败', result.error || '图片处理失败，请重试');
      }
    } catch (error) {
      console.error('Process error:', error);
      Alert.alert('错误', '网络请求失败，请检查网络连接');
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  }, [imageUri, pixelSize, brand, useColorMatching, router]);

  // 保存到历史记录
  const saveToHistory = async (result: ProcessedResult, imageUri: string) => {
    try {
      const historyKey = 'bead_history';
      const historyData = await AsyncStorage.getItem(historyKey);
      const history = historyData ? JSON.parse(historyData) : [];
      
      const newItem = {
        id: result.id,
        imageUri,
        width: result.width,
        height: result.height,
        totalBeads: result.totalBeads,
        colorCount: result.colorCount,
        brand,
        pixelSize,
        createdAt: new Date().toISOString(),
      };
      
      // 只保留最近10条记录
      const updatedHistory = [newItem, ...history].slice(0, 10);
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Save history error:', error);
    }
  };

  // 预览图片变化
  const getPreviewUrl = useCallback(() => {
    if (processedResult) {
      return `${API_BASE}/api/v1/bead/preview/${processedResult.id}?cellSize=${Math.max(6, Math.floor(280 / processedResult.width))}`;
    }
    return '';
  }, [processedResult]);

  const difficulty = getCurrentDifficulty();

  return (
    <Screen style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>调整参数</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image Preview */}
        <View style={styles.previewSection}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>请先选择图片</Text>
            </View>
          )}
        </View>

        {/* Pixel Size Slider */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>拼豆难度</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficulty.color }]}>
              <Text style={styles.difficultyText}>{difficulty.label}</Text>
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={16}
            maximumValue={128}
            step={16}
            value={pixelSize}
            onValueChange={setPixelSize}
            minimumTrackTintColor="#FF6B4A"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#FF6B4A"
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>16px</Text>
            <Text style={styles.sliderLabel}>入门</Text>
            <Text style={styles.sliderLabel}>128px</Text>
          </View>
          
          <View style={styles.difficultyInfo}>
            <Text style={styles.difficultyInfoText}>
              尺寸: {pixelSize}×{pixelSize} | 约 {pixelSize * pixelSize} 颗
            </Text>
            <Text style={styles.difficultyInfoText}>
              难度: {difficulty.beads}
            </Text>
          </View>

          {/* Difficulty Quick Select */}
          <View style={styles.quickSelect}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.quickSelectItem,
                  pixelSize === level.value && { 
                    backgroundColor: level.color,
                    borderColor: level.color,
                  }
                ]}
                onPress={() => setPixelSize(level.value)}
              >
                <Text style={[
                  styles.quickSelectText,
                  pixelSize === level.value && styles.quickSelectTextActive
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择品牌</Text>
          <View style={styles.brandList}>
            {BRANDS.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.brandItem,
                  brand === b.id && styles.brandItemActive
                ]}
                onPress={() => setBrand(b.id)}
              >
                <Text style={[
                  styles.brandText,
                  brand === b.id && styles.brandTextActive
                ]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Matching Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.sectionTitle}>转换为色号</Text>
              <Text style={styles.toggleHint}>
                开启后将匹配 {BRANDS.find(b => b.id === brand)?.name} 官方色号
              </Text>
            </View>
            <Switch
              value={useColorMatching}
              onValueChange={setUseColorMatching}
              trackColor={{ false: '#E5E7EB', true: '#FFB4A7' }}
              thumbColor={useColorMatching ? '#FF6B4A' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Stats Preview */}
        {processedResult && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>预估统计</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{processedResult.width}×{processedResult.height}</Text>
                <Text style={styles.statLabel}>像素尺寸</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{processedResult.totalBeads.toLocaleString()}</Text>
                <Text style={styles.statLabel}>珠子总数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{processedResult.colorCount}</Text>
                <Text style={styles.statLabel}>使用颜色</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generate Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.generateButton, (!imageUri || isGenerating) && styles.generateButtonDisabled]}
          onPress={handleProcessImage}
          disabled={!imageUri || isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateButtonText}>生成图纸</Text>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#FF6B4A',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 60,
  },
  previewSection: {
    height: 200,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  difficultyInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  difficultyInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  quickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickSelectItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  quickSelectText: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  brandList: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  brandItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  brandItemActive: {
    backgroundColor: '#FFF0ED',
    borderColor: '#FF6B4A',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  brandTextActive: {
    color: '#FF6B4A',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B4A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  generateButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B4A',
    justifyContent: 'center',
    alignItems: 'center',
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
});
