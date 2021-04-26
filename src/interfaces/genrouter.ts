import { GenServer } from "torrjs-core/src/interfaces/genserver";
import {
  keyForRouteMap,
  keyForBasePath,
  keyForBaseMiddlewares,
} from "../utils/symbols";
import { ExpressMiddleware, HttpVerb } from "../utils/types";

abstract class GenRouter extends GenServer {
  public static [keyForRouteMap]: Map<
    string,
    { verb: HttpVerb; route: string; middlewares: ExpressMiddleware[] }
  >;
  public static [keyForBasePath]: string;
  public static [keyForBaseMiddlewares]: ExpressMiddleware[];
}

export { GenRouter };
