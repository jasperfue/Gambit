const {parseFriendList} = require("../redis/redisController.js");
const {onDisconnect} = require("./socketMiddleware.js");
const {createChessGame} = require("./socketChessController.js");
const {getActiveGamesData} = require("../redis/redisController.js");
const {getFriends} = require("../redis/redisController.js");
const {getFriendRequests} = require("../redis/redisController.js");
const {declineFriend} = require("../redis/redisController.js");
const {requestFriend} = require("../redis/redisController.js");
const {addFriend} = require("../redis/redisController.js");


const initializeListeners = (client, io) => {
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
        const friends = await getFriends(client.user?.username);
        if(friends) {
            const parsedFriends = await parseFriendList(friends);
            cb({friendList: parsedFriends});
        } else {
            cb({friendList: []});
        }
    });

    client.on('cancel_game_request', (friend) => {
        client.to(friend.userid).emit('cancel_game_request', client.user.username);
    });

    client.on('game_request_response', async (friend, time,  accepted) => {
        if(accepted) {
            const roomId = await createChessGame(io, client.user.username, friend.username, time);
            io.to([client.user.userid, friend.userid]).emit('joined_game',friend.username, client.user.username, roomId);
        } else {
            client.to(friend.userid).emit('game_request_denied', client.user);
        }
    });

    client.on('send_game_Request', async (friend, time) => {
        client.to(friend.userid).emit('game_request', client.user, time);
    });

    client.on('get_friend_requests', async (cb) => {
        const friendRequests = await getFriendRequests(client.user?.username);
        cb({requests: friendRequests});
    });

    client.on('get_active_Games', async (cb) => {
        if (client.user) {
            const activeGames = await getActiveGamesData(client.user.username);
            cb({ activeGames });
        }
    });
    client.on('send_friend_request', (requestName, cb) => {
        if(client.user?.username) {
            requestFriend(client.user.username, client.user.userid, requestName).then(result => {
                    if (result?.errorMsg) {
                        cb({done: false, errorMsg: result.errorMsg});
                        return;
                    }
                    cb({done: true});
                    client.to(result.userid).emit('friend_request', client.user.username);
                }
            );
        } else {
            cb({done: false, errorMsg: "Please try again later"});
        }
    });
    client.on('accept_friend_request', async (friend, cb) => {
        if(client.user?.username) {
            const result = await addFriend(client.user.username, client.user.userid, friend, cb);
            if (result?.errMsg) {
                cb({done: false, errMsg: result.errMsg});
                return;
            }
            cb({done: true, newFriend: result.newFriend});
            client.to(result.newFriend.userid).emit('friend_request_accepted', result.oldFriend);
        }
    });
    client.on('decline_friend_request', async (name, cb) => {
        if(client.user?.username) {
            const result = await declineFriend(client.user.username, name);
            if (result?.errMsg) {
                cb({done: false, errMsg: result.errMsg});
            } else {
                cb({done: true});
            }
        } else {
            cb({done: false, errMsg: "Please try again later"});
        }
    });
    console.log(client.id);
}
module.exports = {
    initializeListeners
};

