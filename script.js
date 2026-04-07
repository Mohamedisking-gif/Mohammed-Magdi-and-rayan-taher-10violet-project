var board;
var game = new Chess();

 VOICE ENGINE
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.pitch = 0.8;
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
    }
}

 PIECE VALUES
const weights = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function evaluateBoard(gameInstance) {
    let total = 0;
    gameInstance.board().forEach(row => {
        row.forEach(piece => {
            if (piece) {
                let val = weights[piece.type];
                total += (piece.color === 'w' ? val : -val);
            }
        });
    });
    return total;
}

 MINIMAX ALGORITHM (Logical Thinking)
function minimax(gameInstance, depth, isMaximizingPlayer) {
    if (depth === 0 || gameInstance.game_over()) {
        return evaluateBoard(gameInstance);
    }

    let moves = gameInstance.moves();

    if (isMaximizingPlayer) {
        let bestScore = -Infinity;
        for (let move of moves) {
            gameInstance.move(move);
            bestScore = Math.max(bestScore, minimax(gameInstance, depth - 1, false));
            gameInstance.undo();
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let move of moves) {
            gameInstance.move(move);
            bestScore = Math.min(bestScore, minimax(gameInstance, depth - 1, true));
            gameInstance.undo();
        }
        return bestScore;
    }
}

  GET BEST MOVE
function getBestMove() {
    let moves = game.moves();
    let bestMove = null;
    let bestValue = Infinity; // AI (Black) wants the lowest score possible

    // Depth based on user level selection
    let depth = parseInt($('#level').val()) || 1;

    moves.forEach(move => {
        game.move(move);
        let boardValue = minimax(game, depth - 1, true);
        game.undo();
        if (boardValue < bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    });
    return bestMove;
}

 TEACHER LINES
function getTeacherLine() {
    if (game.in_checkmate()) return "Checkmate. You failed the exam.";
    if (game.in_check()) return "You are in check. Solve it.";
    
    let score = evaluateBoard(game);
    if (score < -5) return "Impressive... but can you finish the game?";
    if (score > 5) return "This performance is unacceptable.";
    return "Think harder.";
}

 AI EXECUTION
function makeMove() {
    if (game.game_over()) return endGame();

    let move = getBestMove();
    game.move(move);
    board.position(game.fen());
    
    updateStatus();
    speak(getTeacherLine());

    if (game.game_over()) endGame();
}

 END GAME
function endGame() {
    let playerWon = game.in_checkmate() && game.turn() === 'b';

    if (playerWon) {
        speak("A perfect score! You pass.");
        const audio = document.getElementById('scare-audio');
        audio.play().catch(() => {});
        $('#jumpscare').css('display', 'flex');
        setTimeout(() => location.reload(), 7000);
    } else {
        speak("Failed. Sit down.");
        alert("Game Over: Ahmed Won.");
    }
}

function updateStatus() {
    let status = game.turn() === 'w' ? "Your Turn" : "Ahmed is calculating...";
    if (game.in_checkmate()) status = "FINISHED";
    $('#status').text(status);
}

// 🏁 BOARD SETUP
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart: function (source, piece) {
        if (game.game_over() || piece.search(/^b/) !== -1) return false;
    },
    onDrop: function (source, target) {
        let move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';

        updateStatus();
        window.setTimeout(makeMove, 500);
    },
    onSnapEnd: function () {
        board.position(game.fen());
    }
};

board = Chessboard('myBoard', config);

$('#startBtn').on('click', function () {
    game.reset();
    board.start();
    updateStatus();
    speak("The final exam starts now.");
});
