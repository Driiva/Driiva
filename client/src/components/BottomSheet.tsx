import { AlertTriangle, Gavel, ShieldOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BottomSheet({ isOpen, onClose }: BottomSheetProps) {
  const incidents = [
    {
      icon: AlertTriangle,
      title: "Crash/Collision",
      description: "Immediate assistance required",
      color: "text-[#EF4444]",
      onClick: () => console.log("Report crash")
    },
    {
      icon: Gavel,
      title: "Vehicle Breakdown",
      description: "Roadside assistance",
      color: "text-[#F59E0B]",
      onClick: () => console.log("Report breakdown")
    },
    {
      icon: ShieldOff,
      title: "Theft/Vandalism",
      description: "Property damage claim",
      color: "text-[#A855F7]",
      onClick: () => console.log("Report theft")
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className="w-full bg-[#1E293B] rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-4">Report Incident</h3>
            <p className="text-gray-400 mb-6">Emergency services will be contacted automatically if needed.</p>
            
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <button
                  key={index}
                  onClick={incident.onClick}
                  className="w-full glass-morphism rounded-2xl p-4 text-left haptic-button"
                >
                  <div className="flex items-center space-x-3">
                    <incident.icon className={`w-6 h-6 ${incident.color}`} />
                    <div>
                      <div className="font-medium">{incident.title}</div>
                      <div className="text-sm text-gray-400">{incident.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
