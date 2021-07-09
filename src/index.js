const express = require('express')
const socketio = require('socket.io')
// express cannot be co-existed with socket, need change of behavior
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users') 

// server (emit) -> client (receive) --acknowledgement--> server
// client (emit) -> server (receive) --acknowledgemetn--> client
// socket.emit -> send an event from server to a specifc client
// socket.broadcast.emit -> send to all clients except this newly created client

const app = express()
// pass the app into server
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New client joined!')

    // ... -> spread operator
    socket.on('join_chat', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        // send an event from server to a specifc client 
        socket.emit('message', generateMessage('Welcome to chat room!'))
        // send a template string to all clients except this newly created client (only in the room)
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`))

        io.to(user.room).emit('roomList', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // listen to 'sendMessage' event from client-side
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()
        if (filter.isProfane(message))
        {
            return callback('Profanity is not allowed')
        }
        // socket.emit('countUpdated', count) update to a specific connections
        // update to all connections
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback();
    })

    // parameter can be whatever name e.g. location
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        // emit a message event
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback('Location shared')
    })

    socket.on('disconnect', () => {
        const remove_user = removeUser(socket.id)

        if (remove_user) {
            // send to all connected client
            io.to(remove_user.room).emit('message', generateMessage(`${remove_user.username} has left`))
            io.to(remove_user.room).emit('roomList', {
                room: remove_user.room,
                users: getUsersInRoom(remove_user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})