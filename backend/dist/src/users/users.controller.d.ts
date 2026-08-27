import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: any): Promise<any>;
    updateMe(user: any, updateUserDto: UpdateUserDto): Promise<any>;
    getMyProfile(user: any): Promise<any>;
    submitOnboarding(user: any, data: any): Promise<any>;
}
