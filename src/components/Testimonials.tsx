import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Testimonials() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Forex Trader",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
      content: "Invest Infinity's AI analysis has transformed my trading strategy. The accuracy of signals is remarkable.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Crypto Investor",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
      content: "The educational resources and real-time alerts have helped me achieve consistent profitability.",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "Day Trader",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80",
      content: "Outstanding platform with exceptional support. The community insights are invaluable.",
      rating: 5
    }
  ];

  useEffect(() => {
    let interval: number;
    if (isAutoPlaying) {
      interval = window.setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  return (
    <section id="testimonials" className="py-20 bg-[#1A1A1A] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-600/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trader Success Stories
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join our community of successful traders
          </p>
        </div>

        <div className="relative"
             onMouseEnter={() => setIsAutoPlaying(false)}
             onMouseLeave={() => setIsAutoPlaying(true)}>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-[#2A2A2A] p-8 rounded-lg">
                    <div className="flex items-center mb-6">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="text-xl font-semibold text-white">{testimonial.name}</h4>
                        <p className="text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-orange-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300">{testimonial.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-[#2A2A2A] p-2 rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-[#2A2A2A] p-2 rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeSlide ? 'bg-orange-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}