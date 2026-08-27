import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(user: any, dto: CreateRequestDto): Promise<any>;
    getAll(user: any): Promise<any>;
    getOne(id: string, user: any): Promise<any>;
    accept(id: string, user: any): Promise<any>;
    decline(id: string, user: any): Promise<any>;
    cancel(id: string, user: any): Promise<any>;
}
