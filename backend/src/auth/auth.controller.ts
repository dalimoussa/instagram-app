import { Controller, Post, Body, UseGuards, Get, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IgAccountsService } from '../ig-accounts/ig-accounts.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private igAccountsService: IgAccountsService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.displayName,
      registerDto.licenseKey,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('instagram/callback')
  async handleInstagramCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    // OAuth callback should NOT be protected by JWT guard
    // The state parameter contains the user ID verification
    
    if (!code || !state) {
      return `
        <html>
          <body>
            <h2>Instagram Connection Failed</h2>
            <p>Missing authorization code or state</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `;
    }
    
    try {
      // Verify state and get user ID from database
      const oauthState = await this.igAccountsService.verifyState(state);
      
      if (!oauthState) {
        return `
          <html>
            <body>
              <h2>Instagram Connection Failed</h2>
              <p>Invalid or expired state. Please try again.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
          </html>
        `;
      }
      
      // Handle the callback with verified user ID
      const account = await this.igAccountsService.handleCallback(
        code,
        state,
        oauthState.userId,
      );
      
      console.log('✅ Account created/updated successfully:', {
        id: account.id,
        username: account.username,
        userId: oauthState.userId,
      });
      
      return `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
              }
              h2 { color: #333; margin-bottom: 1rem; }
              p { color: #666; margin-bottom: 1.5rem; }
              .success { color: #10b981; font-weight: 600; font-size: 1.1rem; }
              .account { 
                background: #f3f4f6; 
                padding: 1rem; 
                border-radius: 0.5rem; 
                margin: 1rem 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🎉 Instagram Account Connected!</h2>
              <div class="account">
                <p class="success">@${account.username}</p>
                <p style="margin: 0; font-size: 0.9rem; color: #666;">Instagram Account ID: ${account.igUserId}</p>
              </div>
              <p>Your account has been successfully connected!</p>
              <p style="font-size: 0.875rem; color: #999;">Redirecting you back...</p>
            </div>
            <script>
              // Use postMessage to notify parent window
              if (window.opener) {
                // Send to all possible origins (localhost and current origin)
                const origins = ['http://localhost:5173', 'https://hydroelectric-cythia-confessingly.ngrok-free.dev', window.location.origin];
                origins.forEach(origin => {
                  try {
                    window.opener.postMessage({ 
                      type: 'INSTAGRAM_CONNECTED',
                      account: {
                        id: '${account.id}',
                        username: '${account.username}',
                        igUserId: '${account.igUserId}'
                      }
                    }, origin);
                  } catch (e) {
                    console.error('Failed to send postMessage to', origin, e);
                  }
                });
              }
              
              // Close popup after a short delay
              setTimeout(() => {
                window.close();
                // If close doesn't work, try to navigate parent
                if (window.opener && !window.closed) {
                  try {
                    window.opener.location.reload();
                  } catch (e) {}
                }
              }, 1500);
            </script>
          </body>
        </html>
      `;
    } catch (error) {
      return `
        <html>
          <body>
            <h2>Instagram Connection Failed</h2>
            <p>Error: ${error.message}</p>
            <p>Please try again or contact support.</p>
            <script>setTimeout(() => window.close(), 5000);</script>
          </body>
        </html>
      `;
    }
  }
}
