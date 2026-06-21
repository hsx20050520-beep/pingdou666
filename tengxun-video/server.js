const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static('public'));

// 搜索腾讯视频
app.get('/api/search', async (req, res) => {
  const keyword = req.query.keyword;
  const page = req.query.page || 1;
  if (!keyword) return res.json({ code: -1, msg: '请输入搜索关键词' });

  try {
    // 腾讯视频搜索API
    const url = `https://pbaccess.video.qq.com/trpc.vector_search.page_service.PageSearch`;
    const response = await axios.post(url, {
      "page_context": { "page_index": page - 1, "page_size": 20 },
      "query_id": "search_video",
      "search_query": { "query": keyword, "content_ret_group_ids": ["short"] },
      "search_scene": "search_video",
      "search_params": { "from": "pc_video" }
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://v.qq.com',
        'Referer': 'https://v.qq.com/',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const data = response.data;
    if (!data || !data.data) {
      return res.json({ code: 0, list: [], total: 0 });
    }

    const results = [];
    const items = data.data.body || [];

    for (const item of items) {
      if (!item.item) continue;
      const info = item.item;

      // 提取视频ID
      let vid = '';
      let playUrl = '';
      if (info.video_info && info.video_info[0]) {
        vid = info.video_info[0].vid || '';
        playUrl = 'https://v.qq.com/x/cover/' + (info.video_info[0].cid || '') + '/' + vid + '.html';
      }

      // 提取清晰度（通过vid查询详情）
      let qualities = ['HD', 'SD'];
      let has4K = false;
      let has1080p = false;

      if (vid) {
        try {
          const detailUrl = `https://s.video.qq.com/get_playsource?id=${vid}&type=4&plat=2&range=1&otype=json`;
          const detailResp = await axios.get(detailUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://v.qq.com/',
            },
            timeout: 5000,
          });

          let detailData;
          if (typeof detailResp.data === 'string') {
            // 有时候返回JSONP格式
            const match = detailResp.data.match(/{.+}/);
            if (match) detailData = JSON.parse(match[0]);
          } else {
            detailData = detailResp.data;
          }

          if (detailData && detailData.Video && detailData.Video.Streams) {
            const streams = detailData.Video.Streams;
            qualities = streams.map(s => s.name || s.resolution || '');
            has4K = streams.some(s => (s.name && s.name.includes('4K')) || (s.resolution && s.resolution.includes('2160')));
            has1080p = streams.some(s => (s.name && s.name.includes('蓝光')) || (s.name && s.name.includes('1080')) || (s.resolution && s.resolution.includes('1080')));
          }
        } catch (e) {
          // 静默失败
        }
      }

      // 去重
      const title = info.title || info.name || '';
      if (!title) continue;

      const existing = results.find(r => r.title === title || (r.vid && r.vid === vid));
      if (existing) continue;

      results.push({
        id: info.cid || vid || Math.random().toString(36),
        title: title.replace(/<[^>]*>/g, ''),
        cover: info.poster_url || info.image_url || info.cover_url || '',
        desc: (info.desc || info.brief || '').substring(0, 200),
        score: info.score || info.mark || '',
        vid,
        playUrl,
        qualities: [...new Set(qualities)].filter(Boolean),
        has4K,
        has1080p,
        actors: info.actors || info.stars || '',
        director: info.director || '',
        category: info.category || info.type || (info.tags || []).join('、'),
        year: info.year || '',
      });
    }

    // 如果有vid的排前面（能查到清晰度）
    results.sort((a, b) => (b.has4K ? 2 : b.has1080p ? 1 : 0) - (a.has4K ? 2 : a.has1080p ? 1 : 0));

    res.json({
      code: 0,
      list: results,
      total: results.length,
      keyword,
    });

  } catch (error) {
    // 备用：用简单搜索
    fallbackSearch(keyword, page, res);
  }
});

// 备用搜索方案
async function fallbackSearch(keyword, page, res) {
  try {
    const url = `https://v.qq.com/x/search/?q=${encodeURIComponent(keyword)}&cur=${page}`;
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000,
    });

    // 尝试从HTML中提取JSON数据
    const html = resp.data;
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
    let results = [];

    if (jsonMatch) {
      try {
        const initData = JSON.parse(jsonMatch[1]);
        const searchData = initData.search || initData.SearchResult || initData;
        const list = searchData.list || searchData.results || searchData.data || [];
        list.forEach(item => {
          if (item.title || item.name) {
            results.push({
              id: item.id || item.cid || Math.random().toString(36),
              title: (item.title || item.name || '').replace(/<[^>]*>/g, ''),
              cover: item.cover || item.pic || item.image || '',
              desc: (item.desc || item.brief || '').substring(0, 200),
              score: item.score || '',
              vid: item.vid || '',
              playUrl: item.play_url || (item.vid ? `https://v.qq.com/x/cover/${item.cid}/${item.vid}.html` : ''),
              qualities: ['HD'],
              has4K: false,
              has1080p: false,
              actors: item.actors || '',
              director: item.director || '',
              category: item.category || item.type || '',
              year: item.year || '',
            });
          }
        });
      } catch (e) {}
    }

    res.json({ code: 0, list: results, total: results.length, keyword, fallback: true });

  } catch (e2) {
    res.json({ code: -1, msg: '搜索失败，请稍后重试' });
  }
}

const PORT = process.env.PORT || 3456;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 腾讯影视搜索工具已启动`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   局域网访问: http://${require('os').networkInterfaces()['eth0']?.[0]?.address || '你的IP'}:${PORT}`);
});
