import React from 'react';
import { BookOpen, AlertTriangle, BarChart3, MessageSquare } from 'lucide-react';

export default function Features() {
  return (
    <div className="bg-[#0A0A0A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Comprehensive tools and resources to elevate your trading experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: AlertTriangle,
              title: 'Real-Time Alerts',
              description: 'Get instant notifications for high-probability trading opportunities'
            },
            {
              icon: BarChart3,
              title: 'Advanced Analytics',
              description: 'Access professional-grade charts and technical analysis tools'
            },
            {
              icon: BookOpen,
              title: 'Educational Resources',
              description: 'Learn from comprehensive guides and video tutorials'
            },
            {
              icon: MessageSquare,
              title: 'Community Support',
              description: 'Join our active Discord community of traders'
            }
          ].map((feature, index) => (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#9D4EDD] rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-[#1A1A1A] p-6 rounded-lg">
                <feature.icon className="w-12 h-12 text-[#8A2BE2] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}