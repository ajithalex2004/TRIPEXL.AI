import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Sun, Moon, Sunrise, Cloud } from "lucide-react";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good Morning", icon: Sunrise };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", icon: Sun };
  if (hour >= 17 && hour < 22) return { text: "Good Evening", icon: Cloud };
  return { text: "Good Night", icon: Moon };
};

export function PersonalizedGreeting() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeBasedGreeting());
    const timer = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const Icon = greeting.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#004990]/10 to-transparent rounded-lg"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="p-2 bg-[#004990] rounded-full text-white"
      >
        <Icon className="w-6 h-6" />
      </motion.div>
      <div>
        <motion.h2 
          className="text-2xl font-bold text-[#004990]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {greeting.text}, {user?.first_name || 'Guest'}!
        </motion.h2>
        <motion.p 
          className="text-muted-foreground"
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