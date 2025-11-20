import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { InstagramService } from '../instagram/instagram.service';
import * as crypto from 'crypto';

@Injectable()
export class IgAccountsService {
  private readonly logger = new Logger(IgAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
    private readonly instagram: InstagramService,
  ) {}

  async getConnectUrl(userId: string) {
    const appId = this.config.get('INSTAGRAM_APP_ID');
    const redirectUri = this.config.get('INSTAGRAM_REDIRECT_URI');
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in database for validation (prevents CSRF attacks)
    await this.prisma.oAuthState.create({
      data: {
        state,
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Correct scopes for Instagram Graph API
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management';
    
    // Use Facebook OAuth with correct API version
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scope}&response_type=code&state=${state}`;

    return { url, state };
  }

  async verifyState(state: string) {
    // Find the state in database
    const oauthState = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!oauthState) {
      return null;
    }

    // Check if expired
    if (oauthState.expiresAt < new Date()) {
      // Clean up expired state
      await this.prisma.oAuthState.delete({
        where: { state },
      });
      return null;
    }

    // Delete state after use (one-time use)
    await this.prisma.oAuthState.delete({
      where: { state },
    });

    return oauthState;
  }

  async handleCallback(code: string, state: string, userId: string) {
    try {
      const appId = this.config.get('INSTAGRAM_APP_ID');
      const appSecret = this.config.get('INSTAGRAM_APP_SECRET');
      const redirectUri = this.config.get('INSTAGRAM_REDIRECT_URI');

      // Step 1: Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`,
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new BadRequestException(
          `Failed to exchange code for token: ${error.error?.message || 'Unknown error'}`,
        );
      }

      const tokenData = await tokenResponse.json();
      const userAccessToken = tokenData.access_token;

      console.log('🔍 Fetching Facebook Pages...');

      // Get Facebook Pages connected to this user
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`,
      );

      if (!pagesResponse.ok) {
        throw new BadRequestException('Failed to fetch Facebook Pages');
      }

      const pagesData = await pagesResponse.json();

      console.log('📄 Facebook Pages found:', pagesData.data?.length || 0);
      if (pagesData.data && pagesData.data.length > 0) {
        pagesData.data.forEach((page: any, index: number) => {
          console.log(`  Page ${index + 1}: "${page.name}" (ID: ${page.id})`);
        });
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new BadRequestException(
          `No Facebook Pages found. Instagram Graph API requires a Facebook Page.

SETUP STEPS (5 minutes):
1. Create a Facebook Page: facebook.com/pages/create
   - Page name: Your brand/business name
   - Category: Choose relevant category
   
2. Open Instagram mobile app
   - Settings → Account → Switch to Professional Account
   - Choose "Business" (required for Page connection)
   - Connect to your Facebook Page
   
3. Return here and reconnect

Note: The Facebook Page is only for API authentication. All posts will go to Instagram only.`,
        );
      }

      // Check each page for Instagram Business Account connection
      let igAccountId = null;
      let pageAccessToken = null;
      let connectedPageName = null;

      for (const page of pagesData.data as any[]) {
        console.log(`🔍 Checking page "${page.name}" for Instagram connection...`);
        
        const igCheckResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        );

        if (igCheckResponse.ok) {
          const igCheckData = await igCheckResponse.json();
          
          if (igCheckData.instagram_business_account) {
            igAccountId = igCheckData.instagram_business_account.id;
            pageAccessToken = page.access_token;
            connectedPageName = page.name;
            console.log(`✅ Found Instagram Business Account on page "${page.name}": ${igAccountId}`);
            break;
          }
        }
      }

      if (!igAccountId) {
        const pageNames = pagesData.data.map((p: any) => `"${p.name}"`).join(', ');
        throw new BadRequestException(
          `Found Facebook Pages (${pageNames}) but none are connected to an Instagram Business Account.

HOW TO FIX:
1. Open Instagram mobile app
2. Settings → Account → Switch to Professional Account  
3. Choose "Business" (not Creator)
4. When asked, select one of your Facebook Pages: ${pageNames}
5. Complete the setup
6. Return here and try connecting again`,
        );
      }

      console.log(`✅ Instagram Account ID: ${igAccountId}`);

      // Step 5: Get Instagram account profile information
      const profileResponse = await fetch(
        `https://graph.facebook.com/v21.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`,
      );

      if (!profileResponse.ok) {
        throw new BadRequestException('Failed to fetch Instagram profile');
      }

      const profile = await profileResponse.json();

      // Step 6: Exchange short-lived token for long-lived token (60 days)
      const longLivedTokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${pageAccessToken}`,
      );

      let finalAccessToken = pageAccessToken;
      let expiresIn = 5184000; // 60 days default

      if (longLivedTokenResponse.ok) {
        const longLivedData = await longLivedTokenResponse.json();
        finalAccessToken = longLivedData.access_token;
        expiresIn = longLivedData.expires_in || 5184000;
      }

      // Encrypt access token for secure storage
      const encryptedToken = this.encryption.encrypt(finalAccessToken);

      // Create or update account with real Instagram data
      const account = await this.prisma.igAccount.upsert({
        where: { igUserId: profile.id },
        create: {
          userId,
          username: profile.username,
          igUserId: profile.id,
          accessToken: encryptedToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          followersCount: profile.followers_count || 0,
          isActive: true,
        },
        update: {
          userId, // CRITICAL: Update userId to current user connecting the account
          accessToken: encryptedToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          followersCount: profile.followers_count || 0,
          username: profile.username,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      console.log('💾 Instagram account saved to database:', {
        accountId: account.id,
        username: account.username,
        igUserId: account.igUserId,
        userId: account.userId,
        isActive: account.isActive,
      });

      return {
        id: account.id,
        username: account.username,
        igUserId: account.igUserId,
        isActive: account.isActive,
        followersCount: profile.followers_count || 0,
      };
    } catch (error) {
      // Return detailed error message
      const errorMessage = error.message || 'Failed to connect Instagram account';
      throw new BadRequestException(errorMessage);
    }
  }

  async findAll(userId: string) {
    console.log('🔍 Finding all Instagram accounts for user:', userId);
    
    const accounts = await this.prisma.igAccount.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        igUserId: true,
        isActive: true,
        followersCount: true,
        lastSyncAt: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Found ${accounts.length} active Instagram account(s):`, 
      accounts.map(a => ({ id: a.id, username: a.username, igUserId: a.igUserId }))
    );

