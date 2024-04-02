import { Router } from "express";
import { get_fb_groups } from "../controllers/groups";

const groups_routes = Router();

groups_routes.get("/", get_fb_groups);

export default groups_routes;
