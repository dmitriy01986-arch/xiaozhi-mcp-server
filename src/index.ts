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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP SSE endpoint: http://localhost:${PORT}/mcp/sse`);
});