import "reflect-metadata";
import { GenRouter } from "../interfaces/genrouter";
import { keyForMetadataMapSymbol } from "torrjs-core/src/utils/symbols";
import { HttpVerb, ExpressMiddleware } from "../utils/types";
import { keyForMetadataRouteMap } from "../utils/symbols";

function route(
  verb: HttpVerb,
  route: string,
  middlewares: ExpressMiddleware[]
) {
  return <T extends GenRouter, U extends string>(
    target: T,
    propertyKey: U & (U extends "init" ? never : U),
    _descriptor: PropertyDescriptor
  ) => {
    let map: Map<string, string> =
      Reflect.getOwnMetadata(keyForMetadataMapSymbol, target) ||
      new Map<string, string>();
    map.set(verb + route, propertyKey);
    Reflect.defineMetadata(keyForMetadataMapSymbol, map, target);
    let mapRoute: Map<
      string,
      { verb: HttpVerb; route: string; middlewares: ExpressMiddleware[] }
    > =
      Reflect.getOwnMetadata(keyForMetadataRouteMap, target) ||
      new Map<string, string>();
    mapRoute.set(route, { verb, route, middlewares });
    Reflect.defineMetadata(keyForMetadataRouteMap, mapRoute, target);
  };
}

export { route };
