const Razorpay = require('razorpay');
const crypto = require('crypto');

const { CREDIT_TO_PAISA_MAPPING, PLAN_IDS } = require('../constants/paymentConstants');
const Users = require('../model/user');

const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentsController = {
    // Step-2 from sequence diagram
    createOrder: async (request, response) => {
        try {
            const { credits } = request.body;

            if (!CREDIT_TO_PAISA_MAPPING[credits]) {
                return response.status(400).json({
                    message: 'Invalid credit value'
                });
            }

            const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

            const order = await razorpayClient.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            return response.json({ order: order });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error'} );
        }
    },

    // Step-8 from sequence diagram
    verifyOrder: async (request, response) => {
        try {
            const {
                razorpay_order_id, razorpay_payment_id, 
                razorpay_signature, credits
            } = request.body;

            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                // Create unique digital fingerprint (HMAC) of the secret key.
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                // Feed both HMAC and body into hashing function.
                .update(body.toString())
                // Convert the hashed string into hexadecimal.
                .digest('hex');
            
            if (expectedSignature !== razorpay_signature) {
                return response.status(400).json({ message: 'Invalid transaction' });
            }

            const user = await Users.findById( { _id: request.user._id });
            user.credits += Number(credits);
            await user.save();
            
            return response.json({ user: user });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error'} );
        }
    },

    createSubscription: async (request, response) => {
        try {
            const { plan_name } = request.body;

            if (!PLAN_IDS[plan_name]) {
                return response.status(400).json({
                    message: 'Invalid plan selected'
                });
            }

            const plan = PLAN_IDS[plan_name];
            const subscription = await razorpayClient.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycleCount,
                // Custom field provided by razorpay to store key-value pairs.
                // In this case, it will help us map the razorpay subscription event
                // to a specific user in our database.
                notes: {
                    userId: request.user._id
                }
            });

            return response.json({ subscription: subscription });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    captureSubscription: async (request, response) => {
        try {
            const { subscriptionId } = request.body;

            const subscription = await razorpayClient.subscriptions.fetch(subscriptionId);
            const user = await Users.findById({ _id: request.user._id });

            // This object will help us know on the UI whether its ok for user to initiate
            // another subscription or one is already in progress. We don't want user to
            // initiate multiple subscriptions at a time.
            user.subscription = {
                subscriptionId: subscriptionId,
                planId: subscription.plan_id,
                status: subscription.status
            };
            await user.save();
            response.json({ user: user });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    handleWebhookEvents: async (request, response) => {
        try {
            console.log('Received Event');
            const signature = request.headers['x-razorpay-signature'];
            const body = request.body;
            
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET) // We'll generate this secret later on
                .update(body)
                .digest('hex');

            if (expectedSignature !== signature) {
                console.log('Invalid signature');
                return response.status(400).send('Invalid signature');
            }

            console.log('Signature verified');
            const payload = JSON.parse(body);
            console.log(JSON.stringify(payload, null, 2));

            const event = payload.event;
            const subscriptionData = payload.payload.subscription.entity;
            const razorpaySubscriptionId = subscriptionData.id;
            const userId = subscriptionData.notes?.userId;
            if (!userId) {
                console.log('UserID not found in the notes');
                return response.status(400).send('UserID not found in the notes');
            }

            let newStatus;
            switch (event) {
                case 'subscription.activated':
                    newStatus = 'active';
                    break;
                
                case 'subscription.pending':
                    newStatus = 'pending';
                    break;
                
                case 'subscription.cancelled':
                    newStatus = 'cancelled';
                    break;

                case 'subscription.completed':
                    newStatus = 'completed';
                    break;

                default:
                    console.log(`Unhandled event received: ${event}`);
                    return response.status(200).send(`Unhandled event received: ${event}`);
            }

            const user = await Users.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'subscription.subscriptionId': razorpaySubscriptionId,
                        'subscription.status': newStatus,
                        'subscription.planId': subscriptionData.plan_id,
                        'subscription.start': subscriptionData.start_at 
                            ? new Date(subscriptionData.start_at * 1000) 
                            : null,
                        'subscription.end': subscriptionData.end_at
                            ? new Date(subscriptionData.end_at * 1000)
                            : null,
                        'subscription.lastBillDate': subscriptionData.current_start
                            ? new Date(subscriptionData.current_start * 1000)
                            : null,
                        'subscription.nextBillDate': subscriptionData.current_end
                            ? new Date(subscriptionData.current_end * 1000)
                            : null,
                        'subscription.paymentsMade': subscriptionData.paid_count,
                        'subscription.paymentsRemaining': subscriptionData.remaining_count,
                    }
                },
                { new: true }
            );

            if (!user) {
                console.log('No user with provided userID exist');
                return response.status(400).send('No user with provided userID exist');
            }

            console.log(`Updated subscription status for the user ${user.email} to ${newStatus}`);
            return response.status(200).send(`Event processed for user: ${user.email} with userID: ${userId}`);
        } catch (error) {
            console.log(error);
            return response.status(500).send('Internal server error');
        }
    },
};

module.exports = paymentsController;