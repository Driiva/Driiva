import { db } from './db';
import { users, drivingProfiles, communityPool, achievements } from '@shared/schema';

async function seedDatabase() {
  try {
    // Create a test user - Sebastian Thomas (Low risk driver from document)
    const [user] = await db.insert(users).values({
      username: 'sebastian_thomas',
      email: 'sebastian@driiva.com',
      password: 'demo_password', // In real app this would be hashed
      firstName: 'Sebastian',
      lastName: 'Thomas',
      premiumAmount: '690.00', // £690 annual premium from document
      phoneNumber: '+1234567890'
    }).returning();

    console.log('Created user:', user);

    // Create driving profile for Sebastian (low risk, score 92.1 from document)
    const [profile] = await db.insert(drivingProfiles).values({
      userId: user.id,
      currentScore: 92,
      hardBrakingScore: 2,
      accelerationScore: 1,
      speedAdherenceScore: 1,
      nightDrivingScore: 0,
      corneringScore: 2,
      consistencyScore: 95,
      totalTrips: 85,
      totalMiles: '2350.5',
      projectedRefund: 104 // £104 refund from document
    }).returning();

    console.log('Created driving profile:', profile);

    // Create community pool (from document: 280 drivers, 140 low-risk eligible)
    const [pool] = await db.insert(communityPool).values({
      poolAmount: '43522.00', // £43,522 refund pool from document
      safetyFactor: '0.75', // Community average score 75 from document
      participantCount: 280,
      safeDriverCount: 140 // 50% low-risk drivers eligible for refunds
    }).returning();

    console.log('Created community pool:', pool);

    // Create achievements
    const achievementsList = [
      {
        name: 'First Trip',
        description: 'Complete your first trip with Driiva',
        icon: '🛣️',
        criteria: { trips: 1 },
        badgeColor: '#10B981',
        isActive: true
      },
      {
        name: 'Safe Driver',
        description: 'Maintain a score above 80 for 30 days',
        icon: '🛡️',
        criteria: { minScore: 80, days: 30 },
        badgeColor: '#3B82F6',
        isActive: true
      },
      {
        name: 'Weekly Warrior',
        description: 'Complete 7 trips in one week',
        icon: '🏆',
        criteria: { tripsPerWeek: 7 },
        badgeColor: '#F59E0B',
        isActive: true
      }
    ];

    for (const achievement of achievementsList) {
      await db.insert(achievements).values(achievement);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();