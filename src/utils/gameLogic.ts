import { ROWS, COLUMNS } from "./types";
import type { Player, BoardState, Position, GameState } from "./types";

//направления для проверки победы
const DIRECTIONS: Position[] = [
    [0, 1],   //горизонтально вправо
    [1, 0],   //вертикально вниз
    [1, 1],   //диагональ вниз-вправо
    [1, -1],  //диагональ вниз-влево
];

//проверка победы
export const checkWin = (board: BoardState, row: number, col: number, player: Player): Position[] | null => {
    if (!player) return null;

    for (const [dr, dc] of DIRECTIONS) {

        const segmentSize = 4;

        for (let i = -segmentSize + 1; i <= 0; i++) {
            const line: Position[] = [];
            let count = 0;

            for (let j = 0; j < segmentSize; j++) {
                const r = row + dr * (i + j);
                const c = col + dc * (i + j);

                //проверка границ
                if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS) {
                    count = 0;
                    break;
                }

                if (board[r][c] === player) {
                    count++;
                    line.push([r, c]);
                } else {
                    count = 0;
                    break;
                }
            }

            //если найдена линия из 4 фишек
            if (count === segmentSize) {
                return line;
            }
        }
    }
    return null;
};

//проверка ничьей
export const checkDraw = (board: BoardState): boolean => {
    for (let c = 0; c < COLUMNS; c++) {
        if (board[0][c] === null) {
            return false;
        }
    }
    return true;
};

//создание пустой доски
export const createEmptyBoard = (rows: number, cols: number): BoardState => {
    return Array(rows).fill(null).map(() => Array(cols).fill(null) as Player[]);
};

//инициализация новой игры
export const INITIAL_STATE: GameState = {
    board: createEmptyBoard(ROWS, COLUMNS),
    currentPlayer: 'Player1',
    isGameOver: false,
    winner: null,
    winningPositions: [],
    steps: [], // <-- ВОССТАНОВЛЕНО
};

//поиск нижней свободной строки
export const findLowestFreeRow = (board: BoardState, col: number): number | null => {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === null) {
            return r;
        }
    }
    return null;
};

//падение фишки
export const dropPiece = (state: GameState, col: number): GameState & { targetRow: number | null } => {
    if (state.isGameOver) return { ...state, targetRow: null };

    const { board, currentPlayer } = state;
    const targetRow = findLowestFreeRow(board, col);

    if (targetRow === null) {
        return { ...state, targetRow: null };
    }

    //создание копии доски
    const newBoard = board.map(arr => [...arr]);
    newBoard[targetRow][col] = currentPlayer;

    const winningLine = checkWin(newBoard, targetRow, col, currentPlayer);


    if (winningLine) {
        return {
            ...state,
            board: newBoard,
            isGameOver: true,
            winner: currentPlayer,
            winningPositions: winningLine,
            currentPlayer: currentPlayer,
            targetRow: targetRow,
        };
    }

    if (checkDraw(newBoard)) {
        return {
            ...state,
            board: newBoard,
            isGameOver: true,
            winner: null,
            winningPositions: [],
            targetRow: targetRow,
        };
    }

    //смена игрока
    const nextPlayer = currentPlayer === 'Player1' ? 'Player2' : 'Player1';

    return {
        board: newBoard,
        currentPlayer: nextPlayer,
        isGameOver: false,
        winner: null,
        winningPositions: [],
        targetRow: targetRow,
        steps: state.steps,
    };
};