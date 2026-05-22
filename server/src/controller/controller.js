import Note from "../models/Note.js"


export async function getNotes(req,res){
    try{
        const notes = await Note.find().sort({createdAt:-1})
        res.status(200).json(notes)
    }catch(error){
        console.error("error in getNotes",error);
        res.status(500).json({message:"internal server error"});
    }
}

export async function getNotesbyID(req,res){
    try{
        const notes = await Note.findById(req.params.id)
        if(!notes){
            return res.status(404).json({message: "not found the note"})
        }
        res.status(200).json(notes)
    }catch(error){
        console.error("error in getNotes",error);
        res.status(500).json({message:"internal server error"});
    }
}

export async function createNotes(req,res){
    try{
        const {title,content} = req.body
        const newNote = new Note({title,content})

        await newNote.save()
        res.status(201).json({message: "Note created successfully"})

    }catch(error){
        console.error("error in createNotes",error);
        res.status(500).json({message:"internal server error"});
    }
}

export async function updateNotes(req,res){
    try{
        const {title,content} = req.body
        const updateNote = await Note.findByIdAndUpdate(req.params.id,
            {title,content},{new: true})

        if(!updateNote){
            return res.status(404).json({message: "not found"})
        }
        res.status(200).json({message: "Note updated"})

    }catch(error){
        console.error("error in updatetNotes",error);
        res.status(500).json({message:"internal server error"});

    }
}

export async function deleteNotes(req,res){
    try{
        const deleteNote = await Note.findByIdAndDelete(req.params.id)

        if(!deleteNote){
            return res.status(404).json({message: "not found"})
        }
        res.status(200).json({message: "Note deleted"})

    }catch(error){
        console.error("error in deleteNotes",error);
        res.status(500).json({message:"internal server error"});

    }
}

// export function posts(req,res){
//     res.status(200).send("hello");
// }

// export function puts(req,res){
//     res.status(200).json({message: "send a put req"});
// }

// export function deletes(req,res){
//     res.status(200).json({message: "send a del req"})
// }
    

