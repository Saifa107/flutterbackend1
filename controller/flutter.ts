import express from "express";
import { conn } from "../dbconnect";
import util from "util";

export const queryAsync = util.promisify(conn.query).bind(conn);
export const router = express.Router();

router.get('/', (req, res)=>{
    res.send('Get in flutter.ts');
});

router.get("/users", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM `user` ");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

router.get("/riders", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM `car` ");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// router.post("/login",async(req,res)=>{
//     try{
//         const {name,password} = req.body;
//         const [rows] = await conn.query(
//         "SELECT * FROM `user` WHERE `user_name` = ? AND `user_password` = ?",
//         [name, password]

//         );
//     }catch(err){
//         console.error(err);
//          res.status(500).send("Database error");
//     }
// });

router.post("/login",async(req,res)=>{
    try{
        const {name,password} = req.body;
        let result = [];
        let role : string | null = null;
        const [userrows] : any = await conn.query(
        "SELECT * FROM `user` WHERE `user_name` = ? AND `user_password` = ?",
        [name, password]
            
        );
        
        const [carrows] :any = await conn.query(
        "SELECT * FROM `car` WHERE `rider_name` = ? AND `rider_password` = ?",
        [name, password]
            
        );
        if(userrows.length == 1){
            result = userrows;
            role = "user";

        }
        if(carrows.length == 1){
            result = carrows;
            role = "rider";
        }
        // res.json(result);
        res.json({role,data:result});
    }catch(err){
        console.error(err);
         res.status(500).send("Database error");
    }
});


