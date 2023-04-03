const {deleteGame} = require("../controllers/socketController.js");
const {newChessMove} = require("../controllers/socketController.js");
const {initializeGame} = require("../controllers/socketController.js");
const {getGame} = require("../controllers/socketController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
const {Game, DateValue, pgnWrite} = require('kokopu');

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

                client.emit('joinedGame', client.user.username, opponent.user.username, gameData.roomId, gameData.playerIsWhite);
                opponent.emit('joinedGame', opponent.user.username, client.user.username, gameData.roomId, !gameData.playerIsWhite);
            } else {
                queue.get(time.string).push(client);
            }
        });
    });
}


const createChessGame = async (io, socket1, socket2, time) => {
    let whitePlayer;
    let blackPlayer;
    const chessInstance = new Game();
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


    chessInstance.playerName('w', whitePlayer.user.username);
    chessInstance.playerName('b', blackPlayer.user.username);
    chessInstance.date(new DateValue(new Date()));
    if (!isGuest(socket1.user.username)) {
        await initializeGame(roomId, whitePlayer, blackPlayer, time, pgnWrite(chessInstance, {withPlyCount: true}));
    }
    const chessClock = new ServerChessClock(time);
    currentGames[roomId] = {chessClock, chessInstance,  whitePlayer, blackPlayer};


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
    return {roomId, playerIsWhite}
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

const newMove = (socket, io) => (roomId, player, move, cb) => {
    if(!currentGames[roomId]) {
        cb({done: false, errMsg: "Game does not exist"});
        return;
    }
    const {chessClock, chessInstance} = currentGames[roomId];
    console.log(move);
    let current = chessInstance.mainVariation().nodes()[chessInstance.mainVariation().nodes().length - 1];
    if (!current) {
        current = chessInstance.mainVariation();
    }
    try {
        current.play(move.san);
    } catch (InvalidNotation) {
        console.log(InvalidNotation);
        cb({done: false, errMsg: InvalidNotation.message});
        return;
    }
    socket.to(roomId).emit('opponentMove', move);
    if (chessInstance.finalPosition().isCheckmate()) {
        io.to(roomId).emit('Checkmate', socket.user.username);
        io.to(roomId).emit('Stop_Clocks');
        chessClock.ChessClockAPI.emit('stop');
        endGame(roomId);
    } else {
        chessClock.ChessClockAPI.emit('toggle', ({remainingTimeWhite, remainingTimeBlack, turn}) => {
            io.to(roomId).emit('updatedTime', remainingTimeWhite, remainingTimeBlack, turn);
        });
    }

    console.log('opponentMove', move);
    if (chessInstance.plyCount() === 1) {
        chessClock.startStartingTimer('black');
        io.to(roomId).emit('stop_starting_time_white');
    } else if (chessInstance.plyCount() === 2) {
        chessClock.startTimer('white');
        io.to(roomId).emit('stop_starting_time_black');
    }
    if (!isGuest(socket.user.username)) {
        newChessMove(pgnWrite(chessInstance), roomId).then(r => cb({done: true}));
    } else {
        cb({done: true});
    }
}

const leaveQueue = (client) => (time) => {
    let queue;
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
