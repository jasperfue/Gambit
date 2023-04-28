const redisClient = require('./redis.js');
require('dotenv').config()


module.exports.getPlayerInQueue = async (loggedIn, time) => {
    return new Promise((resolve, reject) => {
        const key = loggedIn ? `waitingPlayers${time}` : `waitingGuests${time}`;
        redisClient.rpop(key, (err, result) => {
            if (err) {
                console.error(`Fehler beim Abrufen von ${key}`, err);
                reject(err);
            } else {
                if(result) {
                    const user = result.split(':');
                    resolve({id: user[1], username: user[0]});
                } else {
                    resolve(result);
                }
            }
        });
    });
};

module.exports.removeFromQueue = async (loggedIn, time, username, userid) => {
    return new Promise((resolve, reject) => {
            const key = loggedIn === true ? `waitingPlayers${time}` : `waitingGuests${time}`;
            redisClient.lrem(key, 0, `${username}:${userid}`, (err, result) => {
                if (err) {
                    console.error(`Fehler beim Entfernen von Einträgen mit Benutzername ${username} aus ${key}`, err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    });
};



module.exports.addPlayerInQueue = async (loggedIn, time, userid, username) => {
    return new Promise((resolve, reject) => {
        const key = loggedIn === true ? `waitingPlayers${time}` : `waitingGuests${time}`;
            redisClient.lpush(key, `${username}:${userid}`, (err, result) => {
                if (err) {
                    console.error('Fehler beim Hinzufügen in waitingPlayers', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    });
};


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


module.exports.setUser = async (username, userid, connected) => {
    await redisClient.hset(
        `userid:${username}`,
        "userid",
        userid,
        "connected",
        connected,
    );
}

const getUserData = async (username, field = null) => {
    let result;
    if(field) {
        result = await redisClient.hget(`userid:${username}`, field);
    } else {
        result = await redisClient.hgetall(`userid:${username}`);
    }
    return result;
}

module.exports.getUserData = getUserData;


const getFriendRequests = async (username) => {
    if (username) {
        const sentFriendRequests = await redisClient.lrange(
            `friend_requests:${username}`,
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


const getFriends = async (username) => {
    if (username) {
        console.log("GET FRIENDS");
        const friendList = await redisClient.lrange(
            `friends:${username}`,
            0,
            -1
        );
        const parsed = friendList.map(friend => {
            return {username: friend.split('.')[0], userid: friend.split('.')[1]};
        });
        return parsed;
    }
    return [];
}

module.exports.getFriends = getFriends;

const friendRequestIsValid = async (username, requestName) => {
    if (!username) {
        return {errorMsg: "Please try again later"};
    }
    if (requestName === username) {
        return {errorMsg: "You can not add yourself as a Friend"};
    }
    const friend = await getUserData(requestName);
    if (!Object.keys(friend).length) {
        return {errorMsg: "User doesn't exist"};
    }
    friend.activeGames = JSON.parse(friend.activeGames);
    const currentFriendList = await redisClient.lrange(`friends:${username}`, 0, -1);
    if (!!Object.keys(currentFriendList).length && currentFriendList.indexOf([requestName, friend.userid].join('.')) !== -1) {
        return {errorMsg: "You are already friends with that user"};
    }
    return friend;
}


const getActiveGames = async (username) => {
    const activeGamesJson = await getUserData(username, "activeGames");
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
        const gameData = [];
        for (const game of activeGames) {
            gameData[game] = await getGame(game);
            delete gameData[game].pgn;
        }
        return gameData;
    } else {
        return [];
    }
}

module.exports.getActiveGamesData = getActiveGamesData;

const addActiveGame = async (username, gameId) => {
    // Hole das aktuelle Array von aktiven Spielen
    getActiveGames(username).then(async activeGames => {
        // Füge das neue Spiel zum Array hinzu
        activeGames.push(gameId);
        // Speichere das aktualisierte Array zurück in den Redis-Hash
        await redisClient.hset(
            `userid:${username}`,
            "activeGames",
            JSON.stringify(activeGames)
        );
    });
}

module.exports.initializeGame = async (roomId, whitePlayerUsername, blackPlayerUsername, time, pgn) => {
    await redisClient.hset(
        `game:${roomId}`,
        "whitePlayer",
        whitePlayerUsername,
        "blackPlayer",
        blackPlayerUsername,
        "time",
        JSON.stringify(time),
        "pgn",
        pgn,
        "chat",
        JSON.stringify([])
    );
    if (!whitePlayerUsername.startsWith('guest')) {
        await addActiveGame(whitePlayerUsername, roomId);
    }
    if (!blackPlayerUsername.startsWith('guest')) {
        await addActiveGame(blackPlayerUsername, roomId);
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
    const activeGamesJson = await getUserData(username, "activeGames");
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

const getGame = async (roomId, key = null) => {
    let result;
    if (key) {
        result = await redisClient.hget(`game:${roomId}`, key);
    } else {
        result = await redisClient.hgetall(`game:${roomId}`);
    }
    if (!result || Object.keys(result).length === 0) {
        return false;
    }
    return result;
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

module.exports.requestFriend = async (username, userid, requestName) => {
    const requestedFriend = await friendRequestIsValid(username, requestName);
    if(requestedFriend.errorMsg) {
        return {errorMsg: requestedFriend.errorMsg};
    }
    const currentFriendRequests = await redisClient.lrange(`friend_requests:${requestName}`, 0, -1);
    if (!!Object.keys(currentFriendRequests).length && currentFriendRequests.indexOf([username, userid].join('.')) !== -1) {
        return {errorMsg: "You've already sent a friend request to this user"};
    }
    if (requestedFriend) {
        await redisClient.lpush(`friend_requests:${requestName}`, [username, userid].join("."));
        return {userid: requestedFriend.userid};
    }
}

module.exports.addFriend = async (username,userid, friendName) => {
    const friend = await friendRequestIsValid(username, friendName);
    if(friend.errMsg) {
        return {errMsg: friend.errMsg};
    }
    if (friend) {
        await redisClient.lrem(`friend_requests:${username}`, 1, friendName + "." + friend.userid, (err, reply) => {
            if (err) {
                console.log(err);
                return {errMsg: err};
            } else {
                console.log("Wert erfolgreich entfernt", reply);
            }
        });
        await redisClient.lpush(`friends:${username}`, [friendName, friend.userid].join("."));
        await redisClient.lpush(`friends:${friendName}`, [username, userid].join('.'))
        const newFriend = {
            username: friendName,
            userid: friend.userid,
            connected: friend.connected,
            activeGames: friend.activeGames
        };
        const activeGames = await getActiveGames(username);
        const oldFriend = {
            username: username,
            userid: userid,
            connected: 'true',
            activeGames: activeGames
        }
        return{newFriend, oldFriend};
    }
}

module.exports.declineFriend = async (username, name) => {
    const friendId = await getUserData(name, "userid");
    if (friendId) {
        await redisClient.lrem(`friend_requests:${username}`, 1, name + "." + friendId, (err, reply) => {
            if (err) {
                return {errMsg: "Friend request could not be found"};
            }
        });
    } else {
        return {errMsg: "User could not be found"};
    }
}



const parseFriendList = async (friendList) => {
    const newFriendList = [];
    for (let friend of friendList) {
        const friendConnected = await getUserData(friend.username, "connected");
        const activeGames = await getActiveGamesData(friend.username);
        newFriendList.push({
            username: friend.username,
            userid: friend.userid,
            connected: friendConnected,
            activeGames: activeGames
        });
    }
    return newFriendList;
}

module.exports.parseFriendList = parseFriendList;