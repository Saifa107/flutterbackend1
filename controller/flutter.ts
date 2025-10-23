import express from "express";
import { conn } from "../dbconnect";
import util from "util";

import { User } from "../model/user";
import { Rider } from "../model/rider";
import { Address } from "../model/address";
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
//////////
//          Address
//////////
//get address
router.get("/getaddress", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM `address` ");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//เพิ่ม address
router.post("/address/:user_id",async(req,res)=>{
  try{
    const user_id = req.params.user_id;
    const address : Address = req.body;
    if(!address || !user_id ){
       return res.status(400).json({ error: "Missing address" });
    }
    const sql ='INSERT INTO `address` (`address_text`, `address_latitude`, `address_longitude`) VALUES (?,?,?);'
    const [result] = await conn.query<ResultSetHeader>(sql, [
      address.address_text,
      address.address_latitude,
      address.address_longitude
    ]);
    const newAddresId = result.insertId;
    const user_address = 'INSERT INTO `user_address` (`user_id`, `address_id`) VALUES (?,?);'
    const [Uaddress] = await conn.query<ResultSetHeader>(user_address, [ 
      user_id,
      user_address
    ]);
     res.status(201).json({
      message: "Address added and user updated successfully",
      address_id: newAddresId,
      affected_rows_address: result.affectedRows,
      affected_rows_UserAddress: Uaddress.affectedRows,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});

// ดูเฉพาะ adress user 
router.get("/addressMe/:user_id",async(req,res)=>{
  try{
    const user_id = req.params.user_id;
    if(!user_id){
      return res.status(400).json({ error: "Missing address" });
    }
    const sql = 
    'SELECT a.address_id, a.address_text, a.address_latitude, a.address_longitude FROM user_address ua JOIN address a ON ua.address_id = a.address_id WHERE ua.user_id = ?;';
    const [result] = await conn.query<ResultSetHeader>(sql, [ 
      user_id
    ]);
    res.status(200).json({
      user_id,
      addresses: result,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});

// การเลือกที่อยู่หลักของ user
router.put("/chooseAddress/:user_id",async(req,res)=>{
  try{
    const user_id = req.params.user_id;
    const {address_id} = req.body;
    const N = 'N';
    if(!user_id || !address_id){
       return res.status(400).json({ error: "Missing address" });
    }
    const sqlN = `UPDATE user_address SET choose = 'N' WHERE user_id = ?`;
    const [resultN] = await conn.query<ResultSetHeader>(sqlN, [ 
      user_id
    ]);
    const AdressUser = `UPDATE user_address SET choose = 'Y' WHERE user_id = ? AND address_id = ?`;
    const [chooseY] = await conn.query<ResultSetHeader>(AdressUser , [ 
      user_id,
      address_id
    ]);
    res.status(200).json({
      user_id,
      addresses: chooseY,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});
//////////
//         sreach
//////////
// แสดงทั้งหมด address ที่มี Y ทั้งหมด
router.get("/searchAll",async(req,res)=>{
  try{
    const parcel = 'SELECT * FROM `parcel`'
    const [parcelA] = await conn.query<ResultSetHeader>(parcel);
    const search = `SELECT 
      u.user_id,
      u.user_name,
      u.user_phone,
      u.user_proflie,
      a.address_id,
      a.address_text,
      a.address_latitude,
      a.address_longitude,
      ua.choose
    FROM user u
    JOIN user_address ua ON u.user_id = ua.user_id
    JOIN address a ON ua.address_id = a.address_id
    WHERE ua.choose = 'Y';`;
    const [rows] = await conn.query<ResultSetHeader>(search);
    res.status(200).json({
      parcelID : parcelA,
      search: rows,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});
// ระบบ sreach ที่อยู่ กับ เบอร์โทร
router.post("/search",async(req,res)=>{
  try{
    const { text } = req.body;
    if(!text){
       return res.status(400).json({ error: "Missing " });
    }
    const search = `SELECT 
    u.user_id,
    u.user_name,
    u.user_phone,
    u.user_proflie,
    a.address_id,
    a.address_text,
    a.address_latitude,
    a.address_longitude,
    ua.choose
  FROM user u
  JOIN user_address ua ON u.user_id = ua.user_id
  JOIN address a ON ua.address_id = a.address_id
  WHERE (u.user_phone LIKE ? OR a.address_text LIKE ?)
    AND ua.choose = 'Y';`;
    const [rows] = await conn.query<ResultSetHeader>(search,[
      `%${text}%`,
      `%${text}%`
    ]);
    res.status(200).json({
      search: rows,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});
//////////
//          ใส่รูปภาพ
//////////
///ใส่ชื่อ+รูปภาพ
router.post("/recevie/:parcel_id",async(req,res)=>{
  try{
    const parcel = req.params.parcel_id;
    const { d_name,image,address_id} = req.body;
    if(!parcel||!d_name ||!image ||!address_id){
      return res.status(400).json({ error: "Missing" });
    }
    // ✅ 1. เพิ่มรูปเข้า photo_status
    const sqlPhoto = `
      INSERT INTO photo_status (photo_status_url, photo_status_tier)
      VALUES (?, 'waiting')
    `;
    const [photoResult] = await conn.query<ResultSetHeader>(sqlPhoto, [image]);
    const photo_status_id = photoResult.insertId;

    // ✅ 2. เพิ่มข้อมูลเข้า delivery
    const sqlDelivery = `
      INSERT INTO delivery (parcel_id, rider_id, delivery_status, d_name, address_id)
      VALUES (?, NULL, 'waiting', ?, ?)
    `;
    const [deliveryResult] = await conn.query<ResultSetHeader>(sqlDelivery, [
      parcel,
      d_name,
      address_id,
    ]);
    const delivery_id = deliveryResult.insertId;

    // ✅ 3. เชื่อมข้อมูลใน delivery_photo_status
    const sqlLink = `
      INSERT INTO delivery_photo_status (delivery_id, photo_status_id)
      VALUES (?, ?)
    `;
    await conn.query(sqlLink, [delivery_id, photo_status_id]);

    // ✅ ตอบกลับ
    res.status(201).json({
      message: "Delivery and photo linked successfully",
      delivery_id,
      photo_status_id,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});

//รายละเอียดการส่ง
router.get("/detailRecevie/:delivery_id",async(req,res)=>{
  try{
    const parcel_id = req.params.delivery_id;

    if (!parcel_id) {
      return res.status(400).json({ error: "Missing parcel_id" });
    }

    const sql = `
      SELECT 
        d.delivery_id,
        d.delivery_status,
        d.d_name,
        d.address_id AS delivery_address_id,
        d.parcel_id,

        p.sender_id,
        p.receiver_id,

        sender.user_name AS sender_name,
        sender.user_phone AS sender_phone,
        receiver.user_name AS receiver_name,
        receiver.user_phone AS receiver_phone,

        -- 📍 address จาก delivery (จุดส่ง)
        delivery_addr.address_text AS delivery_address_text,
        delivery_addr.address_latitude AS delivery_latitude,
        delivery_addr.address_longitude AS delivery_longitude

      FROM delivery d
      JOIN parcel p ON d.parcel_id = p.parcel_id
      JOIN user sender ON p.sender_id = sender.user_id
      JOIN user receiver ON p.receiver_id = receiver.user_id

      -- ใช้ address ของ delivery โดยตรง
      JOIN address delivery_addr ON d.address_id = delivery_addr.address_id

      WHERE d.delivery_id = ?;
    `;
    const [rows] = await conn.query<ResultSetHeader>(sql, [parcel_id]);

    const waiting = `SELECT
    ps.photo_status_url
FROM
    delivery_photo_status AS dps
INNER JOIN
    photo_status AS ps 
    ON dps.photo_status_id = ps.photo_status_id
WHERE
    dps.delivery_id = ?
    AND ps.photo_status_tier = 'waiting';`;
    const [image] = await conn.query<ResultSetHeader>(waiting, [parcel_id]);
    res.status(200).json({
      image: image,
      parcel_detail: rows,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});