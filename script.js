var board;
var game = new Chess();

// 🔊 voice
function speak(text) {
    speechSynthesis.cancel();
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.8;
    speechSynthesis.speak(msg);
}

// 🎬 GIF RESULT
function showResult(type) {
    const screen = document.getElementById("resultScreen");
    const gif = document.getElementById("resultGif");

    if (type === "win") {
        gif.src = "https://media.tenor.com/2roX3uxz_68AAAAC/winner.gif";
    } else {
        gif.src = "https://media.tenor.com/o7Bpr6QZQxIAAAAC/sad-cry.gif";
    }

    screen.style.display = "flex";

    setTimeout(() => location.reload(), 4000);
}

// 🎯 highlight
function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight');
}

function showMoves(square, piece) {
    removeHighlights();
    if (!piece || piece[0] !== 'w') return;

    let moves = game.moves({ square: square, verbose: true });

    moves.forEach(m => {
        $('#myBoard .square-' + m.to).addClass('highlight');
    });
}

// 🧠 AI
function minimax(depth, isMax) {
    if (depth === 0) return evaluateBoard();

    let moves = game.moves();

    if (isMax) {
        let best = -9999;
        for (let m of moves) {
            game.move(m);
            best = Math.max(best, minimax(depth - 1, false));
            game.undo();
        }
        return best;
    } else {
        let best = 9999;
        for (let m of moves) {
            game.move(m);
            best = Math.min(best, minimax(depth - 1, true));
            game.undo();
        }
        return best;
    }
}

function getBestMove(depth) {
    let bestMove = null;
    let bestValue = -9999;

    game.moves().forEach(m => {
        game.move(m);
        let val = minimax(depth - 1, false);
        game.undo();

        if (val > bestValue) {
            bestValue = val;
            bestMove = m;
        }
    });

    return bestMove;
}

function evaluateBoard() {
    const val = { p:1, n:3, b:3, r:5, q:9, k:0 };
    let total = 0;

    game.board().forEach(row => {
        row.forEach(p => {
            if (p) total += p.color === 'w' ? val[p.type] : -val[p.type];
        });
    });

    return total;
}

// 🤖 AI move
function makeMove() {
    if (game.game_over()) return endGame();

    let depth = $('#level').val();
    let move = getBestMove(depth);

    game.move(move);
    board.position(game.fen());

    speak("Your move is weak.");
    updateStatus();

    if (game.game_over()) endGame();
}

// 💀 end game
function endGame() {
    if (game.in_checkmate()) {
        if (game.turn() === 'b') {
            speak("Impossible... you passed.");
            showResult("win");
        } else {
            speak("You failed.");
            showResult("lose");
        }
    }
}

// 📊 status
function updateStatus() {
    let status = game.turn() === 'w' ? "Your Turn" : "Ahmed Thinking...";
    $('#status').text(status);
}

// ♟️ board init (FIXED PIECES)
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',

    onDragStart: function (s, p) {
        if (game.game_over()) return false;
        if (p.search(/^b/) !== -1) return false;
    },

    onDrop: function (source, target) {
        removeHighlights();

        let move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        speak("Hmm...");
        updateStatus();

        setTimeout(makeMove, 250);
    },

    onMouseoverSquare: showMoves,
    onMouseoutSquare: removeHighlights,

    onSnapEnd: function () {
        board.position(game.fen());
    }
});

// restart
$('#startBtn').on('click', function () {
    game.reset();
    board.start();
    updateStatus();
    removeHighlights();
});
