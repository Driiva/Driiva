import { db } from './db';
import { 
  users, 
  drivingProfiles, 
  trips, 
  communityPool, 
  achievements, 
  userAchievements,
  leaderboard 
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Seed the database with initial test data
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash password for test user
    const hashedPassword = await bcrypt.hash('driiva1', SALT_ROUNDS);

    // 1. Create test user
    console.log('Creating test user...');
    const [testUser] = await db.insert(users)
      .values({
        username: 'driiva1',
        email: 'test@driiva.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Driver',
        phoneNumber: '+44 7700 123456',
        premiumAmount: '1840.00'
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          email: 'test@driiva.com',
          firstName: 'Test',
          lastName: 'Driver',
          phoneNumber: '+44 7700 123456',
          premiumAmount: '1840.00'
        }
      })
      .returning();

    console.log('✅ Test user created:', testUser.username);

    // 2. Create driving profile
    console.log('Creating driving profile...');
    await db.insert(drivingProfiles)
      .values({
        userId: testUser.id,
        currentScore: 72,
        hardBrakingScore: 85,
        accelerationScore: 78,
        speedAdherenceScore: 74,
        nightDrivingScore: 82,
        corneringScore: 79,
        consistencyScore: 75,
        totalTrips: 26,
        totalMiles: '1107.70',
        projectedRefund: '100.80'
      })
      .onConflictDoUpdate({
        target: drivingProfiles.userId,
        set: {
          currentScore: 72,
          hardBrakingScore: 85,
          accelerationScore: 78,
          speedAdherenceScore: 74,
          nightDrivingScore: 82,
          corneringScore: 79,
          consistencyScore: 75,
          totalTrips: 26,
          totalMiles: '1107.70',
          projectedRefund: '100.80'
        }
      });

    console.log('✅ Driving profile created');

    // 3. Create community pool
    console.log('Creating community pool...');
    await db.insert(communityPool)
      .values({
        poolAmount: '105000.00',
        safetyFactor: '0.85',
        participantCount: 1000,
        safeDriverCount: 850
      })
      .onConflictDoNothing();

    console.log('✅ Community pool created');

    // 4. Create achievements
    console.log('Creating achievements...');
    const achievementData = [
      {
        name: 'Long Distance Driver',
        description: 'Drove over 1000 miles safely',
        icon: 'road',
        criteria: { minMiles: 1000 },
        badgeColor: 'driiva-blue'
      },
      {
        name: 'Consistent Driver',
        description: 'Maintained 70+ score for 4 weeks',
        icon: 'target',
        criteria: { minScore: 70, weeks: 4 },
        badgeColor: 'driiva-green'
      },
      {
        name: 'Safe Night Driver',
        description: 'Perfect night driving record',
        icon: 'moon',
        criteria: { nightScore: 90 },
        badgeColor: 'driiva-purple'
      },
      {
        name: 'Speed Master',
        description: 'No speed violations in 30 days',
        icon: 'gauge',
        criteria: { speedViolations: 0, days: 30 },
        badgeColor: 'driiva-orange'
      }
    ];

    for (const achievement of achievementData) {
      await db.insert(achievements)
        .values(achievement)
        .onConflictDoNothing();
    }

    console.log('✅ Achievements created');

    // 5. Award achievements to test user
    console.log('Awarding achievements...');
    const allAchievements = await db.select().from(achievements);
    
    // Award first two achievements
    for (let i = 0; i < Math.min(2, allAchievements.length); i++) {
      await db.insert(userAchievements)
        .values({
          userId: testUser.id,
          achievementId: allAchievements[i].id
        })
        .onConflictDoNothing();
    }

    console.log('✅ Achievements awarded');

    // 6. Create sample trips
    console.log('Creating sample trips...');
    const sampleTrips = [
      {
        userId: testUser.id,
        startLocation: 'Manchester City Centre',
        endLocation: 'Trafford Centre',
        startTime: new Date('2025-01-28T09:00:00Z'),
        endTime: new Date('2025-01-28T09:45:00Z'),
        distance: '12.5',
        duration: 45,
        score: 85,
        hardBrakingEvents: 1,
        harshAcceleration: 0,
        speedViolations: 0,
        nightDriving: false,
        sharpCorners: 2,
        telematicsData: { avgSpeed: 28, maxSpeed: 45 }
      },
      {
        userId: testUser.id,
        startLocation: 'Home',
        endLocation: 'Supermarket',
        startTime: new Date('2025-01-27T14:30:00Z'),
        endTime: new Date('2025-01-27T15:00:00Z'),
        distance: '8.2',
        duration: 30,
        score: 92,
        hardBrakingEvents: 0,
        harshAcceleration: 0,
        speedViolations: 0,
        nightDriving: false,
        sharpCorners: 1,
        telematicsData: { avgSpeed: 25, maxSpeed: 35 }
      },
      {
        userId: testUser.id,
        startLocation: 'Office',
        endLocation: 'Home',
        startTime: new Date('2025-01-26T18:00:00Z'),
        endTime: new Date('2025-01-26T18:35:00Z'),
        distance: '15.8',
        duration: 35,
        score: 78,
        hardBrakingEvents: 2,
        harshAcceleration: 1,
        speedViolations: 1,
        nightDriving: false,
        sharpCorners: 3,
        telematicsData: { avgSpeed: 32, maxSpeed: 55 }
      }
    ];

    for (const trip of sampleTrips) {
      await db.insert(trips)
        .values(trip)
        .onConflictDoNothing();
    }

    console.log('✅ Sample trips created');

    // 7. Create leaderboard entries
    console.log('Creating leaderboard...');
    const leaderboardData = [
      { userId: testUser.id, score: 72, rank: 14, period: 'weekly' },
      { userId: testUser.id, score: 75, rank: 12, period: 'monthly' }
    ];

    for (const entry of leaderboardData) {
      await db.insert(leaderboard)
        .values(entry)
        .onConflictDoUpdate({
          target: [leaderboard.userId, leaderboard.period],
          set: { score: entry.score, rank: entry.rank }
        });
    }

    console.log('✅ Leaderboard entries created');
    console.log('🎉 Database seeding completed successfully!');
    
    return {
      success: true,
      testUser,
      message: 'Database seeded with test data'
    };

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}