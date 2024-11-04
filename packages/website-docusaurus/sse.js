const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// 存储所有活跃的 SSE 连接
const clients = new Map();
let messageCount = 0;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Cache-Control', 'Connection', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400
}));

app.options('*', cors());

// POST /events 使用原始请求处理
app.post('/events', async (req, res) => {
  // 1. 立即设置必要的头部
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // 2. 读取和解析请求体
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  
  // 3. 解析配置
  let config;
  try {
    config = body ? JSON.parse(body) : {};
  } catch (e) {
    config = {};
  }
  
  const channel = config.channel || 'default';
  const interval = parseInt(config.interval) || 3000;
  
  // 4. 禁用请求超时
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  
  // 5. 开始发送数据
  console.log(`New client connected to channel: ${channel}`);
  
  // 6. 将连接添加到对应频道的客户端集合
  if (!clients.has(channel)) {
    clients.set(channel, new Set());
  }
  clients.get(channel).add(res);
  
  const totalClients = Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0);
  console.log(`Client connected to channel ${channel}. Total clients: ${totalClients}`);
  
  // 7. 发送连接成功消息
  const sendEvent = (data, eventType = null) => {
    if (eventType) {
      res.write(`event: ${eventType}\n`);
    }
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // 8. 发送初始消息
  try {
    sendEvent({ 
      message: 'Connected to SSE stream',
      channel: channel,
      time: new Date().toISOString() 
    }, 'connected');
    
    // 9. 设置定期消息发送
    let messageCounter = 0;
    const intervalId = setInterval(() => {
      messageCounter++;
      messageCount++;
      
      try {
        sendEvent({
          id: messageCount,
          count: messageCounter,
          channel: channel,
          time: new Date().toISOString(),
          message: `Channel ${channel} message ${messageCounter}`
        });
      } catch (error) {
        console.error(`Error sending message to channel ${channel}:`, error);
        cleanup();
      }
    }, interval);
    
    // 10. 设置心跳
    const heartbeatId = setInterval(() => {
      try {
        res.write(':\n\n');
      } catch (error) {
        console.error(`Heartbeat error on channel ${channel}:`, error);
        cleanup();
      }
    }, 15000);
    
    // 11. 清理函数
    const cleanup = () => {
      clearInterval(intervalId);
      clearInterval(heartbeatId);
      
      const channelClients = clients.get(channel);
      if (channelClients) {
        channelClients.delete(res);
        if (channelClients.size === 0) {
          clients.delete(channel);
        }
      }
      
      const remainingClients = Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0);
      console.log(`Client disconnected from channel ${channel}. Total clients: ${remainingClients}`);
      
      try {
        res.end();
      } catch (error) {
        console.error('Error ending response:', error);
      }
    };
    
    // 12. 设置连接关闭处理
    req.on('close', cleanup);
    req.on('end', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
    
  } catch (error) {
    console.error(`Error in SSE connection for channel ${channel}:`, error);
    res.end();
  }
});

// GET SSE 端点处理函数
function handleGETConnection(req, res, channel = 'default', interval = 3000) {
  // 设置 SSE 头部
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true'
  });

  console.log(`New client connected to channel: ${channel}`);

  // 发送连接成功消息
  const sendEvent = (data, eventType = null) => {
    if (eventType) {
      res.write(`event: ${eventType}\n`);
    }
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 发送初始连接消息
  sendEvent({ 
    message: 'Connected to SSE stream',
    channel: channel,
    time: new Date().toISOString() 
  }, 'connected');

  // 将连接添加到对应频道的客户端集合
  if (!clients.has(channel)) {
    clients.set(channel, new Set());
  }
  clients.get(channel).add(res);
  
  const totalClients = Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0);
  console.log(`Client connected to channel ${channel}. Total clients: ${totalClients}`);

  // 定期发送消息
  let messageCounter = 0;
  const intervalId = setInterval(() => {
    messageCounter++;
    messageCount++;
    sendEvent({
      id: messageCount,
      count: messageCounter,
      channel: channel,
      time: new Date().toISOString(),
      message: `Channel ${channel} message ${messageCounter}`
    });
  }, interval);

  // 心跳检测
  const heartbeatId = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  // 清理函数
  const cleanup = () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    const channelClients = clients.get(channel);
    if (channelClients) {
      channelClients.delete(res);
      if (channelClients.size === 0) {
        clients.delete(channel);
      }
    }
    const remainingClients = Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0);
    console.log(`Client disconnected from channel ${channel}. Total clients: ${remainingClients}`);
    try {
      res.end();
    } catch (error) {
      console.error('Error ending response:', error);
    }
  };

  // 监听连接关闭
  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

// GET SSE 端点
app.get('/events', (req, res) => {
  const channel = req.query.channel || 'default';
  const interval = parseInt(req.query.interval) || 3000;
  handleGETConnection(req, res, channel, interval);
});

// 广播消息端点
app.post('/broadcast', bodyParser.json(), (req, res) => {
  const { message, channel, eventType = 'broadcast' } = req.body;
  
  let targetClients = new Set();
  if (channel) {
    targetClients = clients.get(channel) || new Set();
    console.log(`Broadcasting message to channel ${channel} (${targetClients.size} clients):`, message);
  } else {
    targetClients = new Set(
      Array.from(clients.values())
        .flatMap(channelClients => Array.from(channelClients))
    );
    console.log(`Broadcasting message to all channels (${targetClients.size} clients):`, message);
  }
  
  let successCount = 0;
  for (const client of targetClients) {
    try {
      client.write(`event: ${eventType}\n`);
      client.write(`id: ${Date.now()}\n`);
      client.write(`data: ${JSON.stringify({ 
        message,
        channel: channel || 'all',
        time: new Date().toISOString()
      })}\n\n`);
      successCount++;
    } catch (error) {
      console.error('Error broadcasting to client:', error);
    }
  }

  res.json({ 
    success: true, 
    clientCount: targetClients.size,
    successfulBroadcasts: successCount,
    channel: channel || 'all',
    message: 'Broadcast sent successfully' 
  });
});

// 状态端点
app.get('/status', (req, res) => {
  const channelStats = {};
  clients.forEach((clientSet, channel) => {
    channelStats[channel] = clientSet.size;
  });

  res.json({
    activeConnections: Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0),
    channelStats,
    messageCount,
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`SSE Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET  /events?channel={channel}&interval={interval} - SSE stream`);
  console.log(`- POST /events - SSE stream with body params`);
  console.log(`- POST /broadcast - Broadcast message to all clients or specific channel`);
  console.log(`- GET  /status - Server status`);
});