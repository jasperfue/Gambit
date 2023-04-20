const redisClient = require('../src/redis.js');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cookie = require('cookie');


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


module.exports.onServerShutdown = async () => {
    console.log('ONSERVERSHUTDOWN');
    try {
        // Finde alle Schlüssel, die mit 'game:' beginnen
        const gameKeys = await redisClient.keys('game:*');

        if (gameKeys.length > 0) {
            // Lösche alle gefundenen Schlüssel
            await Promise.all(gameKeys.map(async key => await redisClient.del(key)));
            console.log('Alle "game:..." Einträge wurden gelöscht.');
        } else {
            console.log('Keine "game:..." Einträge zum Löschen gefunden.');
        }
    } catch (error) {
        console.error('Fehler beim Löschen der "game:..." Einträge:', error);
    }

    try {
        const userKeys = await redisClient.keys('userid:*');
        if (userKeys.length > 0) {
            await Promise.all(userKeys.map(async key => await redisClient.hset(key, "activeGames", JSON.stringify([]), "connected", false)));
            console.log('Alle activeGames gelöscht und connected false');
        } else {
            console.log('Keine userKeys zum löschen von activeGames');
        }
    } catch (error) {
        console.error('Fehler beim Löschen von activeGames aus userid:*');
    }

}


module.exports.initializeUser = async (socket, next) => {
    if (!socket.user) {
        next();
        return;
    }
    socket.join(socket.user.userid);
    getActiveGames(socket.user.username).then(async activeGames => {
        await redisClient.hset(
            `userid:${socket.user.username}`,
            "userid",
            socket.user.userid,
            "connected",
            true,
            "activeGames",
            JSON.stringify(activeGames)
        );
    });
    getFriends(socket).then(friends => {
        const friendRooms = friends.map(friend => friend.userid);
        if (friendRooms.length > 0) {
            socket.to(friendRooms).emit("connected", "true", socket.user.username);
        }
        socket.emit('friends', friends);
    });

    getFriendRequests(socket).then(friendRequests => socket.emit('friend_requests', friendRequests));

    getActiveGamesData(socket.user.username).then(gameData => socket.emit('active_games', gameData));

    next();
};


const getFriendRequests = async (socket) => {
    if (socket.user) {
        const sentFriendRequests = await redisClient.lrange(
            `friend_requests:${socket.user.username}`,
            0,
            -1
        );
        const usernameFriendRequest = (request) => {
            const requestSplitted = request.split('.');
            return requestSplitted[0];
        }
        return sentFriendRequests.map(usernameFriendRequest);
    }
    return [];
}

module.exports.getFriendRequests = getFriendRequests;


const getFriends = async (socket) => {
    if (socket.user) {
        console.log("GET FRIENDS");
        const friendList = await redisClient.lrange(
            `friends:${socket.user.username}`,
            0,
            -1
        );
        const parsedFriendList = await parseFriendList(friendList);
        return parsedFriendList;
    }
    return [];
}

module.exports.getFriends = getFriends;

const friendRequestIsValid = async (socket, requestName, cb) => {
    if (!socket.user?.username) {
        cb({done: false, errorMsg: "Please try again later"});
        return false;
    }
    if (requestName === socket.user.username) {
        cb({done: false, errorMsg: "You can not add yourself as a Friend"});
        return false;
    }
    const friend = await redisClient.hgetall(`userid:${requestName}`);
    if (!Object.keys(friend).length) {
        cb({done: false, errorMsg: "User doesn't exist"});
        return false;
    }
    friend.activeGames = JSON.parse(friend.activeGames);
    const currentFriendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
    if (!!Object.keys(currentFriendList).length && currentFriendList.indexOf([requestName, friend.userid].join('.')) !== -1) {
        cb({done: false, errorMsg: "You are already friends with that user"});
        return false;
    }
    return friend;
}


const getActiveGames = async (username) => {
    const activeGamesJson = await redisClient.hget(`userid:${username}`, "activeGames");
    if (activeGamesJson) {
        return JSON.parse(activeGamesJson);
    } else {
        return [];
    }
}

module.exports.getActiveGames = getActiveGames;

const getActiveGamesData = async (username) => {
    const activeGames = await getActiveGames(username);
    if (activeGames.length > 0) {
        const gameData = {};
        for (const game of activeGames) {
            gameData[game] = await getGame(game);
            delete gameData[game].pgn;
        }
        return gameData;
    } else {
        return {};
    }
}

module.exports.getActiveGamesData = getActiveGamesData;

const addActiveGame = async (socket, gameId) => {
    // Hole das aktuelle Array von aktiven Spielen
    getActiveGames(socket.user.username).then(async activeGames => {
        // Füge das neue Spiel zum Array hinzu
        activeGames.push(gameId);
        // Speichere das aktualisierte Array zurück in den Redis-Hash
        await redisClient.hset(
            `userid:${socket.user.username}`,
            "activeGames",
            JSON.stringify(activeGames)
        );
    });
}

module.exports.initializeGame = async (roomId, whitePlayer, blackPlayer, time, pgn) => {
    await redisClient.hset(
        `game:${roomId}`,
        "whitePlayer",
        whitePlayer.user.username,
        "blackPlayer",
        blackPlayer.user.username,
        "time",
        JSON.stringify(time),
        "pgn",
        pgn,
        "chat",
        JSON.stringify([])
    );
    if (!whitePlayer.user.username.startsWith('guest')) {
        await addActiveGame(whitePlayer, roomId);
    }
    if (!blackPlayer.user.username.startsWith('guest')) {
        await addActiveGame(blackPlayer, roomId);
    }
}

