var board = null;
var game = new Chess();
var $status = $('#status');

// --- 1. HIGHLIGHTING LOGIC (The "Eraser") ---

function removeHighlights() {
    // This targets the specific class we use for hints
    $('#myBoard .square-55d60').removeClass('highlight-hint');
}

function onMouseoverSquare(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    $('#myBoard .square-' + square).addClass('highlight-hint');

    for (var i = 0; i < moves.length; i++) {
        $('#myBoard .square-' + moves[i].to).addClass('highlight-hint');
    }
}

function onMouseoutSquare(square, piece) {
    removeHighlights();
}

// --- 2. AI & LEVELS LOGIC ---

function makeMove() {
    removeHighlights(); 
    var moves = game.moves();
    if (game.game_over()) return;

    var level = $('#level').val();
    var move;

    if (level === "1") {
        move = moves[Math.floor(Math.random() * moves.length)];
    } else if (level === "2") {
        move = getBestMove(moves);
    } else {
        // Level 3: Ahmed is in "Impossible" mode
        move = getImpossibleMove(game);
    }

    game.move(move);
    board.position(game.fen());
    updateStatus();

    if (game.in_checkmate() && level === "3") {
        setTimeout(scare, 400);
    }
}

function getBestMove(moves) {
    for (var i = 0; i < moves.length; i++) {
        if (moves[i].includes('x') || moves[i].includes('#')) return moves[i];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

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
            var piece = board[i][j];
            if (piece) {
                var val = (piece.type === 'p') ? 10 : (piece.type === 'r') ? 50 : (piece.type === 'n') ? 30 : (piece.type === 'b') ? 30 : (piece.type === 'q') ? 90 : 900;
                totalEvaluation += (piece.color === 'w' ? val : -val);
            }
        }
    }
    return totalEvaluation;
}

// --- 3. CORE GAME FUNCTIONS ---

function onDrop(source, target) {
    removeHighlights(); // Wipe highlights as soon as you let go

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    window.setTimeout(makeMove, 250);
    updateStatus();
}

// THIS IS THE FIX: It clears highlights after the animation finishes
function onSnapEnd() {
    board.position(game.fen());
    removeHighlights(); 
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
    audio.play().catch(e => console.log("Audio play blocked"));
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
    onSnapEnd: onSnapEnd, // Added the snapback/animation cleanup
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
