import { Chessground } from 'chessground'
import { Chess, SQUARES } from 'chess.js';


export function validMoves(chess) {
    const moves = new Map;
    for (var square of SQUARES) {
        const ms = chess.moves({square: square, verbose: true});
        if(ms.length){
            moves.set(square, ms.map((m) => m.to));
        }
    }
    return moves;
}


export function onEnPassent(ground, move) {
    var toArray = move.to.split('');
    move.color === 'w' ?
        ground.state.pieces.delete(toArray[0] + (parseInt(toArray[toArray.length - 1]) - 1).toString())
        :
        ground.state.pieces.delete(toArray[0] + (parseInt(toArray[toArray.length - 1]) + 1).toString())
}



export function refreshBoard(ground, chess) {
    ground.set({
        turnColor: toColor(chess),
        movable: {
            dests: validMoves(chess)
        }
    });
}


function toColor(chess) {
    return (chess.turn() === 'w') ? 'white' : 'black';
}

