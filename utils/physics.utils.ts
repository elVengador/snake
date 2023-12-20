export type EmptyThing = {
    id:string,
  x: number;
  y: number;
  width: number;
  height: number;
};

type DetectCollision = {thing1: EmptyThing, thing2: EmptyThing}

export const detectCollision = ({thing1,thing2}:DetectCollision): boolean => {
  // Calculate the boundaries of the objects
  const left1 = thing1.x;
  const right1 = thing1.x + thing1.width;
  const top1 = thing1.y;
  const bottom1 = thing1.y + thing1.height;

  const left2 = thing2.x;
  const right2 = thing2.x + thing2.width;
  const top2 = thing2.y;
  const bottom2 = thing2.y + thing2.height;

  const thereIsCollision =
    left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;

  return thereIsCollision;
};
