import React from 'react';
import { Award, Users, Target, Heart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const About: React.FC = () => {
  const { isDark } = useTheme();

  const values = [
    {
      icon: Target,
      title: 'Objective Reviews',
      description: 'We provide unbiased, thorough reviews based on extensive testing and real-world usage.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Our platform is built by tech enthusiasts, for tech enthusiasts. Every voice matters.'
    },
    {
      icon: Award,
      title: 'Expert Analysis',
      description: 'Our team of experts brings years of experience in technology and product evaluation.'
    },
    {
      icon: Heart,
      title: 'Passion for Tech',
      description: 'We love technology and want to help you make informed decisions about your purchases.'
    }
  ];

  const team = [
    {
      name: 'Alex Thompson',
      role: 'Founder & CEO',
      image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      bio: '15+ years in tech journalism and product management'
    },
    {
      name: 'Sarah Chen',
      role: 'Lead Technical Reviewer',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      bio: 'Former hardware engineer with expertise in mobile devices'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Senior Reviewer',
      image: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      bio: 'Gaming and consumer electronics specialist'
    },
    {
      name: 'Emily Watson',
      role: 'Community Manager',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      bio: 'Building bridges between reviewers and the community'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className={`rounded-xl p-8 text-center ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h1 className={`text-4xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          About LimReview
        </h1>
        <p className={`text-xl max-w-3xl mx-auto ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          We're passionate about technology and committed to providing honest, comprehensive reviews that help you make informed purchasing decisions. Our platform combines expert analysis with community insights to deliver the most valuable tech reviews on the web.
        </p>
      </div>

      {/* Mission Statement */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Our Mission
        </h2>
        <p className={`text-lg leading-relaxed text-center max-w-4xl mx-auto ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          To democratize technology reviews by creating a platform where expert analysis meets community wisdom. We believe that everyone deserves access to honest, detailed information about the products they're considering, whether it's a $50 accessory or a $5,000 workstation.
        </p>
      </div>

      {/* Values */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-2xl font-bold mb-8 text-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex p-4 bg-blue-500 rounded-full mb-4">
                <value.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {value.title}
              </h3>
              <p className={`${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-2xl font-bold mb-8 text-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Meet Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className={`text-xl font-semibold mb-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {member.name}
              </h3>
              <p className="text-blue-500 font-medium mb-3">
                {member.role}
              </p>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              2,890
            </div>
            <div className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Products Reviewed
            </div>
          </div>
          <div>
            <div className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              15,234
            </div>
            <div className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              User Reviews
            </div>
          </div>
          <div>
            <div className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              45,678
            </div>
            <div className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Active Users
            </div>
          </div>
          <div>
            <div className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              98%
            </div>
            <div className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Satisfaction Rate
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Our Story
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className={`mb-4 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            LimReview was founded in 2020 with a simple vision: to create the most trustworthy and comprehensive technology review platform on the internet. We noticed that many review sites were either too technical for everyday consumers or too shallow to be truly helpful.
          </p>
          <p className={`mb-4 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Starting with just three reviewers and a passion for technology, we've grown into a platform that serves hundreds of thousands of users monthly. Our commitment to independence means we purchase all products with our own funds and never accept payment for positive reviews.
          </p>
          <p className={`${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Today, we continue to evolve our platform based on community feedback, always striving to provide the most valuable and trustworthy technology reviews possible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;