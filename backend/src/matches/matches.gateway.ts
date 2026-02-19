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
import { Inject, forwardRef } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as sc from '../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway implements OnGatewayConnection {
	@WebSocketServer()
	server: Server;

	constructor(
		@InjectQueue('timer') private readonly timerQueue: Queue,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {}

	handleConnection(client: Socket) {
		console.log(`Client connected: ${client.id}`);
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
}