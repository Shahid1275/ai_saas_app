import express from "express";
import { createTenant, getTenants } from "../controllers/tenantController.js";

const tenatRouter = express.Router();

tenatRouter.post("/tenants", createTenant);
tenatRouter.get("/tenants", getTenants);

export default tenatRouter;
