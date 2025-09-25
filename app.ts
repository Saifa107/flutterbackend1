import express from "express";
import { router as flutter } from "./controller/flutter";
import bodyParser from "body-parser";
import * as os from "os";
export const app = express();



app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/",flutter);

// หา IP ของเครื่อง
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIP();

const PORT = 8080;

//คำสั่งรันserver npx nodemon server.ts

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://${localIP}:${PORT}/`);
  console.log(`Login route: http://localhost:${PORT}/`);
  console.log(`Register route: http://localhost:${PORT}/flutter`);
});