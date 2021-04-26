import { InMemoryEmitter } from "torrjs-core/src/transports/in-memory-emitter";
import { SocketIoMiddleware } from "../utils/types";
import { GenChannel } from "../interfaces/genchannel";
import {
  keyForMetadataMapSymbol,
  keyForMapSymbol,
} from "torrjs-core/src/utils/symbols";
import {
  keyForNamespace,
  keyForBaseMiddlewares,
  keyForMetadataGateMap,
  keyForGateMap,
} from "../utils/symbols";

function Channel(
  transport: InMemoryEmitter,
  namespace: string,
  middlewares?: SocketIoMiddleware[]
) {
  return <T extends typeof GenChannel>(constructor: T) => {
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
    const mapGate: Map<
      string,
      { event: string; middlewares: SocketIoMiddleware[] }
    > =
      Reflect.getOwnMetadata(keyForMetadataGateMap, constructor.prototype) ||
      new Map();
    Reflect.defineProperty(constructor, keyForGateMap, {
      configurable: false,
      enumerable: true,
      value: mapGate,
      writable: false,
    });
    Reflect.deleteMetadata(keyForMetadataGateMap, constructor.prototype);
    Reflect.defineProperty(constructor, keyForNamespace, {
      configurable: false,
      enumerable: true,
      value: namespace,
      writable: false,
    });
    Reflect.defineProperty(constructor, keyForBaseMiddlewares, {
      configurable: false,
      enumerable: true,
      value: middlewares || [],
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

export { Channel };
