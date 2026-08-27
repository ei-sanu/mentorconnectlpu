import { Connection, ClientSession } from 'mongoose';

export async function runTransactionSafely<T>(
  connection: Connection,
  action: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await connection.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await action(session);
    });
    return result!;
  } catch (error: any) {
    const isStandaloneError =
      error?.message &&
      (error.message.includes('Transaction numbers are only allowed') ||
       error.message.includes('sessions are not supported'));

    if (isStandaloneError) {
      // Standalone fallback: execute sequentially without transaction context
      return await action(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
