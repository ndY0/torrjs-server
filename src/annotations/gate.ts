import "reflect-metadata";
import { GenRouter } from "../interfaces/genrouter";
import { keyForMetadataMapSymbol } from "torrjs-core/src/utils/symbols";
import { SocketMiddleware } from "../utils/types";
import { keyForMetadataGateMap } from "../utils/symbols";

function gate(event: string, middlewares?: SocketMiddleware[]) {
  return <T extends GenRouter, U extends string>(
    target: T,
    propertyKey: U & (U extends "init" ? never : U),
    _descriptor: PropertyDescriptor
  ) => {
    let map: Map<string, string> =
      Reflect.getOwnMetadata(keyForMetadataMapSymbol, target) ||
      new Map<string, string>();
    map.set(event, propertyKey);
    Reflect.defineMetadata(keyForMetadataMapSymbol, map, target);
    let mapGate: Map<
      string,
      { event: string; middlewares: SocketMiddleware[] }
    > =
      Reflect.getOwnMetadata(keyForMetadataGateMap, target) ||
      new Map<string, string>();
    mapGate.set(event, { event, middlewares: middlewares || [] });
    Reflect.defineMetadata(keyForMetadataGateMap, mapGate, target);
  };
}

export { gate };
