const {getActiveGames} = require("../controllers/socketController.js");
const {getFriends} = require("../controllers/socketController.js");
const {getFriendRequests} = require("../controllers/socketController.js");
const {getGame} = require("../controllers/socketController.js");
const {logout} = require("../controllers/socketController.js");
const {declineFriend} = require("../controllers/socketController.js");
const {requestFriend} = require("../controllers/socketController.js");
const {onDisconnect} = require("../controllers/socketController.js");
const {addFriend} = require("../controllers/socketController.js");

const initializeListeners = (io) => {
    io.on('connection', client => {
        client.on('disconnect', () => {
            if (client.user) {
                onDisconnect(client);
            }
        });
        client.on('logout', (cb) => {
            onDisconnect(client).catch(() => {
                cb({done: false});
            }).then(() => {
                logout(client);
                cb({done: true});
            })
        });
        client.on('get_friend_List', async (cb) => {
            cb(await getFriends(client));
        });

        client.on('get_friend_requests', async (cb) => {
            cb({requests: await getFriendRequests(client)});
        });

        client.on('get_active_Games', async (cb) =>{
            cb({activeGames: await getActiveGames(client)});
        });
        client.on('send_friend_request', (requestName, cb) => requestFriend(client, requestName, cb));
        client.on('accept_friend_request', (friend, cb) => addFriend(client, friend, cb));
        client.on('decline_friend_request', (name, cb) => declineFriend(client, name, cb));
        console.log(client.id);
    });
}
module.exports = {
    initializeListeners
};

