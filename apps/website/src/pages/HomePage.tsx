import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Leaf, 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track planting progress, monitor growth rates, and generate comprehensive reports with our powerful analytics dashboard.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Manage multiple users, assign roles, and coordinate reforestation efforts across your entire organization.'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Enterprise-grade security ensures your reforestation data is protected with bank-level encryption and compliance.'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications and real-time updates on planting activities, weather conditions, and project milestones.'
    },
    {
      icon: Globe,
      title: 'Global Monitoring',
      description: 'Monitor reforestation projects across multiple sites and regions from a single, unified platform.'
    },
    {
      icon: Leaf,
      title: 'Sustainability Focus',
      description: 'Built specifically for environmental organizations with features designed to maximize reforestation impact.'
    }
  ]

  const benefits = [
    'Increase planting efficiency by 40%',
    'Reduce data entry time by 60%',
    'Improve project transparency',
    'Enable real-time collaboration',
    'Generate compliance reports automatically',
    'Scale operations without complexity'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
                Manage Reforestation Projects with{' '}
                <span className="gradient-text">Precision</span>
              </h1>
              <p className="text-xl text-secondary-600 mb-8">
                Streamline your reforestation operations with our comprehensive platform. 
                Track planting, monitor growth, and ensure sustainable forest management 
                with powerful analytics and real-time collaboration tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="btn-primary text-center">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Link>
                <Link to="/features" className="btn-outline text-center">
                  Learn More
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-secondary-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      <span className="text-sm font-medium">Re-Tree Dashboard</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                      <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                      <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-secondary-900">Project Overview</h3>
                      <Leaf className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">1,247</div>
                        <div className="text-sm text-secondary-600">Trees Planted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">89%</div>
                        <div className="text-sm text-secondary-600">Survival Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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
              Everything You Need for Successful Reforestation
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Our platform provides all the tools and features needed to manage 
              reforestation projects efficiently and effectively.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-hover"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">
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

      {/* Benefits Section */}
      <section className="bg-secondary-50 section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Transform Your Reforestation Operations
              </h2>
              <p className="text-xl text-secondary-600 mb-8">
                Join hundreds of organizations that have revolutionized their 
                reforestation efforts with Re-Tree. See measurable improvements 
                in efficiency, transparency, and project success rates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="text-secondary-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-200"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">40%</div>
                <div className="text-lg text-secondary-600 mb-6">Average Efficiency Increase</div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Before Re-Tree</span>
                    <span className="font-semibold">60%</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div className="bg-secondary-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">With Re-Tree</span>
                    <span className="font-semibold text-primary-600">100%</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              Ready to Transform Your Reforestation Projects?
            </h2>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              Start your free trial today and see how Re-Tree can help you 
              achieve your reforestation goals with greater efficiency and impact.
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

export default HomePage
