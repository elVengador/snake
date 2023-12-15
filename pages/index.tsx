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
import { getIdOfFirstCollisionThing, moveSnake } from "../utils.ts/snake.utils";
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

const getOffset = (slotDimensionPx: number,direction:ThingDirection):Offset=> {
  if(direction==="bottom")return{ x: 0, y: slotDimensionPx }
  if(direction==="left")return{ x: -slotDimensionPx, y: 0 }
  if(direction==="right")return{ x: slotDimensionPx, y: 0 }
  if(direction==="top")return{ x: 0, y: -slotDimensionPx }
  return{ x: 0, y: 0} 
}

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

type getRandomRockInput = { slots: SlotsOnGame; slotDimensionPx: number };
// const getRandomRock = ({slots,slotDimensionPx}:getRandomRockInput): Thing => {
//   return newRock({x:getRandomInteger(slots.x)*slotDimensionPx,y:getRandomInteger(slots.y)*slotDimensionPx})
// };

const Home: NextPage = () => {
  const [snake, setSnake] = useState<Snake>(INITIAL_SNAKE);
  const [foods, setFoods] = useState<Thing[]>([]);
  const [rocks, setRocks] = useState<Thing[]>([]);
  const [maxScore, setMaxScore] = useState(0);

  const movementAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const startGameAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const completedAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const { elementHeight, elementWidth } = useElementSize(mainRef);

  const slots: SlotsOnGame = useMemo(() => {
    return {
      x: Math.floor(elementWidth / NODE_DIMENSION),
      y: Math.floor(elementHeight / NODE_DIMENSION),
    };
  }, [elementHeight, elementWidth]);

  const playAudio = (audioRef: MutableRefObject<HTMLAudioElement | null>) => {
    if (!audioRef.current) return;

    if (!audioRef.current.paused) audioRef.current.currentTime = 0;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const onStartGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFoods([getRandomFood({ slots, slotDimensionPx: NODE_DIMENSION })]);
    setRocks(getInitialRocks(slots, NODE_DIMENSION));
    playAudio(startGameAudioRef);
  }, [slots]);

  const onMoveSnake = useCallback((direction:ThingDirection,byUser?:boolean) => {
    setSnake((prev) => {
      const offset = getOffset(NODE_DIMENSION,direction)
      const newSnake = moveSnake({ snake: prev.body, offset });
      const lastNodeFromNewSnake = prev.body[prev.body.length - 1];
      return { ...prev, body: newSnake, lastNodeData: lastNodeFromNewSnake,direction:byUser?direction:prev.direction };
    });

    playAudio(movementAudioRef);
  }, []);

  useEffect(() => {
    onStartGame();
  }, [onStartGame]);

  useEffect(() => {
    if (snake.state === "DEAD") return;
    const timeoutId = setInterval(() => {
      console.log('timer')
     onMoveSnake(snake.direction);
    }, 1000);
    return () => clearInterval(timeoutId);
  }, [onMoveSnake, snake.direction, snake.state]);

  useEffect(() => {
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
      const newMaxScore = Math.max(snake.body.length, maxScore);
      localStorage.setItem(MAX_SCORE_KEY, newMaxScore.toString());
      setMaxScore(newMaxScore);
      return setSnake((prev) => ({ ...prev, state: "DEAD" }));
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
      return setSnake((prev) => ({ ...prev, state: "DEAD" }));
    }
  }, [foods, maxScore, rocks, slots, snake]);

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") onMoveSnake("top",true);
      if (e.code === "ArrowLeft") onMoveSnake("left",true);
      if (e.code === "ArrowDown") onMoveSnake("bottom",true);
      if (e.code === "ArrowRight") onMoveSnake("right",true);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onMoveSnake]);

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

      {snake.state === "DEAD" && (
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
            {`You've got ${snake.body.length} points`}, Your max score{" "}
            <span style={{ color: "royalblue" }}>{maxScore}</span>
          </p>
          <button
            onClick={onStartGame}
            style={{ padding: "8px", fontSize: "16px" }}
          >
            Try Again
          </button>
        </main>
      )}

      {snake.state === "LIVE" && (
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
              Snake
            </h1>
            <div>Score: {snake.body.length}</div>
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
