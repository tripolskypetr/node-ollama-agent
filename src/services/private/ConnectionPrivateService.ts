import { CANCELED_PROMISE_SYMBOL, memoize } from "functools-kit";
import { TContextService } from "../base/ContextService";
import { inject } from "src/core/di";
import TYPES from "src/config/types";
import LoggerService from "../base/LoggerService";
import BaseConnection, { IConnection } from "src/common/BaseConnection";
import { AgentName } from "src/utils/getAgentMap";

export interface IMessage {
  clientId: string;
  stamp: string;
  data: string;
}

export type SendMessageFn = (
  outgoing: IMessage
) => Promise<void | typeof CANCELED_PROMISE_SYMBOL>;

export class ConnectionPrivateService implements IConnection {
  readonly loggerService = inject<LoggerService>(TYPES.loggerService);
  readonly contextService = inject<TContextService>(TYPES.contextService);

  private getClientConnection = memoize(
    ([clientId]) => clientId,
    (clientId: string) =>
      new (class extends BaseConnection({
        clientId,
        connectionName: "root-connection",
      }) {})()
  );

  public connect = (
    connector: (outgoing: IMessage) => void | Promise<void>
  ) => {
    this.loggerService.logCtx("connectionPrivateService connect");
    return this.getClientConnection(
      this.contextService.context.clientId
    ).connect(connector);
  };

  public dispose = async () => {
    this.loggerService.logCtx("connectionPrivateService dispose");
    await this.getClientConnection(
      this.contextService.context.clientId
    ).dispose();
    this.getClientConnection.clear(this.contextService.context.clientId);
  };

  public emit = async (outgoing: string, agentName: AgentName) => {
    this.loggerService.logCtx("connectionPrivateService emit", {
      outgoing,
    });
    return await this.getClientConnection(
      this.contextService.context.clientId
    ).emit(outgoing, agentName);
  };
}

export default ConnectionPrivateService;
