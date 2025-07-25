import { db } from './db';
import { users, drivingProfiles, communityPool, achievements } from '@shared/schema';

async function seedDatabase() {
  try {
    // Create a test user
    const [user] = await db.insert(users).values({
      username: 'demo_user',
      email: 'demo@driiva.com',
      password: 'demo_password', // In real app this would be hashed
      firstName: 'Demo',
      lastName: 'Driver',
      premiumAmount: '2400.00', // $2400 annual premium
      phoneNumber: '+1234567890'
    }).returning();

    console.log('Created user:', user);

    // Create driving profile
    const [profile] = await db.insert(drivingProfiles).values({
      userId: user.id,
      currentScore: 85,
      hardBrakingScore: 5,
      accelerationScore: 3,
      speedAdherenceScore: 2,
      nightDrivingScore: 1,
      corneringScore: 4,
      consistencyScore: 90,
      totalTrips: 45,
      totalMiles: '1250.5'
    }).returning();

    console.log('Created driving profile:', profile);

    // Create community pool
    const [pool] = await db.insert(communityPool).values({
      poolAmount: '125000.00',
      safetyFactor: '0.82',
      participantCount: 2500,
      safeDriverCount: 2050
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