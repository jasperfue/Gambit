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
        client.on('get_game_data', (roomId, cb) => getGame(roomId, cb));
        client.on('send_friend_request', (requestName, cb) => requestFriend(client, requestName, cb));
        client.on('accept_friend_request', (friend, cb) => addFriend(client, friend, cb));
        client.on('decline_friend_request', (name, cb) => declineFriend(client, name, cb));
        console.log(client.id);
    });
}
module.exports = {
    initializeListeners
};

