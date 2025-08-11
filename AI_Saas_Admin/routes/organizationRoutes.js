import express from "express";
import {
  createOrganization,
  getOrganizations,
} from "../controllers/organizationController.js";

const Orgrouter = express.Router();

Orgrouter.post("/organizations", createOrganization);
Orgrouter.get("/organizations", getOrganizations);

export default Orgrouter;
