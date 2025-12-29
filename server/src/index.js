import "dotenv/config";
import { createApp } from "./app.js";

const port = process.env.PORT || 8787;
const app = createApp();

app.listen(port, () => {
  const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Allowing web origin: ${WEB_ORIGIN}`);
});