module.exports.addChatMessage = async (roomId, username, message) => {
    try {
        // Get the current chat messages from Redis
        redisClient.hget(`game:${roomId}`, 'chat').then(async chatJson => {

            const chat = JSON.parse(chatJson) || [];

            // Add the new message to the chat array
            chat.push({username, message});

            // Update the chat messages in Redis
            await redisClient.hset(`game:${roomId}`, 'chat', JSON.stringify(chat));
        });
    } catch (error) {
        console.error('Error adding chat message:', error);
    }
};

const removeActiveGame = async (username, roomId) => {
    // Hole das aktuelle Array von aktiven Spielen
    redisClient.hget(`userid:${username}`, "activeGames").then(async activeGamesJson => {
        let activeGames = [];
        if (activeGamesJson) {
            activeGames = JSON.parse(activeGamesJson);
        }

        // Entferne die roomId aus dem Array
        const updatedActiveGames = activeGames.filter(gameId => gameId !== roomId);

        // Speichere das aktualisierte Array zurück in den Redis-Hash
        await redisClient.hset(
            `userid:${username}`,
            "activeGames",
            JSON.stringify(updatedActiveGames)
        );
    });
};


module.exports.deleteGame = async (roomId) => {
    // Hole die Benutzernamen der Spieler
    redisClient.hgetall(`game:${roomId}`).then(async game => {

        const whitePlayerUsername = game.whitePlayer;
        const blackPlayerUsername = game.blackPlayer;
        if (!whitePlayerUsername.startsWith('guest')) {
            await removeActiveGame(whitePlayerUsername, roomId);
        }
        if (!blackPlayerUsername.startsWith('guest')) {
            await removeActiveGame(blackPlayerUsername, roomId);
        }

        // Lösche den Redis-Eintrag für das Spiel
        await redisClient.del(`game:${roomId}`);
    });
};

const getGame = async (roomId) => {
    const game = await redisClient.hgetall(`game:${roomId}`);
    if (!game || Object.keys(game).length === 0) {
        return false;
    }
    return game;
}
module.exports.getGame = getGame;


module.exports.newChessMove = async (pgn, roomId) => {
    redisClient.exists(`game:${roomId}`, (err, reply) => {
        if (err) {
            console.log(err);
        } else {
            if (reply === 1) {
                redisClient.hset(`game:${roomId}`, "pgn", pgn, (err, reply) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("PGN updated successfully");
                    }
                });
            } else {
                console.log('SPIEL EXISTIERT NICHT IN NEW CHESS MOVE METHODE');
            }
        }
    });
}

module.exports.requestFriend = async (socket, requestName, cb) => {
    const requestedFriend = await friendRequestIsValid(socket, requestName, cb);
    const currentFriendRequests = await redisClient.lrange(`friend_requests:${requestName}`, 0, -1);
    if (!!Object.keys(currentFriendRequests).length && currentFriendRequests.indexOf([socket.user.username, socket.user.userid].join('.')) !== -1) {
        cb({done: false, errorMsg: "You've already sent a friend request to this user"});
        return;
    }
    if (requestedFriend) {
        await redisClient.lpush(`friend_requests:${requestName}`, [socket.user.username, socket.user.userid].join("."));
        cb({done: true});
        socket.to(requestedFriend.userid).emit('friend_request', socket.user.username);

    }
}

module.exports.addFriend = async (socket, friendName, cb) => {
    const friend = await friendRequestIsValid(socket, friendName, cb);
    if (friend) {
        await redisClient.lrem(`friend_requests:${socket.user.username}`, 1, friendName + "." + friend.userid, (err, reply) => {
            if (err) {
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
            connected: friend.connected,
            activeGames: friend.activeGames
        };
        const activeGames = await getActiveGames(socket.user.username);
        const oldFriend = {
            username: socket.user.username,
            userid: socket.user.userid,
            connected: 'true',
            activeGames: activeGames
        }
        cb({done: true, newFriend});
        socket.to(friend.userid).emit('friend_request_accepted', oldFriend);
    }
}

module.exports.declineFriend = async (socket, name, cb) => {
    const friend = await redisClient.hgetall(`userid:${name}`);
    if (friend) {
        await redisClient.lrem(`friend_requests:${socket.user.username}`, 1, name + "." + friend.userid, (err, reply) => {
            if (err) {
                cb({done: false, errMsg: "Friend request could not be found"});
            } else {
                cb({done: true});
            }
        });
    } else {
        cb({done: false, errMsg: "User could not be found"});
    }
}


module.exports.onDisconnect = async (socket) => {
    if (!socket.user) {
        return;
    }
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


const parseFriendList = async (friendList) => {
    const newFriendList = [];
    for (let friend of friendList) {
        const parsedFriend = friend.split('.');
        const friendConnected = await redisClient.hget(`userid:${parsedFriend[0]}`, "connected");
        const activeGames = await getActiveGamesData(parsedFriend[0]);
        newFriendList.push({
            username: parsedFriend[0],
            userid: parsedFriend[1],
            connected: friendConnected,
            activeGames: activeGames
        });
    }
    return newFriendList;
}