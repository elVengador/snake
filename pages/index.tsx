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

type SlotsOnGame = { x: number; y: number };
export type Node = { x: number; y: number };
export type Snake = {
  state: "LIVE" | "DEAD";
  body: Node[];
  lastNodeData: Node;
};
export type ThingDirection = "top" | "left" | "right" | "bottom";
export type Offset = { x: number; y: number };
export type Thing = {
  id: string;
  x: number;
  y: number;
  type: "apple" | "rock";
  value: number;
  direction: ThingDirection;
};

const COLORS = {
  black: "#252525",
};
const NODE_DIMENSION = 50;
const INITIAL_SNAKE: Snake = {
  state: "LIVE",
  body: [{ x: 100, y: 100 }],
  lastNodeData: { x: 100, y: 100 },
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

type getRandomRockInput = { slots: SlotsOnGame; slotDimensionPx: number };
// const getRandomRock = ({slots,slotDimensionPx}:getRandomRockInput): Thing => {
//   return newRock({x:getRandomInteger(slots.x)*slotDimensionPx,y:getRandomInteger(slots.y)*slotDimensionPx})
// };

const Home: NextPage = () => {
  const [snake, setSnake] = useState<Snake>(INITIAL_SNAKE);
  const [foods, setFoods] = useState<Thing[]>([]);
  const [rocks, setRocks] = useState<Thing[]>([]);

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
    const topRocks = Array(slots.x)
      .fill(null)
      .map((_, i) =>
        newRock({ x: i * NODE_DIMENSION, y: 0, direction: "top" })
      );
    const bottomRocks = Array(slots.x)
      .fill(null)
      .map((_, i) =>
        newRock({
          x: i * NODE_DIMENSION,
          y: (slots.y - 1) * NODE_DIMENSION,
          direction: "bottom",
        })
      );
    const leftRocks = Array(slots.y)
      .fill(null)
      .map((_, i) =>
        newRock({ x: 0, y: i * NODE_DIMENSION, direction: "left" })
      );
    const rightRocks = Array(slots.y)
      .fill(null)
      .map((_, i) =>
        newRock({
          x: (slots.x - 1) * NODE_DIMENSION,
          y: i * NODE_DIMENSION,
          direction: "right",
        })
      );
    setRocks([...topRocks, ...bottomRocks, ...leftRocks, ...rightRocks]);
    playAudio(startGameAudioRef);
  }, [slots]);

  type onMoveSnakeInput = Offset;
  const onMoveSnake = useCallback((offset: onMoveSnakeInput) => {
    setSnake((prev) => {
      const newSnake = moveSnake({ snake: prev.body, offset });
      const lastNodeFromNewSnake = prev.body[prev.body.length - 1];
      return { ...prev, body: newSnake, lastNodeData: lastNodeFromNewSnake };
    });

    playAudio(movementAudioRef);
  }, []);

  useEffect(() => {
    onStartGame();
  }, [onStartGame]);

  useEffect(() => {
    if (snake.state === "DEAD") return;

    const head = snake.body[0];
    const foodIdCollision = getIdOfFirstCollisionThing({
      head,
      things: foods,
      thingDimensions: NODE_DIMENSION,
    });
    if (foodIdCollision) {
      const newFood = getRandomFood({ slots, slotDimensionPx: NODE_DIMENSION });
      const filteredFoods = foods.filter((cur) => cur.id !== foodIdCollision);
      setFoods([...filteredFoods, newFood]);
      setSnake({
        ...snake,
        body: [...snake.body, snake.lastNodeData],
        lastNodeData: snake.body[snake.body.length - 1],
      });
      playAudio(successAudioRef);
    }

    const rockIdCollision = getIdOfFirstCollisionThing({
      head,
      things: rocks,
      thingDimensions: NODE_DIMENSION,
    });
    if (rockIdCollision) {
      playAudio(loseAudioRef);
      return setSnake((prev) => ({ ...prev, state: "DEAD" }));
    }
  }, [foods, rocks, slots, snake]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // initial set up when is executing on client
      movementAudioRef.current = new Audio("./sounds/movement.mp3");
      loseAudioRef.current = new Audio("./sounds/negative_beeps.mp3");
      startGameAudioRef.current = new Audio("./sounds/game-start.mp3");
      successAudioRef.current = new Audio("./sounds/success.mp3");
      completedAudioRef.current = new Audio("./sounds/complete.mp3");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") onMoveSnake({ x: 0, y: -NODE_DIMENSION });
      if (e.code === "ArrowLeft") onMoveSnake({ x: -NODE_DIMENSION, y: 0 });
      if (e.code === "ArrowDown") onMoveSnake({ x: 0, y: NODE_DIMENSION });
      if (e.code === "ArrowRight") onMoveSnake({ x: NODE_DIMENSION, y: 0 });
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
          }}
        >
          <h1 style={{ fontSize: "64px" }}>Game Over</h1>
          <h2
            style={{ color: "#dddddd" }}
          >{`You've got ${snake.body.length} points`}</h2>
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
