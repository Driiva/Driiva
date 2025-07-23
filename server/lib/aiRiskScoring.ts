
import { TelematicsData, DrivingMetrics } from './telematics';

export interface RiskProfile {
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedClaimProbability: number;
  confidenceScore: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface DriverBehaviorPattern {
  aggressiveness: number;
  consistency: number;
  timeOfDayPattern: number[];
  weatherAdaptability: number;
  routeFamiliarity: number;
}

export interface MachineLearningFeatures {
  // Temporal features
  timeOfDay: number;
  dayOfWeek: number;
  seasonality: number;
  
  // Behavioral features
  accelerationVariance: number;
  brakingPattern: number;
  speedConsistency: number;
  corneringStyle: number;
  
  // Environmental features
  weatherConditions: number;
  trafficDensity: number;
  roadType: number;
  
  // Historical features
  recentPerformance: number;
  improvementTrend: number;
  violationHistory: number;
}

export class AIRiskScoringEngine {
  private readonly RISK_WEIGHTS = {
    behavioral: 0.40,
    environmental: 0.25,
    historical: 0.20,
    temporal: 0.15
  };

  private readonly ML_THRESHOLDS = {
    lowRisk: 0.3,
    mediumRisk: 0.6,
    highRisk: 0.8
  };

  calculateAIRiskScore(
    telematicsData: TelematicsData,
    drivingMetrics: DrivingMetrics,
    historicalData?: DrivingMetrics[]
  ): RiskProfile {
    // Extract ML features
    const features = this.extractFeatures(telematicsData, drivingMetrics, historicalData);
    
    // Calculate behavioral patterns
    const behaviorPattern = this.analyzeBehaviorPattern(telematicsData, drivingMetrics);
    
    // Run ensemble models
    const riskScore = this.runEnsembleModel(features, behaviorPattern);
    
    // Calculate claim probability
    const claimProbability = this.predictClaimProbability(features, riskScore);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(features, behaviorPattern);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors, behaviorPattern);
    
    return {
      riskScore: Math.round(riskScore * 100) / 100,
      riskCategory: this.categorizeRisk(riskScore),
      predictedClaimProbability: Math.round(claimProbability * 10000) / 100,
      confidenceScore: this.calculateConfidence(features),
      riskFactors,
      recommendations
    };
  }

  private extractFeatures(
    telematicsData: TelematicsData,
    metrics: DrivingMetrics,
    historicalData?: DrivingMetrics[]
  ): MachineLearningFeatures {
    const firstPoint = telematicsData.gpsPoints[0];
    const date = new Date(firstPoint?.timestamp || Date.now());
    
    return {
      // Temporal features
      timeOfDay: date.getHours() / 24,
      dayOfWeek: date.getDay() / 7,
      seasonality: this.calculateSeasonality(date),
      
      // Behavioral features
      accelerationVariance: this.calculateAccelerationVariance(telematicsData.accelerometerData),
      brakingPattern: this.analyzeBrakingPattern(telematicsData.accelerometerData),
      speedConsistency: this.calculateSpeedConsistency(telematicsData.speedData),
      corneringStyle: this.analyzeCorneringStyle(telematicsData.gyroscopeData),
      
      // Environmental features (simulated - in production, integrate weather/traffic APIs)
      weatherConditions: this.estimateWeatherConditions(date),
      trafficDensity: this.estimateTrafficDensity(firstPoint, date),
      roadType: this.classifyRoadType(telematicsData.speedData),
      
      // Historical features
      recentPerformance: this.calculateRecentPerformance(historicalData),
      improvementTrend: this.calculateImprovementTrend(historicalData),
      violationHistory: this.calculateViolationHistory(historicalData)
    };
  }

  private runEnsembleModel(features: MachineLearningFeatures, pattern: DriverBehaviorPattern): number {
    // Simulate ensemble of ML models (Random Forest, Gradient Boosting, Neural Network)
    const randomForestScore = this.randomForestModel(features);
    const gradientBoostingScore = this.gradientBoostingModel(features, pattern);
    const neuralNetworkScore = this.neuralNetworkModel(features, pattern);
    
    // Weighted ensemble
    return (randomForestScore * 0.4) + (gradientBoostingScore * 0.35) + (neuralNetworkScore * 0.25);
  }

  private randomForestModel(features: MachineLearningFeatures): number {
    // Simulate Random Forest prediction
    let score = 0.5; // Base risk
    
    // Behavioral risk factors
    if (features.accelerationVariance > 0.7) score += 0.15;
    if (features.brakingPattern > 0.6) score += 0.12;
    if (features.speedConsistency < 0.4) score += 0.10;
    
    // Temporal risk factors
    if (features.timeOfDay > 0.85 || features.timeOfDay < 0.2) score += 0.08; // Night driving
    if (features.dayOfWeek > 0.7) score += 0.05; // Weekend driving
    
    // Environmental factors
    score += features.weatherConditions * 0.1;
    score += features.trafficDensity * 0.05;
    
    return Math.min(1, Math.max(0, score));
  }

