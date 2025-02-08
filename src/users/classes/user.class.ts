export class User{
    id: number;
    username: string;
    isGuest: boolean;
    token: string;
    socketId?: string;
    passwordReset?: {
        token: string;
        expiration: Date;
        images: Array<{
            id: number;
            item_id: string;
            name: string;
            src: string;
            isRight: boolean;
        }>;
        verified: boolean;
        email: string;
    }

    constructor(id: number, username: string, isGuest: boolean, token: string){
        this.id = id;
        this.username = username;
        this.isGuest = isGuest;
        this.token = token;
        this.socketId = null;
        this.passwordReset = null;
    }
}