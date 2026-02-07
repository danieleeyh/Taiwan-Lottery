export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 路由
    if (path === '/api/lotto') {
      return handleLotto(env);
    } else if (path === '/api/powerball') {
      return handlePowerball(env);
    } else if (path === '/api/stats') {
      return handleStats(env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleLotto(env) {
  try {
    // 从 GitHub 获取所有大樂透 CSV
    const years = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
    const files = [
      '2007/大樂透_2007.csv', '2008/大樂透_2008.csv', '2009/大樂透_2009.csv',
      '2010/大樂透_2010.csv', '2011/大樂透_2011.csv', '2012/大樂透_2012.csv',
      '2013/大樂透_2013.csv', '2014/大樂透_2014.csv', '2015/大樂透_2015.csv',
      '2016/大樂透_2016.csv', '2017/大樂透_2017.csv',
      '2018/大樂透_201801_201812.csv', '2019/大樂透_2019.csv',
      '2020/大樂透_202001_202012.csv', '2021/大樂透_2021.csv',
      '2022/大樂透_2022.csv', '2023/大樂透_2023.csv', '2024/大樂透_2024.csv',
      '2025/大樂透_2025.csv', '2026/大樂透_2026.csv'
    ];
    
    const baseUrl = 'https://raw.githubusercontent.com/danieleeyh/Taiwan-Lottery/main/';
    const allData = [];
    
    for (const file of files) {
      try {
        const res = await fetch(baseUrl + file);
        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n').slice(1);
          for (const line of lines) {
            if (line.trim()) {
              const cols = line.split(',');
              if (cols.length >= 8) {
                allData.push({
                  period: cols[1],
                  date: cols[2],
                  nums: cols.slice(7, 13).map(n => parseInt(n.trim()))
                });
              }
            }
          }
        }
      } catch (e) { continue; }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      count: allData.length,
      data: allData 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePowerball(env) {
  try {
    const files = [
      '2008/威力彩_2008.csv', '2009/威力彩_2009.csv', '2010/威力彩_2010.csv',
      '2011/威力彩_2011.csv', '2012/威力彩_2012.csv', '2013/威力彩_2013.csv',
      '2014/威力彩_2014.csv', '2015/威力彩_2015.csv', '2016/威力彩_2016.csv',
      '2017/威力彩_2017.csv', '2018/威力彩_201801_201812.csv', '2019/威力彩_2019.csv',
      '2020/威力彩_202001_202012.csv', '2021/威力彩_2021.csv',
      '2022/威力彩_2022.csv', '2023/威力彩_2023.csv', '2024/威力彩_2024.csv',
      '2025/威力彩_2025.csv', '2026/威力彩_2026.csv'
    ];
    
    const baseUrl = 'https://raw.githubusercontent.com/danieleeyh/Taiwan-Lottery/main/';
    const allData = [];
    
    for (const file of files) {
      try {
        const res = await fetch(baseUrl + file);
        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n').slice(1);
          for (const line of lines) {
            if (line.trim()) {
              const cols = line.split(',');
              if (cols.length >= 8) {
                allData.push({
                  period: cols[1],
                  date: cols[2],
                  nums: cols.slice(7, 13).map(n => parseInt(n.trim())),
                  zone2: cols[13] ? parseInt(cols[13].trim()) : null
                });
              }
            }
          }
        }
      } catch (e) { continue; }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      count: allData.length,
      data: allData 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStats(env) {
  return new Response(JSON.stringify({
    lotto: { total: 2091, years: '2007-2026' },
    powerball: { total: 1747, years: '2008-2026' }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
