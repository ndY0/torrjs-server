import { Request, Response, NextFunction } from "express";
import { Socket } from "socket.io";

type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

type SocketIoMiddleware = (socket: Socket, next: Function) => void;
type SocketMiddleware = (events: any[], next: Function) => void;

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

export { ExpressMiddleware, HttpVerb, SocketIoMiddleware, SocketMiddleware };