  private gradientBoostingModel(features: MachineLearningFeatures, pattern: DriverBehaviorPattern): number {
    // Simulate Gradient Boosting with interaction terms
    let score = 0.45;
    
    // Complex interactions
    const aggressivenessRisk = pattern.aggressiveness * (1 + features.trafficDensity);
    const consistencyBonus = pattern.consistency * 0.15;
    const environmentalMultiplier = 1 + (features.weatherConditions * 0.2);
    
    score += (aggressivenessRisk * 0.25 * environmentalMultiplier);
    score -= consistencyBonus;
    score += features.violationHistory * 0.2;
    
    // Temporal interactions
    if (features.timeOfDay > 0.8 && pattern.aggressiveness > 0.6) {
      score += 0.12; // High risk: aggressive night driving
    }
    
    return Math.min(1, Math.max(0, score));
  }

  private neuralNetworkModel(features: MachineLearningFeatures, pattern: DriverBehaviorPattern): number {
    // Simulate deep neural network with non-linear activation
    const hidden1 = this.sigmoid(
      features.accelerationVariance * 0.3 +
      features.brakingPattern * 0.25 +
      pattern.aggressiveness * 0.2 +
      features.timeOfDay * 0.15 +
      features.weatherConditions * 0.1
    );
    
    const hidden2 = this.sigmoid(
      features.speedConsistency * -0.3 +
      pattern.consistency * -0.25 +
      features.improvementTrend * -0.2 +
      features.routeFamiliarity * -0.15 +
      hidden1 * 0.1
    );
    
    const output = this.sigmoid(hidden1 * 0.6 + hidden2 * 0.4 + features.violationHistory * 0.2);
    
    return output;
  }

  private analyzeBehaviorPattern(telematicsData: TelematicsData, metrics: DrivingMetrics): DriverBehaviorPattern {
    return {
      aggressiveness: this.calculateAggressiveness(telematicsData, metrics),
      consistency: this.calculateConsistency(telematicsData),
      timeOfDayPattern: this.analyzeTimeOfDayPattern(telematicsData.gpsPoints),
      weatherAdaptability: this.assessWeatherAdaptability(telematicsData),
      routeFamiliarity: this.calculateRouteFamiliarity(telematicsData.gpsPoints)
    };
  }

  private identifyRiskFactors(features: MachineLearningFeatures, pattern: DriverBehaviorPattern): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    if (pattern.aggressiveness > 0.7) {
      factors.push({
        factor: 'Aggressive Driving',
        impact: pattern.aggressiveness,
        severity: 'HIGH',
        description: 'Frequent hard acceleration and braking events detected'
      });
    }
    
    if (features.timeOfDay > 0.85 || features.timeOfDay < 0.2) {
      factors.push({
        factor: 'Night Driving',
        impact: 0.6,
        severity: 'MEDIUM',
        description: 'Regular driving during high-risk night hours'
      });
    }
    
    if (features.speedConsistency < 0.4) {
      factors.push({
        factor: 'Inconsistent Speed',
        impact: 1 - features.speedConsistency,
        severity: 'MEDIUM',
        description: 'Erratic speed patterns indicating poor speed management'
      });
    }
    
    if (features.violationHistory > 0.5) {
      factors.push({
        factor: 'Speed Violations',
        impact: features.violationHistory,
        severity: 'HIGH',
        description: 'History of speeding violations'
      });
    }
    
