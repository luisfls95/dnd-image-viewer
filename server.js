const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');


// Get the local IP address
const os = require('os');
const interfaces = os.networkInterfaces();
let localIp = '127.0.0.1';

for (let interfaceName in interfaces) {
    for (let interface of interfaces[interfaceName]) {
        if (interface.family === 'IPv4' && !interface.internal) {
            localIp = interface.address;
            break;
        }
    }
}

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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



import('open').then(openModule => {
    const open = openModule.default; // Access the 'open' function from the imported module

    // Your server setup code here...

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, localIp, () => {
        const url = `http://${localIp}:${PORT}`;
        console.log(`Server is running on ${url}`);
        open(url); // Open the URL in the default web browser
    });
}).catch(error => {
    console.error('Error loading open module:', error);
});