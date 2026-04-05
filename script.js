var board;
var game = new Chess();
var selectedSquare = null;

// 🔊 VOICE
function speak(text) {
    speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1;
    msg.pitch = 0.7;

    speechSynthesis.speak(msg);
}

// 👨‍🏫 SMART TEACHER TALK
function getTeacherLine() {
    let score = evaluateBoard(game);

    if (game.in_checkmate()) return "You failed the exam.";

    if (score > 5) return "This is embarrassing.";
    if (score > 2) return "Too many mistakes.";
    if (score > 0) return "Not good.";
    if (score === 0) return "Acceptable.";
    if (score < 0) return "Hmm... improving.";

    return "Focus.";
}

// 🎯 HIGHLIGHTS
function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight');
}

function onClickSquare(square, piece) {
    removeHighlights();

    if (!piece || piece[0] !== 'w') return;

    selectedSquare = square;

    let moves = game.moves({
        square: square,
        verbose: true
    });

    moves.forEach(m => {
        $('#myBoard .square-' + m.to).addClass('highlight');
    });
}

// 🧠 AI
function minimax(depth, game, isMax) {
    if (depth === 0) return evaluateBoard(game);

    let moves = game.moves();

    if (isMax) {
        let best = -9999;
        for (let m of moves) {
            game.move(m);
            best = Math.max(best, minimax(depth - 1, game, false));
            game.undo();
        }
        return best;
    } else {
        let best = 9999;
        for (let m of moves) {
            game.move(m);
            best = Math.min(best, minimax(depth - 1, game, true));
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
        let value = minimax(depth - 1, game, false);
        game.undo();

        if (value > bestValue) {
            bestValue = value;
            bestMove = m;
        }
    });

    return bestMove;
}

// ♟️ BOARD VALUE
function evaluateBoard(game) {
    const val = { p:1, n:3, b:3, r:5, q:9, k:0 };
    let total = 0;

    game.board().forEach(row => {
        row.forEach(piece => {
            if (piece) {
                total += piece.color === 'w' ? val[piece.type] : -val[piece.type];
            }
        });
    });

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

// ♟️ BOARD INIT
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',

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

        setTimeout(makeMove, 250);
        updateStatus();
    },

    onMouseoverSquare: onClickSquare,

    onSnapEnd: function () {
        board.position(game.fen());
    }
});

// 🔁 RESTART
$('#startBtn').on('click', function () {
    game.reset();
    board.start();
    updateStatus();
    removeHighlights();

    speak("Let's begin.");
});
