const {deleteGame, getGame, initializeGame, newChessMove, addChatMessage} = require("../controllers/socketController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");


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


module.exports.initializeChessListeners = (io) => {
        io.on('connection', client => {
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
            const data = currentGames[roomId];
            const chessClock = data.chessClock;
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
            let queue;
            if (user.loggedIn) {
                queue = waitingPlayers;
            } else {
                queue = waitingGuests;
                client.user = {username:`guest-${UUIDv4().slice(0, 8)}`};
            }
            if (queue.get(time.string).length > 0) {
                var opponent = queue.get(time.string).shift();
                const gameData = await createChessGame(io, client, opponent, time);

                client.emit('joinedGame', client.user.username, opponent.user.username, gameData.roomId);
                opponent.emit('joinedGame', opponent.user.username, client.user.username, gameData.roomId);
            } else {
                queue.get(time.string).push(client);
            }
        });
        client.on('sendMessage', async ({message, username, roomId}) => {
            console.log('NEW MESSAGE', message);
            await addChatMessage(roomId, username, message);
            io.to(roomId).emit("message", {message, username, roomId});
            });
    });
}


const createChessGame = async (io, socket1, socket2, time) => {
    const chessInstance = await import('./Chess.mjs').then(ChessFile => {
        return ChessFile.Chess();
    });

    let whitePlayer;
    let blackPlayer;
    var roomId = UUIDv4();
    socket1.join(roomId);
    socket2.join(roomId);

    const playerIsWhite = Math.random() < 0.5;
    if (playerIsWhite) {
        whitePlayer = socket1;
        blackPlayer = socket2;
    } else {
        blackPlayer = socket1;
        whitePlayer = socket2;
    }

    const d = new Date();
    chessInstance.header('White', whitePlayer.user.username, 'Black', blackPlayer.user.username, 'Date', d.toDateString());
    await initializeGame(roomId, whitePlayer, blackPlayer, time, chessInstance.pgn());
    const chessClock = new ServerChessClock(time);
    currentGames[roomId] = {chessClock,  whitePlayer, blackPlayer};


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
    return {roomId, playerIsWhite};
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
    const chessInstance = await import('./Chess.mjs').then(ChessFile => {
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

const leaveQueue = (client) => (time) => {
    let queue;
    if(!client.user?.username) {
        return;
    }
    if (isGuest(client.user.username)) {
        queue = waitingGuests.get(time.string);
    } else {
        queue = waitingPlayers.get(time.string);
    }
    const clientIndex = queue.findIndex(c => c.id === client.id);
    if (clientIndex !== -1) {
        queue.splice(clientIndex, 1);
    } else {
        return;
    }

}
