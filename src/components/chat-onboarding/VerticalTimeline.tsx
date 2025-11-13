import { motion } from 'framer-motion';

export interface TimelineStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface VerticalTimelineProps {
  steps: TimelineStep[];
}

export function VerticalTimeline({ steps }: VerticalTimelineProps) {
  return (
    <div className="flex flex-col py-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-3">
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                step.completed
                  ? 'bg-primary border-primary'
                  : step.current
                    ? 'bg-background border-primary'
                    : 'bg-background border-muted'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            />
            {index < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 ${
                  step.completed ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>

          {/* Step label */}
          <motion.div
            className={`text-xs pb-8 -mt-0.5 ${
              step.completed || step.current
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            {step.label}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
