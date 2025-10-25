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
    const DEFAULT_PROFILE_URL = 'https://cdn-icons-png.freepik.com/512/428/428573.png';
    // 💡 5 คอลัมน์ (user_proflie, user_role ถูกกำหนดเป็น Literal String)
    const sql = `
      INSERT INTO user 
        (user_name, user_phone, user_password, user_proflie, user_role) 
      VALUES (?, ?, ?, '${DEFAULT_PROFILE_URL}', 'user')
    `;
    const [result] = await conn.query<ResultSetHeader>(sql, [
      user.user_name,     // 1. user_name
      user.user_phone,    // 2. user_phone
      user.user_password, // 3. user_password
    ]); // ⬅️ ส่ง 3 ค่า เข้า 3 Placeholder

    res.status(201).json({
      affected_row: result.affectedRows,
      last_idx: result.insertId,
    });
  }catch(error){
    console.error("❌ Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//rigister rider
router.post("/regisrider",async(req,res)=>{
  try{
    const rider : Rider = req.body;
    console.log("📥 Register request:", rider);
    const DEFAULT_PROFILE_URL = 'https://cdn-icons-png.freepik.com/512/428/428573.png';
    // 💡 6 คอลัมน์ (rider_profile, rider_role ถูกกำหนดเป็น Literal String)
    const sql = `
      INSERT INTO car
        (rider_name, rider_phone, rider_registration, rider_password, rider_profile, rider_role) 
      VALUES (?, ?, ?, ?, '${DEFAULT_PROFILE_URL}', 'rider')
    `;
    const [result] = await conn.query<ResultSetHeader>(sql, [
      rider.rider_name,         // 1. rider_name
      rider.rider_phone,        // 2. rider_phone
      rider.rider_registration, // 3. rider_registration
      rider.rider_password      // 4. rider_password
    ]); // ⬅️ ส่ง 4 ค่า เข้า 4 Placeholder

    res.status(201).json({
      affected_row: result.affectedRows,
      last_idx: result.insertId,
    });
  }catch(error){
    console.error("❌ Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
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
// แสดงทั้งหมด address ที่มี Y ทั้งหมด แต่ไม่ใช้ตัวเอง
router.get("/searchU/:user_id", async (req, res) => { // ⬅️ รับ user_id ผ่าน URL Parameter
  try {
    const user_id_to_exclude = req.params.user_id; // ⬅️ ดึง user_id ของผู้ใช้ปัจจุบัน
    
    // 💡 Query สำหรับ Parcel (ถ้าไม่จำเป็นต้องใช้ ให้พิจารณาลบออกเพื่อเพิ่มประสิทธิภาพ)
    const parcel = 'SELECT * FROM `parcel`';
    const [parcelA] = await conn.query(parcel);

    const search = `
      SELECT 
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
      WHERE ua.choose = 'Y' 
      AND u.user_id != ?;`; // ⬅️ เพิ่มเงื่อนไข: user_id ต้องไม่เท่ากับ ID ที่ส่งมา

    // 🎯 ส่ง user_id_to_exclude เข้าไปใน Query
    const [rows] = await conn.query(search, [user_id_to_exclude]);

    res.status(200).json({
      parcelID: parcelA,
      search: rows,
    });
  } catch (error) {
    console.error("SearchU error:", error);
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
router.post("/recevie/:sender_id/:receiver_id",async(req,res)=>{
  try{
    const sender = req.params.sender_id;
    const receiver = req.params.receiver_id;
    const { d_name,image,address_id} = req.body;
    
    if(!sender || !receiver || !d_name || !image || !address_id){
      return res.status(400).json({ error: "Missing sender, receiver, d_name, image, or address_id" });
    }
    
    // 1. ✅ INSERT ข้อมูลลงใน table `parcel`
    //    (ละเว้น parcel_id เพราะเป็น AUTO_INCREMENT)
    const sqlParcel = 'INSERT INTO `parcel`(`sender_id`, `receiver_id`) VALUES (?, ?)';
    const [parcelInsertResult]: any = await conn.query<ResultSetHeader>(sqlParcel, [
      sender,
      receiver
    ]);
    
    // 2. 🎯 ดึง parcel_id ที่ถูกสร้างขึ้นมาใหม่
    const new_parcel_id = parcelInsertResult.insertId;

    // 3. ✅ เพิ่มรูปเข้า photo_status
    const sqlPhoto = `
      INSERT INTO photo_status (photo_status_url, photo_status_tier)
      VALUES (?, 'waiting')
    `;
    const [photoResult]: any = await conn.query<ResultSetHeader>(sqlPhoto, [image]);
    const photo_status_id = photoResult.insertId;


    // 4. ✅ เพิ่มข้อมูลเข้า delivery
    const sqlDelivery = `
      INSERT INTO delivery (parcel_id, rider_id, delivery_status, d_name, address_id)
      VALUES (?, NULL, 'waiting', ?, ?)
    `;
    // 🎯 ใช้ new_parcel_id ที่ได้จากการ INSERT ในขั้นตอนที่ 2
    const [deliveryResult]: any = await conn.query<ResultSetHeader>(sqlDelivery, [
      new_parcel_id, // ⬅️ ตัวแปรใหม่ที่ถูกต้อง
      d_name,
      address_id,
    ]);
    const delivery_id = deliveryResult.insertId;


    // 5. ✅ เชื่อมข้อมูลใน delivery_photo_status
    const sqlLink = `
      INSERT INTO delivery_photo_status (delivery_id, photo_status_id)
      VALUES (?, ?)
    `;
    await conn.query(sqlLink, [delivery_id, photo_status_id]);

    // ✅ ตอบกลับ (เพิ่ม parcel_id ใน Response ด้วย)
    res.status(201).json({
      message: "Delivery and photo linked successfully",
      delivery_id,
      parcel_id: new_parcel_id, // 💡 ส่ง Parcel ID กลับไปด้วย
      photo_status_id,
    });
  }catch(error){
    console.error("Recevie API Error:", error);
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
//////////
//          รายการส่งสินค้า main
//////////
// รายการที่ส่งทั้งหมดของ user
router.get("/main/:user_id",async(req,res)=>{
  try{
    const user = req.params.user_id;
    if(!user){
      return res.status(400).json({ error: "Missing user id" });
    }
    const sql = `SELECT
    p.parcel_id,
    d.delivery_id,
    d.delivery_status,
    d.d_name,
    ps.photo_status_url,
    ps.photo_status_tier
FROM
    parcel AS p
INNER JOIN
    delivery AS d 
    ON p.parcel_id = d.parcel_id
INNER JOIN
    delivery_photo_status AS dps
    ON d.delivery_id = dps.delivery_id
INNER JOIN
    photo_status AS ps
    ON dps.photo_status_id = ps.photo_status_id
WHERE
    p.sender_id = ?;`;
    const [sand] = await conn.query<ResultSetHeader>(sql, [user]);
    res.status(200).json({
      user_id: user,
      parcel: sand,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});
//serach ชื่อ กับ สถานะ
router.post("/mainSearch/:user_id", async (req, res) => {
  try {
    const user = req.params.user_id;
    
    // 🎯 แก้ไขตรงนี้: ใช้ Destructuring เพื่อดึงค่า 'text' ออกมาจาก Object req.body
    const { text } = req.body; 
    
    if (!user) {
      return res.status(400).json({ error: "Missing user ID" });
    }
    
    // 💡 สร้างตัวแปร search text ที่มี % ล้อมรอบ
    const searchText = `%${text}%`; 

    const search = `
      SELECT
        p.parcel_id,
        d.delivery_id,
        d.delivery_status,
        d.d_name,
        ps.photo_status_url,
        ps.photo_status_tier
      FROM
        parcel AS p
      INNER JOIN
        delivery AS d 
        ON p.parcel_id = d.parcel_id
      INNER JOIN
        delivery_photo_status AS dps
        ON d.delivery_id = dps.delivery_id
      INNER JOIN
        photo_status AS ps
        ON dps.photo_status_id = ps.photo_status_id
      WHERE 
        p.sender_id = ?
        AND (d.d_name LIKE ? OR d.delivery_status LIKE ?);
    `;
    
    // 🎯 ส่งตัวแปร searchText เข้าไป 2 ครั้ง (สำหรับ d_name และ delivery_status)
    const [main] = await conn.query(search, [
      user,
      searchText,
      searchText
    ]);

    res.status(200).json({
      user_id: user,
      parcel: main,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//////////
//          รายการของที่ต้องรับ
//////////
router.get("/getBox/:user_id",async(req,res)=>{
  try{
    const user = req.params.user_id;
    if(!user){
      return res.status(400).json({ error: "Missing user id" });
    }
    const sql = `SELECT
    p.parcel_id,
    d.delivery_id,
    d.delivery_status,
    d.d_name,
    ps.photo_status_url,
    ps.photo_status_tier
FROM
    parcel AS p
INNER JOIN
    delivery AS d 
    ON p.parcel_id = d.parcel_id
INNER JOIN
    delivery_photo_status AS dps
    ON d.delivery_id = dps.delivery_id
INNER JOIN
    photo_status AS ps
    ON dps.photo_status_id = ps.photo_status_id
WHERE
    p.receiver_id = ?;`;
    const [sand] = await conn.query<ResultSetHeader>(sql, [user]);
    res.status(200).json({
      user_id: user,
      parcel: sand,
    });
  }catch(error){
    res.status(500).json({ error: "Internal server error" });
  }
});
//serach ชื่อ กับ สถานะ
router.post("/getBoxSearch/:user_id", async (req, res) => {
  try {
    const user = req.params.user_id;
    
    // 🎯 แก้ไขตรงนี้: ใช้ Destructuring เพื่อดึงค่า 'text' ออกมาจาก Object req.body
    const { text } = req.body; 
    
    if (!user) {
      return res.status(400).json({ error: "Missing user ID" });
    }
    
    // 💡 สร้างตัวแปร search text ที่มี % ล้อมรอบ
    const searchText = `%${text}%`; 

    const search = `
      SELECT
        p.parcel_id,
        d.delivery_id,
        d.delivery_status,
        d.d_name,
        ps.photo_status_url,
        ps.photo_status_tier
      FROM
        parcel AS p
      INNER JOIN
        delivery AS d 
        ON p.parcel_id = d.parcel_id
      INNER JOIN
        delivery_photo_status AS dps
        ON d.delivery_id = dps.delivery_id
      INNER JOIN
        photo_status AS ps
        ON dps.photo_status_id = ps.photo_status_id
      WHERE 
        p.receiver_id = ?
        AND (d.d_name LIKE ? OR d.delivery_status LIKE ?);
    `;
    
    // 🎯 ส่งตัวแปร searchText เข้าไป 2 ครั้ง (สำหรับ d_name และ delivery_status)
    const [main] = await conn.query(search, [
      user,
      searchText,
      searchText
    ]);
    res.status(200).json({
      user_id: user,
      parcel: main,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//////////
//          profile (user)
//////////
router.get("/profile/:user_id", async (req, res) => {
  try{
     const user = req.params.user_id;
      if (!user) {
        return res.status(400).json({ error: "Missing user ID" });
      }
      const sql = `
      SELECT
    u.user_name,
    u.user_phone,
    u.user_proflie,
    a.address_id,
    a.address_text,
    a.address_latitude,
    a.address_longitude,
    ua.choose AS is_default_address
FROM 
    user u
LEFT JOIN 
    user_address ua ON u.user_id = ua.user_id
LEFT JOIN 
    address a ON ua.address_id = a.address_id
WHERE 
    u.user_id = ?
ORDER BY 
    ua.choose DESC;
      `;
      const [profile] = await conn.query(sql, [
      user,
    ]);
     res.status(200).json({
      user_id: user,
      profile: profile,
    });
  }catch(error){
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error"});
  }
});
// put ข้อมูล user
router.put("/edit/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;
        const { name, phone, profileUrl } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "Missing user ID in request parameters." });
        }

        // --- 1. Fetch current user data ---
        const selectSql = `
            SELECT user_name, user_phone, user_proflie
            FROM user
            WHERE user_id = ?;
        `;
        // Assuming 'conn' is your database connection object
        const [rows] : any = await conn.query<ResultSetHeader>(selectSql, [user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const currentData = rows[0];

        // --- 2. Merge old data with new data ---
        // Use the new value if provided, otherwise stick to the current (old) value.
        const newName = name || currentData.user_name;
        const newPhone = phone || currentData.user_phone;
        // profileUrl can be explicitly sent as null to clear it, 
        // or left undefined to keep the old URL.
        const newProfileUrl = (profileUrl === undefined) ? currentData.user_proflie : profileUrl;


        // --- 3. Execute the UPDATE query ---
        if (!newName || !newPhone) {
             // Basic validation for mandatory fields (name and phone)
             return res.status(400).json({ error: "Name and phone are required fields and cannot be empty." });
        }

        const updateSql = `
            UPDATE user
            SET
                user_name = ?,
                user_phone = ?,
                user_proflie = ?
            WHERE
                user_id = ?;
        `;

        const [result] = await conn.query<ResultSetHeader>(updateSql, [
            newName,
            newPhone,
            newProfileUrl, // This handles null gracefully
            user_id,
        ]);
        
        console.log(`User ${user_id} profile updated. Rows affected: ${result.affectedRows}`);
        
        if (result.affectedRows === 0) {
            // This might happen if the data was identical to what was sent, but it's good practice to check.
             return res.status(200).json({ message: "Profile updated successfully (or no changes were made)." });
        }

        return res.status(200).json({ message: "Profile updated successfully" });

    } catch(error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Internal server error"});
    }
});
//////////
//          rider รับงาน
//////////
// แสดงงานทั้งหมดที่ rider
router.get("/work", async (req, res) => {
  try{
    const sql = `
    SELECT * FROM delivery WHERE delivery_status = 'waiting';
    `;
    const work = await conn.query(sql);
    res.status(200).json({
      work : work,
    });
  }catch(error){
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error"});
  }
});
// ป้องกันการรับ 2 งาน
router.post("/working/:rider_id" ,async (req, res) => {
  try{
    const rider_id = req.params.rider_id;
    if(!rider_id){
      return res.status(400).json({ error: "Missing user ID" });
    }
    const sql = `
    SELECT
    d.delivery_id,
    d.d_name,
    d.delivery_status
FROM
    delivery AS d
WHERE
    d.rider_id = ?
    AND d.delivery_status IN ('received', 'delivered');
    `;
    const [working] = await conn.query<ResultSetHeader>(sql, [rider_id]);
    res.status(200).json({
      user_id: rider_id,
      working: working,
    });
  }catch(error){
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error"});
  }
})
// rider รับงาน
router.post("/goWork/:rider_id/:delivery_id" ,async (req, res) => {
  try{
    const rider_id = req.params.rider_id;
    const delivery = req.params.delivery_id;
    if(!rider_id || !delivery){
      return res.status(400).json({ error: "Missing user ID" });
    }
    const sql = `
    UPDATE delivery
SET 
    rider_id = ?,          
    delivery_status = 'received' 
WHERE 
    delivery_id = ?;
    `;
    const [working] = await conn.query<ResultSetHeader>(sql, [rider_id,delivery]);
    res.status(200).json({
      user_id: rider_id,
      working: working,
    });
  }catch(error){
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error"});
  }
})

