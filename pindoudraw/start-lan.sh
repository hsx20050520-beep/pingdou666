#!/bin/bash
# 局域网启动脚本 - 使拼豆图纸在同一局域网下可用
# 用法: bash start-lan.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🦀 拼豆图纸大师 - 局域网启动"

# 获取 WSL2 IP
WSL2_IP=$(hostname -I | awk '{print $1}')
echo "  WSL2 IP: $WSL2_IP"

# 获取 Windows 主机 LAN IP
WIN_LAN_IP=$(/mnt/c/Windows/System32/ipconfig.exe 2>/dev/null | strings | grep -E "192\.168|10\.|172\.1[6-9]|172\.2[0-9]|172\.3[0-1]" | head -1 | awk '{print $NF}')
echo "  Windows LAN IP: $WIN_LAN_IP"

# ====== 后端服务 (端口 9091) ======
echo ""
echo "📦 启动后端服务..."
kill -9 $(lsof -t -i:9091) 2>/dev/null || true
sleep 1
cd "$ROOT_DIR/server"
nohup npx tsx ./src/index.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "  后端 PID: $SERVER_PID (端口 9091)"

# ====== 前端服务 (端口 5000) ======
echo ""
echo "🎨 启动前端服务..."
kill -9 $(lsof -t -i:5000) 2>/dev/null || true
sleep 1
cd "$ROOT_DIR/client"
# EXPO_PUBLIC_BACKEND_BASE_URL 留空 = 相对路径，自动跟随页面域名
nohup env EXPO_PUBLIC_BACKEND_BASE_URL="" npx expo start --web --clear --port 5000 > /tmp/expo.log 2>&1 &
EXPO_PID=$!
echo "  前端 PID: $EXPO_PID (端口 5000)"

# 等待服务启动
echo ""
echo "⏳ 等待服务就绪..."
sleep 6

# 检查后端
curl -s http://localhost:9091/api/v1/health > /dev/null 2>&1 && \
  echo "  ✅ 后端 OK (localhost:9091)" || \
  echo "  ❌ 后端启动失败 - 查看日志: cat /tmp/server.log"

# 检查前端
curl -s -o /dev/null -w "" http://localhost:5000/ > /dev/null 2>&1 && \
  echo "  ✅ 前端 OK (localhost:5000)" || \
  echo "  ❌ 前端启动失败 - 查看日志: cat /tmp/expo.log"

echo ""
echo "=========================================="
echo "  🌐 局域网访问地址:"
echo ""
echo "  本机:     http://localhost:5000"
echo "  局域网:   http://$WIN_LAN_IP:5000"
echo ""
echo "  ⚠️  注意: 如果局域网打不开，请在 Windows"
echo "     (以管理员身份) 运行一次:"
echo ""
echo "     netsh interface portproxy add v4tov4 \\"
echo "       listenaddress=0.0.0.0 listenport=5000 \\"
echo "       connectaddress=$WSL2_IP connectport=5000"
echo ""
echo "=========================================="

# 保存 PID 方便后续关闭
echo "$SERVER_PID" > /tmp/pindoudraw_server.pid
echo "$EXPO_PID" > /tmp/pindoudraw_expo.pid
