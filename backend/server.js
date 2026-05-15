const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Villages API Running");
});

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
});

//states
app.get("/states", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM state ORDER BY name"
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

//district
app.get("/districts", async (req, res) => {
    try {
        const { state } = req.query;

        const result = await pool.query(
            "SELECT * FROM district WHERE state_id = $1 ORDER BY name",
            [state]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
//subdisticts
app.get("/subdistricts", async (req, res) => {
    try {
        const { district } = req.query;

        const result = await pool.query(
            `SELECT * FROM sub_district
 WHERE district_id = $1
 ORDER BY name`,
            [district]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

//villages
app.get("/villages", async (req, res) => {
    try {
        const { subdistrict } = req.query;

        const result = await pool.query(
            `SELECT * FROM village
 WHERE sub_district_id = $1
 ORDER BY name
 LIMIT 100`,
            [subdistrict]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.get("/search", async (req, res) => {
    try {
        const { q } = req.query;

        const result = await pool.query(
            `
SELECT 
v.id,
v.name as village,
sd.name as subdistrict,
d.name as district,
s.name as state
FROM village v
JOIN sub_district sd ON v.sub_district_id = sd.id
JOIN district d ON sd.district_id = d.id
JOIN state s ON d.state_id = s.id
WHERE LOWER(v.name) LIKE LOWER($1)
LIMIT 50
`,
            [`%${q}%`]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});