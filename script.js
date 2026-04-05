var board;
var game = new Chess();

// 🔊 VOICE (safe & simple)
function speak(text) {
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1;
    msg.pitch = 0.8;
    speechSynthesis.speak(msg);
}

// 👨‍🏫 SMART TEACHER LINES
function getTeacherLine() {
    let score = evaluateBoard();

    if (game.in_checkmate()) return "You failed the exam.";
    if (score > 5) return "This is embarrassing.";
    if (score > 2) return "Too many mistakes.";
    if (score > 0) return "Not good.";
    if (score === 0) return "Acceptable.";
    if (score < 0) return "Hmm... improving.";

    return "Focus.";
}

// 🎯 HIGHLIGHT MOVES
function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight');
}

function showMoves(square, piece) {
    removeHighlights();

    // only allow white pieces
    if (!piece || piece[0] !== 'w') return;

    let moves = game.moves({
        square: square,
        verbose: true
    });

    moves.forEach(m => {
        $('#myBoard .square-' + m.to).addClass('highlight');
    });
}

// 🧠 MINIMAX AI
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

    let moves = game.moves();

    for (let m of moves) {
        game.move(m);
        let value = minimax(depth - 1, false);
        game.undo();

        if (value > bestValue) {
            bestValue = value;
            bestMove = m;
        }
    }

    return bestMove;
}

// ♟️ BOARD EVALUATION
function evaluateBoard() {
    const val = { p:1, n:3, b:3, r:5, q:9, k:0 };
    let total = 0;

    let boardArr = game.board();

    for (let row of boardArr) {
        for (let piece of row) {
            if (piece) {
                total += piece.color === 'w'
                    ? val[piece.type]
                    : -val[piece.type];
            }
        }
    }

    return total;
}

// 🤖 AI MOVE
function makeMove() {
    if (game.game_over()) return endGame();

    let level = $('#level').val();
    let depth = level == 1 ? 1 : level == 2 ? 2 : 3;

    let move = getBestMove(depth);
    game.move(move);

    board.position(game.fen());

    speak(getTeacherLine());
    updateStatus();

    if (game.game_over()) endGame();
}

// 💀 END GAME
function endGame() {
    speak("Game over.");

    if ($('#level').val() === "3") {
        document.body.classList.add('scary');

        document.getElementById('scare-audio').play().catch(()=>{});
        $('#jumpscare').css('display', 'flex');

        setTimeout(() => location.reload(), 4000);
    }
}

// 📊 STATUS
function updateStatus() {
    let status = game.turn() === 'w' ? "Your Turn" : "Ahmed Thinking...";
    if (game.in_checkmate()) status = "CHECKMATE 💀";
    $('#status').text(status);
}

// ♟️ INIT BOARD (FIXED PIECES HERE)
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',

    // ✅ THIS FIXES YOUR BROKEN PIECES
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',

    onDragStart: function (source, piece) {
        if (game.game_over()) return false;
        if (piece.search(/^b/) !== -1) return false;
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

// 🔁 RESTART
$('#startBtn').on('click', function () {
    game.reset();
    board.start();
    removeHighlights();
    updateStatus();

    speak("Let's begin.");
});
