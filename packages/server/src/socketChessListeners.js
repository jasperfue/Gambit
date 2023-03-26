const {deleteGame} = require("../controllers/socketController.js");
const {newChessMove} = require("../controllers/socketController.js");
const {initializeGame} = require("../controllers/socketController.js");
const {getGame} = require("../controllers/socketController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
const { Game, DateValue, pgnWrite } = require('kokopu');
const listeners = new Map();

let waitingPlayers = new Map();
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
let waitingGuests = new Map([...waitingPlayers]);
let currentGames = {};
console.log('initialized Current Games');
let localio;


module.exports.initializeChessListeners = (io) => {
    io.on('connection', client => {
        localio = io;
        client.on('get_game_data', (roomId, cb) => {
            if(!currentGames.hasOwnProperty(roomId)) {
                cb({done: false, errMsg: "This Game does not exist"});
                console.log('kein Objekt in currentGames')
                return;
            }
            if(!client.rooms.has(roomId)) {
                client.join(roomId);
            }
            const data = currentGames[roomId];
            const chessClock = data.chessClock;
            const chessInstance = data.chessInstance;
                getGame(roomId)
                    .catch(() => {
                        console.log('kein Eintrag in redis');
                        cb({done: false, errMsg: "This Game does not exist"})
                    })
                    .then(game => {
                        if(!game) {
                            cb({done:false, errMsg: "This Game does not exist"});
                            return;
                        }
                        game.currentState = chessClock.getCurrentMode();
                        if(game.currentState.includes('s')) {
                            game.currentStartingTimer = chessClock.getCurrentStartingTimer();
                        } else {
                            game.currentTimes = chessClock.getCurrentTimes();
                        }
                        cb({done: true, data: game});
                    }
                    )
        });

    client.on('find_game', (user, time) => {
        let queue;
        if (user.loggedIn) {
            queue = waitingPlayers;
            client.userName = user.username;
        } else {
            queue = waitingGuests;
            client.userName = `guest-${UUIDv4().slice(0, 8)}`;
        }
        if (queue.get(time.string).length > 0) {
            let whitePlayer;
            let blackPlayer;
            var opponent = queue.get(time.string).shift();
            opponent.off('disconnect', () => leaveQueue(opponent, time));
            opponent.off('leave_queue', () => leaveQueue(opponent, time));
            console.log("Zweiter Spieler: " + client.userName);
            const chessInstance = new Game();
            var roomId = UUIDv4();
            client.join(roomId);
            opponent.join(roomId);
            const playerIsWhite = Math.random() < 0.5;
            if (playerIsWhite) {
                whitePlayer = client;
                blackPlayer = opponent;
            } else {
                blackPlayer = client;
                whitePlayer = opponent;
            }
            client.emit('joinedGame',client.userName, opponent.userName, roomId, playerIsWhite);
            opponent.emit('joinedGame',opponent.userName, client.userName, roomId, !playerIsWhite);
            chessInstance.playerName('w', whitePlayer.userName);
            chessInstance.playerName('b', blackPlayer.userName);
            chessInstance.date(new DateValue(new Date()));
            if(!isGuest(client.userName)) {
                initializeGame(roomId, whitePlayer, blackPlayer, time, pgnWrite(chessInstance, {withPlyCount: true}));
            }
            const chessClock = new ServerChessClock(time);
            currentGames[roomId] = {chessInstance, chessClock, client, opponent};
            const clientMoveListener =  newMove(chessInstance, roomId, client, chessClock);
            const opponentMoveListener = newMove(chessInstance, roomId, opponent, chessClock);
            client.on('newMove', clientMoveListener);
            opponent.on('newMove', opponentMoveListener);
            listeners.set(client.id, new Map([[roomId, clientMoveListener]]));
            listeners.set(opponent.id, new Map([[roomId, opponentMoveListener]]));
            chessClock.startStartingTimer('white');
            chessClock.ChessClockAPI.on('Cancel Game', () => {
                endGame(roomId);
                client.emit(`Cancel Game ${roomId}`);
                opponent.emit(`Cancel Game ${roomId}`);
                console.log('CANCEL GAME chessClock');
            });
            chessClock.ChessClockAPI.on('Time_Over_White', () => {
                endGame(roomId);
                localio.to(roomId).emit('Time_Over', 'white');
                localio.to(roomId).emit('Stop_Clocks');
            });
            chessClock.ChessClockAPI.on('Time_Over_Black', () => {
                endGame(roomId);
                localio.to(roomId).emit('Time_Over', 'black');
                localio.to(roomId).emit('Stop_Clocks');
            });
        } else {
            queue.get(time.string).push(client);
            console.log("Erster Spieler: " + client.userName);
            client.on('disconnect', () => {
                leaveQueue(client, time);
            });
            client.on('leave_queue', () => {
                leaveQueue(client, time);
            });
        }
    });
    });
}


function endGame(roomId) {
    const {chessInstance, chessClock, client, opponent} = currentGames[roomId];
    deleteGame(roomId);
    client.off('newMove', listeners.get(client.id).get(roomId));
    opponent.off('newMove', listeners.get(opponent.id).get(roomId));
    listeners.get(client.id).delete(roomId);
    listeners.get(opponent.id).delete(roomId);
    if(listeners.get(client.id).size === 0) listeners.delete(client.id)
    if(listeners.get(opponent.id).size === 0) listeners.delete(opponent.id)
    client.leave(roomId);
    opponent.leave(roomId);
    delete currentGames[roomId];
}

function isGuest(username) {
    return username.startsWith('guest');
}

const newMove = (chessInstance, roomId, client, chessClock) => (move, cb) => {
    let current = chessInstance.mainVariation().nodes()[chessInstance.mainVariation().nodes().length - 1];
    if(!current) {
        current = chessInstance.mainVariation();
    }
    try {
        current.play(move.san);
    } catch (InvalidNotation) {
        console.log(InvalidNotation);
        cb({done: false, errMsg: InvalidNotation.message});
        return;
    }
    client.to(roomId).emit('opponentMove', move);
    if(chessInstance.finalPosition().isCheckmate()) {
        localio.to(roomId).emit('Checkmate', client.userName);
        localio.to(roomId).emit('Stop_Clocks');
        chessClock.ChessClockAPI.emit('stop');
        endGame(roomId);
    } else {
        chessClock.ChessClockAPI.emit('toggle', ({remainingTimeWhite, remainingTimeBlack, turn}) => {
            localio.to(roomId).emit('updatedTime', remainingTimeWhite, remainingTimeBlack, turn);
        });
    }

    console.log('opponentMove', move);
    if (chessInstance.plyCount() === 1) {
        chessClock.startStartingTimer('black');
        localio.to(roomId).emit('stop_starting_time_white');
    } else if (chessInstance.plyCount() === 2) {
        chessClock.startTimer('white');
        localio.to(roomId).emit('stop_starting_time_black');
    }
    if (!isGuest(client.userName)) {
        newChessMove(pgnWrite(chessInstance), roomId).then(r => cb({done: true}));
    } else {
        cb({done: true});
    }
}

function leaveQueue(client, time) {
    let queue;
    if (isGuest(client.userName)) {
        queue = waitingGuests;
    } else {
        queue = waitingPlayers;
    }
    if (queue.get(time.string).includes(client)) {
        queue.get(time.string).splice(queue.get(time.string).indexOf(client), 1);
    } else {
    }
}