import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon, Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        
        return (
          <React.Fragment key={step.number}>
            <motion.div
              className={`
                relative flex flex-col items-center group
                ${isCurrent ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Step Circle */}
              <motion.div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2
                  ${isCurrent 
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/30' 
                    : isCompleted 
                      ? 'bg-green-500/20 border-green-400 shadow-lg shadow-green-500/30'
                      : 'bg-gray-800 border-gray-600'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                animate={isCurrent ? { 
                  boxShadow: ['0 0 20px rgba(34, 211, 238, 0.3)', '0 0 30px rgba(34, 211, 238, 0.5)', '0 0 20px rgba(34, 211, 238, 0.3)']
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </motion.div>
              
              {/* Step Label */}
              <span className="text-xs font-medium text-center max-w-20">
                {step.title}
              </span>
              
              {/* Step Number */}
              <span className="text-xs opacity-60 mt-1">
                Step {step.number}
              </span>
            </motion.div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <motion.div
                className={`
                  w-16 h-0.5 rounded-full
                  ${isCompleted ? 'bg-green-400' : 'bg-gray-700'}
                `}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;