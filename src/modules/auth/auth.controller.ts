import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from 'src/schemas/user.schema';
import { CurrentUser } from './current-user.decorator';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _: LoginDto,
    @CurrentUser() user: User,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.login(user, req, res);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @CurrentUser() body: { user: User; refreshToken: string },
    @Res({ passthrough: true }) res,
  ) {
    await this.authService.refresh(body, res);
  }

  @Post('session')
  @UseGuards(JwtAuthGuard)
  async session(
    @CurrentUser() body: { user: User; userId: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.session(body.userId, req, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() body: { user: User; userId: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(body.userId, response);
  }
}
