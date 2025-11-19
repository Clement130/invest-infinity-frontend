import React from 'react';
import { Play, Book, Video, Users } from 'lucide-react';

export default function Education() {
  const courses = [
    {
      title: "Fundamentals of Trading",
      description: "Master the basics of market analysis and trading strategies",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80",
      duration: "4 weeks",
      lessons: 12
    },
    {
      title: "Technical Analysis Pro",
      description: "Advanced chart patterns and technical indicators",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80",
      duration: "6 weeks",
      lessons: 18
    },
    {
      title: "Crypto Trading Mastery",
      description: "Comprehensive guide to cryptocurrency trading",
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80",
      duration: "8 weeks",
      lessons: 24
    }
  ];

  return (
    <section id="education" className="py-20 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Educational Resources
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprehensive trading education to help you succeed in the markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div key={index} className="group relative overflow-hidden rounded-lg">
              <div className="relative h-64">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#8A2BE2] p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="p-6 bg-[#2A2A2A]">
                <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-2" />
                    {course.lessons} lessons
                  </div>
                  <div className="flex items-center">
                    <Video className="w-4 h-4 mr-2" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    1.2k students
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}