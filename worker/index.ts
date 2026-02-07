export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    return serveHTML();
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const type = url.pathname.split('/')[2];

  if (type === 'lotto') {
    return fetchCSV('lotto');
  } else if (type === 'powerball') {
    return fetchCSV('powerball');
  } else if (type === 'stats') {
    return fetchStats();
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

async function fetchCSV(type) {
  const baseUrl = 'https://raw.githubusercontent.com/danieleeyh/Taiwan-Lottery/main/';
  const allData = [];
  const isLotto = type === 'lotto';
  
  const files = isLotto ? [
    '2007/大樂透_2007.csv', '2008/大樂透_2008.csv', '2009/大樂透_2009.csv',
    '2010/大樂透_2010.csv', '2011/大樂透_2011.csv', '2012/大樂透_2012.csv',
    '2013/大樂透_2013.csv', '2014/大樂透_2014.csv', '2015/大樂透_2015.csv',
    '2016/大樂透_2016.csv', '2017/大樂透_2017.csv',
    '2018/大樂透_201801_201812.csv', '2019/大樂透_2019.csv',
    '2020/大樂透_202001_202012.csv', '2021/大樂透_2021.csv',
    '2022/大樂透_2022.csv', '2023/大樂透_2023.csv', '2024/大樂透_2024.csv',
    '2025/大樂透_2025.csv', '2026/大樂透_2026.csv'
  ] : [
    '2008/威力彩_2008.csv', '2009/威力彩_2009.csv', '2010/威力彩_2010.csv',
    '2011/威力彩_2011.csv', '2012/威力彩_2012.csv', '2013/威力彩_2013.csv',
    '2014/威力彩_2014.csv', '2015/威力彩_2015.csv', '2016/威力彩_2016.csv',
    '2017/威力彩_2017.csv', '2018/威力彩_201801_201812.csv', '2019/威力彩_2019.csv',
    '2020/威力彩_202001_202012.csv', '2021/威力彩_2021.csv',
    '2022/威力彩_2022.csv', '2023/威力彩_2023.csv', '2024/威力彩_2024.csv',
    '2025/威力彩_2025.csv', '2026/威力彩_2026.csv'
  ];

  for (const file of files) {
    try {
      const res = await fetch(baseUrl + encodeURI(file));
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const cols = line.split(',');
            if (cols.length >= 8) {
              const nums = cols.slice(7, 13).map(n => parseInt(n.trim()));
              if (nums.every(n => !isNaN(n))) {
                allData.push({
                  period: cols[1],
                  date: cols[2],
                  nums: nums,
                  zone2: isLotto ? parseInt(cols[13]?.trim()) : (cols[13] ? parseInt(cols[13].trim()) : null)
                });
              }
            }
          }
        }
      }
    } catch (e) { continue; }
  }

  return new Response(JSON.stringify({ success: true, data: allData }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function fetchStats() {
  return new Response(JSON.stringify({
    lotto: { total: 2091, years: '2007-2026' },
    powerball: { total: 1747, years: '2008-2026' }
  }));
}

async function serveHTML() {
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>台灣彩券分析器</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: #fff; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 10px; font-size: 2rem; }
        .subtitle { text-align: center; color: #aaa; margin-bottom: 20px; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
        .tab { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; background: rgba(255,255,255,0.1); color: #fff; transition: all 0.3s; }
        .tab.active { background: #e94560; }
        .tab:hover { background: rgba(255,255,255,0.2); }
        .game-selector { display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
        .game-btn { padding: 10px 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: transparent; color: #fff; cursor: pointer; transition: all 0.3s; }
        .game-btn.active { border-color: #e94560; background: rgba(233,69,96,0.2); }
        .game-btn:hover { border-color: #e94560; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #e94560; }
        .stat-label { color: #aaa; font-size: 0.85rem; margin-top: 5px; }
        .section { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .section h2 { margin-bottom: 15px; color: #e94560; font-size: 1.3rem; }
        .filter-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; }
        .filter-btn { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; background: rgba(255,255,255,0.1); color: #fff; font-size: 0.9rem; }
        .filter-btn.active { background: #0f3460; border: 2px solid #e94560; }
        .number-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 15px 0; }
        .number-btn { width: 42px; height: 42px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
        .number-btn:hover { border-color: #e94560; transform: scale(1.1); }
        .number-btn.selected { background: #e94560; border-color: #e94560; box-shadow: 0 0 15px rgba(233, 69, 96, 0.5); }
        .lotto-grid .number-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; }
        .lotto-grid .number-btn.selected { background: #e94560; }
        .powerball-grid .number-btn { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; }
        .powerball-grid .number-btn.selected { background: #11998e; box-shadow: 0 0 15px rgba(17, 153, 142, 0.5); }
        .powerball2-grid .number-btn { width: 38px; height: 38px; font-size: 0.9rem; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border: none; }
        .powerball2-grid .number-btn.selected { background: #e94560; }
        .recommendation { background: rgba(233, 69, 96, 0.15); border: 2px solid #e94560; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .recommendation h3 { color: #e94560; margin: 0 0 15px 0; }
        .rec-nums { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .rec-num { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e94560; font-weight: bold; font-size: 1.2rem; }
        .your-picks { margin: 15px 0; }
        .your-picks h4 { color: #aaa; margin-bottom: 10px; }
        .picked-nums { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .picked-num { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.2); font-size: 0.9rem; }
        .action-btns { display: flex; gap: 10px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
        .btn-primary { background: #e94560; color: #fff; }
        .btn-primary:hover { background: #ff6b6b; transform: translateY(-2px); }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        .history { max-height: 300px; overflow-y: auto; }
        .history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .history-date { color: #aaa; font-size: 0.9rem; }
        .history-nums { display: flex; gap: 5px; }
        .history-nums2 { display: flex; gap: 5px; margin-left: 10px; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.2); }
        .chart-container { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .chart-wrapper { position: relative; height: 300px; margin: 20px 0; }
        .hot-cold { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .hot-list, .cold-list { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; }
        .hot-list h4 { color: #ff6b6b; margin-bottom: 10px; }
        .cold-list h4 { color: #4ecdc4; margin-bottom: 10px; }
        .search-box { display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap; justify-content: center; }
        .search-input { padding: 12px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.1); color: #fff; font-size: 1rem; width: 80px; text-align: center; }
        .search-input:focus { outline: none; border-color: #e94560; }
        .loading { text-align: center; padding: 60px; color: #aaa; font-size: 1.2rem; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #e94560; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .panel { display: none; }
        .panel.active { display: block; }
        .content-area { display: none; }
        .content-area.active { display: block; }
        .nav-menu { display: flex; gap: 5px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; }
        .nav-item { padding: 10px 20px; border-radius: 8px; cursor: pointer; color: #aaa; transition: all 0.3s; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-item.active { background: #e94560; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 台灣彩券分析器</h1>
        <p class="subtitle">大樂透、威力彩歷史開獎與AI智能選號</p>
        
        <div class="tabs">
            <button class="tab active" onclick="switchGame('lotto')">大樂透</button>
            <button class="tab" onclick="switchGame('powerball')">威力彩</button>
        </div>

        <div class="game-selector" id="game-selector">
            <button class="game-btn active" onclick="switchTab('recent')">📊 最近開獎</button>
            <button class="game-btn" onclick="switchTab('stats')">📈 統計分析</button>
            <button class="game-btn" onclick="switchTab('ai')">🤖 AI 智能選號</button>
            <button class="game-btn" onclick="switchTab('search')">🔍 搜尋組合</button>
        </div>

        <div id="loading" class="loading"><div class="spinner"></div>載入歷史數據中...</div>

        <div id="recent-panel" class="content-area">
            <div class="stats">
                <div class="stat-card"><div class="stat-value" id="total-count">-</div><div class="stat-label">總期數</div></div>
                <div class="stat-card"><div class="stat-value" id="latest-period">-</div><div class="stat-label">最新期數</div></div>
                <div class="stat-card"><div class="stat-value" id="hot-number">-</div><div class="stat-label">最常開出</div></div>
            </div>
            <div class="section"><h2>📅 歷史開獎紀錄</h2><div class="history" id="history-list"></div></div>
        </div>

        <div id="stats-panel" class="content-area">
            <div class="chart-container"><h2>📊 號碼開出頻率</h2><div class="chart-wrapper"><canvas id="freqChart"></canvas></div></div>
            <div class="hot-cold">
                <div class="hot-list"><h4>🔥 熱門號碼 (Top 10)</h4><div id="hot-nums"></div></div>
                <div class="cold-list"><h4>❄️ 冷門號碼 (Bottom 10)</h4><div id="cold-nums"></div></div>
            </div>
            <div class="section"><h2>📋 完整頻率表</h2><div class="number-grid" id="freq-grid"></div></div>
        </div>

        <div id="ai-panel" class="content-area">
            <div class="recommendation"><h3>🤖 AI 智能推薦</h3><p id="rec-count">載入中...</p><div class="rec-nums" id="ai-rec"></div>
                <div class="filter-btns" style="justify-content:center; margin-top:15px;">
                    <button class="filter-btn active" onclick="setStrategy('hot')">🔥 熱門</button>
                    <button class="filter-btn" onclick="setStrategy('cold')">❄️ 冷門</button>
                    <button class="filter-btn" onclick="setStrategy('random')">🎲 隨機</button>
                </div>
            </div>
            <div class="section"><h2>🎯 自選號碼 - 第一區</h2>
                <p style="color:#aaa; font-size:0.9rem; margin-bottom:15px;">點擊號碼進行選擇（最多6個）</p>
                <div class="number-grid" id="select-numbers"></div>
                <div class="your-picks"><h4>已選擇的號碼：</h4><div class="picked-nums" id="picked-display"></div></div>
                <div class="action-btns">
                    <button class="btn btn-secondary" onclick="clearPicks()">清除重選</button>
                    <button class="btn btn-primary" onclick="generateRecommendation()">✨ 重新推薦</button>
                </div>
            </div>
            <div class="section" id="powerball2-section" style="display:none;"><h2>🎯 自選號碼 - 第二區 (01-08)</h2><div class="number-grid powerball2-grid" id="powerball2-select"></div></div>
        </div>

        <div id="search-panel" class="content-area">
            <div class="section"><h2>🔍 搜尋號碼組合</h2>
                <p style="color:#aaa; margin-bottom:15px;">輸入 6 個號碼，查詢是否曾經開出過</p>
                <div class="search-box">
                    <input type="number" class="search-input" id="search1" min="1" max="49" placeholder="01">
                    <input type="number" class="search-input" id="search2" min="1" max="49" placeholder="02">
                    <input type="number" class="search-input" id="search3" min="1" max="49" placeholder="03">
                    <input type="number" class="search-input" id="search4" min="1" max="49" placeholder="04">
                    <input type="number" class="search-input" id="search5" min="1" max="49" placeholder="05">
                    <input type="number" class="search-input" id="search6" min="1" max="49" placeholder="06">
                </div>
                <div class="action-btns">
                    <button class="btn btn-primary" onclick="searchCombination()">🔍 搜尋</button>
                    <button class="btn btn-secondary" onclick="randomSearch()">🎲 隨機輸入</button>
                </div>
                <div id="search-result" style="margin-top:20px; padding:20px; border-radius:10px; display:none;"></div>
            </div>
        </div>
    </div>

    <script>
        let lottoData = [], powerballData = [];
        let currentGame = 'lotto', currentTab = 'recent';
        let pickedNumbers = new Set(), pickedPowerball2 = new Set();
        let currentStrategy = 'hot', freqChart = null;
        const API_URL = '';

        async function loadData() {
            try {
                const lottoRes = await fetch(API_URL + '/api/lotto');
                const lottoJson = await lottoRes.json();
                if (lottoJson.success) lottoData = lottoJson.data;
                const powerballRes = await fetch(API_URL + '/api/powerball');
                const powerballJson = await powerballRes.json();
                if (powerballJson.success) powerballData = powerballJson.data;
                document.getElementById('loading').style.display = 'none';
                document.getElementById('recent-panel').classList.add('active');
                initUI(); updateStats(); renderHistory(); generateRecommendation();
            } catch (e) {
                document.getElementById('loading').innerHTML = '載入失敗，請重新整理頁面<br><small>' + e.message + '</small>';
            }
        }

        function calculateFreq(data) {
            const freq = {};
            data.forEach(item => { item.nums.forEach(n => { freq[n] = (freq[n] || 0) + 1; }); });
            return freq;
        }

        function initUI() {
            const maxNum = currentGame === 'lotto' ? 49 : 38;
            const grid = document.getElementById('select-numbers');
            grid.innerHTML = ''; grid.className = 'number-grid ' + (currentGame === 'lotto' ? 'lotto-grid' : 'powerball-grid');
            for (let i = 1; i <= maxNum; i++) {
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = i.toString().padStart(2,'0');
                btn.onclick = () => { if (pickedNumbers.has(i)) pickedNumbers.delete(i); else if (pickedNumbers.size < 6) pickedNumbers.add(i); updatePickUI(); generateRecommendation(); };
                grid.appendChild(btn);
            }
            const pb2Grid = document.getElementById('powerball2-select');
            pb2Grid.innerHTML = '';
            for (let i = 1; i <= 8; i++) {
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = i.toString().padStart(2,'0');
                btn.onclick = () => { pickedPowerball2.clear(); pickedPowerball2.add(i); updatePickUI(); };
                pb2Grid.appendChild(btn);
            }
            document.getElementById('powerball2-section').style.display = currentGame === 'powerball' ? 'block' : 'none';
            for (let i = 1; i <= 6; i++) document.getElementById('search' + i).max = maxNum;
        }

        function switchGame(game) {
            currentGame = game; pickedNumbers.clear(); pickedPowerball2.clear(); currentTab = 'recent';
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.game-selector button:first-child').classList.add('active');
            initUI(); updateStats(); renderHistory(); generateRecommendation();
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            document.querySelectorAll('.content-area').forEach(p => p.classList.remove('active'));
            document.getElementById(tab + '-panel').classList.add('active');
            if (tab === 'stats') renderStats();
        }

        function updateStats() {
            const data = currentGame === 'lotto' ? lottoData : powerballData;
            const freq = calculateFreq(data);
            document.getElementById('total-count').textContent = data.length.toLocaleString();
            if (data.length > 0) document.getElementById('latest-period').textContent = data[0].period;
            const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
            document.getElementById('hot-number').textContent = sorted[0]?.[0] || '-';
            window.currentFreq = freq;
        }

        function renderHistory() {
            const data = (currentGame === 'lotto' ? lottoData : powerballData).slice(0, 30);
            document.getElementById('history-list').innerHTML = data.map(item => \`
                <div class="history-item">
                    <span class="history-date">\${item.date} (\${item.period})</span>
                    <div style="display:flex;align-items:center;">
                        <div class="history-nums">
                            \${item.nums.map(n => \`<span class="number-btn" style="width:32px;height:32px;font-size:0.8rem;background:linear-gradient(135deg, \${currentGame === 'lotto' ? '#667eea, #764ba2' : '#f093fb, #f5576c'});border:none;">\${n}</span>\`).join('')}
                        </div>
                        \${item.zone2 ? \`<div class="history-nums2"><span class="number-btn" style="width:28px;height:28px;font-size:0.7rem;background:linear-gradient(135deg, #11998e, #38ef7d);border:none;">\${item.zone2}</span></div>\` : ''}
                    </div>
                </div>
            \`).join('');
        }

        function renderStats() {
            const freq = window.currentFreq || {};
            const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
            document.getElementById('hot-nums').innerHTML = sorted.slice(0, 10).map(([n,c]) => \`<span style="display:inline-block;background:rgba(233,69,96,0.3);padding:5px 10px;border-radius:5px;margin:3px;">\${n} <span style="color:#e94560;">\${c}次</span></span>\`).join('');
            document.getElementById('cold-nums').innerHTML = sorted.slice(-10).reverse().map(([n,c]) => \`<span style="display:inline-block;background:rgba(78,205,196,0.3);padding:5px 10px;border-radius:5px;margin:3px;">\${n} <span style="color:#4ecdc4;">\${c}次</span></span>\`).join('');
            const grid = document.getElementById('freq-grid');
            grid.innerHTML = '';
            const maxNum = currentGame === 'lotto' ? 49 : 38;
            const maxCount = Math.max(...Object.values(freq));
            for (let i = 1; i <= maxNum; i++) {
                const count = freq[i] || 0;
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = i.toString().padStart(2,'0');
                btn.style.opacity = 0.3 + (count / maxCount) * 0.7;
                btn.style.background = \`rgba(233,6996,\${0.2 + (count / maxCount) * 0.8})\`;
                btn.title = \`開出 \${count} 次\`;
                grid.appendChild(btn);
            }
            const ctx = document.getElementById('freqChart').getContext('2d');
            if (freqChart) freqChart.destroy();
            freqChart = new Chart(ctx, { type: 'bar', data: { labels: sorted.map(([n]) => n), datasets: [{ label: '開出次數', data: sorted.map(([,c]) => c), backgroundColor: sorted.map(([,c], i) => { const max = sorted[0][1]; return c / max > 0.8 ? '#e94560' : c / max > 0.5 ? '#ff6b6b' : '#667eea'; }), borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }, x: { grid: { display: false }, ticks: { color: '#aaa', maxTicksLimit: 20 } } } } });
        }

        function updatePickUI() {
            document.querySelectorAll('#select-numbers .number-btn').forEach((btn, idx) => { btn.classList.toggle('selected', pickedNumbers.has(idx + 1)); });
            document.querySelectorAll('#powerball2-select .number-btn').forEach((btn, idx) => { btn.classList.toggle('selected', pickedPowerball2.has(idx + 1)); });
            document.getElementById('picked-display').innerHTML = [...pickedNumbers].sort((a,b) => a-b).map(n => \`<span class="picked-num">\${n.toString().padStart(2,'0')}</span>\`).join('');
        }

        function generateRecommendation() {
            const data = currentGame === 'lotto' ? lottoData : powerballData;
            const freq = calculateFreq(data);
            let pool = Object.entries(freq).sort((a,b) => { if (currentStrategy === 'hot') return b[1] - a[1]; if (currentStrategy === 'cold') return a[1] - b[1]; return Math.random() - 0.5; }).map(([n]) => parseInt(n)).filter(n => !pickedNumbers.has(n));
            if (currentStrategy === 'random') pool = pool.slice(0, 30).sort(() => Math.random() - 0.5);
            const need = 6 - pickedNumbers.size;
            const selected = pool.slice(0, need).sort((a,b) => a-b);
            const final = [...pickedNumbers, ...selected].sort((a,b) => a-b);
            document.getElementById('ai-rec').innerHTML = final.map(n => \`<span class="rec-num" style="\${pickedNumbers.has(n) ? 'background:rgba(255,255,255,0.3);' : ''}">\${n.toString().padStart(2,'0')}</span>\`).join('') + (currentGame === 'powerball' ? \`<span style="margin:0 10px;color:#38ef7d;font-size:1.8rem;font-weight:bold;">+</span>\` + \`<span class="rec-num" style="background:#38ef7d;">\${pickedPowerball2.size ? [...pickedPowerball2][0].toString().padStart(2,'0') : Math.floor(Math.random()*8)+1}</span>\` : '');
            document.getElementById('rec-count').textContent = pickedNumbers.size > 0 ? \`已選 \${pickedNumbers.size} 個，AI 推薦 \${need} 個\` : '點擊號碼進行選擇，或使用 AI 推薦';
        }

        function setStrategy(strategy) {
            currentStrategy = strategy;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            generateRecommendation();
        }

        function clearPicks() { pickedNumbers.clear(); pickedPowerball2.clear(); updatePickUI(); generateRecommendation(); }

        function randomSearch() {
            const nums = new Set();
            const maxNum = currentGame === 'lotto' ? 49 : 38;
            while (nums.size < 6) nums.add(Math.floor(Math.random() * maxNum) + 1);
            const sorted = [...nums].sort((a,b) => a-b);
            for (let i = 1; i <= 6; i++) document.getElementById('search' + i).value = sorted[i-1];
        }

        function searchCombination() {
            const nums = [];
            for (let i = 1; i <= 6; i++) nums.push(parseInt(document.getElementById('search' + i).value));
            if (nums.some(isNaN)) { alert('請輸入完整6個號碼'); return; }
            const sorted = nums.sort((a,b) => a-b);
            const data = currentGame === 'lotto' ? lottoData : powerballData;
            const found = data.find(item => { const s = [...item.nums].sort((a,b) => a-b); return s.length === 6 && s.every((n, i) => n === sorted[i]); });
            const result = document.getElementById('search-result');
            result.style.display = 'block';
            result.style.background = found ? 'rgba(78, 205, 196, 0.2)' : 'rgba(233, 69, 96, 0.2)';
            result.innerHTML = found ? \`<h3 style="color:#4ecdc4;">✅ 找到匹配的期數！</h3><p style="margin-top:10px;">\${found.date} <strong>\${found.period}期</strong></p><p style="color:#aaa;margin-top:5px;">號碼：\${found.nums.join(', ')}</p>\` : \`<h3 style="color:#e94560;">❌ 沒有找到匹配的期數</h3><p style="margin-top:10px;">這組號碼在歷史記錄中從未開出過</p><p style="color:#aaa;margin-top:5px;">\${currentGame === 'lotto' ? '大樂透' : '威力彩'}歷史共 \${data.length} 期</p>\`;
        }

        loadData();
    </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
