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
import { Logger } from '@nestjs/common';

interface SocketData {
	matchId?: string;
	guestId?: string;
	username?: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer() server: Server;

	constructor(
		@InjectQueue('timer') private readonly timerQueue: Queue,
		private readonly redisService: RedisService,
	) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(MatchesGateway.name);

	handleConnection(client: Socket) {
		this.logger.log(`[Socket] Client connected: ${client.id}`);
	}

	async handleDisconnect(client: Socket<any, any, any, SocketData>) {
		this.logger.log(`[Socket] Client disconnected: ${client.id}`);

		const matchId = client.data?.matchId;
		const guestId = client.data?.guestId;
		const username = client.data?.username;

		if (matchId) {
			if (username) {
				await this.redisService.removeViewer(matchId, username);
				await this.redisService.removeUserStatus(matchId, username);

				this.server
					.to(`analysis_stream_status:${matchId}:${username}`)
					.emit('analysisStreamEnded', {
						matchId,
						username,
					});

				const counts = await this.redisService.getViewerData(matchId);
				this.server
					.to(`counter:${matchId}`)
					.emit('viewer_count_update', { matchId, ...counts });
			} else if (guestId) {
				await this.redisService.removeGuestViewer(matchId, guestId);
				const counts = await this.redisService.getViewerData(matchId);
				this.server
					.to(`counter:${matchId}`)
					.emit('viewer_count_update', { matchId, ...counts });
			}
		}
	}

