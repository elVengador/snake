import { MongoClient } from "mongodb";

let dbClient:any = null

const main = async ()=>{
    const uri = process.env.MONGO_DB_URI
    if(!uri) throw new Error("Error: MONGO_DB_URI does not exist!")
    dbClient = new MongoClient(uri);
    
    await dbClient.connect()
    console.log('>. mongoDb connected')
}

export const collection = (name:string) => dbClient.db('snake-db').collection(name)

main()
