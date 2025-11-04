import React, { useState, useEffect } from 'react';
import { INITIAL_STATE, dropPiece } from './utils/gameLogic';
import { ROWS, COLUMNS, PLAYER_COLORS, LOCAL_STORAGE_KEY, BORDER_SIZE, CELL_SIZE } from './utils/types';
import type { Player, AnimatedGameState, GameState, ValidationOutput } from './utils/types';
import { validator } from './utils/validator';
import './App.css';

//начальное состояние для новой игры
const INITIAL_ANIMATED_STATE: AnimatedGameState = {
    ...INITIAL_STATE,
    lastDropPosition: null,
    steps: [],
};

//загрузка игры из local storage
const getInitialState = (): AnimatedGameState => {
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            const parsedState: GameState = JSON.parse(savedState);

            return {
                ...parsedState,
                steps: parsedState.steps || [],
                lastDropPosition: null,
            } as AnimatedGameState;
        }
    } catch (error) {
        console.error("Ошибка загрузки состояния игры:", error);
    }
    return INITIAL_ANIMATED_STATE;
};

//компонент модального окна для завершения игры
const GameOverModal: React.FC<{
    show: boolean,
    showContent: boolean,
    message: string,
    messageClass: string,
    onRestart: () => void,
    onShowHistory: () => void
}> = ({ show, showContent, message, messageClass, onRestart, onShowHistory }) => {

    return (
        <div className={`modal-backdrop ${show ? 'show' : ''}`}>
            <div className={`modal-content ${showContent ? 'visible' : ''}`}>
                <h2>Игра окончена!</h2>
                <p className={messageClass}>{message}</p>

                <button className="restart-button" onClick={onRestart}>
                    НАЧАТЬ НОВУЮ ИГРУ
                </button>

                <button
                    onClick={onShowHistory}
                    className="button-history"
                >
                    ПОКАЗАТЬ ИСТОРИЮ ХОДОВ
                </button>
            </div>
        </div>
    );
};

