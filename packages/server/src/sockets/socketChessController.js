const {deleteGame, getGame, initializeGame, newChessMove, addChatMessage, addPlayerInQueue, getPlayerInQueue, removeFromQueue} = require("../redis/redisController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("../chess/ServerChessClock.js");


const waitingPlayers = new Map();
waitingPlayers.set('1 + 0', []);
waitingPlayers.set('2 + 1', []);
waitingPlayers.set('3 + 0', []);
waitingPlayers.set('3 + 2', []);
waitingPlayers.set('5 + 0', []);
waitingPlayers.set('5 + 3', []);
waitingPlayers.set('10 + 0', []);
waitingPlayers.set('10 + 5', []);
waitingPlayers.set('15 + 10', []);
waitingPlayers.set('30 + 0', []);
waitingPlayers.set('30 + 20', []);
const waitingGuests = new Map();
for (const [key, value] of waitingPlayers) {
    waitingGuests.set(key, [...value]);
}
const currentGames = {};
console.log('initialized Current Games');


module.exports.initializeChessListeners = (client, io) => {
        client.on('newMove', newMove(client, io));
        client.on('leave_queue', leaveQueue(client));
        client.on('resign', resign(io));
        client.on('get_game_data', (roomId, cb) => {
            console.log('get_game_data');
            if (!currentGames.hasOwnProperty(roomId)) {
                cb({done: false, errMsg: "This Game does not exist"});
                console.log('kein Objekt in currentGames')
                return;
            }
            if (!client.rooms.has(roomId)) {
                client.join(roomId);
            }
            console.log(client.rooms);
            const chessClock = currentGames[roomId].chessClock;
            getGame(roomId)
                .catch(() => {
                    console.log('kein Eintrag in redis');
                    cb({done: false, errMsg: "This Game does not exist"})
                })
                .then(game => {
                        if (!game) {
                            cb({done: false, errMsg: "This Game does not exist"});
                            return;
                        }
                        game.currentState = chessClock.getCurrentMode();
                        if (game.currentState.includes('s')) {
                            game.currentStartingTimer = chessClock.getCurrentStartingTimer();
                        } else {
                            game.currentTimes = chessClock.getCurrentTimes();
                        }
                        cb({done: true, data: game});
                    }
                )
        });
        client.on('find_game', async (user, time) => {
            const queuePlayer = await getPlayerInQueue(user.loggedIn, time.string);
            if (!user.loggedIn) {
                client.user = {username:`guest-${UUIDv4().slice(0, 8)}`};
            }
            if(queuePlayer && Object.keys(queuePlayer).length !== 0) {
                console.log(queuePlayer);
                const roomId = await createChessGame(io, queuePlayer.username, client.user.username, time);
                io.to(queuePlayer.id).emit('joined_game',queuePlayer.username, client.user.username, roomId);
                client.emit('joined_game', client.user.username, queuePlayer.username, roomId);
            } else {
                await addPlayerInQueue(user.loggedIn, time.string, client.id, client.user.username);
            }
        });
        client.on('sendMessage', async ({message, username, roomId}) => {
            console.log('NEW MESSAGE', message);
            await addChatMessage(roomId, username, message);
            io.to(roomId).emit("message", {message, username, roomId});
        });
}


const createChessGame = async (io, username1, username2, time) => {
    const chessInstance = await import('../chess/Chess.mjs').then(ChessFile => {
        return ChessFile.Chess();
    });

    let whitePlayer;
    let blackPlayer;
    var roomId = UUIDv4();

    const playerIsWhite = Math.random() < 0.5;
    if (playerIsWhite) {
        whitePlayer = username1;
        blackPlayer = username2;
    } else {
        blackPlayer = username1;
        whitePlayer = username2;
    }

    const d = new Date();
    chessInstance.header('White', whitePlayer, 'Black', blackPlayer, 'Date', d.toDateString());
    await initializeGame(roomId, whitePlayer, blackPlayer, time, chessInstance.pgn());
    const chessClock = new ServerChessClock(time);
    currentGames[roomId] = {chessClock};


    chessClock.startStartingTimer('white');

    chessClock.ChessClockAPI.on('Cancel Game', () => {
        io.to(roomId).emit('Cancel_Game');
        io.to(roomId).emit('Stop_Clocks');
        endGame(roomId)
    });


    chessClock.ChessClockAPI.on('Time_Over_White', () => {
        io.to(roomId).emit('Time_Over', 'white');
        io.to(roomId).emit('Stop_Clocks');
        endGame(roomId);
    });

    chessClock.ChessClockAPI.on('Time_Over_Black', () => {
        io.to(roomId).emit('Time_Over', 'black');
        io.to(roomId).emit('Stop_Clocks');
        endGame(roomId);
    });
    return roomId;
}

module.exports.createChessGame = createChessGame;


const resign = (io) => (color, roomId) => {
    if (!currentGames[roomId]) {
        console.log("ERROR! CurrentGame[roomId] doesn't exist");
        return;
    }
    const {chessClock} = currentGames[roomId];
    io.to(roomId).emit('resigned', color);
    io.to(roomId).emit('Stop_Clocks');
    chessClock.ChessClockAPI.emit('stop');
    endGame(roomId);
}


function endGame(roomId) {

    if(currentGames[roomId]) delete currentGames[roomId]
    deleteGame(roomId);
}


function isGuest(username) {
    return username.startsWith('guest');
}

const newMove = (socket, io) => async (roomId, player, move, cb) => {
    if(!currentGames[roomId]) {
        cb({done: false, errMsg: "Game does not exist"});
        return;
    }
    const {chessClock} = currentGames[roomId];
    console.log(move);
    const chessInstance = await import('../chess/Chess.mjs').then(ChessFile => {
        return ChessFile.Chess();
    });
    chessInstance.loadPgn(await getGame(roomId).then(data => {
        return data.pgn
    }));
    try {
        chessInstance.move(move)
    } catch(error) {
        cb({done: false, errMsg: error});
        return;
    }

    socket.to(roomId).emit('opponentMove', move);
    if(chessInstance.isGameOver()) {
        if (chessInstance.isCheckmate()) {
            io.to(roomId).emit('Checkmate', socket.user.username);
            io.to(roomId).emit('Stop_Clocks');
            chessClock.ChessClockAPI.emit('stop');
            endGame(roomId);
        } else {
            io.to(roomId).emit('Stalemate');
            io.to(roomId).emit('Stop_Clocks');
            chessClock.ChessClockAPI.emit('stop');
            endGame(roomId);
        }
        cb({done: true});
        return;
    }
        chessClock.ChessClockAPI.emit('toggle', ({remainingTimeWhite, remainingTimeBlack, turn}) => {
            io.to(roomId).emit('updatedTime', remainingTimeWhite, remainingTimeBlack, turn);
        });

    console.log('opponentMove', move);
    if (chessInstance.history().length === 1) {
        chessClock.startStartingTimer('black');
        io.to(roomId).emit('stop_starting_time_white');
    } else if (chessInstance.history().length === 2) {
        chessClock.startTimer('white');
        io.to(roomId).emit('stop_starting_time_black');
    }
    newChessMove(chessInstance.pgn(), roomId).then(r => cb({done: true}));
}

const leaveQueue = (client) => async (time) => {
    if(!client.user?.username) {
        return;
    } else {
        await removeFromQueue(!isGuest(client.user.username), time.string, client.user.username, client.id);
    }

}
