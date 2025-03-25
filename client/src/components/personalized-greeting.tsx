import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sunrise, Cloud } from "lucide-react";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good Morning", icon: Sunrise };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", icon: Sun };
  if (hour >= 17 && hour < 22) return { text: "Good Evening", icon: Cloud };
  return { text: "Good Night", icon: Moon };
};

const AnimatedIcon = ({ Icon }: { Icon: any }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }}
    whileHover={{ 
      scale: 1.2,
      rotate: 360,
      transition: { duration: 0.8 }
    }}
    className="relative"
  >
    <motion.div
      className="absolute inset-0 bg-white/20 rounded-full blur-lg"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <div className="p-3 bg-[#004990] rounded-full text-white relative">
      <Icon className="w-8 h-8 animate-pulse" />
    </div>
  </motion.div>
);

export function PersonalizedGreeting() {
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeBasedGreeting());
    const timer = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-6 p-6 bg-gradient-to-r from-[#004990]/10 to-transparent rounded-lg"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={greeting.text}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedIcon Icon={greeting.icon} />
        </motion.div>
      </AnimatePresence>

      <div>
        <motion.h2 
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {greeting.text}!!!
        </motion.h2>
        <motion.p 
          className="text-white text-lg font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to TripXL Enterprise Journey Management
        </motion.p>
      </div>
    </motion.div>
  );
}