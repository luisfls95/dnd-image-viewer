const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Copy the config.json file to the root of the server folder
// Copy the node_modules folder to the root of the server folder
/*const srcPath = path.join(__dirname, 'node_modules');
const destPath = path.join(process.cwd(), 'node_modules');

fs.copy(srcPath, destPath, (err) => {
  if (err) {
    console.error('Error copying node_modules:', err);
  } else {
    console.log('node_modules copied successfully');
  }
});
*/


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');


const readline = require('readline');


// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function waitForKeyPress() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('Press any key to exit...');
    rl.on('line', () => {
      rl.close();
      resolve();
    });
  });
}

// Get the local IP address
const interfaces = os.networkInterfaces();
let localIp = '127.0.0.1';

for (let interfaceName in interfaces) {
  for (let iface of interfaces[interfaceName]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIp = iface.address;
      break;
    }
  }
}

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure multer for file uploads, using a relative path
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Serve static files, using relative paths
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint for image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    io.emit('chat image', imageUrl); // Broadcast image URL to all clients
    res.status(200).send('Image uploaded successfully');
  } else {
    res.status(400).send('Image upload failed');
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Helper function to import the 'open' module
async function loadOpenModule() {
  try {
    const open = await import('open');
    return open.default;
  } catch (error) {
    console.error('Error loading open module:', error);
    return null;
  }
}

// Start the server and open the URL
(async () => {
  const open = await loadOpenModule();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, localIp, () => {
    const url = `http://${localIp}:${PORT}`;
    console.log(`Server is running on ${url}`);
    if (open) {
      open(url); // Open the URL in the default web browser
    }
  });
})().finally(async () => {
  await waitForKeyPress();
});