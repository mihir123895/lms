import { Webhook } from "svix";
import User from "../models/User.js";

// API Controller function to handle Clerk user webhooks and update the database
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify the incoming webhook signature to ensure the request is from Clerk
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        // Check if necessary data exists before processing
        if (data && data.id && data.email_address && data.first_name && data.last_name) {
          const userData = {
            _id: data.id,
            email: data.email_address[0].email_address,
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url || null, // Handle missing image_url gracefully
          };
          
          // Create a new user in the database
          await User.create(userData);
          res.status(200).json({ success: true, message: "User created successfully." });
        } else {
          res.status(400).json({ success: false, message: "Invalid user data." });
        }
        break;
      }

      case "user.updated": {
        // Check if necessary data exists before processing
        if (data && data.id && data.email_address && data.first_name && data.last_name) {
          const userData = {
            email: data.email_address[0].email_address,
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url || null, // Handle missing image_url gracefully
          };

          // Find the user by ID and update the user information
          await User.findByIdAndUpdate(data.id, userData, { new: true });
          res.status(200).json({ success: true, message: "User updated successfully." });
        } else {
          res.status(400).json({ success: false, message: "Invalid user data." });
        }
        break;
      }

      case "user.deleted": {
        // Check if user ID exists in the payload
        if (data && data.id) {
          // Delete the user by ID
          await User.findByIdAndDelete(data.id);
          res.status(200).json({ success: true, message: "User deleted successfully." });
        } else {
          res.status(400).json({ success: false, message: "Invalid user ID." });
        }
        break;
      }

      default: {
        res.status(400).json({ success: false, message: "Unhandled event type." });
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ success: false, message: "Server error, please try again later." });
  }
};
