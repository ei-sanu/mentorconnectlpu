"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransactionSafely = runTransactionSafely;
async function runTransactionSafely(connection, action) {
    const session = await connection.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await action(session);
        });
        return result;
    }
    catch (error) {
        const isStandaloneError = error?.message &&
            (error.message.includes('Transaction numbers are only allowed') ||
                error.message.includes('sessions are not supported'));
        if (isStandaloneError) {
            return await action(null);
        }
        throw error;
    }
    finally {
        await session.endSession();
    }
}
//# sourceMappingURL=transaction.helper.js.map