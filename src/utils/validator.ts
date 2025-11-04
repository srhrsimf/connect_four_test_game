import { ROWS, COLUMNS, } from "./types";
import type { Position, BoardState, Player, ValidationOutput, StepDetails, WinnerInfo } from "./types";
import { createEmptyBoard, findLowestFreeRow, checkWin, checkDraw } from "./gameLogic";

//перевод названия игрока в нужный нам формат имени
//(служит для того, что бы в коде было только 2 переменные, а пользователь видел другие)
const PlayerMap: Record<'Player1' | 'Player2', 'player_1' | 'player_2'> = {
    'Player1': 'player_1',
    'Player2': 'player_2',
};

export const validator = (steps: number[]): ValidationOutput => {
    let currentBoard: BoardState = createEmptyBoard(ROWS, COLUMNS);
    const player1Positions: Position[] = [];
    const player2Positions: Position[] = [];

    //результат, который будет возвращен
    const output: ValidationOutput = {};

    //начальное состояние в объекте, который будет финальным
    output[`step_0`] = {
        player_1: [],
        player_2: [],
        board_state: 'waiting',
    };

    //обработка шагов
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        const col = steps[stepIndex];
        const stepKey = `step_${stepIndex + 1}`;
        const currentPlayer: Player = (stepIndex % 2 === 0) ? 'Player1' : 'Player2';
        const currentPlayerPositions = currentPlayer === 'Player1' ? player1Positions : player2Positions;
        const targetRow = findLowestFreeRow(currentBoard, col);
        const prevStepKey = `step_${stepIndex}`;
        const prevBoardState = output[prevStepKey].board_state;
        let boardState: StepDetails;

        //если предыдущий шаг уже был "win" или "draw", просто копируем последнее состояние
        if (prevBoardState === 'win' || prevBoardState === 'draw') {
            boardState = { ...output[prevStepKey] };
        }
        //если столбец полон
        else if (targetRow === null) {
            boardState = { ...output[prevStepKey] };
        }

        //основная логика
        else {
            const row = targetRow;

            //создаем новую доску
            const newBoard: BoardState = currentBoard.map(arr => [...arr]);
            newBoard[row][col] = currentPlayer;

            //обновляем список позиций
            const newPosition: Position = [row, col];
            currentPlayerPositions.push(newPosition); // [row, col]

            //запоминаем новую доску для следующего шага
            currentBoard = newBoard;

            //проверка победы
            const winningLine = checkWin(newBoard, row, col, currentPlayer);

            if (winningLine) {
                const winnerInfo: WinnerInfo = {
                    who: PlayerMap[currentPlayer],
                    positions: winningLine, // [row, col]
                };

                boardState = {
                    player_1: [...player1Positions],
                    player_2: [...player2Positions],
                    board_state: 'win',
                    winner: winnerInfo,
                };
            }

            //проверка ничьей
            else if (checkDraw(newBoard)) {
                boardState = {
                    player_1: [...player1Positions],
                    player_2: [...player2Positions],
                    board_state: 'draw',
                };
            }
            else {
                boardState = {
                    player_1: [...player1Positions],
                    player_2: [...player2Positions],
                    board_state: 'pending',
                };
            }
        }

        //сохранение состояния текущего шага
        output[stepKey] = boardState;
    }

    return output;
};