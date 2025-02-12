import { WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EmailGateway {
    private server: Server;

    afterInit(server: Server) {
        this.server = server;
    }

    emitUserVerification(userId: string, token: string, success: boolean): void {
        try {
            this.server.to(userId)?.emit("userVerification", { token: token, success: success });
        } catch (error) {
            console.log("Error sending user verification email:", error);
        }
    }
}