export interface NotificationProvider {
  send(userId: string, type: string, payload: Record<string, unknown>): Promise<void>;
}
