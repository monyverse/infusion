import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { AchievementCard, Achievement } from '../gamification/achievement-card';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  currentTask?: string;
  performance: {
    successRate: number;
    totalTasks: number;
    avgResponseTime: number;
  };
  trustScore: number;
  isEnabled: boolean;
}

export interface AutomationTask {
  id: string;
  type: 'swap' | 'rebalance' | 'arbitrage' | 'security' | 'bridge';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  agentId?: string;
}

interface AIAutomationDashboardProps {
  className?: string;
}

const AI_AGENTS: AIAgent[] = [
  {
    id: 'portfolio-manager',
    name: 'Portfolio Manager',
    description: 'Intelligent portfolio rebalancing and risk management',
    icon: '📊',
    status: 'active',
    capabilities: ['rebalancing', 'risk-assessment', 'diversification'],
    performance: {
      successRate: 98.5,
      totalTasks: 1247,
      avgResponseTime: 2.3
    },
    trustScore: 95,
    isEnabled: true
  },
  {
    id: 'arbitrage-bot',
    name: 'Arbitrage Bot',
    description: 'Cross-chain arbitrage opportunity detection and execution',
    icon: '💰',
    status: 'active',
    capabilities: ['arbitrage', 'price-monitoring', 'execution'],
    performance: {
      successRate: 96.2,
      totalTasks: 892,
      avgResponseTime: 1.8
    },
    trustScore: 92,
    isEnabled: true
  },
  {
    id: 'security-guardian',
    name: 'Security Guardian',
    description: 'Real-time threat detection and transaction validation',
    icon: '🛡️',
    status: 'active',
    capabilities: ['phishing-detection', 'contract-audit', 'risk-assessment'],
    performance: {
      successRate: 99.8,
      totalTasks: 2156,
      avgResponseTime: 0.5
    },
    trustScore: 99,
    isEnabled: true
  },
  {
    id: 'bridge-optimizer',
    name: 'Bridge Optimizer',
    description: 'Optimal cross-chain routing and bridge selection',
    icon: '🌉',
    status: 'active',
    capabilities: ['route-optimization', 'fee-analysis', 'execution'],
    performance: {
      successRate: 97.1,
      totalTasks: 567,
      avgResponseTime: 3.2
    },
    trustScore: 94,
    isEnabled: true
  }
];

const AUTOMATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-automated-swap',
    title: 'First Automated Swap',
    description: 'Complete your first AI-powered automated token swap',
    icon: '🤖',
    category: 'swap',
    rarity: 'common',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
    xpReward: 100,
    points: 50
  },
  {
    id: 'cross-chain-master',
    title: 'Cross-Chain Master',
    description: 'Execute swaps across 10 different blockchain networks',
    icon: '🔗',
    category: 'chain',
    rarity: 'rare',
    progress: 7,
    maxProgress: 10,
    unlocked: false,
    xpReward: 500,
    points: 250
  },
  {
    id: 'security-expert',
    title: 'Security Expert',
    description: 'Successfully avoid 50 potential security threats',
    icon: '🛡️',
    category: 'security',
    rarity: 'epic',
    progress: 23,
    maxProgress: 50,
    unlocked: false,
    xpReward: 1000,
    points: 500
  },
  {
    id: 'arbitrage-king',
    title: 'Arbitrage King',
    description: 'Profit from 100 arbitrage opportunities',
    icon: '👑',
    category: 'volume',
    rarity: 'legendary',
    progress: 67,
    maxProgress: 100,
    unlocked: false,
    xpReward: 2000,
    points: 1000
  }
];

