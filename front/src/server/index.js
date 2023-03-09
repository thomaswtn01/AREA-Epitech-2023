import path     from "path";
import express  from "express";


//////////////////////////////////////////////
//  EXPRESS
//////////////////////////////////////////////


const app = express();


//////////////////////////////////////////////
//  ROUTES
//////////////////////////////////////////////


app.get("/client.apk", (req, res) => {
    res.sendFile(path.resolve("/apk_folder", "client.apk"));
});

app.use(express.static("public"));

app.use((req, res) => {
    res.sendFile(path.resolve("public", "index.html"));
});


//////////////////////////////////////////////
//  MAIN
//////////////////////////////////////////////


app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`[LOG][EXPRESS] Server started on ${process.env.HOST}:${process.env.PORT}.`);
});
