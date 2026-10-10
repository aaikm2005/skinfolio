import app from "./src/index.js";

const port = Number(process.env.PORT ?? 8787);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});
