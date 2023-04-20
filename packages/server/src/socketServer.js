const {createChessGame} = require("./socketChessListeners.js");
const {getActiveGamesData} = require("../controllers/socketController.js");
const {getFriends} = require("../controllers/socketController.js");
const {getFriendRequests} = require("../controllers/socketController.js");
const {logout} = require("../controllers/socketController.js");
const {declineFriend} = require("../controllers/socketController.js");
const {requestFriend} = require("../controllers/socketController.js");
const {onDisconnect} = require("../controllers/socketController.js");
const {addFriend} = require("../controllers/socketController.js");


const initializeListeners = (client, io) => {
    client.on('getRooms', (cb) => cb(client.rooms));
    client.on('leaveRoom', (roomId) => {
        client.leave(roomId);
        console.log('CLIENT LEAVE ROOM');
    });
    client.on('disconnect', () => {
        if (client.user) {
            onDisconnect(client);
        }
    });
    client.on('logout', (cb) => {
        onDisconnect(client).catch(() => {
            cb({done: false});
        }).then(() => {
            cb({done: true});
        })
    });
    client.on('get_friends', async (cb) => {
        const friends = await getFriends(client);
        cb({friendList: friends});
    });

    client.on('send_game_Request', async (friend, time, callback) => {
        const receiver = io.sockets.sockets.get(io.of('/').adapter.rooms.get(friend.userid).values().next().value)
        console.log(receiver.id);
        client.to(friend.userid).emit('game_request', client.user.username, time);
        client.once('cancel_game_request', (username) => {
            if(username === receiver.user.username) {
                receiver.emit('cancel_game_request', client.user.username);
            }
        });
        receiver.once('game_request_response', async (username, accepted, cb) => {
            if(username === client.user.username) {
                if(accepted) {
                    const {roomId} = await createChessGame(io, client, receiver, time);
                    callback({accepted: true, roomId: roomId});
                    cb(roomId);
                } else {
                    callback({accepted: false});
                }
            }
        });
    });

    client.on('get_friend_requests', async (cb) => {
        const friendRequests = await getFriendRequests(client);
        cb({requests: friendRequests});
    });

    client.on('get_active_Games', async (cb) => {
        if (client.user) {
            const activeGames = await getActiveGamesData(client.user.username);
            cb({activeGames: activeGames});
        }
    });
    client.on('send_friend_request', (requestName, cb) => requestFriend(client, requestName, cb));
    client.on('accept_friend_request', (friend, cb) => addFriend(client, friend, cb));
    client.on('decline_friend_request', (name, cb) => declineFriend(client, name, cb));
    console.log(client.id);
}
module.exports = {
    initializeListeners
};

