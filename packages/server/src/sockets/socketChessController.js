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
const currentChessClocks = {};
console.log('initialized Current Games');


module.exports.initializeChessListeners = (client, io) => {
    client.on('new_move', newMove(client, io));
    client.on('leave_queue', leaveQueue(client));
    client.on('resign', resign(io));
    client.on('get_game_data', (roomId, guestName, cb) => {
        if (!currentChessClocks.hasOwnProperty(roomId)) {
            cb({done: false, errMsg: "This Game does not exist"});
            console.log('kein Objekt in currentChessClocks')
            return;
        }
        if (!client.rooms.has(roomId)) {
            client.join(roomId);
        }
        if(guestName) {
            client.user = {username: guestName}
        }
        const chessClock = currentChessClocks[roomId].chessClock;
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
            client.user = {username: `guest-${UUIDv4().slice(0, 8)}`, userid: client.id};
        }
        if (queuePlayer && Object.keys(queuePlayer).length !== 0) {
            const roomId = await createChessGame(io, queuePlayer.username, client.user.username, time);
            io.to(queuePlayer.userid).emit('joined_game', queuePlayer.username, roomId);
            client.emit('joined_game', client.user.username, roomId);
        } else {
            await addPlayerInQueue(user.loggedIn, time.string, client.user);
        }
    });
    client.on('sendMessage', async ({message, username, roomId}) => {
        await addChatMessage(roomId, username, message);
        io.to(roomId).emit("message", {message, username, roomId});
    });
}

/**
 * Creates a new chess game with two players and initializes the game state and chess clock.
 *
 * @param  io - The Socket.IO server instance.
 * @param  username1 - The username of the first player.
 * @param  username2 - The username of the second player.
 * @param  time - The time mode for the chess clock.
 * @returns {Promise<string>} - Returns a promise that resolves to the new game's room ID.
 */
const createChessGame = async (io, username1, username2, time) => {
    var roomId = UUIDv4();
    const [whitePlayer, blackPlayer] = Math.random() < 0.5 ? [username1, username2] : [username2, username1];

    const chessInstance = await import('../chess/Chess.mjs').then(ChessFile => {
        return ChessFile.Chess();
    });
    const d = new Date();
    chessInstance.header('White', whitePlayer, 'Black', blackPlayer, 'Date', d.toDateString());
    await initializeGame(roomId, whitePlayer, blackPlayer, time, chessInstance.pgn());
    const chessClock = new ServerChessClock(time);
    currentChessClocks[roomId] = {chessClock};

    chessClock.startStartingTimer('white');
    chessClock.ChessClockEvents.on('cancel_game', () => {
        io.to(roomId).emit('cancel_game');
        io.to(roomId).emit('stop_clocks');
        endGame(roomId)
    });
    chessClock.ChessClockEvents.on('time_over', (color) => {
        io.to(roomId).emit('time_over', color);
        io.to(roomId).emit('stop_clocks');
        endGame(roomId);
    });
    return roomId;
}

module.exports.createChessGame = createChessGame;

/**
 *
 * @param io
 * @returns {function(string, string): (undefined)}
 */
const resign = (io) => (color, roomId) => {
    if (!currentChessClocks[roomId]) {
        console.log("ERROR! CurrentChessClock[roomId] doesn't exist");
        return;
    } else {
        const {chessClock} = currentChessClocks[roomId];
        chessClock.ChessClockEvents.emit('stop');
    }
    io.to(roomId).emit('resigned', color);
    io.to(roomId).emit('stop_clocks');
    endGame(roomId);
}


function endGame(roomId) {

    if(currentChessClocks[roomId]) delete currentChessClocks[roomId]
    deleteGame(roomId);
}


function isGuest(username) {
    return username.startsWith('guest');
}

/**
 * Handles a new move in a chess game, updates the game state, and communicates
 * the move to the opponent. Also handles game-over scenarios such as checkmate
 * and stalemate.
 *
 * @param socket - The socket of the player making the move.
 * @param io - The socket.io instance.
 * @returns {function(string, Object, Object, function): Promise<void>} - An async function that takes the roomId, player, move, and a callback as arguments.
 */
const newMove = (socket, io) => async (roomId, player, move, cb) => {
    if(!currentChessClocks[roomId]) {
        cb({done: false, errMsg: "Game does not exist"});
        return;
    }
    const {chessClock} = currentChessClocks[roomId];
    const chessInstance = await import('../chess/Chess.mjs').then(ChessFile => {
        return ChessFile.Chess();
    });
    try {
        chessInstance.loadPgn(await getGame(roomId, "pgn").then(pgn => {
            if(!pgn) {
                cb({done: false, errMsg: "Game does not exist"});
                return;
            }
            return pgn;
        }));
        chessInstance.move(move)
    } catch(error) {
        cb({done: false, errMsg: error});
        return;
    }

    socket.to(roomId).emit('opponent_move', move);
    if(chessInstance.isGameOver()) {
        if (chessInstance.isCheckmate()) {
            io.to(roomId).emit('checkmate', socket.user.username);
        } else {
            io.to(roomId).emit('draw');
        }
        io.to(roomId).emit('stop_clocks');
        chessClock.ChessClockEvents.emit('stop');
        endGame(roomId);
        cb({done: true});
        return;
    }
        chessClock.ChessClockEvents.emit('toggle', ({remainingTimeWhite, remainingTimeBlack, turn}) => {
            io.to(roomId).emit('updated_time', remainingTimeWhite, remainingTimeBlack, turn);
        });

    if (chessInstance.history().length === 1) {
        chessClock.startStartingTimer('black');
        io.to(roomId).emit('stop_starting_time_white');
    } else if (chessInstance.history().length === 2) {
        chessClock.startTimer('white');
        io.to(roomId).emit('stop_starting_time_black');
    }
    //Store move in Redis
    newChessMove(chessInstance.pgn(), roomId).then(r => cb({done: true}));
}

const leaveQueue = (client) => async (time) => {
    if(client.user?.username) {
        await removeFromQueue(!isGuest(client.user.username), time.string, client.user.username, client.id);
    }
}
