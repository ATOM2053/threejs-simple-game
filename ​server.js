const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // อนุญาตให้เว็บไซต์เกมทุกที่เชื่อมต่อเข้ามาได้
    methods: ["GET", "POST"]
  }
});

// เก็บข้อมูลผู้เล่นทั้งหมดที่ออนไลน์อยู่
const players = {};

io.on('connection', (socket) => {
  console.log(`ผู้เล่นเชื่อมต่อเข้ามาแล้ว ID: ${socket.id}`);

  // สร้างข้อมูลผู้เล่นใหม่
  players[socket.id] = {
    x: 0,
    y: 0,
    z: 0,
    rotation: 0
  };

  // ส่งรายชื่อผู้เล่นที่มีอยู่เดิมให้คนใหม่รู้
  socket.emit('currentPlayers', players);

  // แจ้งให้ผู้เล่นคนอื่นรู้ว่ามีคนเข้ามาใหม่
  socket.broadcast.emit('newPlayer', {
    id: socket.id,
    player: players[socket.id]
  });

  // รับข้อมูลตำแหน่งเมื่อผู้เล่นขยับตัว
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotation = movementData.rotation;

      // กระจายตำแหน่งใหม่นี้ให้คนอื่นๆ ในห้องเห็น
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        player: players[socket.id]
      });
    }
  });

  // เมื่อผู้เล่นออกจากเกม
  socket.on('disconnect', () => {
    console.log(`ผู้เล่นออกจากเกม ID: ${socket.id}`);
    delete players[socket.id];
    // แจ้งให้คนอื่นลบตัวละครของผู้ที่ออกไป
    io.emit('disconnectPlayer', socket.id);
  });
});

// รันเซิร์ฟเวอร์ที่พอร์ต 3000 (หรือพอร์ตที่โฮสต์กำหนดให้)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์กำลังรันอยู่ที่พอร์ต ${PORT}`);
});

