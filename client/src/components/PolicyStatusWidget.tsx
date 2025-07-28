import { Shield, Calendar, CreditCard, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PolicyStatusWidgetProps {
  user: {
    premiumAmount: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function PolicyStatusWidget({ user }: PolicyStatusWidgetProps) {
  const [isActive] = useState(true);
  const { toast } = useToast();
  
  const policyData = {
    policyNumber: "DRV-2025-000001",
    policyType: "Comprehensive Telematics",
    startDate: "Jul 01, 2025",
    renewalDate: "Jul 01, 2026",
    premiumAmount: user.premiumAmount
  };

  return (
    <section className="mb-3">
      <div className="glass-morphism rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-white">Policy Status</h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
              } animate-pulse`}
            />
            <button
              onClick={() => toast({
                title: "Policy Status",
                description: "Your policy is active and up to date. Next renewal: July 1, 2026",
              })}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/30'
                  : 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg shadow-red-400/30'
              } haptic-button spring-transition hover:scale-105`}
              style={{
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* Policy Type */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{policyData.policyType}</div>
              <div className="text-xs text-gray-400">Policy No: {policyData.policyNumber}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Start Date</div>
                <div className="text-sm font-medium text-white">{policyData.startDate}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Renewal Date</div>
                <div className="text-sm font-medium text-white">{policyData.renewalDate}</div>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Annual Premium</div>
                <div className="text-xs text-gray-400">£{Number(policyData.premiumAmount || 1840).toLocaleString()}</div>
              </div>
            </div>
            <button
              onClick={() => toast({
                title: "Policy Documents",
                description: "Access your policy documents, payment history, and renewal options",
              })}
              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 transition-all duration-200 flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              View Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}