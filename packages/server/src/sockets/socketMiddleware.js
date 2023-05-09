const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const {parseFriendList} = require("../redis/redisController.js");
const {getActiveGamesData} = require("../redis/redisController.js");
const {getFriendRequests} = require("../redis/redisController.js");
const {getFriends} = require("../redis/redisController.js");
const {setUser} = require("../redis/redisController.js");

/**
 * Middleware that authorizes the socket connection user based on the JWT in the cookie.
 * If the user is successfully authorized, their profile is added to the socket object.
 *
 * @param socket - The socket object representing the connection to the client.
 * @param next - The next middleware function to be called if authorization is successful.
 */
module.exports.authorizeUser = (socket, next) => {
    let token = null;
    if (socket.request.headers.cookie) {
        token = cookie.parse(socket.request.headers.cookie).jwt;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
                if (err) {
                    next(new Error('Unable to Read Token'));
                    return;
                }
                socket.user = {...decodedPayload};
            });
        }
    }
    next();
}
/**
 * Middleware that initializes the user data when they connect to the socket server.
 * The function retrieves the user's friends, friend requests, and active games data,
 * and sends them to the client. It also emits a 'connected' event to the user's friends.
 *
 * @param socket - The socket object representing the connection to the client.
 * @param next - The next middleware function to be called.
 * @returns {Promise<void>}
 */
module.exports.initializeUser = async (socket, next) => {
    if (socket.user) {
        socket.join(socket.user.userid);
        await setUser(socket.user.username, socket.user.userid, true);
        getFriends(socket.user.username).then(async friends => {
            const friendRooms = friends.map(friend => friend.userid);
            if (friendRooms.length > 0) {
                socket.to(friendRooms).emit("connected", "true", socket.user.username);
            }
        });
    }
    next();
};
/**
 * Function that handles user disconnection from the socket server.
 * The function updates the user's online status and informs all friends,
 * that the user ist offline
 *
 * @param socket - The socket object representing the connection to the client.
 * @returns {Promise<void>}
 */
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