//компонент модального окна валидатора
interface HistoryModalProps {
    steps: number[];
    onClose: () => void;
}
const HistoryModal: React.FC<HistoryModalProps> = ({ steps, onClose }) => {
    const history: ValidationOutput = validator(steps);
    const stepKeys = Object.keys(history).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));

    return (
        <div className="modal-backdrop show">
            <div className={`modal-content visible history-modal`}>
                <h2>Полная история игры</h2>

                <div className="history-list">
                    {stepKeys.map(key => {
                        const stepData = history[key];
                        const stepNum = parseInt(key.slice(5));
                        const isFinal = stepData.board_state !== 'pending' && stepNum > 0;

                        const playerTurn = stepNum > 0 ? (stepNum % 2 !== 0 ? 'Player1' : 'Player2') : '---';
                        const lastMoveCol = stepNum > 0 ? steps[stepNum - 1] : null;

                        return (
                            <div key={key} className={`history-item ${isFinal ? 'final-step' : ''}`}>

                                <h4>{key.toUpperCase()}</h4>

                                {lastMoveCol !== null && (
                                    <p>
                                        **Ход:** {playerTurn} бросил фишку в **Столбец {lastMoveCol + 1}**
                                    </p>
                                )}

                                <p>
                                    **Статус игры:** *{stepData.board_state.toUpperCase()}*
                                </p>

                                {stepData.board_state === 'win' && stepData.winner && (
                                    <div className="winner-info">
                                        **Победитель:** **{stepData.winner.who.toUpperCase()}**
                                        <br/>
                                        Победная линия: ({stepData.winner.positions.map(p => `[${p[0]}, ${p[1]}]`).join(', ')})
                                    </div>
                                )}
                                <p>
                                    Фишек P1: {stepData.player_1.length}, Фишек P2: {stepData.player_2.length}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <button onClick={onClose} className="restart-button">
                    ЗАКРЫТЬ
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [gameState, setGameState] = useState<AnimatedGameState>(getInitialState);
    const [showModalContent, setShowModalContent] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const { board, currentPlayer, isGameOver, winner, winningPositions, lastDropPosition, steps } = gameState;

    //перезагрузка игры
    const restartGame = () => {
        setGameState(INITIAL_ANIMATED_STATE);
        setShowModalContent(false);
        setShowHistory(false);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

    //обработчик клика по стрелке
    const handleColumnClick = (col: number) => {
        // Блокировка: игра окончена ИЛИ идет анимация
        // Блокировка: игра окончена ИЛИ идет анимация
        if (isGameOver || lastDropPosition !== null) return;

        //обновление состояния
        setGameState((prevState: AnimatedGameState) => {
            const nextStateWithTarget = dropPiece(prevState, col);
            const { targetRow, ...nextState } = nextStateWithTarget;

            if (targetRow !== null) {
                // Логика записи хода:
                const newSteps = [...prevState.steps, col];

                return {
                    ...nextState,
                    lastDropPosition: [targetRow, col],
                    steps: newSteps, // Сохраняем историю ходов
                } as AnimatedGameState;
            }

            return prevState;
        });
    };

    //обработчик модальных окон
    const handleShowHistory = () => {
        setShowHistory(true);
        setShowModalContent(false); // Скрываем модальное окно победы
    };

    //сохранение состояния в local storage
    useEffect(() => {
        const stateToSave: GameState = {
            board: gameState.board,
            currentPlayer: gameState.currentPlayer,
            isGameOver: gameState.isGameOver,
            winner: gameState.winner,
            winningPositions: gameState.winningPositions,
            steps: gameState.steps, // СОХРАНЯЕМ ИСТОРИЮ
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [gameState]);


    //сброс lastDropPosition после завершения анимации падения
    useEffect(() => {
        if (lastDropPosition) {
            const animationDuration = 500; // 0.5s из CSS
            const timer = setTimeout(() => {
                setGameState(prevState => ({ ...prevState, lastDropPosition: null }));
            }, animationDuration + 50);

            return () => clearTimeout(timer);
        }
    }, [lastDropPosition]);

    //управление задержкой модального окна
    useEffect(() => {
        if (isGameOver && !showHistory) {
            const delayTimer = setTimeout(() => {
                setShowModalContent(true);
            }, 2000);

            return () => clearTimeout(delayTimer);
        } else {
            setShowModalContent(false);
        }
    }, [isGameOver, showHistory]);

    //выделение ячейки, которая в победной линии
    const isWinningPiece = (r: number, c: number): boolean => {
        return winningPositions.some(pos => pos[0] === r && pos[1] === c);
    };

    //перевод названия игрока в нужный нам формат именип
    const getColorName = (player: Player): string => {
        if (!player) return 'empty';
        return PLAYER_COLORS[player].toLowerCase();
    };

    //компонент для отображения одной ячейки
    const Cell: React.FC<{ player: Player, row: number, col: number }> = ({ player, row, col }) => {
        const pieceClass = player ? `piece-${getColorName(player)}` : 'piece-empty';
        const winningClass = isWinningPiece(row, col) ? 'piece-winner' : '';
        const isLastDrop = lastDropPosition && lastDropPosition[0] === row && lastDropPosition[1] === col;
        const animationClass = isLastDrop ? 'piece-animate-drop' : '';

        let dropHeightStyle = {};
        if (isLastDrop) {
            const dropDistance = (row + 1) * (CELL_SIZE + 2 * BORDER_SIZE);
            dropHeightStyle = { '--drop-height': `-${dropDistance}px` } as React.CSSProperties;
        }

        return (
            <div className="cell">
                {player && (
                    <div
                        className={`piece ${pieceClass} ${winningClass} ${animationClass}`}
                        style={dropHeightStyle}
                    ></div>
                )}
            </div>
        );
    };

    //компонент для области стрелки
    const ColumnClickArea: React.FC = () => (
        <div className="click-area">
            {Array.from({ length: COLUMNS }).map((_, c) => (
                <div
                    key={c}
                    className={`column-selector ${isGameOver || lastDropPosition !== null ? 'disabled' : ''}`}
                    onClick={() => handleColumnClick(c)}
                >
                    {/* Показываем стрелку только если игра не окончена И нет анимации */}
                    {!isGameOver && lastDropPosition === null && (
                        <span
                            className={`arrow current-player-${getColorName(currentPlayer)}`}
                        >
                            ⬇
                        </span>
                    )}
                </div>
            ))}
        </div>
    );

    const statusMessage = isGameOver
        ? winner
            ? `Победитель: ${winner}!`
            : 'Ничья!'
        : `Текущий ход: ${currentPlayer}`;

    const statusClass = isGameOver
        ? (winner ? `winner-${getColorName(winner)}` : 'draw')
        : `current-player-${getColorName(currentPlayer)}`;

    return (
        <div className="game-container" >
            <h1>Игра "4 в ряд"</h1>

            {/* статус и кнопка сброса видны, пока не показано модальное окно */}
            {!showModalContent && !showHistory && (
                <>
                    <p className={`status-message ${statusClass}`}>
                        {statusMessage}
                    </p>

                    <div className="button-group">
                        <button className="restart-button" onClick={restartGame}>
                            Сбросить игру
                        </button>
                    </div>
                </>
            )}


            <div className="board-wrapper">
                <ColumnClickArea />

                <div className="board">
                    {Array.from({ length: ROWS }).map((_, r) => (
                        <div key={r} className="row">
                            {Array.from({ length: COLUMNS }).map((_, c) => (
                                <Cell
                                    key={c}
                                    player={board[r][c]}
                                    row={r}
                                    col={c}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* модальное окно победы */}
            <GameOverModal
                show={isGameOver}
                showContent={showModalContent}
                message={statusMessage}
                messageClass={statusClass}
                onRestart={restartGame}
                onShowHistory={handleShowHistory}
            />

            {/* модальное окно истории */}
            {showHistory && (
                <HistoryModal
                    steps={steps}
                    onClose={() => setShowHistory(false)}
                />
            )}

        </div>
    );
};

export default App;