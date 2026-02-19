
import { aiRiskScoringEngine } from './lib/aiRiskScoring';
import { TelematicsData, DrivingMetrics } from './lib/telematics';

// Test function to validate AI models
export function testAIModels() {
  console.log('🧠 Testing AI Risk Scoring Models...');
  
  // Create sample telematics data
  const sampleTelematicsData: TelematicsData = {
    gpsPoints: [
      { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() - 600000, accuracy: 5 },
      { latitude: 40.7589, longitude: -73.9851, timestamp: Date.now() - 300000, accuracy: 5 },
      { latitude: 40.7831, longitude: -73.9712, timestamp: Date.now(), accuracy: 5 }
    ],
    accelerometerData: Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 0.5 - 0.25,
      y: Math.random() * 0.3 - 0.15,
      z: 9.81 + Math.random() * 0.2 - 0.1,
      timestamp: Date.now() - (50 - i) * 1000
    })),
    gyroscopeData: Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 0.1 - 0.05,
      y: Math.random() * 0.1 - 0.05,
      z: Math.random() * 0.1 - 0.05,
      timestamp: Date.now() - (50 - i) * 1000
    })),
    speedData: Array.from({ length: 30 }, (_, i) => ({
      speed: 25 + Math.random() * 20,
      timestamp: Date.now() - (30 - i) * 2000,
      speedLimit: 35
    }))
  };

  const sampleMetrics: DrivingMetrics = {
    hardBrakingEvents: 2,
    harshBrakingCount: 2,
    harshAccelerationEvents: 1,
    speedViolations: 3,
    nightDriving: false,
    sharpCorners: 1,
    score: 85,
    distance: 5.2,
    distanceKm: 5.2,
    duration: 12,
    avgSpeed: 26,
    maxSpeed: 60,
    ecoScore: 80,
    anomalies: {
      hasImpossibleSpeed: false,
      hasGPSJumps: false,
      isDuplicate: false,
      anomalyScore: 100,
    },
  };

  try {
    // Test AI risk scoring
    const riskProfile = aiRiskScoringEngine.calculateAIRiskScore(
      sampleTelematicsData,
      sampleMetrics
    );

    console.log('✅ AI Model Test Results:');
    console.log(`   Risk Category: ${riskProfile.riskCategory}`);
    console.log(`   Risk Score: ${riskProfile.riskScore.toFixed(3)}`);
    console.log(`   Claim Probability: ${riskProfile.predictedClaimProbability.toFixed(1)}%`);
    console.log(`   Confidence: ${(riskProfile.confidenceScore * 100).toFixed(1)}%`);
    console.log(`   Risk Factors: ${riskProfile.riskFactors.length}`);
    console.log(`   Recommendations: ${riskProfile.recommendations.length}`);
    
    // Validate results are within expected ranges
    if (riskProfile.riskScore < 0 || riskProfile.riskScore > 1) {
      console.error('❌ Risk score out of valid range [0,1]');
      return false;
    }
    
    if (riskProfile.predictedClaimProbability < 0 || riskProfile.predictedClaimProbability > 100) {
      console.error('❌ Claim probability out of valid range [0,100]');
      return false;
    }
    
    if (riskProfile.confidenceScore < 0 || riskProfile.confidenceScore > 1) {
      console.error('❌ Confidence score out of valid range [0,1]');
      return false;
    }

    console.log('✅ All AI models validated successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ AI Model Test Failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAIModels();
}
