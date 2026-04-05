var board = null;
var game = new Chess();
var $status = $('#status');

function removeHighlights() {
    $('#myBoard .square-55d60').removeClass('highlight-hint');
}

$('#level').on('change', function() {
    if ($(this).val() === "3") { $('body').addClass('scary-mode'); } 
    else { $('body').removeClass('scary-mode'); }
});

function onMouseoverSquare(square, piece) {
    removeHighlights(); // Clear old ones first!
    var moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    
    for (var i = 0; i < moves.length; i++) {
        $('#myBoard .square-' + moves[i].to).addClass('highlight-hint');
    }
}

function onMouseoutSquare() {
    removeHighlights();
}

function makeMove() {
    removeHighlights();
    var moves = game.moves();
    if (game.game_over()) { checkEnd(); return; }

    var level = $('#level').val();
    var move = (level === "1") ? moves[Math.floor(Math.random() * moves.length)] : getBestMove(moves);

    game.move(move);
    board.position(game.fen());
    updateStatus();
    if (game.game_over()) checkEnd();
}

function getBestMove(moves) {
    for(var i=0; i<moves.length; i++) {
        if (moves[i].includes('x') || moves[i].includes('#')) return moves[i];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

function checkEnd() {
    if ($('#level').val() === "3") {
        setTimeout(triggerScare, 500);
    }
}

function triggerScare() {
    $('#jumpscare').css('display', 'flex');
    document.getElementById('scare-audio').play();
    setTimeout(() => { location.reload(); }, 3000);
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
    onDrop: (source, target) => {
        var move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';
        removeHighlights();
        window.setTimeout(makeMove, 250);
        updateStatus();
    },
    onSnapEnd: () => { board.position(game.fen()); removeHighlights(); },
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
$('#startBtn').on('click', function() { game.reset(); board.start(); updateStatus(); removeHighlights(); });
