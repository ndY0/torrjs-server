import { Request, Response, NextFunction } from "express";

type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

enum HttpVerb {
  GET,
  POST,
  PUT,
  DELETE,
  HEAD,
  OPTIONS,
  PATCH,
  CONNECT,
  TRACE,
}

export { ExpressMiddleware, HttpVerb };
