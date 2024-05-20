const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

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

const PORT = process.env.PORT || 3456;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});