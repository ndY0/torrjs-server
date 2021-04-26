import {
  keyForMetadataMapSymbol,
  keyForMapSymbol,
} from "torrjs-core/src/utils/symbols";
import { InMemoryEmitter } from "torrjs-core/src/transports/in-memory-emitter";
import { GenRouter } from "../interfaces/genrouter";
import { ExpressMiddleware, HttpVerb } from "../utils/types";
import {
  keyForMetadataRouteMap,
  keyForRouteMap,
  keyForBasePath,
  keyForBaseMiddlewares,
} from "../utils/symbols";

function Router(
  transport: InMemoryEmitter,
  basePath: string,
  middlewares?: ExpressMiddleware[]
) {
  return <T extends typeof GenRouter>(constructor: T) => {
    const map: Map<string, string> =
      Reflect.getOwnMetadata(keyForMetadataMapSymbol, constructor.prototype) ||
      new Map();
    Reflect.defineProperty(constructor, keyForMapSymbol, {
      configurable: false,
      enumerable: true,
      value: map,
      writable: false,
    });
    Reflect.deleteMetadata(keyForMetadataMapSymbol, constructor.prototype);
    const mapRoute: Map<
      string,
      { verb: HttpVerb; route: string; middlewares: ExpressMiddleware[] }
    > =
      Reflect.getOwnMetadata(keyForMetadataRouteMap, constructor.prototype) ||
      new Map();
    Reflect.defineProperty(constructor, keyForRouteMap, {
      configurable: false,
      enumerable: true,
      value: mapRoute,
      writable: false,
    });
    Reflect.deleteMetadata(keyForMetadataRouteMap, constructor.prototype);
    Reflect.defineProperty(constructor, keyForBasePath, {
      configurable: false,
      enumerable: true,
      value: basePath,
      writable: false,
    });
    Reflect.defineProperty(constructor, keyForBaseMiddlewares, {
      configurable: false,
      enumerable: true,
      value: middlewares,
      writable: false,
    });
    Reflect.defineProperty(constructor, "eventEmitter", {
      configurable: false,
      enumerable: false,
      value: transport,
      writable: false,
    });
  };
}

export { Router };
