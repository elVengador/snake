import { Node, Offset, Thing } from "../pages";
import { detectCollision } from "./physics.utils";

type MoveNodeInput = { node: Node; offset: Offset };
export const moveNode = ({ node, offset }: MoveNodeInput): Node => ({
  x: node.x + offset.x,
  y: node.y + offset.y,
});

type MoveSnakeInitialType = { previousNode: null | Node; newNodes: Node[] };
type MoveSnakeInput = { snake: Node[]; offset: Offset };
export const moveSnake = ({ snake, offset }: MoveSnakeInput): Node[] => {
  const { newNodes } = snake.reduce(
    (acu: MoveSnakeInitialType, cur): MoveSnakeInitialType => {
      const newNodes = [
        ...acu.newNodes,
        acu.previousNode ? acu.previousNode : moveNode({ node: cur, offset }),
      ];
      return { previousNode: cur, newNodes };
    },
    { previousNode: null, newNodes: [] }
  );

  return newNodes;
};

type GetIdOfFirstCollisionThingInput = {
  head: Node;
  things: Thing[];
  thingDimensions: number;
};
export const getIdOfFirstCollisionThing = ({
  head,
  things,
  thingDimensions,
}: GetIdOfFirstCollisionThingInput) =>
  things.reduce((acu, cur): string => {
    if (acu) return acu;
    const thing1 = { ...head, height: thingDimensions, width: thingDimensions };
    const thing2 = { ...cur, height: thingDimensions, width: thingDimensions };
    return detectCollision({ thing1, thing2 }) ? thing2.id : "";
  }, "");
