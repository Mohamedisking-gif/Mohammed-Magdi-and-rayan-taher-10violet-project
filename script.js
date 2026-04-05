var board = null;
var game = new Chess();
var $status = $('#status');

function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false;
}

// Highlight legal moves
function onMouseoverSquare(square) {
    var moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    $('#myBoard .square-' + square).addClass('highlight-hint');
    for (var i = 0; i < moves.length; i++) {
        $('#myBoard .square-' + moves[i].to).addClass('highlight-hint');
    }
}

function onMouseoutSquare() {
    $('#myBoard .square-55d60').removeClass('highlight-hint');
}

function makeMove() {
    var moves = game.moves();
    if (game.game_over()) return;

    var level = $('#level').val();
    var move;

    if (level === "1") {
        // Level 1: Pure Random
        move = moves[Math.floor(Math.random() * moves.length)];
    } else {
        // Level 2 & 3: Better AI (Prioritizes Captures/Checkmate)
        move = getBestMove(moves);
    }

    game.move(move);
    board.position(game.fen());
    updateStatus();

    // Jumpscare logic for Level 3
    if (game.in_checkmate() && level === "3") {
        setTimeout(scare, 300);
    }
}

function getBestMove(moves) {
    // Simple AI: If it can take a piece, it will.
    for(var i=0; i<moves.length; i++) {
        if (moves[i].includes('x') || moves[i].includes('#')) return moves[i];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    window.setTimeout(makeMove, 250);
    updateStatus();
}

function scare() {
    $('#jumpscare').css('display', 'flex');
    document.getElementById('scare-audio').play();
    setTimeout(() => { location.reload(); }, 2500);
}

function updateStatus() {
    var status = game.turn() === 'b' ? "Ahmed is thinking..." : "Your turn";
    if (game.in_checkmate()) status = "CHECKMATE!";
    $status.html(status);
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);

$('#startBtn').on('click', function() {
    game.reset();
    board.start();
    updateStatus();
});
