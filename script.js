var board = null;
var game = new Chess();
var $status = $('#status');

function removeHighlights() {
    $('.square-55d60').removeClass('highlight-hint');
}

// LEVEL SELECTOR CHANGE: Update theme instantly
$('#level').on('change', function() {
    if ($(this).val() === "3") {
        $('body').addClass('scary-mode');
    } else {
        $('body').removeClass('scary-mode');
    }
});

function onMouseoverSquare(square) {
    var moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    
    // Dot on the piece you are holding
    $('#myBoard .square-' + square).addClass('highlight-hint');
    // Dots on target squares
    for (var i = 0; i < moves.length; i++) {
        $('#myBoard .square-' + moves[i].to).addClass('highlight-hint');
    }
}

function onMouseoutSquare() {
    removeHighlights(); // Dots disappear when cursor leaves square
}

function onDrop(source, target) {
    removeHighlights();
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    window.setTimeout(makeMove, 250);
    updateStatus();
}

function makeMove() {
    removeHighlights();
    if (game.game_over()) {
        checkGameOver();
        return;
    }

    var level = $('#level').val();
    var moves = game.moves();
    var move;

    if (level === "1") {
        move = moves[Math.floor(Math.random() * moves.length)];
    } else {
        // Impossible AI logic
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
        move = bestMove || moves[0];
    }

    game.move(move);
    board.position(game.fen());
    updateStatus();
    
    if (game.game_over()) {
        checkGameOver();
    }
}

function checkGameOver() {
    var level = $('#level').val();
    // Level 3 Rule: Lose OR Win = Jumpscare
    if (level === "3") {
        setTimeout(scare, 500);
    }
}

function evaluateBoard(board) {
    var total = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var piece = board[i][j];
            if (piece) {
                var val = piece.type === 'p' ? 10 : piece.type === 'r' ? 50 : piece.type === 'n' ? 30 : piece.type === 'b' ? 30 : piece.type === 'q' ? 90 : 900;
                total += (piece.color === 'w' ? val : -val);
            }
        }
    }
    return total;
}

function scare() {
    $('#jumpscare').css('display', 'flex');
    document.getElementById('scare-audio').play();
    setTimeout(() => { location.reload(); }, 2500);
}

function updateStatus() {
    var status = game.turn() === 'b' ? "Ahmed's Turn" : "Your Turn";
    if (game.in_checkmate()) status = "GAME OVER";
    $status.html(status);
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: (s, p) => { if (game.game_over() || p.search(/^b/) !== -1) return false },
    onDrop: onDrop,
    onSnapEnd: () => { board.position(game.fen()); removeHighlights(); },
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
$('#startBtn').on('click', function() { game.reset(); board.start(); updateStatus(); removeHighlights(); });
