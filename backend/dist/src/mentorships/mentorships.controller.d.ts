import { MentorshipsService } from './mentorships.service';
export declare class MentorshipsController {
    private readonly mentorshipsService;
    constructor(mentorshipsService: MentorshipsService);
    getAll(user: any): Promise<any>;
    getOne(id: string, user: any): Promise<any>;
    update(id: string, user: any, status: any): Promise<any>;
}
