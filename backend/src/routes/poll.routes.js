import { Router } from "express";
import { createPoll, generateVote, getPollResults } from "../controllers/poll.controller.js";

const router = Router()


router.route("/").post(createPoll);
router.route("/:id/vote").post(generateVote);
router.route("/:id").get(getPollResults);

export default router;