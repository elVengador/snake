import { NextApiRequest, NextApiResponse } from "next";
import { collection } from "../../utils/mongo.utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  if (req.method === "POST") {
    const { name, score } = JSON.parse(req.body);
    console.log("db:", { name, score });
    await collection("scores").insertOne({
      name: name || "anonym",
      score: score || 0,
    });
    return res.status(200).json({});
  }

  res.status(403);
}
