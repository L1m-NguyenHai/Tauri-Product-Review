import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Contact: React.FC = () => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      // Show success message (in real app)
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'support@techreviewpro.com',
      description: 'Get in touch via email'
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: 'Monday to Friday, 9am-6pm EST'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: '123 Tech Street, Silicon Valley, CA 94043',
      description: 'Our headquarters'
    },
    {
      icon: Clock,
      title: 'Response Time',
      content: '24-48 hours',
      description: 'Average response time'
    }
  ];

  const subjects = [
    'General Inquiry',
    'Product Review Request',
    'Technical Support',
    'Partnership Inquiry',
    'Press Inquiry',
    'Bug Report',
    'Feature Request',
    'Other'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`rounded-xl p-8 text-center ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h1 className={`text-4xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Get in Touch
        </h1>
        <p className={`text-xl max-w-2xl mx-auto ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Have a question, suggestion, or just want to say hello? We'd love to hear from you. Reach out and we'll get back to you as soon as possible.
        </p>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contactInfo.map((info, index) => (
          <div key={index} className={`rounded-xl p-6 text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <div className="inline-flex p-3 bg-blue-500 rounded-full mb-4">
              <info.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {info.title}
            </h3>
            <p className={`font-medium mb-1 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {info.content}
            </p>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {info.description}
            </p>
          </div>
        ))}
      </div>

      {/* Contact Form and FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className={`rounded-xl p-8 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-2xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Send us a Message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Subject *
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Tell us how we can help you..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* FAQ */}
        <div className={`rounded-xl p-8 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-2xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                How do you choose products to review?
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                We select products based on consumer interest, innovation, and community requests. Our editorial team evaluates submissions and prioritizes products that will provide the most value to our readers.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Are your reviews sponsored?
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                No, we maintain complete editorial independence. We purchase all products with our own funds and never accept payment for reviews. Any sponsored content is clearly labeled as such.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                How can I request a product review?
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Use our "Request Review" form to suggest products. While we can't review every request, we read them all and prioritize based on community interest and product significance.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Can I contribute reviews to your platform?
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Yes! Create an account and start writing reviews. High-quality contributors may be invited to join our expert reviewer program.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                How do you ensure review quality?
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Our moderation team reviews all submissions for accuracy, relevance, and helpfulness. We also use community voting to highlight the most valuable reviews.
              </p>
            </div>
          </div>

          <div className={`mt-8 p-4 rounded-lg ${
            isDark ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className={`font-medium ${
                  isDark ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  Still have questions?
                </h3>
                <p className={`text-sm mt-1 ${
                  isDark ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  Don't hesitate to reach out. We're here to help and usually respond within 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;