const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');

const app = express();
const server = app.listen(3000);
const io = socketIo(server);
const redisClient = redis.createClient();

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hallo Welt2');
})

app.get('/chats/:id', (req, res) => {
    redisClient.lrange(`chat.${req.params.id}`, 0, -1, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error')
        } else {
            res.send(data)
        }
    })
})

app.post('/chats/:id', (req, res) => {
    console.log(req.body.message);
    redisClient.rpush(`chat.${req.params.id}`, req.body.message, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error')
        } else {
            res.send('OK')
            if (chatSubscription[req.params.id] != null) {
                chatSubscription[req.params.id].forEach(client => {
                    client.emit('refresh', {
                        id: req.params.id
                    });
                });
            }
        }
    })
})

const chatSubscription = {};

io.on('connection', client => {
    client.on('join', data => {
        if (chatSubscription[data.id] == null) {
            chatSubscription[data.id] = [];
        }
        chatSubscription[data.id].push(client);
    })
})