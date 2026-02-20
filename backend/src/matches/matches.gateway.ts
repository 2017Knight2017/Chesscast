import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';


@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway implements OnGatewayConnection {
	@WebSocketServer()
	server: Server;

	constructor(
		@InjectQueue('timer') private readonly timerQueue: Queue,
	) {}

	// Хук подключения клиента
	handleConnection(client: Socket) {
		console.log(`[Socket] Клиент подключился: ${client.id}`);
	}

	// Хук отключения клиента
	handleDisconnect(client: Socket) {
		console.log(`[Socket] Клиент отключился: ${client.id}`);
	}

	@SubscribeMessage('joinMatch')
	handleJoinMatch(
		@MessageBody() data: { matchId: string },
		@ConnectedSocket() client: Socket,
	) {
		client.join(data.matchId);
		console.log(`Client ${client.id} joined room: ${data.matchId}`);
	}

	@SubscribeMessage('startBroadcast')
	async handleStart(@MessageBody() data: { matchId: string }) {
		await this.timerQueue.add(
			'nextStep',
			{ matchId: data.matchId, moveIndex: 0 },
			{ jobId: `timer_${data.matchId}` }
		);
	}

	@SubscribeMessage('leaveMatch')
	handleLeaveMatch(
		@MessageBody('matchId') matchId: string,
		@ConnectedSocket() client: Socket,
	) {
		client.leave(matchId);
		console.log(`[Socket] Клиент ${client.id} покинул партию ${matchId}`);
		
		return { status: 'left', matchId };
	}
}