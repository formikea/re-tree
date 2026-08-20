import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Leaf,
  MapPin,
  Calendar,
  FileText,
  Bell,
  Settings,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics & Reporting',
      description: 'Comprehensive analytics dashboard with real-time insights into your reforestation projects.',
      details: [
        'Real-time project performance metrics',
        'Custom report generation',
        'Data visualization and charts',
        'Export capabilities (PDF, CSV, Excel)',
        'Historical data analysis',
        'Predictive analytics for growth patterns'
      ]
    },
    {
      icon: Users,
      title: 'Team Management & Collaboration',
      description: 'Manage your entire reforestation team with role-based access and real-time collaboration.',
      details: [
        'Role-based user permissions',
        'Team activity tracking',
        'Real-time collaboration tools',
        'User invitation and management',
        'Activity logs and audit trails',
        'Mobile app for field workers'
      ]
    },
    {
      icon: MapPin,
      title: 'Site & Location Management',
      description: 'Organize and manage multiple reforestation sites with detailed location tracking.',
      details: [
        'GPS location tracking',
        'Site boundary mapping',
        'Multi-site management',
        'Site-specific data collection',
        'Geographic data visualization',
        'Integration with mapping services'
      ]
    },
    {
      icon: Calendar,
      title: 'Seasonal Planning & Scheduling',
      description: 'Plan and schedule planting activities based on optimal seasonal conditions.',
      details: [
        'Seasonal planting calendars',
        'Weather integration',
        'Task scheduling and reminders',
        'Resource allocation planning',
        'Progress tracking by season',
        'Historical seasonal data'
      ]
    },
    {
      icon: FileText,
      title: 'Compliance & Documentation',
      description: 'Maintain comprehensive records for regulatory compliance and project documentation.',
      details: [
        'Automated compliance reporting',
        'Document storage and management',
        'Regulatory requirement tracking',
        'Audit trail maintenance',
        'Certificate generation',
        'Legal documentation support'
      ]
    },
    {
      icon: Bell,
      title: 'Notifications & Alerts',
      description: 'Stay informed with intelligent notifications about project milestones and important events.',
      details: [
        'Real-time project alerts',
        'Weather condition notifications',
        'Maintenance reminders',
        'Custom notification settings',
        'Email and SMS alerts',
        'Mobile push notifications'
      ]
    }
  ]

  const technicalFeatures = [
    {
      title: 'Cloud-Based Platform',
      description: 'Access your data from anywhere with our secure, scalable cloud infrastructure.',
      icon: Globe
    },
    {
      title: 'API Integration',
      description: 'Connect with existing systems and third-party tools through our robust API.',
      icon: Settings
    },
    {
      title: 'Mobile Responsive',
      description: 'Full functionality on desktop, tablet, and mobile devices for field work.',
      icon: Zap
    },
    {
      title: 'Data Security',
      description: 'Enterprise-grade security with encryption, backups, and compliance standards.',
      icon: Shield
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
              Powerful Features for{' '}
              <span className="gradient-text">Modern Reforestation</span>
            </h1>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto mb-8">
              Discover how Re-Tree's comprehensive feature set can transform your 
              reforestation operations and help you achieve greater impact with 
              less complexity.
            </p>
            <Link to="/signup" className="btn-primary">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Everything you need to manage successful reforestation projects 
              from planning to completion.
            </p>
          </motion.div>

          <div className="space-y-16">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-secondary-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                          <span className="text-sm font-medium">{feature.title}</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-secondary-900">Feature Preview</h4>
                          <feature.icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="space-y-3">
                          {feature.details.slice(0, 3).map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                              <span className="text-sm text-secondary-600">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="bg-secondary-50 section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Technical Excellence
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Built with modern technology to ensure reliability, security, and 
              seamless integration with your existing workflows.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technicalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-hover text-center"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              Start your free trial today and explore all the powerful features 
              that Re-Tree has to offer for your reforestation projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
              <Link to="/pricing" className="btn-outline">
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default FeaturesPage
