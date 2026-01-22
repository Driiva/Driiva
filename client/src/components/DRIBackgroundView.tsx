import { motion } from "framer-motion";

interface DRIBackgroundViewProps {
  variant?: "welcome" | "app";
}

export default function DRIBackgroundView({ variant = "welcome" }: DRIBackgroundViewProps) {
  return (
    <>
      <div className="driiva-background-base" />
      {variant === "welcome" ? (
        <div className="radial-blur-welcome" />
      ) : (
        <div className="radial-blur-app" />
      )}
    </>
  );
}
