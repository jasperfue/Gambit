const redisClient = require('../src/redis.js');

module.exports.authorizeUser = (socket, next) => {
    if(!socket.request.session) {
        console.log('No session');
        next(new Error('No session'));
    } else if (!socket.request.session.user){
        console.log('user not logged In');
        next();
    } else {
        initializeUser(socket);
        next();
    }
}

const initializeUser = async socket => {
    socket.user = { ...socket.request.session.user };
    socket.join(socket.user.userid);
    await redisClient.hset(
        `userid:${socket.user.username}`,
        "userid",
        socket.user.userid,
        "connected",
        true
    );

    const friendList = await redisClient.lrange(
        `friends:${socket.user.username}`,
        0,
        -1
    );
    const parsedFriendList = await parseFriendList(friendList);
    const friendRooms = parsedFriendList.map(friend => friend.userid);
    if (friendRooms.length > 0) {
        socket.to(friendRooms).emit("connected", "true", socket.user.username);
    }
    socket.emit("friends", parsedFriendList);

    const sentFriendRequests = await redisClient.lrange(
        `friend_requests:${socket.user.username}`,
        0,
        -1
    );
    const usernameFriendRequest = (request) => {
        const requestSplitted = request.split('.');
        return requestSplitted[0];
    }
    socket.emit('friend_requests', sentFriendRequests.map(usernameFriendRequest));
};
const friendRequestIsValid = async (socket, requestName, cb) => {
    if(requestName === socket.user.username) {
        cb({done:false, errorMsg: "You can not add yourself as a Friend"});
        return false;
    }
    const friend = await redisClient.hgetall(`userid:${requestName}`);
    if(!Object.keys(friend).length) {
        cb({done:false, errorMsg: "User doesn't exist"});
        return false;
    }
    const currentFriendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
    if(!!Object.keys(currentFriendList).length && currentFriendList.indexOf([requestName, friend.userid].join('.')) !== -1) {
        cb({done:false, errorMsg: "You are already friends with that user"});
        return false;
    }
    return friend;
}
module.exports.initializeGame = async (roomId, firstPlayer, secondPlayer, firstPlayerIsWhite, time) => {
    console.log("initialized");
    await redisClient.hset(
        `game:${roomId}`,
        "firstPlayer",
        firstPlayer,
        "secoundPlayer",
        secondPlayer,
        "fistPlayerIsWhite",
        firstPlayerIsWhite,
        "time",
        time
    );
}

module.exports.getGame = async (socket, roomId, cb) => {
    const game = await redisClient.hgetall(`game:${roomId}`);
    if(!!Object.keys(game).length) {
        cb({done: false, errMsg: "This Game doesn't exist"});
    } else {
        cb({done: true, data: game});
    }
}

module.exports.requestFriend = async (socket, requestName, cb) => {
    const requestedFriend = await friendRequestIsValid(socket, requestName, cb);
    const currentFriendRequests = await redisClient.lrange(`friend_requests:${requestName}`, 0, -1);
    if(!!Object.keys(currentFriendRequests).length && currentFriendRequests.indexOf([socket.user.username, socket.user.userid].join('.')) !== -1) {
        cb({done:false, errorMsg: "You've already sent a friend request to this user"});
        return;
    }
    if(requestedFriend) {
        await redisClient.lpush(`friend_requests:${requestName}`, [socket.user.username, socket.user.userid].join("."));
        cb({done: true});
        socket.to(requestedFriend.userid).emit('friend_request', socket.user.username);
        return;
    }
}

module.exports.addFriend = async (socket, friendName, cb) => {
    const friend = await friendRequestIsValid(socket, friendName, cb);
    if(friend) {
        await redisClient.lrem(`friend_requests:${socket.user.username}`, 1, friendName + "." + friend.userid, (err, reply) => {
            if(err) {
                console.log(err);
            } else {
                console.log("Wert erfolgreich entfernt", reply);
            }
        });
        await redisClient.lpush(`friends:${socket.user.username}`, [friendName, friend.userid].join("."));
        await redisClient.lpush(`friends:${friendName}`, [socket.user.username, socket.user.userid].join('.'))
        const newFriend = {
            username: friendName,
            userid: friend.userid,
            connected: friend.connected
        };
        const oldFriend= {
            username: socket.user.username,
            userid: socket.user.userid,
            connected: 'true'
        }
        cb({done: true, newFriend});
        socket.to(friend.userid).emit('friend_request_accepted', oldFriend);
    }
}

module.exports.declineFriend = async (socket, name, cb) => {
    const friend = await redisClient.hgetall(`userid:${name}`);
    if(friend) {
        await redisClient.lrem(`friend_requests:${socket.user.username}`, 1, name + "." + friend.userid, (err, reply) => {
            if(err) {
                cb({done: false, errMsg: "Friend request could not be found"});
            } else {
                cb({done: true});
            }
        });
    } else {
        cb({done: false, errMsg: "User could not be found"});
    }
}


module.exports.onDisconnect = async(socket) => {
    await redisClient.hset(
        `userid:${socket.user.username}`,
        "connected",
        false
    );
    const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
    const friendRooms = await parseFriendList(friendList).then(friends =>
        friends.map(friend => friend.userid)
    );
    socket.to(friendRooms).emit('connected', "false", socket.user.username);
}

    module.exports.logout = (socket) => {
    if(socket.user) {
        delete socket['user'];
    }
    if(socket.request.session.user) {
        delete socket.request.session['user'];
        socket.request.session.save();
    }
    }

const parseFriendList = async(friendList) => {
    const newFriendList= [];
    for(let friend of friendList) {
        const parsedFriend = friend.split('.');
        const friendConnected = await redisClient.hget(`userid:${parsedFriend[0]}`, "connected");
        newFriendList.push({username: parsedFriend[0], userid: parsedFriend[1], connected: friendConnected});
    }
    return newFriendList;
}