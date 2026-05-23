import express from 'express';
import cors from 'cors';
import { Server as SSEServer } from '@modelcontextprotocol/sdk/server/sse.js';
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
const mcpServer = new McpServer({
  name: 'Yandex Music MCP Server',
  version: '1.0.0',
});

// Регистрируем инструмент для поиска музыки
mcpServer.tool(
  'search_yandex_music',
  'Search for a track on Yandex Music by query',
  {
    query: z.string().describe('Search query (track name or artist)'),
  },
  async ({ query }) => {
    // ВАШ ТОКЕН ЯНДЕКСА
    const YANDEX_TOKEN = 'ваш_токен_яндекса';
    
    try {
      const response = await fetch(
        `https://api.music.yandex.net/search?type=track&text=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `OAuth ${YANDEX_TOKEN}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.result?.tracks?.results?.length > 0) {
        const track = data.result.tracks.results[0];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                title: track.title,
                artist: track.artists[0]?.name,
                trackId: track.id
              })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, message: 'Ничего не найдено' })
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message })
          }
        ]
      };
    }
  }
);

// Создаем SSE сервер
const sseServer = new SSEServer(mcpServer);

// Эндпоинт для SSE подключений
app.get('/mcp/sse', (req, res) => {
  sseServer.handleRequest(req, res);
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SSE endpoint: http://localhost:${PORT}/mcp/sse`);
});
