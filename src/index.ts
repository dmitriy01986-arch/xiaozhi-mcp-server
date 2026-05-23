import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check для Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Главный MCP endpoint для XiaoZhi
app.get('/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Отправка приветственного события
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'MCP Server Ready' })}\n\n`);
});

// Пример MCP инструмента для поиска музыки
app.post('/mcp/tools/search', async (req, res) => {
  const { query } = req.body;
  
  // Здесь будет код для Яндекс Музыки после настройки
  // Пока возвращаем заглушку
  
  res.json({
    success: true,
    tool: "search_yandex_music",
    result: `Поиск: ${query}`,
    message: "Интеграция с Яндекс Музыкой готовится"
  });
});
// Эндпоинт для поиска музыки в Яндекс
app.post('/mcp/tools/search_yandex_music', async (req, res) => {
  const { query } = req.body;
  
  // Ваш OAuth токен Яндекс Музыки
  const YANDEX_TOKEN = 'y0__wgBEMm-8R8Y3vgGILO7xcsXpuQqXnDOKUYPn0HtK69BDbHxwmg';  // <-- ВСТАВЬТЕ СВОЙ ТОКЕН
  
  try {
    // Запрос к API Яндекс Музыки
    const response = await fetch(
      `https://api.music.yandex.net/search?type=track&text=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `OAuth ${YANDEX_TOKEN}`
        }
      }
    );
    
    const data = await response.json();
    
    // Проверяем, есть ли результаты
    if (data.result && data.result.tracks && data.result.tracks.results.length > 0) {
      const track = data.result.tracks.results[0];
      const trackId = track.id;
      const title = track.title;
      const artist = track.artists[0].name;
      
      // Получаем ссылку для воспроизведения
      const downloadResponse = await fetch(
        `https://api.music.yandex.net/tracks/${trackId}/download-info`,
        {
          headers: {
            'Authorization': `OAuth ${YANDEX_TOKEN}`
          }
        }
      );
      
      const downloadData = await downloadResponse.json();
      
      // Находим ссылку на mp3 (обычно с кодеком 'mp3')
      const mp3Info = downloadData.result.find(d => d.codec === 'mp3');
      
      res.json({
        success: true,
        track: {
          title: title,
          artist: artist,
          url: mp3Info ? mp3Info.downloadInfoUrl : null
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Ничего не найдено'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});
// Запуск сервера
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP SSE endpoint: http://localhost:${PORT}/mcp/sse`);
});
