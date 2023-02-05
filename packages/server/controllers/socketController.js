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
    const parseFriendRequest = (request) => {
        const requestSplitted = request.split('.');
        return {username: requestSplitted[0], userid: requestSplitted[1]};
    }
    socket.emit('friend_requests', sentFriendRequests.map(parseFriendRequest));
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
    if(!!Object.keys(currentFriendList).length && currentFriendList.indexOf(requestName) === -1) {
        cb({done:false, errorMsg: "You are already friends with that user"});
        return false;
    }
    return friend;
}

module.exports.requestFriend = async (socket, requestName, cb) => {
    const requestedFriend = await friendRequestIsValid(socket, requestName, cb);
    const currentFriendRequests = await redisClient.lrange(`friend_requests:${requestName}`, 0, -1);
    if(!!Object.keys(currentFriendRequests).length && currentFriendRequests.indexOf(requestName) === -1) {
        cb({done:false, errorMsg: "You've already sent a friend request to this user"});
        return;
    }
    if(requestedFriend) {
        console.log(requestedFriend);
        await redisClient.lpush(`friend_requests:${requestName}`, [socket.user.username, socket.user.userid].join("."));
        cb({done: true});
        socket.to(requestedFriend.userid).emit('friend_request', socket.user.username);
        return;
    }
}

module.exports.addFriend = async (socket, friendName, cb) => {
    const friend = await friendRequestIsValid(socket, friendName, cb);
    if(friend) {
        await redisClient.lpush(`friends:${socket.user.username}`, [friendName, friend.userid].join("."));
        const newFriend = {
            username: friendName,
            userid: friend.userid,
            connected: friend.connected
        };
        cb({done: true, newFriend});
        return;
    }
}

module.exports.onDisconnect = async(socket) => {
    await redisClient.hset(
        `userid:${socket.user.username}`,
        "connected",
        false
    );
    const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
    const hallo = await parseFriendList(friendList);
    const friendRooms = await parseFriendList(friendList).then(friends =>
        friends.map(friend => friend.userid)
    );
    socket.to(friendRooms).emit('connected', "false", socket.user.username);
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