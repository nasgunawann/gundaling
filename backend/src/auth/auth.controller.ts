import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: { user: { sub: string } }) {
    return this.authService.validateUserById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-manager-pin')
  @HttpCode(HttpStatus.OK)
  async verifyManagerPin(@Body() verifyPinDto: VerifyPinDto) {
    const isValid = await this.authService.verifyManagerPin(verifyPinDto.pin);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Manager PIN');
    }
    return { success: true };
  }
}
