import { ActionItemsService } from './action-items.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
export declare class ActionItemsController {
    private readonly actionItemsService;
    constructor(actionItemsService: ActionItemsService);
    getActionItems(mentorshipId: string, user: any): Promise<any>;
    createActionItem(mentorshipId: string, user: any, dto: CreateActionItemDto): Promise<any>;
    updateActionItem(id: string, user: any, dto: any): Promise<any>;
}
