import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { GenServer } from "torrjs-core/src/interfaces/genserver";
import { GenSupervisor } from "torrjs-core/src/interfaces/gensupervisor";
import EventEmitter from "events";
import { GenRouter } from "./genrouter";
import {
  keyForCombinedSelfReadable,
  keyForCombinedAdministrationSelfReadable,
  keyForSupervisedChidren,
  keyForIdSymbol,
} from "torrjs-core/src/utils/symbols";
import { CombineEmitter } from "torrjs-core/src/transports/combine-emitter";
import {
  memo,
  combineMemos,
  getMemoPromise,
  tail,
  putMemoValue,
} from "torrjs-core/src/utils";
import { ChildSpec, RestartStrategy } from "torrjs-core/src/supervision/types";
import {
  keyForServer,
  keyForServerPort,
  keyForSocketServer,
  keyForSocketServerPort,
} from "../utils/symbols";
import { buildExpressApp, buildSocketServer } from "../utils";
import { GenChannel } from "./genchannel";

abstract class GenEndpoint extends GenSupervisor {
  public [keyForServer]: Server;
  public [keyForSocketServer]: Server;
  public static [keyForServerPort]: number;
  public static [keyForSocketServerPort]: number;
  protected abstract children(): AsyncGenerator<
    unknown,
    (
      | (typeof GenRouter & (new () => GenRouter))
      | (typeof GenChannel & (new () => GenChannel))
    )[],
    unknown
  >;
  public async *start<U extends typeof GenServer, V extends typeof GenEndpoint>(
    startArgs: [RestartStrategy],
    context: U,
    canceler: Generator<[boolean, EventEmitter], never, boolean>,
    _cancelerPromise: Promise<boolean>
  ) {
    [
      context.eventEmitter,
      ...context.externalEventEmitters.values(),
    ].forEach((emitter) => emitter.resetInternalStreams());
    const combinableStreams = [
      context.eventEmitter,
      ...context.externalEventEmitters.values(),
    ].map((emitter) => {
      const stream = new (emitter.getInternalStreamType())();
      emitter.setStream(context.name, stream);
      return stream;
    });
    const combinableAdministrationStreams = [
      context.eventEmitter,
      ...context.externalEventEmitters.values(),
    ].map((emitter) => {
      const administrationStream = new (emitter.getInternalStreamType())();
      emitter.setStream(`${context.name}_management`, administrationStream);
      return administrationStream;
    });
    this[keyForCombinedSelfReadable] = new CombineEmitter(combinableStreams);
    this[keyForCombinedAdministrationSelfReadable] = new CombineEmitter(
      combinableAdministrationStreams
    );
    const managementCanceler = memo(true);
    const combinedCanceler = combineMemos(
      (...states) => states.reduce((acc, curr) => acc && curr, true),
      managementCanceler,
      canceler
    );
    const combinedCancelerPromise = getMemoPromise(combinedCanceler);
    const childSpecs = yield* this.init();
    const httpServers = childSpecs.filter(
      (
        spec: [
          typeof GenRouter | typeof GenChannel,
          GenRouter | GenChannel,
          ChildSpec,
          Generator<[boolean, EventEmitter], never, boolean>
        ]
      ) => spec[1] instanceof GenRouter
    );
    const socketServers = childSpecs.filter(
      (
        spec: [
          typeof GenRouter | typeof GenChannel,
          GenRouter | GenChannel,
          ChildSpec,
          Generator<[boolean, EventEmitter], never, boolean>
        ]
      ) => spec[1] instanceof GenChannel
    );
    if (httpServers.length > 0) {
      this[keyForServer] = buildExpressApp(httpServers).listen(
        (<V>(<unknown>context))[keyForServerPort]
      );
      combinedCancelerPromise.then((_) => {
        this[keyForServer].close();
      });
    }
    if (socketServers.length > 0) {
      this[keyForSocketServer] = buildSocketServer(socketServers).listen(
        (<V>(<unknown>context))[keyForSocketServerPort]
      );
      combinedCancelerPromise.then((_) => {
        this[keyForSocketServer].close();
      });
    }
    this[keyForSupervisedChidren] = childSpecs.map(
      (
        childSpecs: [
          typeof GenRouter | typeof GenChannel,
          GenRouter | GenChannel,
          ChildSpec,
          Generator<[boolean, EventEmitter], never, boolean>
        ]
      ) => ({
        id: childSpecs[1][keyForIdSymbol],
        canceler: childSpecs[3],
      })
    );
    await Promise.all([
      tail(
        (specs) =>
          this.run(
            combinedCanceler,
            combinedCancelerPromise,
            context,
            this[keyForSupervisedChidren],
            specs
          ),
        canceler,
        {
          childSpecs,
          strategy: startArgs[0],
        },
        (specs) => specs.childSpecs.length === 0
      ).then((value) => (putMemoValue(managementCanceler, false), value)),
      tail(
        () =>
          this.runManagement(
            managementCanceler,
            combinedCancelerPromise,
            context
          ),
        combinedCanceler,
        null,
        (exitValue) => exitValue === undefined
      ),
    ]);
  }
}

export { GenEndpoint };
