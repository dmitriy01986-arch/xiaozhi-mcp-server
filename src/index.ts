import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Создаем MCP сервер
const server = new McpServer({
  name: 'Yandex Music MCP Server',
  version: '1.0.0',
});

// Регистрируем инструмент для поиска музыки
server.tool(
  'search_yandex_music',
  'Search for a track on Yandex Music by query',
  {
    query: z.string().describe('Search query (track name or artist)'),
  },
  async ({ query }) => {
    const YANDEX_TOKEN = 'ваш_токен_яндекса'; // Замените на ваш токен
    
    try {
      const response = await fetch(
        `https://api.music.yandex.net/search?type=track&text=${encodeURIComponent(query)}`,
        {
          headers: { 'Authorization': `OAuth ${YANDEX_TOKEN}` }
        }
      );
      
      const data = await response.json();
      
      if (data.result?.tracks?.results?.length > 0) {
        const track = data.result.tracks.results[0];
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              title: track.title,
              artist: track.artists[0]?.name
            })
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Ничего не найдено' })
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message })
        }]
      };
    }
  }
);

// Создаем транспорт для Streamable HTTP
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

// Эндпоинт для MCP (поддерживает GET и POST)
app.use('/mcp/sse', async (req, res) => {
  await transport.handleRequest(req, res, server);
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp/sse`);
});
