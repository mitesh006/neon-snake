import { useCallback, useEffect, useRef, useState} from "react";
import "./App.css";


const DIRECTIONS = {
  STOP: 0,
  RIGHT: 1,
  LEFT: 2,
  UP: 3,
  DOWN: 4,
};

export default function SnakeGame() {

const isMobile =
  window.innerWidth <= 900;

const GRID_WIDTH = isMobile
  ? 20
  : 40;

const GRID_HEIGHT = 20;

const CELL_SIZE = isMobile
  ? 16
  : 20;


  const initialSnake = [
    {
      x: Math.floor(GRID_WIDTH / 2),
      y: Math.floor(GRID_HEIGHT / 2),
    },
  ];

  const generateFruit = useCallback((snakeBody) => {
    while (true) {
    const position = {
      x: Math.floor(
        Math.random() * GRID_WIDTH
      ),
      y: Math.floor(
        Math.random() * GRID_HEIGHT
      ),
    };

    const overlaps = snakeBody.some(
      (segment) =>
        segment.x === position.x &&
        segment.y === position.y
    );

    if (!overlaps) {
      return position;
    }
  }
}, [GRID_WIDTH]);

  const [snake, setSnake] = useState(initialSnake);

  const [fruit, setFruit] = useState(
    generateFruit(initialSnake)
  );

  const [score, setScore] = useState(0);

  const [bestScore, setBestScore] = useState(
    Number(localStorage.getItem("snake-best")) || 0
  );

  const [speed, setSpeed] = useState(120);

  const [gameStarted, setGameStarted] =
    useState(false);

  const [gameOver, setGameOver] = useState(false);
  
  const [paused, setPaused] = useState(false);

  const directionRef = useRef(DIRECTIONS.STOP);

  const nextDirectionRef = useRef(
    DIRECTIONS.STOP
  );

  const gameLoopRef = useRef(null);

  const touchStartRef = useRef({
    x: 0,
    y: 0,
  });

  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
    gameOverRef.current = gameOver;
    pausedRef.current = paused;
  }, [gameStarted, gameOver, paused]);

  
    const startGame = useCallback(() => {
    const freshSnake = [
      {
        x: Math.floor(GRID_WIDTH / 2),
        y: Math.floor(GRID_HEIGHT / 2),
      },
    ];

    setSnake(freshSnake);

    setFruit(generateFruit(freshSnake));

    directionRef.current = DIRECTIONS.STOP;

    nextDirectionRef.current =
      DIRECTIONS.STOP;

    setScore(0);

    setSpeed(120);

    setPaused(false);

    setGameOver(false);

    setGameStarted(true);
}, [generateFruit, GRID_WIDTH]);
  const togglePause = () => {
    if (
      !gameStartedRef.current ||
      gameOverRef.current
    )
      return;

    setPaused((prev) => !prev);
  };

  const handleDirection = (newDirection) => {
    const current = directionRef.current;

    if (
      (newDirection === DIRECTIONS.UP &&
        current === DIRECTIONS.DOWN) ||
      (newDirection === DIRECTIONS.DOWN &&
        current === DIRECTIONS.UP) ||
      (newDirection === DIRECTIONS.LEFT &&
        current === DIRECTIONS.RIGHT) ||
      (newDirection === DIRECTIONS.RIGHT &&
        current === DIRECTIONS.LEFT)
    ) {
      return;
    }

    nextDirectionRef.current = newDirection;
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];

    const deltaX =
      touch.clientX - touchStartRef.current.x;

    const deltaY =
      touch.clientY - touchStartRef.current.y;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < 30) return;

    if (absX > absY) {
      if (deltaX > 0) {
        handleDirection(DIRECTIONS.RIGHT);
      } else {
        handleDirection(DIRECTIONS.LEFT);
      }
    } else {
      if (deltaY > 0) {
        handleDirection(DIRECTIONS.DOWN);
      } else {
        handleDirection(DIRECTIONS.UP);
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();

      switch (key) {
        case "w":
        case "arrowup":
          handleDirection(DIRECTIONS.UP);
          break;

        case "s":
        case "arrowdown":
          handleDirection(DIRECTIONS.DOWN);
          break;

        case "a":
        case "arrowleft":
          handleDirection(DIRECTIONS.LEFT);
          break;

        case "d":
        case "arrowright":
          handleDirection(DIRECTIONS.RIGHT);
          break;

        case " ":
          e.preventDefault();

          if (gameOverRef.current) {
            startGame();
            return;
          }

          togglePause();
          break;

        case "r":
          startGame();
          break;

        default:
          break;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyPress
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyPress
      );
    };
  }, [startGame]);

  useEffect(() => {
    if (
      !gameStarted ||
      gameOver ||
      paused
    )
      return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const currentDirection =
          nextDirectionRef.current ||
          directionRef.current;

        if (
          currentDirection === DIRECTIONS.STOP
        ) {
          return prevSnake;
        }

        directionRef.current =
          currentDirection;

        const head = prevSnake[0];

        let newHeadX = head.x;
        let newHeadY = head.y;

        switch (currentDirection) {
          case DIRECTIONS.UP:
            newHeadY -= 1;
            break;

          case DIRECTIONS.DOWN:
            newHeadY += 1;
            break;

          case DIRECTIONS.LEFT:
            newHeadX -= 1;
            break;

          case DIRECTIONS.RIGHT:
            newHeadX += 1;
            break;

          default:
            break;
        }

        // WRAP

        if (newHeadX < 0)
          newHeadX = GRID_WIDTH - 1;

        if (newHeadX >= GRID_WIDTH)
          newHeadX = 0;

        if (newHeadY < 0)
          newHeadY = GRID_HEIGHT - 1;

        if (newHeadY >= GRID_HEIGHT)
          newHeadY = 0;

        // SELF COLLISION

        if (
          prevSnake.slice(1).some(
            (segment) =>
              segment.x === newHeadX &&
              segment.y === newHeadY
          )
        ) {
          setGameOver(true);
          setGameStarted(false);

          return prevSnake;
        }

        let newSnake = [
          {
            x: newHeadX,
            y: newHeadY,
          },
          ...prevSnake,
        ];

        // FRUIT

        if (
          newHeadX === fruit.x &&
          newHeadY === fruit.y
        ) {
          const newScore = score + 10;

          setScore(newScore);

          if (newScore > bestScore) {
            setBestScore(newScore);

            localStorage.setItem(
              "snake-best",
              newScore
            );
          }

          setFruit(generateFruit(newSnake));

          setSpeed((prev) =>
            Math.max(prev - 3, 45)
          );
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () =>
      clearInterval(gameLoopRef.current);
  }, [
    gameStarted,
    gameOver,
    paused,
    fruit,
    speed,
    score,
    bestScore,
    generateFruit,
    GRID_WIDTH
  ]);

  return (
    <div>

      <div className="game-container">
        <h1>SNAKE GAME</h1>

        <div className="top-bar">
          <div className="panel">
            <p>Score</p>
            <span>{score}</span>
          </div>

          <div className="panel">
            <p>Best</p>
            <span>{bestScore}</span>
          </div>

          <div className="panel">
            <p>Speed</p>
            <span>
              {Math.floor((120 - speed) / 5)}
            </span>
          </div>
        </div>

        <div
          className="game-board"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            width: GRID_WIDTH * CELL_SIZE,
            height: GRID_HEIGHT * CELL_SIZE,
            gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
          }}
          >
          {Array.from({
            length: GRID_HEIGHT,
          }).map((_, row) =>
            Array.from({
              length: GRID_WIDTH,
            }).map((_, col) => {
              const isSnakeHead =
              snake[0]?.x === col &&
              snake[0]?.y === row;
              
              const snakeIndex =
              snake.findIndex(
                (segment) =>
                  segment.x === col &&
                segment.y === row
              );
              
              const isSnakeBody =
              snakeIndex > 0;
              
              const isFruit =
              fruit.x === col &&
              fruit.y === row;
              
              return (
                <div
                key={`${col}-${row}`}
                className={`
                  cell
                  ${
                      isSnakeHead
                      ? "snake-head"
                        : ""
                      }
                      ${
                        isSnakeBody
                        ? "snake-body"
                        : ""
                      }
                      ${isFruit ? "fruit" : ""}
                      `}
                      style={{
                        opacity:
                        snakeIndex >= 0
                        ? 1 - snakeIndex * 0.03
                        : 1,
                      }}
                      >
                  {isSnakeHead && (
                    <div className="eyes">
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {!gameStarted && !gameOver && (
            <div className="overlay">
              <h2>Ready?</h2>

              <button
                className="btn"
                onClick={startGame}
                >
                Start Game
              </button>
            </div>
          )}

          {paused && (
            <div className="overlay">
              <h2>Paused</h2>
              <p>Resume when ready</p>
            </div>
          )}

          {gameOver && (
            <div className="overlay">
              <h2>Game Over</h2>

              <p>Score: {score}</p>

              <button
                className="btn"
                onClick={startGame}
                >
                Play Again
              </button>
            </div>
          )}
        </div>

        {isMobile && gameStarted && !gameOver && (
          <div className="mobile-controls">
            <button
              className="mobile-btn"
              onClick={togglePause}
              >
              {paused ? "Resume" : "Pause"}
            </button>

            <button
              className="mobile-btn"
              onClick={startGame}
              >
              Restart
            </button>
          </div>
        )}

        <div className="controls">
          {isMobile ? (
            <p>Swipe to control the snake</p>
          ) : (
            <p>
              WASD / Arrow Keys • SPACE Pause • R
              Restart
            </p>
          )}
        </div>
      </div>
      <footer>
        <a
          href="https://github.com/mitesh006"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          >
          Built by mitesh006
        </a>
      </footer>
    </div>
  );
}
