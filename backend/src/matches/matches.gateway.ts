import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from 'src/redis/redis.service';


@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(
		@InjectQueue('timer') private readonly timerQueue: Queue,
		private readonly redisService: RedisService
	) {}

	handleConnection(client: Socket) {
		console.log(`[Socket] Client connected: ${client.id}`);
	}

	async handleDisconnect(client: Socket) {
		console.log(`[Socket] Client disconnected: ${client.id}`);

		const matchId = client.data?.matchId;
		const guestId = client.data?.guestId;

		if (matchId && guestId) {
			await this.redisService.removeGuestViewer(matchId, guestId);
			const counts = await this.redisService.getViewerData(matchId);
			this.server.to(`counter:${matchId}`).emit('viewer_count_update', { matchId, ...counts });
		}
	}

	@SubscribeMessage('joinMatch')
	async handleJoinMatch(
		@MessageBody() data: { matchId: string; username?: string; guestId?: string },
		@ConnectedSocket() client: Socket,
	) {
		client.join(data.matchId);
		client.data.matchId = data.matchId;

		console.log(`Client ${client.id} joined room: ${data.matchId}`);

		if (data.username) {
			await this.redisService.addViewer(data.matchId, data.username);
		} else if (data.guestId) {
			client.data.guestId = data.guestId;
			await this.redisService.addGuestViewer(data.matchId, data.guestId);
		}

		const counts = await this.redisService.getViewerData(data.matchId);
		this.server.to(`counter:${data.matchId}`).emit('viewer_count_update', { matchId: data.matchId, ...counts })
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
		@MessageBody() data: { matchId: string; username?: string; guestId?: string },
		@ConnectedSocket() client: Socket,
	) {
		client.leave(data.matchId);
		console.log(`[Socket] Client ${client.id} left match ${data.matchId}`);

		if (data.username) {
			await this.redisService.removeViewer(data.matchId, data.username);
		} else if (data.guestId) {
			await this.redisService.removeGuestViewer(data.matchId, data.guestId);
		}

		const counts = await this.redisService.getViewerData(data.matchId);
		client.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('subscribeToCounts')
	async handleSubscribe(client: Socket, data: { matchIds: string[] }) {
		for (const id of data.matchIds) {
			client.join(`counter:${id}`);
			const counts = await this.redisService.getViewerData(id);
			client.emit('viewer_count_update', { matchId: id, ...counts });
		}
	}

	@SubscribeMessage('unsubscribeFromCounts')
	handleUnsubscribe(client: Socket, data: { matchIds: string[] }) {
		data.matchIds.forEach(id => {
			client.leave(`counter:${id}`);
		});
	}

	@SubscribeMessage('joinAnalysisStream')
	async handleJoinAnalysisStream(
		@MessageBody() data: { matchId: string; userId: number },
		@ConnectedSocket() client: Socket,
	) {
		const room = `analysis_stream:${data.matchId}:user:${data.userId}`;
		client.join(room);
		console.log(`Client ${client.id} joined analysis stream room: ${room}`);
	}

	@SubscribeMessage('leaveAnalysisStream')
	async handleLeaveAnalysisStream(
		@MessageBody() data: { matchId: string; userId: number },
		@ConnectedSocket() client: Socket,
	) {
		const room = `analysis_stream:${data.matchId}:user:${data.userId}`;
		client.leave(room);
		console.log(`Client ${client.id} left analysis stream room: ${room}`);
	}

	@SubscribeMessage('syncUserAnalysis')
	async handleSyncUserAnalysis(
		@MessageBody() data: { matchId: string; userId: number; movesTree: object },
		@ConnectedSocket() client: Socket,
	) {
		await this.redisService.setUserAnalysis(
			data.matchId,
			data.userId,
			data.movesTree,
		);

		const room = `analysis_stream:${data.matchId}:user:${data.userId}`;
		this.server.to(room).emit('analysisUpdate', {
			matchId: data.matchId,
			userId: data.userId,
			movesTree: data.movesTree,
		});
	}

	@SubscribeMessage('isMatchProcessing')
	async handleIsMatchProcessing(
		@MessageBody() data: {matchId: string},
		@ConnectedSocket() client: Socket,
	) {
		client.join(`is_processing:${data.matchId}`)
	}
}
