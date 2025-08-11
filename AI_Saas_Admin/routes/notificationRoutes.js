import express from "express";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.post("/notifications", createNotification);
notificationRouter.get("/notifications", getNotifications);
notificationRouter.put("/notifications/:id/read", markNotificationAsRead);

export default notificationRouter;
