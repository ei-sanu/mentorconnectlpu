import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type SessionDocument = Session & Document;
export declare enum SessionStatus {
    SCHEDULED = "SCHEDULED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    RESCHEDULED = "RESCHEDULED",
    NO_SHOW = "NO_SHOW"
}
export declare enum CalendarSyncStatus {
    PENDING = "PENDING",
    FAILED = "FAILED",
    SYNCED = "SYNCED"
}
export declare class Session {
    mentorshipId: Types.ObjectId;
    title: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    status: SessionStatus;
    notes?: string;
    meetingUrl?: string;
    createdBy: string;
    calendarEventId?: string;
    calendarSyncStatus: CalendarSyncStatus;
}
export declare const SessionSchema: MongooseSchema<Session, import("mongoose").Model<Session, any, any, any, Document<unknown, any, Session, any, {}> & Session & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Session, Document<unknown, {}, import("mongoose").FlatRecord<Session>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Session> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
