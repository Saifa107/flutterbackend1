import express from "express";
import { conn } from "../dbconnect";
import util from "util";

import { User } from "../model/user";
import { Rider } from "../model/rider";
import { ResultSetHeader } from "mysql2";

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
//////////
//          สมัครสมาชิก
//////////
//rigister user
router.post("/regisuser",async(req,res)=>{
  try{
    const user : User = req.body;
    console.log("📥 Register request:", user);
    const sql = `
      INSERT INTO user 
        (user_name, user_phone, user_password, user_role) 
      VALUES (?, ?, ?,'user')
    `;
    const [result] = await conn.query<ResultSetHeader>(sql, [
      user.user_name,
      user.user_phone,
      user.user_password,
     
    ]);
    res.status(201).json({
      affected_row: result.affectedRows,
      last_idx: result.insertId,
    });
  }catch(error){
    console.error("❌ Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})
//rigister rider
router.post("/regisrider",async(req,res)=>{
  try{
    const rider : Rider = req.body;
    console.log("📥 Register request:", rider);
    const sql = `
      INSERT INTO car
        (rider_name, rider_phone,rider_registration,rider_password, rider_role) 
      VALUES (?, ?, ?, ?,'rider')
    `;
    const [result] = await conn.query<ResultSetHeader>(sql, [
      rider.rider_name,
      rider.rider_phone,
      rider.rider_registration,
      rider.rider_password
    ]);
    res.status(201).json({
      affected_row: result.affectedRows,
      last_idx: result.insertId,
    });
  }catch(error){
    console.error("❌ Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})
