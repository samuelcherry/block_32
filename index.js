require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

//VIEW

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        SELECT * from flavors ORDER BY created_at DESC
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
            SELECT * from flavors
            WHERE id = $1
            `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//CREATE

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        INSERT INTO flavors(id,name, is_favorite)
        Values($1, $2, $3)
        RETURNING *
        `;

    const response = await client.query(SQL, [
      req.body.id,
      req.body.name,
      req.body.is_favorite
    ]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//UPDATE

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
       UPDATE flavors
       SET name=$1, is_favorite=$2, updated_at=now()
       WHERE id = $3
       RETURNING *
       `;

    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE from flavors
        WHERE id = $1
        `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();

  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
        )`;
  await client.query(SQL);
  console.log("tables create");

  SQL = `INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
        INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', false);
        INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', false)`;

  await client.query(SQL);

  const port = process.env.PORT;
  app.listen(port, () => console.log(` listining on port ${port}`));
};

init();
