import express, { Request, Response } from "express";
import { Server, createServer } from "http";
import { GenRouter } from "../interfaces/genrouter";
import {
  keyForBaseMiddlewares,
  keyForBasePath,
  keyForRouteMap,
} from "./symbols";
import { HttpVerb } from "./types";
import { keyForIdSymbol } from "torrjs-core/src/utils/symbols";

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

function buildExpressApp(routers: [typeof GenRouter, GenRouter][]): Server {
  const app = express();

  routers.forEach(([router, instance]: [typeof GenRouter, GenRouter]) => {
    const expressRouter = express.Router();
    expressRouter.use(router[keyForBaseMiddlewares]);
    router[keyForRouteMap].forEach((route) => {
      expressRouter[mapEnumToExpressFuncName(route.verb)](
        route.route,
        route.middlewares,
        (req: Request, res: Response) => {
          router.cast(
            [router, instance[keyForIdSymbol]],
            route.verb + route.route,
            [req, res]
          );
        }
      );
    });
    app.use(router[keyForBasePath], expressRouter);

    const baseMiddlewares = router[keyForBaseMiddlewares];
  });

  const server = createServer(app);
  return server;
}
export { buildExpressApp };
