import express from "express"

const router = express.Router();

import { getNotes, getNotesbyID, createNotes, updateNotes, deleteNotes } from "../controller/controller.js"

router.get("/", getNotes);

router.get("/:id",getNotesbyID);

router.post("/",createNotes);

router.put("/:id",updateNotes)

router.delete("/:id",deleteNotes);

export default router ;



