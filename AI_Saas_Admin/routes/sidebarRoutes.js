import express from "express";
import {
  createSidebarConfig,
  getSidebarConfigs,
} from "../controllers/sidebarController.js";

const sidebarRouter = express.Router();

sidebarRouter.post("/sidebar-configs", createSidebarConfig);
sidebarRouter.get("/sidebar-configs", getSidebarConfigs);

export default sidebarRouter;
