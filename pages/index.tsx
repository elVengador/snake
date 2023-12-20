import uuid4 from "uuid4";
import type { NextPage } from "next";
import Head from "next/head";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getIdOfFirstCollisionThing, moveSnake } from "../utils/snake.utils";
import { useElementSize } from "../hooks/useElementSize";

export type ThingDirection = "top" | "left" | "right" | "bottom";
type SlotsOnGame = { x: number; y: number };
export type Node = { x: number; y: number; id: string };
export type Snake = {
  state: "LIVE" | "DEAD";
  body: Node[];
  lastNodeData: Node;
  direction: ThingDirection;
};
export type Offset = { x: number; y: number };
export type Thing = {
  id: string;
  x: number;
  y: number;
  type: "apple" | "rock";
  value: number;
  direction: ThingDirection;
};

const getOffset = (
  slotDimensionPx: number,
  direction: ThingDirection
): Offset => {
  if (direction === "bottom") return { x: 0, y: slotDimensionPx };
  if (direction === "left") return { x: -slotDimensionPx, y: 0 };
  if (direction === "right") return { x: slotDimensionPx, y: 0 };
  if (direction === "top") return { x: 0, y: -slotDimensionPx };
  return { x: 0, y: 0 };
};

const MAX_SCORE_KEY = "max-score";
const COLORS = {
  black: "#252525",
};
const NODE_DIMENSION = 50;
const INITIAL_SNAKE: Snake = {
  state: "LIVE",
  body: [{ x: 100, y: 100, id: uuid4() }],
  lastNodeData: { x: 100, y: 100, id: uuid4() },
  direction: "right",
};

const getRandomInteger = (max: number) => Math.floor(Math.random() * max);

type getRandomFoodInput = {
  slots: SlotsOnGame;
  slotDimensionPx: number;
  offset?: number;
};
const getRandomFood = ({
  slots,
  slotDimensionPx,
  offset = 1,
}: getRandomFoodInput): Thing => {
  return {
    id: `f${uuid4()}`,
    x: (getRandomInteger(slots.x - 2 * offset) + 1) * slotDimensionPx,
    y: (getRandomInteger(slots.y - 2 * offset) + 1) * slotDimensionPx,
    type: "apple",
    value: 1,
    direction: "bottom",
  };
};

type NewRockInput = {
  x: number;
  y: number;
  value?: number;
  direction?: ThingDirection;
};
const newRock = ({
  x,
  y,
  value = 1,
  direction = "bottom",
}: NewRockInput): Thing => ({
  id: `r${uuid4()}`,
  x,
  y,
  type: "rock",
  value,
  direction,
});

const getInitialRocks = (slots: SlotsOnGame, slotDimensionPx: number) => {
  const topRocks = Array(slots.x)
    .fill(null)
    .map((_, i) => newRock({ x: i * slotDimensionPx, y: 0, direction: "top" }));
  const bottomRocks = Array(slots.x)
    .fill(null)
    .map((_, i) =>
      newRock({
        x: i * slotDimensionPx,
        y: (slots.y - 1) * slotDimensionPx,
        direction: "bottom",
      })
    );
  const leftRocks = Array(slots.y)
    .fill(null)
    .map((_, i) =>
      newRock({ x: 0, y: i * slotDimensionPx, direction: "left" })
    );
  const rightRocks = Array(slots.y)
    .fill(null)
    .map((_, i) =>
      newRock({
        x: (slots.x - 1) * slotDimensionPx,
        y: i * slotDimensionPx,
        direction: "right",
      })
    );
  return [...topRocks, ...bottomRocks, ...leftRocks, ...rightRocks];
};

