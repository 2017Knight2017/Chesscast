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
		@MessageBody() data: { matchId: string; username?: string },
		@ConnectedSocket() client: Socket,
	) {
		client.join(data.matchId);
		console.log(`Client ${client.id} joined room: ${data.matchId}`);

		if (data.username) {
			await this.redisService.addViewer(data.matchId, data.username);
		}
		else {
			await this.redisService.addGuestViewer(data.matchId);
		}

		const counts = await this.redisService.getViewerData(data.matchId);
		client.emit('viewer_count_update', { matchId: data.matchId, ...counts });
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
		@MessageBody() data: { matchId: string; username?: string },
		@ConnectedSocket() client: Socket,
	) {
		client.leave(data.matchId);
		console.log(`[Socket] Client ${client.id} left match ${data.matchId}`);

		if (data.username) {
			await this.redisService.removeViewer(data.matchId, data.username);
		}
		else {
			await this.redisService.removeGuestViewer(data.matchId);
		}
		
		const counts = await this.redisService.getViewerData(data.matchId);
		client.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('subscribeToCounts')
	handleSubscribe(client: Socket, data: { matchIds: string[] }) {
		data.matchIds.forEach(id => {
			client.join(`counter:${id}`);
		});
	}

	@SubscribeMessage('unsubscribeFromCounts')
	handleUnsubscribe(client: Socket, data: { matchIds: string[] }) {
		data.matchIds.forEach(id => {
			client.leave(`counter:${id}`);
		});
	}
}