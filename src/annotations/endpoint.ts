import { GenEndpoint } from "../interfaces/genendpoint";
import { keyForServerPort } from "../utils/symbols";
import { TransportEmitter } from "torrjs-core/src/transports/interface";

function Endpoint(
  transport: TransportEmitter,
  port: number,
  externalTransports?: { [key: string]: TransportEmitter } & {
    internal?: never;
  }
) {
  return <T extends typeof GenEndpoint>(constructor: T) => {
    Reflect.defineProperty(constructor, keyForServerPort, {
      configurable: false,
      enumerable: true,
      value: port,
      writable: false,
    });
    Reflect.defineProperty(constructor, "eventEmitter", {
      configurable: false,
      enumerable: false,
      value: transport,
      writable: false,
    });
    const externalTransportsMap: Map<string, TransportEmitter> = new Map();
    if (externalTransports) {
      Object.keys(externalTransports).forEach((key) => {
        externalTransportsMap.set(key, externalTransports[key]);
      });
    }
    Reflect.defineProperty(constructor, "externalEventEmitters", {
      configurable: false,
      enumerable: false,
      value: externalTransportsMap,
      writable: false,
    });
  };
}

export { Endpoint };
