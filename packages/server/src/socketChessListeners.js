const {deleteGame} = require("../controllers/socketController.js");
const {newChessMove} = require("../controllers/socketController.js");
const {initializeGame} = require("../controllers/socketController.js");
const {getGame} = require("../controllers/socketController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
const {Game, DateValue, pgnWrite} = require('kokopu');
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

        client.on('find_game', (user, time) => {
            let queue;
            if (user.loggedIn) {
                queue = waitingPlayers;
                client.userName = user.username;
            } else {
                queue = waitingGuests;
                client.userName = `guest-${UUIDv4().slice(0, 8)}`;
            }
            const leaveQueueListener = () => leaveQueue(client, time);

            if (queue.get(time.string).length > 0) {
                let whitePlayer;
                let blackPlayer;

                var opponent = queue.get(time.string).shift();
                if (listeners.has(opponent.id) && listeners.get(opponent.id).leaveQueueListener) {
                    opponent.off('leave_queue', listeners.get(opponent.id).leaveQueueListener);
                    opponent.off('disconnect', listeners.get(opponent.id).leaveQueueListener);
                    delete listeners.get(opponent.id).leaveQueueListener;
                    if(Object.keys(listeners.get(opponent.id)).length === 0) {
                        listeners.delete(opponent.id);
                    }
                }



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


                chessInstance.playerName('w', whitePlayer.userName);
                chessInstance.playerName('b', blackPlayer.userName);
                chessInstance.date(new DateValue(new Date()));
                if (!isGuest(client.userName)) {
                    initializeGame(roomId, whitePlayer, blackPlayer, time, pgnWrite(chessInstance, {withPlyCount: true}));
                }
                const chessClock = new ServerChessClock(time);
                currentGames[roomId] = {chessClock, client, opponent};


                const clientMoveListener = () => newMove(chessInstance, roomId, client, chessClock);
                const opponentMoveListener = () => newMove(chessInstance, roomId, opponent, chessClock);


                const clientResignListener = () => resign(chessClock, roomId);
                const opponentResignListener = () => resign(chessClock, roomId);

                setListeners(client, roomId, clientMoveListener, clientResignListener);
                setListeners(opponent, roomId, opponentMoveListener, opponentResignListener);

                chessClock.startStartingTimer('white');

                chessClock.ChessClockAPI.on('Cancel Game', () => {
                    localio.to(roomId).emit('Cancel_Game');
                    localio.to(roomId).emit('Stop_Clocks');
                    endGame(roomId);
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

                client.emit('joinedGame', client.userName, opponent.userName, roomId, playerIsWhite);
                opponent.emit('joinedGame', opponent.userName, client.userName, roomId, !playerIsWhite);
            } else {
                queue.get(time.string).push(client);
                console.log("Erster Spieler: " + client.userName);
                setListeners(client, null, null, null, leaveQueueListener);

            }
        });
    });
}
function setListeners(socket, roomId = null, moveListener = null, resignListener = null, leaveQueueListener = null) {
    if (roomId && moveListener && resignListener) {
        socket.on('resign', resignListener);
        socket.on('newMove', moveListener);
    }

    if (leaveQueueListener) {
        socket.on('leave_queue', leaveQueueListener);
        socket.on('disconnect', leaveQueueListener)
    }

    if (!listeners.has(socket.id)) {
        if (leaveQueueListener) {
            listeners.set(socket.id, {
                leaveQueueListener: leaveQueueListener
            });
        } else if (roomId) {
            listeners.set(socket.id, {
                games: new Map([[roomId, {
                    moveListener: moveListener,
                    resignListener: resignListener,
                }]])
            });
        }
    } else {
        if (leaveQueueListener) {
            listeners.get(socket.id).leaveQueueListener = leaveQueueListener;
        }
        if (roomId) {
            if (!listeners.get(socket.id).games) {
                listeners.get(socket.id).games = new Map();
            }
            listeners.get(socket.id).games.set(roomId, {
                moveListener: moveListener,
                resignListener: resignListener,
            });
        }
    }
    console.log(roomId, socket._events);
}



function resign(chessClock, roomId) {
    localio.to(roomId).emit('resigned');
    localio.to(roomId).emit('Stop_Clocks');
    chessClock.ChessClockAPI.emit('stop');
    endGame(roomId);
}


function endGame(roomId) {
    const {client, opponent} = currentGames[roomId];

    console.log("client Listeners", client._events);
    console.log("opponent Listeners" , opponent._events);

    removeGameListeners(client, roomId);
    removeGameListeners(opponent, roomId);

    console.log("client Listeners", client._events);
    console.log("opponent Listeners" , opponent._events);

    client.leave(roomId);
    opponent.leave(roomId);
    delete currentGames[roomId];
}


function removeGameListeners(socket, roomId) {
    if(!listeners.get(socket.id).games && !listeners.get(socket.id).games.has(roomId)) return;
    const gameListeners = listeners.get(socket.id).games.get(roomId);
        socket.off('resign', gameListeners.resignListener);
        socket.off('newMove', gameListeners.moveListener);

        delete gameListeners.resignListener;
        delete gameListeners.moveListener;

        if (Object.keys(gameListeners).length === 0) {
            listeners.get(socket.id).games.delete(roomId);
            if (listeners.get(socket.id).games.size === 0) {
                delete listeners.get(socket.id).games;
                if (Object.keys(listeners.get(socket.id)).length === 0) {
                    listeners.delete(socket.id);
                }
            }
        }
}


function isGuest(username) {
    return username.startsWith('guest');
}

const newMove = (chessInstance, roomId, client, chessClock) => (move, cb) => {
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
    client.to(roomId).emit('opponentMove', move);
    if (chessInstance.finalPosition().isCheckmate()) {
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
        queue = waitingGuests.get(time.string);
    } else {
        queue = waitingPlayers.get(time.string);
    }
    if (queue.includes(client)) {
        queue.splice(queue.indexOf(client), 1);
    } else {
        return;
    }
    if (listeners.has(client.id) && listeners.get(client.id).leaveQueueListener) {
        const listener = listeners.get(client.id).leaveQueueListener;
        client.off('disconnect', listener);
        client.off('leave_queue', listener);
        delete listeners.get(client.id).leaveQueueListener;
        if (Object.keys(listeners.get(client.id)).length === 0) {
            listeners.delete(client.id);
        }

    }
}
