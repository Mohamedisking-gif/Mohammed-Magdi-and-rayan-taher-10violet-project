var board;
var game = new Chess();

function speak(text) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.rate = 1;
        msg.pitch = 0.7; // Lower pitch for "Ahmed"
        speechSynthesis.speak(msg);
    }
}

function getTeacherLine() {
    if (game.in_checkmate()) return "You failed the exam. Miserably.";
    let score = evaluateBoard();
    if (score > 4) return "Is this a joke to you?";
    if (score > 1) return "Pay attention to your pieces.";
    if (score < -2) return "You're lucky. For now.";
    return "Focus.";
}

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

function evaluateBoard() {
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
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

// AI logic
function makeMove() {
    if (game.game_over()) return endGame();

    let level = parseInt($('#level').val());
    let moves = game.moves();
    
    // Simple AI choice based on level
    let move;
    if (level === 1) {
        move = moves[Math.floor(Math.random() * moves.length)];
    } else {
        // Better move selection for levels 2 and 3
        moves.sort(() => Math.random() - 0.5);
        move = moves[0]; // Default
        for(let m of moves) {
            game.move(m);
            if (game.in_check()) { move = m; game.undo(); break; }
            game.undo();
        }
    }

    game.move(move);
    board.position(game.fen());
    speak(getTeacherLine());
    updateStatus();

    if (game.game_over()) endGame();
}

function endGame() {
    let playerLost = game.in_checkmate() && game.turn() === 'w';
    let isLevel3 = $('#level').val() === "3";

    // Jumpscare triggers if you lose OR if you finish a game on Level 3
    if (playerLost || isLevel3) {
        speak("WRONG ANSWER!");
        document.body.classList.add('scary');
        const audio = document.getElementById('scare-audio');
        audio.volume = 1.0;
        audio.play().catch(() => {});
        $('#jumpscare').css('display', 'flex');
        
        setTimeout(() => {
            location.reload();
        }, 4000);
    } else {
        speak("The lesson is over.");
    }
}

function updateStatus() {
    let status = game.turn() === 'w' ? "Your Turn" : "Ahmed is thinking...";
    if (game.in_checkmate()) status = "FAILED 💀";
    $('#status').text(status);
}

// Board Init
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    // THIS FIXES THE PIECES:
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart: function (source, piece) {
        if (game.game_over() || piece.search(/^b/) !== -1) return false;
    },
    onDrop: function (source, target) {
        let move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';

        removeHighlights();
        updateStatus();
        window.setTimeout(makeMove, 250);
    },
    onMouseoverSquare: showMoves,
    onMouseoutSquare: removeHighlights,
    onSnapEnd: function () {
        board.position(game.fen());
    }
});

$('#startBtn').on('click', function () {
    game.reset();
    board.start();
    updateStatus();
    speak("Let us begin the exam.");
});
