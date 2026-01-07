import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Flame, MessageCircle, CheckCircle2 } from 'lucide-react';
import type { GoalsPlanData } from './GoalsOnboarding';

interface PersonalizedPlanProps {
  plan: GoalsPlanData;
}

export const PersonalizedPlan: React.FC<PersonalizedPlanProps> = ({ plan }) => {
  const priorityColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-muted text-muted-foreground border-muted',
  };

  const motivationColors = {
    high: 'text-green-500',
    medium: 'text-yellow-500',
    low: 'text-red-500',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Commitment Score & Motivation */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Commitment Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{plan.commitment_score}</div>
              <div className="flex-1">
                <Progress value={plan.commitment_score * 10} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">out of 10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Motivational Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">"{plan.motivational_feedback}"</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analysis Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Time Management Issues</p>
              <div className="flex flex-wrap gap-2">
                {plan.analysis.time_management_issues.map((issue, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Motivation Level</p>
                <p className={`font-semibold capitalize ${motivationColors[plan.analysis.motivation_level]}`}>
                  {plan.analysis.motivation_level}
                </p>
              </div>
            </div>
            {plan.analysis.commitment_gaps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Areas to Watch</p>
                <div className="flex flex-wrap gap-2">
                  {plan.analysis.commitment_gaps.map((gap, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {gap}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Schedule */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Your Daily Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.daily_schedule.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-sm font-mono text-muted-foreground w-20">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.activity}</p>
                    <p className="text-xs text-muted-foreground">{item.duration}</p>
                  </div>
                  <Badge className={`${priorityColors[item.priority]} text-xs`}>
                    {item.priority}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Priorities */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Priority Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.task_priorities.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className={`${priorityColors[task.priority]} text-xs shrink-0`}>
                    {task.priority}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{task.task}</p>
                    <p className="text-xs text-muted-foreground">{task.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
