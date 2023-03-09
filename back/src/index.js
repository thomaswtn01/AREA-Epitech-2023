import "./utils.js";
import "./database/mongodb.js";
import express          from "express";
import SwaggerUI        from 'swagger-ui-express'
import middlewareAuth   from "./middlewares/auth.js";
import routeAbout       from "./api/about.js";
import routeAuth        from "./api/auth.js";
import routeOAuth       from "./api/oauth.js";
import routeMe          from "./api/me.js";
import routeMeDelete    from "./api/delete.js";
import routeActions     from "./api/actions.js";
import SwaggerDocument  from "../swagger_output.json" assert { type: "json" };


//////////////////////////////////////
//  EXPRESS
//////////////////////////////////////


const app = express();

// Disable server tokens.
app.disable("x-powered-by");

// JSON body parser.
app.use(express.json());

// Swagger UI.
app.use("/api-docs", SwaggerUI.serve, SwaggerUI.setup(SwaggerDocument));


//////////////////////////////////////
//  ROUTES
//////////////////////////////////////


// About AREA.
app.get("/about.json"           , routeAbout);

// Login route.
app.post("/login"               , routeAuth.login);
app.post("/register"            , routeAuth.register);
app.get("/oauth/:service"       , routeOAuth);
app.post("/oauth/:service"      , routeOAuth);
app.delete("/oauth/:service"    , routeOAuth);

// Middleware auth.
app.use(middlewareAuth);

// Get user @me.
app.get("/user/@me"             , routeMe);
app.delete("/user/@me"          , routeMeDelete);

// reActions.
app.post("/actions"             , routeActions.create);
app.delete("/actions/:id"       , routeActions.delete);


//////////////////////////////////////
//  CATCHER
//////////////////////////////////////


app.use((req, res) => {
    return res.status(404).json({
        code    : 404,
        error   : "Not found.",
    });
});


//////////////////////////////////////
//  MAIN
//////////////////////////////////////


app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`[LOG][EXPRESS] Server started on ${process.env.HOST}:${process.env.PORT}.`);
});