    // Map field names to match frontend expectations
    return accounts.map(account => ({
      id: account.id,
      instagramUserId: account.igUserId,
      username: account.username,
      followersCount: account.followersCount || 0,
      isActive: account.isActive,
      lastSyncedAt: account.lastSyncAt || account.updatedAt,
      createdAt: account.createdAt,
    }));
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        username: true,
        igUserId: true,
        isActive: true,
        followersCount: true,
        lastSyncAt: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    // Map field names to match frontend expectations
    return {
      id: account.id,
      instagramUserId: account.igUserId,
      username: account.username,
      followersCount: account.followersCount || 0,
      isActive: account.isActive,
      lastSyncedAt: account.lastSyncAt || account.updatedAt,
      createdAt: account.createdAt,
    };
  }

  async remove(id: string, userId: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    await this.prisma.igAccount.delete({
      where: { id },
    });

    return { message: 'Account removed successfully' };
  }

  async refreshToken(id: string, userId: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    try {
      const decryptedToken = this.encryption.decrypt(account.accessToken);
      
      // Refresh the Instagram access token using the Graph API
      this.logger.log(`Refreshing Instagram token for account ${account.username}...`);
      const newTokenData = await this.instagram.refreshAccessToken(decryptedToken);

      const encryptedToken = this.encryption.encrypt(newTokenData.access_token);

      await this.prisma.igAccount.update({
        where: { id },
        data: {
          accessToken: encryptedToken,
          tokenExpiresAt: new Date(Date.now() + newTokenData.expires_in * 1000),
        },
      });

      this.logger.log(`✅ Token refreshed successfully for ${account.username}`);
      return { message: 'Token refreshed successfully' };
    } catch (error) {
      this.logger.error(`❌ Failed to refresh token for account ${account.username}:`, error.message);
      throw new BadRequestException('Failed to refresh token');
    }
  }

  async createDemoAccount(userId: string) {
    // Generate random demo data
    const demoUsername = `demo_user_${Math.floor(Math.random() * 10000)}`;
    const demoIgUserId = `demo_${Date.now()}`;
    const demoToken = `demo_token_${crypto.randomBytes(16).toString('hex')}`;
    
    // Encrypt demo token
    const encryptedToken = this.encryption.encrypt(demoToken);
    
    // Create demo account
    const account = await this.prisma.igAccount.create({
      data: {
        userId,
        username: demoUsername,
        igUserId: demoIgUserId,
        accessToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        followersCount: Math.floor(Math.random() * 10000) + 500,
      },
    });

    return {
      id: account.id,
      username: account.username,
      igUserId: account.igUserId,
      isActive: account.isActive,
    };
  }
}
