/**
 * 预览页面 - 显示生成的图纸和色号图例
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
  RefreshControl,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

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
  brand: string;
}

export default function PreviewScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ imageId: string; imageUri?: string }>();
  
  const [imageId, setImageId] = useState<string>('');
  const [imageUri, setImageUri] = useState<string>('');
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.imageId) {
      setImageId(params.imageId);
      loadPreview(params.imageId);
    }
    if (params.imageUri) {
      setImageUri(params.imageUri);
    }
  }, [params.imageId, params.imageUri]);

  // 加载预览数据
  const loadPreview = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/bead/image/${id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setResult(data.data);
        // 设置预览 URL
        const cellSize = Math.max(10, Math.floor((SCREEN_WIDTH - 64) / data.data.width));
        setPreviewUrl(`${API_BASE}/api/v1/bead/preview/${id}?cellSize=${cellSize}`);
      } else {
        Alert.alert('错误', '加载预览失败');
      }
    } catch (error) {
      console.error('Load preview error:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    if (imageId) {
      setRefreshing(true);
      await loadPreview(imageId);
      setRefreshing(false);
    }
  }, [imageId]);

  // 导出图纸
  const handleExport = async () => {
    if (!imageId) return;

    setIsExporting(true);
    try {
      // 下载图纸 PNG
      const patternUrl = `${API_BASE}/api/v1/bead/export/${imageId}?cellSize=20`;
      const cacheDir = (FileSystem as any).cacheDirectory || '';
      const patternFileUri = `${cacheDir}bead-pattern-${imageId}.png`;
      
      const patternDownload = await FileSystem.downloadAsync(patternUrl, patternFileUri);
      
      if (patternDownload.status === 200) {
        // 检查是否支持分享
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(patternFileUri, {
            mimeType: 'image/png',
            dialogTitle: '保存拼豆图纸',
          });
        } else {
          Alert.alert('提示', '分享功能不可用，请尝试其他方式保存');
        }
      } else {
        Alert.alert('错误', '下载图纸失败');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('错误', '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 导出色号图例
  const handleExportLegend = async () => {
    if (!imageId) return;

    setIsExporting(true);
    try {
      const legendUrl = `${API_BASE}/api/v1/bead/legend/${imageId}`;
      const cacheDir = (FileSystem as any).cacheDirectory || '';
      const legendFileUri = `${cacheDir}bead-legend-${imageId}.png`;
      
      const legendDownload = await FileSystem.downloadAsync(legendUrl, legendFileUri);
      
      if (legendDownload.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(legendFileUri, {
            mimeType: 'image/png',
            dialogTitle: '保存色号图例',
          });
        } else {
          Alert.alert('提示', '分享功能不可用');
        }
      } else {
        Alert.alert('错误', '下载图例失败');
      }
    } catch (error) {
      console.error('Export legend error:', error);
      Alert.alert('错误', '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 创建新图纸
  const handleCreateNew = () => {
    router.replace('/');
  };

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B4A" />
        <Text style={styles.loadingText}>正在生成图纸...</Text>
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>加载失败</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadPreview(imageId)}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B4A"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>图纸预览</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FF6B4A" />
            ) : (
              <Text style={styles.exportText}>下载</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Pattern Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>像素图纸</Text>
          <View style={styles.previewContainer}>
            {previewUrl ? (
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <ActivityIndicator size="small" color="#FF6B4A" />
              </View>
            )}
          </View>
          <Text style={styles.previewHint}>
            {result.width} x {result.height} 像素
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>统计信息</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{result.width}x{result.height}</Text>
              <Text style={styles.statLabel}>像素尺寸</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{result.totalBeads.toLocaleString()}</Text>
              <Text style={styles.statLabel}>珠子总数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{result.colorCount}</Text>
              <Text style={styles.statLabel}>使用颜色</Text>
            </View>
          </View>
        </View>

        {/* Color Legend */}
        <View style={styles.legendSection}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>色号图例</Text>
            <TouchableOpacity
              style={styles.legendExportButton}
              onPress={handleExportLegend}
              disabled={isExporting}
            >
              <Text style={styles.legendExportText}>下载图例</Text>
            </TouchableOpacity>
          </View>
          
          {/* 横向滚动图例 */}
          <View style={styles.legendScrollContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.legendScroll}
            >
              {result.legend.map((item, index) => (
                <View key={item.id || index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.hex }]}>
                    {item.hex === '#FFFFFF' && (
                      <View style={styles.legendColorBorder} />
                    )}
                  </View>
                  <Text style={styles.legendName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendCount}>{item.count}颗</Text>
                  <Text style={styles.legendPercent}>{item.percentage}%</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Legend Grid */}
          <View style={styles.legendGrid}>
            {result.legend.map((item, index) => (
              <View key={item.id || index} style={styles.legendGridItem}>
                <View style={[styles.legendGridColor, { backgroundColor: item.hex }]}>
                  {item.hex === '#FFFFFF' && (
                    <View style={styles.legendColorBorder} />
                  )}
                </View>
                <View style={styles.legendGridInfo}>
                  <Text style={styles.legendGridName}>{item.name}</Text>
                  <Text style={styles.legendGridBrand}>{item.brand.toUpperCase()}</Text>
                </View>
                <View style={styles.legendGridStats}>
                  <Text style={styles.legendGridCount}>{item.count}颗</Text>
                  <Text style={styles.legendGridPercent}>{item.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Original Image */}
        {imageUri && (
          <View style={styles.originalSection}>
            <Text style={styles.originalTitle}>原图参考</Text>
            <Image
              source={{ uri: imageUri }}
              style={styles.originalImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>制作小贴士</Text>
          <Text style={styles.tipsText}>1. 打印图纸后按格子排列珠子</Text>
          <Text style={styles.tipsText}>2. 使用熨斗烫接时注意温度和时间</Text>
          <Text style={styles.tipsText}>3. 建议从中心向外围制作</Text>
          <Text style={styles.tipsText}>4. 保存时可截图留作记录</Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={handleCreateNew}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FF6B4A" />
          <Text style={styles.newButtonText}> 创建新图纸</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>保存图纸</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B4A',
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
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
  exportButton: {
    paddingVertical: 8,
    paddingLeft: 16,
  },
  exportText: {
    fontSize: 16,
    color: '#FF6B4A',
    fontWeight: '500',
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  previewContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B4A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  legendSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  legendExportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF0ED',
  },
  legendExportText: {
    fontSize: 12,
    color: '#FF6B4A',
    fontWeight: '500',
  },
  legendScrollContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  legendScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  legendItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  legendColor: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendColorBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendName: {
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 60,
  },
  legendCount: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  legendPercent: {
    fontSize: 10,
    color: '#FF6B4A',
    fontWeight: '500',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  legendGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    width: '48%',
  },
  legendGridColor: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendGridInfo: {
    flex: 1,
  },
  legendGridName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  legendGridBrand: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  legendGridStats: {
    alignItems: 'flex-end',
  },
  legendGridCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
  },
  legendGridPercent: {
    fontSize: 10,
    color: '#FF6B4A',
  },
  originalSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  originalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  originalImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  newButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6B4A',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B4A',
  },
  saveButton: {
    flex: 1,
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
