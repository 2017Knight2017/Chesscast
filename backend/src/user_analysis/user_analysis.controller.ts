import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	UseGuards,
	Request,
	NotFoundException,
} from '@nestjs/common';
import { UserAnalysisService, MoveTreeNode } from './user_analysis.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface userRequest extends Request {
	user: {
		id: number;
		username: string;
	};
}

@Controller('user-analysis')
export class UserAnalysisController {
	constructor(private readonly userAnalysisService: UserAnalysisService) {}

	@Get(':matchId/:userId')
	async getUserAnalysis(
		@Param('matchId') matchId: string,
		@Param('userId') userId: string,
	) {
		const data = await this.userAnalysisService.getUserAnalysis(
			matchId,
			parseInt(userId),
		);
		return { data };
	}

	@Post('save')
	@UseGuards(JwtAuthGuard)
	async saveUserAnalysis(
		@Request() req: userRequest,
		@Body() body: { matchId: string; data: MoveTreeNode[] },
	) {
		await this.userAnalysisService.saveUserAnalysis(
			body.matchId,
			req.user.id,
			body.data,
		);
		return { success: true };
	}

	@Post('save-draft')
	@UseGuards(JwtAuthGuard)
	async saveDraft(
		@Request() req: userRequest,
		@Body() body: { matchId: string },
	) {
		await this.userAnalysisService.saveAnalysisFromRedis(
			body.matchId,
			req.user.id,
		);
		return { success: true };
	}

	@Delete('discard')
	@UseGuards(JwtAuthGuard)
	async discardUserAnalysis(
		@Request() req: userRequest,
		@Body() body: { matchId: string },
	) {
		await this.userAnalysisService.discardUserAnalysis(
			body.matchId,
			req.user.id,
		);
		return { success: true };
	}

	@Get('is-analyzing/:matchId/:userId')
	async isAnalyzing(
		@Param('matchId') matchId: string,
		@Param('userId') userId: string,
	) {
		const result = await this.userAnalysisService.isAnalyzing(
			matchId,
			parseInt(userId),
		);
		return { isAnalyzing: result };
	}

	@Get('by-username/:username')
	async getPlayerByUsername(@Param('username') username: string) {
		return this.userAnalysisService.findByUsername(username);
	}
}
