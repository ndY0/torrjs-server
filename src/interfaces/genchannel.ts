import { GenServer } from "torrjs-core/src/interfaces/genserver";
import {
  keyForBaseMiddlewares,
  keyForNamespace,
  keyForGateMap,
} from "../utils/symbols";
import { SocketIoMiddleware, SocketMiddleware } from "../utils/types";

abstract class GenChannel extends GenServer {
  public static [keyForGateMap]: Map<
    string,
    { event: string; middlewares: SocketMiddleware[] }
  >;
  public static [keyForNamespace]: string;
  public static [keyForBaseMiddlewares]: SocketIoMiddleware[];
}

export { GenChannel };
