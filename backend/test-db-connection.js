const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:kali@localhost:5432/instagram_autoposter?schema=public'
    }
  },
  log: ['query', 'error', 'warn']
});

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('Database info:', result);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected successfully!');
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testConnection();
