import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  CheckCircle, 
  X, 
  ArrowRight,
  Star,
  Users,
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small reforestation projects and organizations just getting started.',
      price: isAnnual ? 29 : 39,
      originalPrice: isAnnual ? 39 : 39,
      features: [
        'Up to 5 team members',
        '3 reforestation sites',
        'Basic analytics dashboard',
        'Email support',
        'Mobile app access',
        'Standard reporting',
        'GPS location tracking',
        'Basic compliance reports'
      ],
      notIncluded: [
        'Advanced analytics',
        'API access',
        'Priority support',
        'Custom integrations'
      ],
      popular: false,
      stripePriceId: isAnnual ? 'price_starter_annual' : 'price_starter_monthly'
    },
    {
      name: 'Professional',
      description: 'Ideal for growing organizations with multiple sites and team members.',
      price: isAnnual ? 79 : 99,
      originalPrice: isAnnual ? 99 : 99,
      features: [
        'Up to 25 team members',
        'Unlimited reforestation sites',
        'Advanced analytics dashboard',
        'Priority email & phone support',
        'Mobile app access',
        'Advanced reporting & exports',
        'GPS location tracking',
        'Compliance & audit reports',
        'API access',
        'Custom data exports',
        'Team collaboration tools',
        'Real-time notifications'
      ],
      notIncluded: [
        'Custom integrations',
        'Dedicated account manager',
        'On-premise deployment'
      ],
      popular: true,
      stripePriceId: isAnnual ? 'price_professional_annual' : 'price_professional_monthly'
    },
    {
      name: 'Enterprise',
      description: 'For large organizations requiring maximum features and customization.',
      price: isAnnual ? 199 : 249,
      originalPrice: isAnnual ? 249 : 249,
      features: [
        'Unlimited team members',
        'Unlimited reforestation sites',
        'Full analytics suite',
        '24/7 priority support',
        'Mobile app access',
        'Advanced reporting & exports',
        'GPS location tracking',
        'Compliance & audit reports',
        'Full API access',
        'Custom integrations',
        'Dedicated account manager',
        'On-premise deployment option',
        'Custom training sessions',
        'White-label options',
        'Advanced security features',
        'Multi-region deployment'
      ],
      notIncluded: [],
      popular: false,
      stripePriceId: isAnnual ? 'price_enterprise_annual' : 'price_enterprise_monthly'
    }
  ]

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setIsLoading(true)
    try {
      // Initialize Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          successUrl: `${window.location.origin}/signup?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      const session = await response.json()

      if (session.error) {
        throw new Error(session.error)
      }

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('There was an error processing your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
              Simple, Transparent{' '}
              <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto mb-8">
              Choose the plan that best fits your reforestation project needs. 
              All plans include a 14-day free trial with no credit card required.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-secondary-900' : 'text-secondary-600'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-primary-600' : 'bg-secondary-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-secondary-900' : 'text-secondary-600'}`}>
                Annual
                <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  Save 25%
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding -mt-8">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative ${
                  plan.popular 
                    ? 'lg:scale-105 border-2 border-primary-500' 
                    : 'border border-secondary-200'
                } bg-white rounded-2xl shadow-xl p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-secondary-600 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-secondary-900">
                        ${plan.price}
                      </span>
                      <span className="text-secondary-600 ml-2">
                        /{isAnnual ? 'month' : 'month'}
                      </span>
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-secondary-500 mt-1">
                        Billed annually (${plan.price * 12})
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? 'Processing...' : 'Start Free Trial'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-secondary-900 mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <>
                      <h4 className="font-semibold text-secondary-900 mb-4 mt-6">Not included:</h4>
                      <ul className="space-y-3">
                        {plan.notIncluded.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-3">
                            <X className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                            <span className="text-secondary-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Can I change my plan later?
              </h3>
              <p className="text-secondary-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Is there a free trial?
              </h3>
              <p className="text-secondary-600">
                Yes, all plans include a 14-day free trial with full access to all features. No credit card required to start.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-secondary-600">
                We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely through Stripe.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-secondary-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
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
              Ready to Get Started?
            </h2>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              Start your free trial today and see how Re-Tree can transform your 
              reforestation projects. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
              <Link to="/contact" className="btn-outline">
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage
