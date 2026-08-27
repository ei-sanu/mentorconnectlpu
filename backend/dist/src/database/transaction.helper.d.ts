import { Connection, ClientSession } from 'mongoose';
export declare function runTransactionSafely<T>(connection: Connection, action: (session: ClientSession | null) => Promise<T>): Promise<T>;
