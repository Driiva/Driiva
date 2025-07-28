import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';

const user = {
  id: '1',
  username: 'driiva1',
  email: 'test@driiva.com',
  name: 'Test Driver',
  firstName: 'Test',
  lastName: 'Driver',
  premiumAmount: '£1,840',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function PolicyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen text-white">
      <DashboardHeader user={user} />
      
      <main className="px-4 pb-20 relative z-10">
        <div className="pt-4 mb-6">
          <button
            onClick={() => setLocation('/profile')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          
          <div className="glass-morphism rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Insurance Policy Details
              </h1>
            </div>

            {/* Policy Overview */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">Policy Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Policy Number:</span>
                    <span className="text-white">DRV-2025-000001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Policy Start:</span>
                    <span className="text-white">July 1, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Policy End:</span>
                    <span className="text-white">June 30, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual Premium:</span>
                    <span className="text-white font-semibold">£1,840.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Refund:</span>
                    <span className="text-green-400 font-semibold">£100.80</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-purple-300">Coverage Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Comprehensive Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Third Party Liability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Personal Injury Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Telematics Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">24/7 Roadside Assistance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telematics Program */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-300 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Driiva Telematics Program
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">72</div>
                  <div className="text-sm text-gray-400">Current Score</div>
                  <div className="text-xs text-gray-500 mt-1">Above Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">5.48%</div>
                  <div className="text-sm text-gray-400">Refund Rate</div>
                  <div className="text-xs text-gray-500 mt-1">£100.80 annual</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">28</div>
                  <div className="text-sm text-gray-400">Monitored Trips</div>
                  <div className="text-xs text-gray-500 mt-1">1,107 miles</div>
                </div>
              </div>
            </div>

            {/* Policy Terms */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Policy Terms
              </h3>
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">Telematics Requirements</h4>
                  <p>Your driving data is collected via mobile app GPS and sensors. Maintaining a score of 70+ qualifies you for refunds ranging from 5% to 15% of your annual premium.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Refund Calculation</h4>
                  <p>Refunds are calculated monthly based on your personal driving score (80% weight) and community pool performance (20% weight). Refunds are processed quarterly.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Data Privacy</h4>
                  <p>All driving data is encrypted and used solely for insurance scoring purposes. You can request data export or deletion at any time through your profile settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}