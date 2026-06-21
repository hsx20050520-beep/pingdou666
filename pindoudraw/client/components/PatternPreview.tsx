import React, { useMemo } from "react";
import { View, Text, Platform, Dimensions, ScrollView } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { ProcessedResult } from "../utils/processing/processPixels";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  result: ProcessedResult;
  cellSize?: number;
  showLegend?: boolean;
}

export function PatternPreview({ result, cellSize: cs, showLegend = true }: Props) {
  const cellSize = cs ?? Math.max(4, Math.floor((SCREEN_WIDTH - 64) / result.width));
  const svgWidth = result.width * cellSize;
  const svgHeight = result.height * cellSize;

  const colorEntries = useMemo(() => {
    return Object.entries(result.colorMap || {});
  }, [result.colorMap]);

  // Build SVG rects
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < result.pixels.length; y++) {
    const row = result.pixels[y];
    for (let x = 0; x < row.length; x++) {
      const color = result.colorMap?.[String(row[x])];
      if (color) {
        rects.push(
          <Rect
            key={y + "-" + x}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize}
            height={cellSize}
            fill={color.hex}
          />
        );
      }
    }
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={svgWidth} height={svgHeight}>
        {rects}
      </Svg>

      <Text style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
        {result.width} x {result.height}  |  {result.totalBeads}颗珠子  |  {result.colorCount}色
      </Text>

      {showLegend && result.legend && (
        <View style={{ marginTop: 16, width: "100%", maxWidth: 320 }}>
          <Text style={{ fontWeight: "600", fontSize: 15, marginBottom: 8, color: "#333" }}>
            色号图例
          </Text>
          {result.legend.map((item, i) => (
            <View
              key={item.id || i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: item.hex,
                  marginRight: 10,
                  borderWidth: item.hex === "#FFFFFF" ? 1 : 0,
                  borderColor: "#ddd",
                }}
              />
              <Text style={{ flex: 1, fontSize: 13, color: "#333" }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: "#999" }}>{item.count}颗</Text>
              <Text style={{ fontSize: 10, color: "#ccc", marginLeft: 6, width: 32, textAlign: "right" }}>
                {item.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
