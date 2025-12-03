import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { GoogleSheetsService } from '../google/google-sheets.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private googleSheets: GoogleSheetsService,
  ) {}

  /**
   * Register a new user
   */
  async register(email: string, password: string, displayName?: string, licenseKey?: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists, update password only (preserve role)
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          displayName: displayName || existingUser.displayName,
        },
      });
      return this.generateTokens(updatedUser.id, updatedUser.email, updatedUser.role);
    }

    // Verify license if provided
    let plan: 'FREE' | 'BASIC' | 'BUSINESS' | 'ENTERPRISE' = 'FREE';
    if (licenseKey) {
      const license = await this.googleSheets.verifyLicense(licenseKey);
      if (!license) {
        throw new Error('Invalid or expired license key');
      }
      plan = license.plan as 'FREE' | 'BASIC' | 'BUSINESS' | 'ENTERPRISE';
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        licenseKey,
        plan,
        role: 'USER',
      },
    });

    // Generate tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}
