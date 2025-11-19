import React from 'react';
import { LineChart, BarChart2, PieChart, Activity } from 'lucide-react';

export default function TradingTools() {
  const tools = [
    {
      name: 'Technical Analysis',
      description: 'Advanced charting tools with over 100+ technical indicators',
      icon: LineChart,
      features: ['Multiple timeframes', 'Custom indicators', 'Drawing tools']
    },
    {
      name: 'Portfolio Tracker',
      description: 'Track and analyze your crypto portfolio performance',
      icon: PieChart,
      features: ['Real-time updates', 'Performance metrics', 'Tax reporting']
    },
    {
      name: 'Market Scanner',
      description: 'Scan the market for trading opportunities',
      icon: BarChart2,
      features: ['Custom alerts', 'Pattern recognition', 'Volatility analysis']
    },
    {
      name: 'Risk Calculator',
      description: 'Calculate position sizes and manage trading risk',
      icon: Activity,
      features: ['Position sizing', 'Risk/reward ratios', 'Stop-loss calculator']
    }
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-pink-900/10 via-black to-black" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Professional Trading Tools
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need for successful trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-800 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-black p-8 rounded-lg border border-pink-800/50 hover:border-pink-500 transition-colors duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-800 p-2.5 mr-4">
                    <tool.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{tool.name}</h3>
                </div>
                <p className="text-gray-400 mb-6">{tool.description}</p>
                <ul className="space-y-2">
                  {tool.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}