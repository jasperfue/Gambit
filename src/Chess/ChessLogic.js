import { Chessground } from 'chessground'
import { Chess, SQUARES } from 'chess.js';


export function getValidMoves(chess) {
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
            dests: getValidMoves(chess)
        }
    });
}


export function toColor(chess) {
    return (chess.turn() === 'w') ? 'white' : 'black';
}

export function charPieceToString(char) {
    var piece;
    switch(char) {
        case 'q':
            piece = 'queen';
            break;
        case 'r':
            piece = 'rook';
            break;
        case 'b':
            piece = 'bishop';
            break;
        case 'n':
            piece = 'knight';
            break;
        case 'p':
            piece = 'prawn';
            break;
        case 'k':
            piece = 'king';
            break;
    }
    return piece;
}

