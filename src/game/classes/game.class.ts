import { Riddle } from "src/riddles/classes/riddle.class";
import { User } from "src/users/classes/user.class";

export class Game {
    riddle: Riddle;
    user: User;
    id: number | null = null;

    constructor(riddle: Riddle, user: User) {
        this.riddle = riddle;
        this.user = user;
    }
}