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
import { RedisService } from 'src/redis/redis.service';


@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway implements OnGatewayConnection {
	@WebSocketServer() server: Server;


	constructor(
		@InjectQueue('timer') private readonly timerQueue: Queue,
		private readonly redisService: RedisService
	) {}

	handleConnection(client: Socket) {
		console.log(`[Socket] Client connected: ${client.id}`);
		
	}

	handleDisconnect(client: Socket) {
		console.log(`[Socket] Client disconnected: ${client.id}`);
	}

	@SubscribeMessage('joinMatch')
	async handleJoinMatch(
		@MessageBody() data: { matchId: string },
		@ConnectedSocket() client: Socket,
	) {
		client.join(data.matchId);
		console.log(`Client ${client.id} joined room: ${data.matchId}`);

		await this.redisService.addViewer(data.matchId);
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
	async handleLeaveMatch(
		@MessageBody('matchId') matchId: string,
		@ConnectedSocket() client: Socket,
	) {
		client.leave(matchId);
		console.log(`[Socket] Client ${client.id} left match ${matchId}`);

		await this.redisService.removeViewer(matchId);
		
		return { status: 'left', matchId };
	}

	@SubscribeMessage('subscribe_to_counts')
	handleSubscribe(client: Socket, data: { matchIds: string[] }) {
		data.matchIds.forEach(id => {
			client.join(`counter:${id}`);
		});
	}
}