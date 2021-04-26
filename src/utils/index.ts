import express, { Request, Response } from "express";
import { Server, createServer } from "http";
import { Server as SocketServer, ServerOptions, Socket } from "socket.io";
import { GenRouter } from "../interfaces/genrouter";
import {
  keyForBaseMiddlewares,
  keyForBasePath,
  keyForRouteMap,
  keyForNamespace,
  keyForGateMap,
} from "./symbols";
import { HttpVerb } from "./types";
import { keyForIdSymbol } from "torrjs-core/src/utils/symbols";
import { GenChannel } from "../interfaces/genchannel";

function mapEnumToExpressFuncName(
  verb: HttpVerb
):
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head"
  | "connect"
  | "trace" {
  switch (verb) {
    case HttpVerb.GET:
      return "get";
    case HttpVerb.POST:
      return "post";
    case HttpVerb.PUT:
      return "put";
    case HttpVerb.DELETE:
      return "delete";
    case HttpVerb.OPTIONS:
      return "options";
    case HttpVerb.CONNECT:
      return "connect";
    case HttpVerb.HEAD:
      return "head";
    case HttpVerb.PATCH:
      return "patch";
    case HttpVerb.TRACE:
      return "trace";
    default:
      return "get";
  }
}

async function runSync<Treturn, Tyield>(
  fn: (...args: any[]) => Generator<Tyield, Treturn, any>,
  ...args: any[]
): Promise<Treturn> {
  const iterable = fn(...args);
  let state: IteratorResult<Tyield, Treturn>;
  do {
    state = iterable.next();
  } while (!state.done);
  return state.value;
}

function buildExpressApp(routers: [typeof GenRouter, GenRouter][]): Server {
  const app = express();

  routers.forEach(([router, instance]: [typeof GenRouter, GenRouter]) => {
    const expressRouter = express.Router();
    expressRouter.use(...router[keyForBaseMiddlewares]);
    router[keyForRouteMap].forEach((route) => {
      expressRouter[mapEnumToExpressFuncName(route.verb)](
        route.route,
        route.middlewares,
        (req: Request, res: Response) =>
          runSync(
            (req, res) =>
              router.cast(
                [router, instance[keyForIdSymbol]],
                route.verb + route.route,
                [req, res]
              ),
            req,
            res
          )
      );
    });
    app.use(router[keyForBasePath], expressRouter);
  });

  const server = createServer(app);
  return server;
}

function buildSocketServer(
  channels: [typeof GenChannel, GenChannel][],
  serverOpt?: Partial<ServerOptions>
): Server {
  const io = new SocketServer(serverOpt);
  const server = require("http").createServer();
  channels.forEach(([channel, instance]: [typeof GenChannel, GenChannel]) => {
    const namespace = io.of(channel[keyForNamespace]);
    channel[keyForBaseMiddlewares].forEach((middleware) =>
      namespace.use(middleware)
    );
    namespace.on("connection", (socket: Socket) => {
      channel[keyForGateMap].forEach((gate) => {
        gate.middlewares.forEach((middleware) => socket.use(middleware));
        socket.on(gate.event, (...args: any[]) => {
          runSync(
            (io, namespace, socket, data) =>
              channel.cast([channel, instance[keyForIdSymbol]], gate.event, [
                io,
                namespace,
                socket,
                data,
              ]),
            io,
            namespace,
            socket,
            args
          );
        });
      });
    });
  });
  io.attach(server);
  return server;
}
export { buildExpressApp, buildSocketServer, runSync };
