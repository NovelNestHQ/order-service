import dotenv from "dotenv";
import express from "express";
import { OrderStatus, PrismaClient } from "@prisma/client";
import verifyToken from "../middleware";
import { HeadersInit } from "undici-types";
import { pushToQueue } from "../rabbitmq";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;
if (!INVENTORY_SERVICE_URL) {
  throw new Error("❌ INVENTORY_SERVICE_URL is not set!");
}

export interface BookInfo {
  success: boolean;
  data: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Route: POST /api/orders (Create a new order)
router.post("/", verifyToken, async (req, res): Promise<any> => {
  const { book_id, book_title, customer_name, payment_status, order_status } =
    req.body;
  const customer_id = req.user.userId; // Get user ID from the token

  try {
    if (!book_id || !book_title || !customer_name || !payment_status) {
      throw new Error("Missing required fields");
    }

    // Check Order Status
    if (!Object.values(OrderStatus).includes(order_status)) {
      throw new Error("Invalid order status");
    }

    // Fetch the book details to get the seller ID
    const headers: HeadersInit = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const response = await fetch(
      `${INVENTORY_SERVICE_URL}/api/books/${book_id}`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch book details");
    }
    const bookData = (await response.json()) as BookInfo;
    const {
      userId: seller_id,
      author: { name: author_name },
      genre: { name: genre_name },
    } = bookData.data;

    const newOrder = await prisma.order.create({
      data: {
        sellerId: seller_id,
        customerId: customer_id,
        bookId: book_id,
        bookTitle: book_title,
        customerName: customer_name,
        paymentStatus: payment_status,
        orderStatus: order_status,
      },
    });
    console.log("✅ Successfully created order:", newOrder.id);

    // create order event
    if (newOrder) {
      const event = {
        eventType: "ORDER_CREATED",
        timestamp: new Date().toISOString(),
        data: {
          order_id: newOrder.id,
          customer_id: newOrder.customerId,
          book_id: newOrder.bookId,
          book_title: newOrder.bookTitle,
          book_author: author_name,
          book_genre: genre_name,
          purchase_date: new Date().toISOString(),
          order_status: newOrder.orderStatus,
        },
      };
      pushToQueue(event);
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      book: newOrder,
    });
  } catch (error: any) {
    console.error("❌ Error creating order:", error);

    // Return 400 status code if required fields are missing
    if (
      error.message === "Missing required fields" ||
      error.message === "Invalid order status"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error?.message });
  }
});

// Route: GET /api/orders (Fetch orders for a seller)
router.get("/", verifyToken, async (req, res): Promise<any> => {
  const { sellerId } = req.query;

  try {
    if (!sellerId || typeof sellerId !== "string") {
      throw new Error(sellerId ? "Invalid seller ID" : "Seller ID is required");
    }

    const orders = await prisma.order.findMany({ where: { sellerId } });

    if (orders.length === 0) {
      throw new Error("No orders found for this seller");
    }

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      book_id: order.bookId,
      book_title: order.bookTitle,
      customer_id: order.customerId,
      customer_name: order.customerName,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
    }));

    console.log("✅ Successfully fetched orders for seller");
    res.status(200).json({ success: true, data: formattedOrders });
  } catch (error: any) {
    console.error("❌ Error fetching orders for seller:", error);

    // Return 404 status code if no orders are found
    if (error.message === "No orders found for this seller") {
      return res.status(404).json({ success: false, message: error.message });
    }
    // Return 400 status code if seller ID is invalid
    if (
      error.message === "Invalid seller ID" ||
      error.message === "Seller ID is required"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Route: PATCH /api/orders/:id (Process an order: Accept/Reject)
router.patch("/:id", verifyToken, async (req, res): Promise<any> => {
  const { id } = req.params;
  const { order_status } = req.body;
  try {
    if (!id || !order_status) {
      throw new Error("Missing required fields");
    }

    // Check Order Status
    if (!Object.values(OrderStatus).includes(order_status)) {
      throw new Error("Invalid order status");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { orderStatus: order_status },
    });

    // update event to the queue
    if (updatedOrder) {
      const event = {
        eventType: "ORDER_UPDATED",
        timestamp: new Date().toISOString(),
        data: {
          order_id: updatedOrder.id,
          order_status: updatedOrder.orderStatus,
        },
      };
      pushToQueue(event);
    }

    console.log("✅ Successfully updated order:", updatedOrder.id);
    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      updatedOrder,
    });
  } catch (error: any) {
    console.error("❌ Error updating order:", error);
    // Return 400 status code if required fields are missing
    if (error.message === "Missing required fields") {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error?.message });
  }
});

export default router;
