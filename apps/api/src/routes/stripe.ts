import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Hono()

// Initialize Stripe
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Schema for creating checkout session
const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

// Create checkout session
stripe.post('/create-checkout-session', zValidator('json', createCheckoutSessionSchema), async (c) => {
  try {
    const { priceId, successUrl, cancelUrl } = c.req.valid('json')

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: 'customer@example.com', // This would come from the user's email
      metadata: {
        // Add any additional metadata you need
        source: 'brochure-website',
      },
    })

    return c.json({ id: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return c.json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Webhook handler for Stripe events
stripe.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  const body = await c.req.text()

  if (!signature) {
    return c.json({ error: 'No signature provided' }, 400)
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Payment successful for session:', session.id)
        // Here you would typically:
        // 1. Update user's subscription status in your database
        // 2. Send confirmation email
        // 3. Grant access to premium features
        break

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription created:', subscription.id)
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', updatedSubscription.id)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription cancelled:', deletedSubscription.id)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded for invoice:', invoice.id)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', failedInvoice.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return c.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ 
      error: 'Webhook signature verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 400)
  }
})

// Get subscription details
stripe.get('/subscription/:subscriptionId', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId')
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
    
    return c.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id,
        quantity: item.quantity,
      })),
    })
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return c.json({ 
      error: 'Failed to retrieve subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Cancel subscription
stripe.post('/subscription/:subscriptionId/cancel', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId')
    const subscription = await stripeClient.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    
    return c.json({
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at,
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return c.json({ 
      error: 'Failed to cancel subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Create customer portal session
stripe.post('/create-portal-session', async (c) => {
  try {
    const { customerId, returnUrl } = await c.req.json()

    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return c.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return c.json({ 
      error: 'Failed to create portal session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { stripe }
