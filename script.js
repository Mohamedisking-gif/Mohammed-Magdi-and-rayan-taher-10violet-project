var board = null;
var game = new Chess();
var $status = $('#status');

// --- 1. HIGHLIGHTING LOGIC ---

function removeHighlights() {
    $('#myBoard .square-55d60').removeClass('highlight-hint');
}

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they hovered over
    $('#myBoard .square-' + square).addClass('highlight-hint');

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        $('#myBoard .square-' + moves[i].to).addClass('highlight-hint');
    }
}

function onMouseoutSquare(square, piece) {
    removeHighlights();
}

// --- 2. AI & LEVELS LOGIC ---

function makeMove() {
    removeHighlights(); // Ensure board is clean before AI moves
    var moves = game.moves();
    if (game.game_over()) return;

    var level = $('#level').val();
    var move;

    if (level === "1") {
        // Level 1: Random (Easy)
        move = moves[Math.floor(Math.random() * moves.length)];
    } else if (level === "2") {
        // Level 2: Smart (Captures/Checkmates)
        move = getBestMove(moves);
    } else {
        // Level 3: Impossible (Deep Search)
        move = getImpossibleMove(game);
    }

    game.move(move);
    board.position(game.fen());
    updateStatus();

    // Check for Jumpscare if User loses on Level 3
    if (game.in_checkmate() && level === "3") {
        setTimeout(scare, 400);
    }
}

// Basic capture-logic for Level 2
function getBestMove(moves) {
    for (var i = 0; i < moves.length; i++) {
        if (moves[i].includes('x') || moves[i].includes('#')) return moves[i];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

// Simple Minimax for Level 3 "Impossible"
function getImpossibleMove(game) {
    var moves = game.moves();
    var bestMove = null;
    var bestValue = Infinity;

    for (var i = 0; i < moves.length; i++) {
        game.move(moves[i]);
        var boardValue = evaluateBoard(game.board());
        game.undo();
        if (boardValue < bestValue) {
            bestValue = boardValue;
            bestMove = moves[i];
        }
    }
    return bestMove || moves[0];
}

function evaluateBoard(board) {
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece) {
    if (piece === null) return 0;
    var val = 0;
    if (piece.type === 'p') val = 10;
    else if (piece.type === 'r') val = 50;
    else if (piece.type === 'n') val = 30;
    else if (piece.type === 'b') val = 30;
    else if (piece.type === 'q') val = 90;
    else if (piece.type === 'k') val = 900;
    return piece.color === 'w' ? val : -val;
}

// --- 3. CORE GAME FUNCTIONS ---

function onDrop(source, target) {
    removeHighlights(); // FIX: Clear highlights as soon as piece is dropped

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    window.setTimeout(makeMove, 250);
    updateStatus();
}

function updateStatus() {
    var status = game.turn() === 'b' ? "Ahmed is thinking..." : "Your turn";
    if (game.in_checkmate()) status = "CHECKMATE!";
    else if (game.in_draw()) status = "DRAW!";
    $status.html(status);
}

function scare() {
    $('#jumpscare').css('display', 'flex');
    var audio = document.getElementById('scare-audio');
    audio.play().catch(e => console.log("Audio play blocked until user clicks board"));
    setTimeout(() => {
        location.reload();
    }, 2500);
}

// --- 4. INITIALIZATION ---

var config = {
    draggable: true,
    position: 'start',
    onDragStart: function(s, p) {
        if (game.game_over() || p.search(/^b/) !== -1) return false;
    },
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
    removeHighlights();
});