export const AIAutomationDashboard: React.FC<AIAutomationDashboardProps> = ({
  className = ''
}) => {
  const [agents, setAgents] = useState<AIAgent[]>(AI_AGENTS);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [userIntent, setUserIntent] = useState('');
  const [isProcessingIntent, setIsProcessingIntent] = useState(false);

  // Simulate real-time task updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        const newTasks = [...prevTasks];
        // Simulate task completion and new task creation
        if (Math.random() > 0.7) {
          const taskTypes: AutomationTask['type'][] = ['swap', 'rebalance', 'arbitrage', 'security', 'bridge'];
          const newTask: AutomationTask = {
            id: `task-${Date.now()}`,
            type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
            description: `AI detected ${taskTypes[Math.floor(Math.random() * taskTypes.length)]} opportunity`,
            status: 'pending',
            priority: Math.random() > 0.8 ? 'high' : 'medium',
            estimatedValue: `$${(Math.random() * 1000).toFixed(2)}`,
            riskLevel: Math.random() > 0.7 ? 'low' : 'medium',
            createdAt: new Date()
          };
          newTasks.unshift(newTask);
        }
        return newTasks.slice(0, 10); // Keep only recent tasks
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleIntentSubmit = async () => {
    if (!userIntent.trim()) return;

    setIsProcessingIntent(true);
    try {
      // Simulate AI processing the intent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new automation task based on the intent
      const newTask: AutomationTask = {
        id: `task-${Date.now()}`,
        type: 'swap',
        description: `AI interpreted: "${userIntent}"`,
        status: 'executing',
        priority: 'medium',
        estimatedValue: '$150.00',
        riskLevel: 'low',
        createdAt: new Date(),
        agentId: 'portfolio-manager'
      };
      
      setTasks(prev => [newTask, ...prev]);
      setUserIntent('');
      
      // Update agent status
      setAgents(prev => prev.map(agent => 
        agent.id === 'portfolio-manager' 
          ? { ...agent, currentTask: `Processing: ${userIntent}` }
          : agent
      ));
      
    } catch (error) {
      console.error('Error processing intent:', error);
    } finally {
      setIsProcessingIntent(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, isEnabled: !agent.isEnabled, status: agent.isEnabled ? 'inactive' : 'active' }
        : agent
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Automation Dashboard</h1>
            <p className="text-gray-600">Your intelligent wallet automation system</p>
          </div>
          <Button
            onClick={() => setShowAchievements(!showAchievements)}
            variant="neutral-secondary"
          >
            🏆 Achievements ({AUTOMATION_ACHIEVEMENTS.filter(a => a.unlocked).length})
          </Button>
        </div>

        {/* Intent Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tell your AI what you want to do:
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="e.g., 'I want to trade on HyperLiquid, go get me a 5X long on Bitcoin'"
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessingIntent}
            />
            <Button
              onClick={handleIntentSubmit}
              disabled={!userIntent.trim() || isProcessingIntent}
              variant="default"
            >
              {isProcessingIntent ? 'Processing...' : '🤖 Execute'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {agents.filter(a => a.isEnabled).length}
            </div>
            <div className="text-sm text-blue-600">Active Agents</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-green-600">Completed Tasks</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(agents.reduce((acc, agent) => acc + agent.trustScore, 0) / agents.length)}
            </div>
            <div className="text-sm text-purple-600">Avg Trust Score</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              ${tasks.reduce((acc, task) => acc + parseFloat(task.estimatedValue.replace('$', '') || '0'), 0).toFixed(2)}
            </div>
            <div className="text-sm text-orange-600">Total Value</div>
          </div>
        </div>
      </div>

      {/* AI Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map(agent => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{agent.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    agent.isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    agent.isEnabled ? 'transform translate-x-6' : 'transform translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities:</h4>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map(capability => (
                  <span
                    key={capability}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{agent.performance.successRate}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{agent.performance.totalTasks}</div>
                <div className="text-xs text-gray-600">Total Tasks</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{agent.performance.avgResponseTime}s</div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </div>
            </div>

            {/* Trust Score */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Trust Score</span>
                <span className="font-medium">{agent.trustScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${agent.trustScore}%` }}
                />
              </div>
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Current Task:</div>
                <div className="text-sm text-blue-700">{agent.currentTask}</div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Automation Tasks</h2>
        <div className="space-y-3">
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {task.type === 'swap' && '🔄'}
                  {task.type === 'rebalance' && '⚖️'}
                  {task.type === 'arbitrage' && '💰'}
                  {task.type === 'security' && '🛡️'}
                  {task.type === 'bridge' && '🌉'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{task.description}</div>
                  <div className="text-sm text-gray-600">
                    {task.createdAt.toLocaleTimeString()} • {task.estimatedValue}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'completed' ? 'text-green-600 bg-green-100' :
                  task.status === 'executing' ? 'text-blue-600 bg-blue-100' :
                  task.status === 'failed' ? 'text-red-600 bg-red-100' :
                  'text-yellow-600 bg-yellow-100'
                }`}>
                  {task.status}
                </span>
              </div>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No automation tasks yet. Try giving your AI an instruction above!
            </div>
          )}
        </div>
      </div>

      {/* Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
                <button
                  onClick={() => setShowAchievements(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUTOMATION_ACHIEVEMENTS.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onClaim={(id) => console.log('Claiming achievement:', id)}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 