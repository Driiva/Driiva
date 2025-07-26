import { motion } from "framer-motion";

interface ScrollIndicatorDotsProps {
  currentPage: number;
  totalPages: number;
  onPageSelect?: (index: number) => void;
}

export default function ScrollIndicatorDots({ currentPage, totalPages, onPageSelect }: ScrollIndicatorDotsProps) {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex space-x-2 glass-morphism rounded-full px-3 py-2" style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
      }}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <motion.button
            key={index}
            onClick={() => onPageSelect?.(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentPage 
                ? 'bg-white shadow-md shadow-white/30' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            animate={{
              scale: index === currentPage ? 1.3 : 1,
              opacity: index === currentPage ? 1 : 0.6,
            }}
            whileHover={{
              scale: index === currentPage ? 1.3 : 1.1,
              opacity: 0.8,
            }}
            whileTap={{
              scale: 0.9,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        ))}
      </div>
    </div>
  );
}