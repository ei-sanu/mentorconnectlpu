import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    getGoals(mentorshipId: string, user: any): Promise<any>;
    createGoal(mentorshipId: string, user: any, dto: CreateGoalDto): Promise<any>;
    updateGoal(id: string, user: any, dto: any): Promise<any>;
    deleteGoal(id: string, user: any): Promise<any>;
}
