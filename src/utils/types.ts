//константы количества строк и столбцов
export const ROWS = 6;
export const COLUMNS = 7;

//константы для размеров элементов
export const CELL_SIZE = 60;
export const BORDER_SIZE = 1;

// тип игроков
export type Player = 'Player1' | 'Player2' | null;

// игровое поле, которое хранит игроков
export type BoardState = Player[][];

//позиция фишек
export type Position = [number, number];

//какой ID соответствует какому цвету
export const PLAYER_COLORS = {
    Player1: 'Red',
    Player2: 'Blue',
};

//состояние игры
export interface GameState {
    board: BoardState;
    currentPlayer: Player;
    isGameOver: boolean;
    winner: Player | null;
    winningPositions: Position[];
    steps: number[];
}

//состояние для анимации падения
export interface AnimatedGameState extends GameState {
    lastDropPosition: Position | null;
}


/*------------------ВАЛИДАТОР------------------------*/

//ключ для localStorage
export const LOCAL_STORAGE_KEY = 'connectFourGameState';

//информация о победе (победивший и массив из 4 победных позиций)
export interface WinnerInfo {
    who: 'player_1' | 'player_2';
    positions: Position[];
}

//тип статуса игры
export type BoardStateValue = 'waiting' | 'pending' | 'win' | 'draw';

//структурированная информация об игре
export interface StepDetails {
    player_1: Position[]; //координаты фишек игрока 1
    player_2: Position[]; //координаты фишек игрока 2
    board_state: BoardStateValue;
    winner?: WinnerInfo;
}

//полная схема игры (итог валидатора)
export interface ValidationOutput {
    [key: string]: StepDetails;
}