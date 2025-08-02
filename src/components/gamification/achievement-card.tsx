import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'swap' | 'chain' | 'volume' | 'streak' | 'social' | 'security';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  xpReward: number;
  points: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  onClaim?: (achievementId: string) => void;
  className?: string;
}

const rarityColors = {
  common: 'bg-gray-100 border-gray-300',
  rare: 'bg-blue-100 border-blue-300',
  epic: 'bg-purple-100 border-purple-300',
  legendary: 'bg-yellow-100 border-yellow-300'
};

const rarityGradients = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
};

const categoryIcons = {
  swap: '🔄',
  chain: '🔗',
  volume: '📊',
  streak: '🔥',
  social: '👥',
  security: '🛡️'
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClaim,
  className = ''
}) => {
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
  const isCompleted = achievement.progress >= achievement.maxProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 ${
        achievement.unlocked 
          ? `${rarityColors[achievement.rarity]} shadow-lg` 
          : 'bg-gray-50 border-gray-200'
      } ${className}`}
    >
      {/* Rarity gradient overlay */}
      {achievement.unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradients[achievement.rarity]} opacity-10`} />
      )}

      {/* Achievement icon */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
            achievement.unlocked ? 'bg-white shadow-md' : 'bg-gray-200'
          }`}>
            {achievement.icon}
          </div>
          <div>
            <h3 className={`font-semibold ${
              achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {achievement.title}
            </h3>
            <p className={`text-sm ${
              achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {categoryIcons[achievement.category]} {achievement.category}
            </p>
          </div>
        </div>
        
        {/* Rarity badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          achievement.unlocked 
            ? 'bg-white text-gray-800 shadow-sm' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {achievement.rarity}
        </div>
      </div>

      {/* Description */}
      <p className={`relative z-10 mb-4 text-sm ${
        achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
      }`}>
        {achievement.description}
      </p>

      {/* Progress bar */}
      <div className="relative z-10 mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{achievement.progress} / {achievement.maxProgress}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-blue-400 to-blue-600'
            }`}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">⭐</span>
            <span className={achievement.unlocked ? 'text-gray-700' : 'text-gray-500'}>
              {achievement.xpReward} XP
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-purple-500">💎</span>
            <span className={achievement.unlocked ? 'text-gray-700' : 'text-gray-500'}>
              {achievement.points} pts
            </span>
          </div>
        </div>

        {/* Status */}
        {achievement.unlocked ? (
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-sm">✓ Unlocked</span>
            {achievement.unlockedAt && (
              <span className="text-xs text-gray-500">
                {achievement.unlockedAt.toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {isCompleted ? 'Ready to claim!' : 'In progress...'}
          </div>
        )}
      </div>

      {/* Claim button */}
      {isCompleted && !achievement.unlocked && onClaim && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 mt-4"
        >
          <Button
            onClick={() => onClaim(achievement.id)}
            variant="gradient"
            size="sm"
            className="w-full"
          >
            🎉 Claim Achievement
          </Button>
        </motion.div>
      )}

      {/* Unlock animation */}
      {achievement.unlocked && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2"
        >
          <div className="bg-yellow-400 text-yellow-900 rounded-full p-1">
            <span className="text-xs">🏆</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 