const Home: NextPage = () => {
  const [nickname, setNickname] = useState("");
  const [startPlay, setStartPlay] = useState(false);
  const [snake, setSnake] = useState<Snake>(INITIAL_SNAKE);
  const [foods, setFoods] = useState<Thing[]>([]);
  const [rocks, setRocks] = useState<Thing[]>([]);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [speed, setSpeed] = useState(1000);

  const movementAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const startGameAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const completedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [mainElement, setMainElement] = useState<HTMLDivElement | null>(null);
  const mainRef = useCallback(
    (element: HTMLDivElement) => setMainElement(element),
    []
  );

  const { elementHeight, elementWidth } = useElementSize(mainElement);

  const slots: SlotsOnGame = useMemo(() => {
    if (!startPlay) return { x: 0, y: 0 };
    return {
      x: Math.floor(elementWidth / NODE_DIMENSION),
      y: Math.floor(elementHeight / NODE_DIMENSION),
    };
  }, [elementHeight, elementWidth, startPlay]);

  const playAudio = (audioRef: MutableRefObject<HTMLAudioElement | null>) => {
    if (!audioRef.current) return;

    if (!audioRef.current.paused) audioRef.current.currentTime = 0;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const onStartGame = () => {
    onPlayGame();
    setStartPlay(true);
  };

  const onPlayGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFoods([getRandomFood({ slots, slotDimensionPx: NODE_DIMENSION })]);
    setRocks(getInitialRocks(slots, NODE_DIMENSION));
    playAudio(startGameAudioRef);
  }, [slots]);

  const onMoveSnake = useCallback(
    (direction: ThingDirection, byUser?: boolean) => {
      setSnake((prev) => {
        const offset = getOffset(NODE_DIMENSION, direction);
        const newSnake = moveSnake({ snake: prev.body, offset });
        const lastNodeFromNewSnake = prev.body[prev.body.length - 1];
        return {
          ...prev,
          body: newSnake,
          lastNodeData: lastNodeFromNewSnake,
          direction: byUser ? direction : prev.direction,
        };
      });

      playAudio(movementAudioRef);
    },
    []
  );

  type OnSaveScoreInput = { score: number; nickname: string };
  const onSaveScore = useCallback(
    async ({ score, nickname }: OnSaveScoreInput) => {
      await fetch("http://localhost:3000/api/score", {
        method: "POST",
        body: JSON.stringify({ name: nickname, score }),
      });
    },
    []
  );

  useEffect(() => {
    onPlayGame();
  }, [onPlayGame]);

  useEffect(() => {
    if (!startPlay) return;
    if (snake.state === "DEAD") return;
    const timeoutId = setInterval(() => {
      onMoveSnake(snake.direction);
      setTimer((prev) => prev + 1);
      setScore((prev) => prev + 0.01);
    }, speed);
    return () => clearInterval(timeoutId);
  }, [onMoveSnake, snake.direction, snake.state, speed, startPlay]);

  useEffect(() => {
    // Calculate the new speed logarithmically
    const minSpeed = 10; // Minimum speed (in ms)
    const maxSpeed = 1000; // Maximum speed (in ms)
    const base = 2; // Logarithmic base
    const factor = 200; // Speed increase factor per 10 points

    const logarithmicSpeed = Math.max(
      maxSpeed / Math.pow(base, score / factor),
      minSpeed
    );

    setSpeed(logarithmicSpeed);
  }, [score, speed]);

  useEffect(() => {
    if (!startPlay) return;
    if (snake.state === "DEAD") return;

    const [head, ...body] = snake.body;
    const foodIdCollision = getIdOfFirstCollisionThing({
      head,
      things: foods.map((c) => ({
        ...c,
        height: NODE_DIMENSION,
        width: NODE_DIMENSION,
      })),
      thingDimensions: NODE_DIMENSION,
    });
    if (foodIdCollision) {
      const newFood = getRandomFood({ slots, slotDimensionPx: NODE_DIMENSION });
      const filteredFoods = foods.filter((cur) => cur.id !== foodIdCollision);
      setFoods([...filteredFoods, newFood]);
      setSnake({
        ...snake,
        body: [...snake.body, { ...snake.lastNodeData, id: uuid4() }],
        lastNodeData: snake.body[snake.body.length - 1],
      });
      setScore((prev) => prev + 3);
      playAudio(successAudioRef);
    }

    const rockIdCollision = getIdOfFirstCollisionThing({
      head,
      things: rocks.map((c) => ({
        ...c,
        height: NODE_DIMENSION,
        width: NODE_DIMENSION,
      })),
      thingDimensions: NODE_DIMENSION,
    });
    if (rockIdCollision) {
      playAudio(loseAudioRef);
      setSnake((prev) => ({ ...prev, state: "DEAD" }));
      if (score <= maxScore) return;

      localStorage.setItem(MAX_SCORE_KEY, score.toString());
      setMaxScore(score);
      onSaveScore({ nickname, score });
      return;
    }

    const nodeIdCollision = getIdOfFirstCollisionThing({
      head,
      things: body.map((c) => ({
        ...c,
        height: NODE_DIMENSION,
        width: NODE_DIMENSION,
      })),
      thingDimensions: NODE_DIMENSION,
    });
    if (nodeIdCollision) {
      playAudio(loseAudioRef);
      const newMaxScore = Math.max(snake.body.length, maxScore);
      localStorage.setItem(MAX_SCORE_KEY, newMaxScore.toString());
      setMaxScore(newMaxScore);
      setSnake((prev) => ({ ...prev, state: "DEAD" }));
      onSaveScore({ nickname, score: newMaxScore });
      return;
    }
  }, [
    foods,
    maxScore,
    nickname,
    onSaveScore,
    rocks,
    score,
    slots,
    snake,
    startPlay,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // initial set up when is executing on client
      movementAudioRef.current = new Audio("./sounds/movement.mp3");
      loseAudioRef.current = new Audio("./sounds/negative_beeps.mp3");
      startGameAudioRef.current = new Audio("./sounds/game-start.mp3");
      successAudioRef.current = new Audio("./sounds/success.mp3");
      completedAudioRef.current = new Audio("./sounds/complete.mp3");
      const maxScoreFromLocalStorage =
        Number(localStorage.getItem(MAX_SCORE_KEY)) ?? 0;
      setMaxScore(maxScoreFromLocalStorage);
    }
  }, []);

  useEffect(() => {
    if (!startPlay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") onMoveSnake("top", true);
      if (e.code === "ArrowLeft") onMoveSnake("left", true);
      if (e.code === "ArrowDown") onMoveSnake("bottom", true);
      if (e.code === "ArrowRight") onMoveSnake("right", true);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onMoveSnake, startPlay]);

  return (
    <div
      style={{
        height: "100dvh",
        background: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Head>
        <title>Snake Game</title>
        <meta name="description" content="Snake Game created by Jimy Nicanor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!startPlay && (
        <main
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            padding: "20px",
          }}
        >
          <h1 style={{ fontSize: "64px", textAlign: "center" }}>Snake Game</h1>
          <form style={{ display: "grid", gap: "20px", fontSize: "24px" }}>
            <label>Enter your nickname:</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ fontSize: "24px" }}
            />
            <button
              onClick={onStartGame}
              style={{ padding: "8px", fontSize: "16px" }}
            >
              Play!
            </button>
          </form>
        </main>
      )}

      {startPlay && snake.state === "DEAD" && (
        <main
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            padding: "20px",
          }}
        >
          <h1 style={{ fontSize: "64px" }}>Game Over</h1>
          <p
            style={{ color: "#dddddd", fontSize: "40px", textAlign: "center" }}
          >
            {nickname
              ? `${nickname} got ${score.toFixed(1)} points`
              : `You've got ${snake.body.length} points`}
            <br />
            {"Your max score is "}
            <span style={{ color: "royalblue" }}>{maxScore}</span>
          </p>

          <button
            onClick={onPlayGame}
            style={{ padding: "8px", fontSize: "16px" }}
          >
            Try Again
          </button>
        </main>
      )}

      {startPlay && snake.state === "LIVE" && (
        <main
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            color: "white",
          }}
        >
          <section
            style={{
              padding: "8px 12px",
              fontSize: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1 style={{ padding: "0px", margin: "0px", fontSize: "36px" }}>
              {nickname ? `Snake's ${nickname}` : "Snake"}
            </h1>
            <div style={{ display: "flex", gap: "30px" }}>
              <div>Score: {score.toFixed(1)}</div>
              <div>Time: {timer}s</div>
            </div>
          </section>

          {/* game map */}
          <section
            style={{
              width: "100%",
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            <div
              ref={mainRef}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Centered content */}
              <div
                style={{
                  position: "relative",
                  height: `${slots.y * NODE_DIMENSION}px`,
                  width: `${slots.x * NODE_DIMENSION}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#515151",
                }}
              >
                {/* Content */}
                {snake.body.map((cur, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "solid 3px #a5acc3",
                      position: "absolute",
                      top: cur.y,
                      left: cur.x,
                      width: `${NODE_DIMENSION}px`,
                      height: `${NODE_DIMENSION}px`,
                      backgroundColor: idx === 0 ? "#1b62a9" : "#2b4157",
                      transition: "0.2s",
                      borderRadius: idx === 0 ? "8px" : "6px",
                    }}
                  />
                ))}

                {rocks.map((cur) => (
                  <div
                    key={cur.id}
                    style={{
                      border: "solid 2px #c1c1c1",
                      position: "absolute",
                      top: cur.y,
                      left: cur.x,
                      width: `${NODE_DIMENSION}px`,
                      height: `${NODE_DIMENSION}px`,
                      backgroundColor: COLORS.black,
                      transition: "0.2s",
                    }}
                  />
                ))}

                {foods.map((cur) => (
                  <div
                    key={cur.id}
                    style={{
                      border: "solid 3px #a56f6f",
                      position: "absolute",
                      top: cur.y,
                      left: cur.x,
                      width: `${NODE_DIMENSION}px`,
                      height: `${NODE_DIMENSION}px`,
                      backgroundColor: "#973131",
                      transition: "0.2s",
                      borderRadius: "50%",
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
};

export default Home;
