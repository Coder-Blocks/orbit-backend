import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roles: ['RENTER'],
        profile: { create: { fullName: dto.fullName } },
        customerProfile: { create: {} },
        verification: { create: {} },
      },
    });
    return this.issueTokens(user.id, user.email, user.roles);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email, user.roles);
  }

  private issueTokens(userId: string, email: string, roles: UserRole[]) {
    const payload = { sub: userId, email, roles };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }),
      refreshToken: this.jwt.sign(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      }),
    };
  }
}
