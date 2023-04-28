const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const {parseFriendList} = require("../redis/redisController.js");
const {getActiveGamesData} = require("../redis/redisController.js");
const {getFriendRequests} = require("../redis/redisController.js");
const {getFriends} = require("../redis/redisController.js");
const {setUser} = require("../redis/redisController.js");

module.exports.authorizeUser = (socket, next) => {
    let token = null;
    console.log(socket.request.headers.cookie);
    if (socket.request.headers.cookie) {
        token = cookie.parse(socket.request.headers.cookie).jwt;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
                if (err) {
                    console.log("VERIFY ERROR: ", err);
                    next(new Error('No session'));
                    return;
                }
                socket.user = {...decodedPayload};
            });
        }
    }
    next();
}

module.exports.initializeUser = async (socket, next) => {
    if (!socket.user) {
        next();
        return;
    }
    socket.join(socket.user.userid);
    await setUser(socket.user.username, socket.user.userid, true);
    getFriends(socket.user.username).then(async friends => {
        const parsedFriends = await parseFriendList(friends);
        const friendRooms = parsedFriends.map(friend => friend.userid);
        if (friendRooms.length > 0) {
            socket.to(friendRooms).emit("connected", "true", socket.user.username);
        }
        socket.emit('friends', parsedFriends);
    });

    getFriendRequests(socket.user.username).then(friendRequests => socket.emit('friend_requests', friendRequests));

    getActiveGamesData(socket.user.username).then(gameData => socket.emit('active_games', gameData));

    next();
};

module.exports.onDisconnect = async (socket) => {
    if (!socket.user) {
        return;
    }
    await setUser(socket.user.username, socket.user.userid, false);
    getFriends(socket.user.username).then(friends => {
        const friendRooms = friends.map(friend => friend.userid);
        if (friendRooms.length > 0) {
            socket.to(friendRooms).emit("connected", "false", socket.user.username);
        }
    });
}