	@SubscribeMessage('joinMatch')
	async handleJoinMatch(
		@MessageBody()
		data: { matchId: string; username?: string; guestId?: string },
		@ConnectedSocket() client: Socket<any, any, any, SocketData>,
	) {
		this.logger.log('handleJoinMatch called');
		await client.join(data.matchId);
		client.data.matchId = data.matchId;

		this.logger.log(`Client ${client.id} joined room: ${data.matchId}`);

		if (data.username) {
			client.data.username = data.username;
			await this.redisService.addViewer(data.matchId, data.username);
		} else if (data.guestId) {
			client.data.guestId = data.guestId;
			await this.redisService.addGuestViewer(data.matchId, data.guestId);
		}

		const counts = await this.redisService.getViewerData(data.matchId);
		this.server
			.to(`counter:${data.matchId}`)
			.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('startBroadcast')
	async handleStart(@MessageBody() data: { matchId: string }) {
		this.logger.log('handleStart called');
		await this.timerQueue.add(
			'nextStep',
			{ matchId: data.matchId, moveIndex: 0 },
			{ jobId: `timer_${data.matchId}` },
		);
	}

	@SubscribeMessage('leaveMatch')
	async handleLeaveMatch(
		@MessageBody()
		data: { matchId: string; username?: string; guestId?: string },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.log('handleLeaveMatch called');
		await client.leave(data.matchId);
		this.logger.log(
			`[Socket] Client ${client.id} left match ${data.matchId}`,
		);

		if (data.username) {
			await this.redisService.removeViewer(data.matchId, data.username);
			await this.redisService.removeUserStatus(
				data.matchId,
				data.username,
			);

			this.server
				.to(`analysis_stream_status:${data.matchId}:${data.username}`)
				.emit('analysisStreamEnded', {
					matchId: data.matchId,
					username: data.username,
				});
		} else if (data.guestId) {
			await this.redisService.removeGuestViewer(
				data.matchId,
				data.guestId,
			);
		}

		const counts = await this.redisService.getViewerData(data.matchId);
		this.server
			.to(`counter:${data.matchId}`)
			.emit('viewer_count_update', { matchId: data.matchId, ...counts });

		client.emit('viewer_count_update', {
			matchId: data.matchId,
			...counts,
		});
	}

	@SubscribeMessage('userStartedAnalysis')
	async handleUserStartedAnalysis(
		@MessageBody()
		data: {
			matchId: string;
			username: string;
			currentFen?: string;
		},
	) {
		this.logger.log('handleUserStartedAnalysis called');
		await this.redisService.setUserStatus(data.matchId, data.username, {
			isAnalyzing: true,
			...(data.currentFen ? { currentFen: data.currentFen } : {}),
		});
		const counts = await this.redisService.getViewerData(data.matchId);
		this.server
			.to(`counter:${data.matchId}`)
			.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('userStoppedAnalysis')
	async handleUserStoppedAnalysis(
		@MessageBody() data: { matchId: string; username: string },
	) {
		this.logger.log('handleUserStoppedAnalysis called');
		await this.redisService.removeUserStatus(data.matchId, data.username);

		this.server
			.to(`analysis_stream_status:${data.matchId}:${data.username}`)
			.emit('analysisStreamEnded', {
				matchId: data.matchId,
				username: data.username,
			});

		const counts = await this.redisService.getViewerData(data.matchId);
		this.server
			.to(`counter:${data.matchId}`)
			.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('broadcastAnalysisPosition')
	async handleBroadcastAnalysisPosition(
		@MessageBody() data: { matchId: string; username: string; fen: string },
	) {
		this.logger.log('handleBroadcastAnalysisPosition called');
		await this.redisService.setUserStatus(data.matchId, data.username, {
			isAnalyzing: true,
			currentFen: data.fen,
		});
		const counts = await this.redisService.getViewerData(data.matchId);
		this.server
			.to(`counter:${data.matchId}`)
			.emit('viewer_count_update', { matchId: data.matchId, ...counts });
	}

	@SubscribeMessage('subscribeToCounts')
	async handleSubscribe(client: Socket, data: { matchIds: string[] }) {
		this.logger.log('handleSubscribe called');
		for (const id of data.matchIds) {
			await client.join(`counter:${id}`);
			const counts = await this.redisService.getViewerData(id);
			client.emit('viewer_count_update', { matchId: id, ...counts });
		}
	}

	@SubscribeMessage('unsubscribeFromCounts')
	async handleUnsubscribe(client: Socket, data: { matchIds: string[] }) {
		this.logger.log('handleUnsubscribe called');
		for (const id of data.matchIds) {
			await client.leave(`counter:${id}`);
		}
	}

	@SubscribeMessage('joinAnalysisStream')
	async handleJoinAnalysisStream(
		@MessageBody()
		data: { matchId: string; userId: number; username: string },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.log('handleJoinAnalysisStream called');
		await client.join(`
			analysis_stream:${data.matchId}:user:${data.userId}
		`);
		if (data.username) {
			await client.join(
				`analysis_stream_status:${data.matchId}:${data.username}`,
			);
		}
	}

	@SubscribeMessage('leaveAnalysisStream')
	async handleLeaveAnalysisStream(
		@MessageBody()
		data: { matchId: string; userId: number; username: string },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.log('handleLeaveAnalysisStream called');
		await client.leave(`
			analysis_stream:${data.matchId}:user:${data.userId}
		`);
		if (data.username) {
			await client.leave(
				`analysis_stream_status:${data.matchId}:${data.username}`,
			);
		}
	}

	@SubscribeMessage('syncUserAnalysis')
	async handleSyncUserAnalysis(
		@MessageBody()
		data: {
			matchId: string;
			userId: number;
			movesTree: object;
			currentPath: number[];
		},
	) {
		this.logger.log('handleSyncUserAnalysis called');
		await this.redisService.setUserAnalysis(
			data.matchId,
			data.userId,
			data.movesTree,
		);

		this.server
			.to(`analysis_stream:${data.matchId}:user:${data.userId}`)
			.emit('analysisUpdate', {
				matchId: data.matchId,
				userId: data.userId,
				movesTree: data.movesTree,
				currentPath: data.currentPath,
			});
	}

	@SubscribeMessage('joinMatchProcessing')
	async handlejoinMatchProcessing(
		@MessageBody() data: { matchId: string },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.log('handlejoinMatchProcessing called');
		await client.join(`is_processing:${data.matchId}`);
	}

	@SubscribeMessage('leaveMatchProcessing')
	async handleleaveMatchProcessing(
		@MessageBody() data: { matchId: string },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.log('handleleaveMatchProcessing called');
		await client.leave(`is_processing:${data.matchId}`);
	}
}
