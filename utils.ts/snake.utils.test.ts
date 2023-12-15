import { Node, Offset, Thing } from "../pages";
import { getIdOfFirstCollisionThing, moveSnake } from "./snake.utils";

describe('test snake.utils', () => { 

    it('should test snake movement with many node', () => {
        const snake:Node[] = [{x:20,y:20},{x:20,y:10},{x:30,y:10}] 
        const snakeResult:Node[] = [{x:10,y:20},{x:20,y:20},{x:20,y:10}] 
        const offset:Offset = {x:-10,y:0}
        const newSnake = moveSnake({snake,offset})

        newSnake.map((cur,idx)=>expect(cur).toEqual(snakeResult[idx]))
    });

    it('should test head collision with other things', () => {
        const things:Thing[]=[{id:"1",value:5,x:20,y:20,type:"apple"},{id:"2",value:5,x:100,y:100,type:"apple"}]
        const head:Node = {x:20,y:20}
        const id = getIdOfFirstCollisionThing({head,things,thingDimensions:2})  
        expect(id).toBe("1")
    })

    it('should test head does not collision with other things', () => {
        const things:Thing[]=[{id:"1",value:5,x:20,y:20,type:"apple"},{id:"2",value:5,x:100,y:100,type:"apple"}]
        const head:Node = {x:40,y:40}
        const id = getIdOfFirstCollisionThing({head,things,thingDimensions:2})  
        expect(id).toBe("")
    })
 })
 