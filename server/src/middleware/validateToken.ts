import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: JwtPayload;
}

export const validateToken = (req: CustomRequest,res: Response,next: NextFunction) => {
  const token: string | undefined = req.header("authorization")?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access denied, missing token" });

  try {
    const verified: JwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Access denied, invalid token" });
  }
};
