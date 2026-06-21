#!/bin/bash
# 停止所有服务
echo "🛑 停止拼豆图纸服务..."
kill $(cat /tmp/pindoudraw_server.pid 2>/dev/null) 2>/dev/null || true
kill $(cat /tmp/pindoudraw_expo.pid 2>/dev/null) 2>/dev/null || true
kill -9 $(lsof -t -i:9091) 2>/dev/null || true
kill -9 $(lsof -t -i:5000) 2>/dev/null || true
echo "  已停止"
rm -f /tmp/pindoudraw_server.pid /tmp/pindoudraw_expo.pid