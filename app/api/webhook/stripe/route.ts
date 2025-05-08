import { stripe } from "@/app/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/app/lib/db";

export async function POST(req: Request) {
  console.log("Webhook received request");
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  console.log("Signature:", signature);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("Webhook received event:", event.type);
    console.log("Event data:", JSON.stringify(event.data, null, 2));
  } catch (error: unknown) {
    console.error("Webhook signature verification failed:", error);
    return new Response("webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    console.log("Processing checkout.session.completed");
    console.log("Session data:", JSON.stringify(session, null, 2));
    
    const customerId = String(session.customer);
    console.log("Customer ID:", customerId);

    const user = await prisma.user.findUnique({
      where: {
        stripeCustomerId: customerId,
      },
    });
    console.log("Found user:", user?.id);

    if (!user) {
      console.error("User not found for customer ID:", customerId);
      throw new Error("User not found...");
    }

    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          paymentDone: true,
        },
      });
      console.log("Updated user paymentDone status:", updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  return new Response(null, { status: 200 });
}
