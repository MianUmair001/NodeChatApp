
const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const port=process.env.PORT|3000
const Filter=require('bad-words')
const app=express()
const server=http.createServer(app)
const io=socketio(server)
const {generateMessages,generateLocation}=require('./utils/messages')
const publicDirectoryPath=path.join(__dirname,'../public')
const {addUser,getUser,getusersInRoom,removeUser}=require('./utils/users')

app.use(express.static(publicDirectoryPath))

// let count=0
io.on('connection',(socket)=>{
    console.log('New WebSocket Connection')
    socket.on('join',(options,callback)=>{
        const {error,user}=addUser({id:socket.id, ...options})
        if(error){  
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessages('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessages('Admin',`${user.username} has join`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getusersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessages(user.username,message))
        callback() 
    })
    socket.on('disconnect', ()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessages('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getusersInRoom(user.room)
            })    
        }
    })
    socket.on('sendLocation',(data,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${data.latitude},${data.longitude}`))
        callback()
    })

})



server.listen(port,()=>{
    console.log(`server is up on port ${port}!`)
})