    return factors.sort((a, b) => b.impact - a.impact);
  }

  private generateRecommendations(factors: RiskFactor[], pattern: DriverBehaviorPattern): string[] {
    const recommendations: string[] = [];
    
    if (pattern.aggressiveness > 0.6) {
      recommendations.push('Practice smooth acceleration and gradual braking to improve your driving score');
    }
    
    if (pattern.consistency < 0.5) {
      recommendations.push('Focus on maintaining consistent driving patterns for better risk assessment');
    }
    
    factors.forEach(factor => {
      switch (factor.factor) {
        case 'Night Driving':
          recommendations.push('Consider avoiding driving during late night hours when possible');
          break;
        case 'Speed Violations':
          recommendations.push('Use cruise control and speed limit alerts to maintain safe speeds');
          break;
        case 'Inconsistent Speed':
          recommendations.push('Practice maintaining steady speeds appropriate for road conditions');
          break;
      }
    });
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  // Helper methods for feature extraction
  private calculateAccelerationVariance(accelerometerData: any[]): number {
    if (accelerometerData.length < 2) return 0;
    
    const accelerations = accelerometerData.map((reading, i) => {
      if (i === 0) return 0;
      return Math.abs(reading.x - accelerometerData[i - 1].x);
    });
    
    const mean = accelerations.reduce((sum, acc) => sum + acc, 0) / accelerations.length;
    const variance = accelerations.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accelerations.length;
    
    return Math.min(1, variance * 10); // Normalize to 0-1
  }

  private calculateAggressiveness(telematicsData: TelematicsData, metrics: DrivingMetrics): number {
    const totalEvents = metrics.hardBrakingEvents + metrics.harshAccelerationEvents + metrics.sharpCorners;
    const tripDuration = metrics.duration || 1;
    
    // Events per hour
    const eventsPerHour = (totalEvents / tripDuration) * 60;
    
    return Math.min(1, eventsPerHour / 10); // Normalize: 10+ events/hour = max aggressiveness
  }

  private calculateConsistency(telematicsData: TelematicsData): number {
    // Analyze consistency across speed, acceleration, and cornering
    const speedVariance = this.calculateSpeedConsistency(telematicsData.speedData);
    const accelVariance = this.calculateAccelerationVariance(telematicsData.accelerometerData);
    
    return (speedVariance + (1 - accelVariance)) / 2;
  }

  private calculateSpeedConsistency(speedData: any[]): number {
    if (speedData.length < 2) return 1;
    
    const speeds = speedData.map(reading => reading.speed);
    const mean = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - mean, 2), 0) / speeds.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower coefficient of variation = higher consistency
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  // Utility methods
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private categorizeRisk(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore < this.ML_THRESHOLDS.lowRisk) return 'LOW';
    if (riskScore < this.ML_THRESHOLDS.mediumRisk) return 'MEDIUM';
    if (riskScore < this.ML_THRESHOLDS.highRisk) return 'HIGH';
    return 'CRITICAL';
  }

  private calculateConfidence(features: MachineLearningFeatures): number {
    // Higher confidence with more data points and consistent patterns
    let confidence = 0.8; // Base confidence
    
    // Adjust based on data quality indicators
    if (features.recentPerformance > 0) confidence += 0.1;
    if (features.improvementTrend !== 0) confidence += 0.05;
    
    return Math.min(1, confidence);
  }

  // Placeholder methods for environmental factors (integrate with real APIs in production)
  private calculateSeasonality(date: Date): number {
    const month = date.getMonth();
    // Winter months (Dec, Jan, Feb) have higher risk
    if (month === 11 || month === 0 || month === 1) return 0.8;
    return 0.3;
  }

  private estimateWeatherConditions(date: Date): number {
    // Placeholder - integrate with weather API
    return Math.random() * 0.5; // 0-0.5 risk factor
  }

  private estimateTrafficDensity(gpsPoint: any, date: Date): number {
    // Placeholder - integrate with traffic API
    const hour = date.getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 0.8; // Rush hour
    }
    return 0.3;
  }

  private classifyRoadType(speedData: any[]): number {
    // Classify based on speed patterns
    const avgSpeed = speedData.reduce((sum, reading) => sum + reading.speed, 0) / speedData.length;
    
    if (avgSpeed > 60) return 0.7; // Highway
    if (avgSpeed > 35) return 0.4; // Arterial
    return 0.2; // Residential
  }

  private analyzeTimeOfDayPattern(gpsPoints: any[]): number[] {
    const hourPattern = new Array(24).fill(0);
    
    gpsPoints.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      hourPattern[hour]++;
    });
    
    return hourPattern;
  }

  private assessWeatherAdaptability(telematicsData: TelematicsData): number {
    // Placeholder - analyze how driving behavior changes with weather
    return 0.7;
  }

  private calculateRouteFamiliarity(gpsPoints: any[]): number {
    // Placeholder - analyze if route is frequently traveled
    return 0.6;
  }

  private analyzeBrakingPattern(accelerometerData: any[]): number {
    // Analyze smoothness of braking
    let abruptBraking = 0;
    for (let i = 1; i < accelerometerData.length; i++) {
      const decel = accelerometerData[i - 1].x - accelerometerData[i].x;
      if (decel > 0.3) abruptBraking++;
    }
    
    return accelerometerData.length > 0 ? abruptBraking / accelerometerData.length : 0;
  }

  private analyzeCorneringStyle(gyroscopeData: any[]): number {
    let sharpCorners = 0;
    gyroscopeData.forEach(reading => {
      const lateralForce = Math.sqrt(reading.x * reading.x + reading.y * reading.y);
      if (lateralForce > 0.25) sharpCorners++;
    });
    
    return gyroscopeData.length > 0 ? sharpCorners / gyroscopeData.length : 0;
  }

  private calculateRecentPerformance(historicalData?: DrivingMetrics[]): number {
    if (!historicalData || historicalData.length === 0) return 0;
    
    const recentScores = historicalData.slice(-5).map(trip => trip.score);
    return recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length / 100;
  }

  private calculateImprovementTrend(historicalData?: DrivingMetrics[]): number {
    if (!historicalData || historicalData.length < 2) return 0;
    
    const scores = historicalData.map(trip => trip.score);
    const recent = scores.slice(-3);
    const previous = scores.slice(-6, -3);
    
    if (previous.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, score) => sum + score, 0) / previous.length;
    
    return (recentAvg - previousAvg) / 100; // Normalized improvement
  }

  private calculateViolationHistory(historicalData?: DrivingMetrics[]): number {
    if (!historicalData || historicalData.length === 0) return 0;
    
    const totalViolations = historicalData.reduce((sum, trip) => sum + trip.speedViolations, 0);
    const totalTrips = historicalData.length;
    
    return Math.min(1, totalViolations / totalTrips / 5); // Normalize to 0-1
  }
}

export const aiRiskScoringEngine = new AIRiskScoringEngine();
