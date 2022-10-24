/*
 * Name: Darel Hansel Gunawan
 * Date: 05.18.2022
 * Section: CSE 154 AC
 *
 * This is the server-side JS to implement my budget manager web app. It handles receiving requests
 * to get or update the user's expenses. It also stores the user expenses inside a file for further
 * use.
 */

"use strict";

const express = require("express");
const app = express();
const multer = require("multer");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const sessions = require("express-session");

const ONE_DAY = 1000 * 60 * 60 * 24;
const BUDGET_DB = "budget.db";
const SERVER_ERROR_CODE = 500;
const CLIENT_ERROR_CODE = 400;
const DEFAULT_PORT = 8080;

const SERVER_ERROR_MSG = "Something went wrong...";
const MISSING_PARAMS = "Missing one or more fields";
const INVALID_PARAMS = "Invalid params";
const SUCCESSFUL_LOGIN = "Login successful";
const SUCCESSFUL_REGIS = "Registered successfully";
const SUCCESSFUL_DELETE = "Deleted successfully";
const INCORRECT_INFO = "Username or password incorrect";
const USERNAME_EXIST = "Username already exist";
const INVALID_USERNAME = "Invalid user";
const CATEGORY_EXIST = "Category already exist";
const INVALID_CATEGORY = "Invalid category";
const INVALID_EXPENSE = "Invalid expense";
const SUCCESSFUL_LOGOUT = "Logout successful";
const UNSUCCESSFUL_LOGOUT = "Logout failed";

const USERNAME_RULES = "Username must not contain whitespace";
const PASSWORD_RULES =
  "must be 3-8 characters, contains at least 1 number and letter";

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767", // Change secret
    saveUninitialized: true,
    cookie: { maxAge: ONE_DAY },
    resave: false,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

/**
 * Login with the given username and password
 */
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    try {
      let db = await getDBConnection();
      let query = "SELECT password FROM users WHERE username = ?;";
      let queryRes = await db.get(query, username);
      await db.close();
      if (queryRes && (await bcrypt.compare(password, queryRes.password))) {
        req.session.username = username;
        res.send(SUCCESSFUL_LOGIN);
      } else {
        res.type("text").status(CLIENT_ERROR_CODE).send(INCORRECT_INFO);
      }
    } catch (err) {
      res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(MISSING_PARAMS);
  }
});

/**
 * Logs out off the session
 */
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.type("text").status(SERVER_ERROR_CODE).send(SUCCESSFUL_LOGOUT);
    } else {
      res.send(SUCCESSFUL_LOGOUT);
    }
  });
});

/**
 * Registers a given username if username is not registered yet
 */
app.post("/register", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    if (usernameValid(username)) {
      if (passwordValid(password)) {
        try {
          let db = await getDBConnection();
          let user = await usernameID(db, username);
          if (!user) {
            let hashedPassword = await bcrypt.hash(password, 10);
            let query = "INSERT INTO users (username, password) VALUES (?, ?);";
            await db.run(query, [username, hashedPassword]);
            await db.close();
            res.type("text").send(SUCCESSFUL_REGIS);
          } else {
            await db.close();
            res.type("text").status(CLIENT_ERROR_CODE).send(USERNAME_EXIST);
          }
        } catch (err) {
          res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
        }
      } else {
        res.type("text").status(CLIENT_ERROR_CODE).send(PASSWORD_RULES);
      }
    } else {
      res.type("text").status(CLIENT_ERROR_CODE).send(USERNAME_RULES);
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
  }
});

/**
 * Returns a JSON object that consist of all categories of the user if no query params. If category
 * query params is given, returns a JSON object of the category of given name
 */
app.get("/categories", async (req, res) => {
  let name = req.query.name;
  let username = req.session.username;
  try {
    let db = await getDBConnection();
    let user = await usernameID(db, username);
    if (user) {
      if (name) {
        let query =
          "SELECT id, category, budget FROM categories WHERE user_id = ? AND category = ?";
        let category = await db.get(query, [user.id, name]);
        if (category) {
          query = "SELECT * FROM expenses WHERE category_id = ?";
          let expenses = await db.all(query, category.id);
          category.expenses = expenses;
          await db.close();
          res.json(category);
        } else {
          await db.close();
          res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
        }
      } else {
        let query =
          "SELECT id, category, budget FROM categories WHERE user_id = ?";
        let categories = await db.all(query, user.id);
        for (let i = 0; i < categories.length; i++) {
          query = "SELECT * FROM expenses WHERE category_id = ?";
          let expenses = await db.all(query, categories[i].id);
          categories[i].expenses = expenses;
        }
        await db.close();
        res.json(categories);
      }
    } else {
      await db.close();
      res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
  }
});

/**
 * Returns the total expense category, i.e. all expenses combined to one, of the user with given
 * username.
 */
app.get("/total", async (req, res) => {
  let username = req.session.username;
  try {
    let db = await getDBConnection();
    let user = await usernameID(db, username);
    if (user) {
      let query =
        "SELECT id, category, budget FROM categories WHERE user_id = ?";
      let categories = await db.all(query, user.id);
      let totalBudget = 0;
      let allExpenses = [];
      for (let i = 0; i < categories.length; i++) {
        totalBudget += categories[i].budget;
        query =
          "SELECT e.id, e.category_id, c.category, e.name, e.expense, e.description, e.date \
        FROM expenses e \
        JOIN categories c ON c.id = ? \
        WHERE category_id = ?";
        let expenses = await db.all(query, [
          categories[i].id,
          categories[i].id,
        ]);
        allExpenses.push(...expenses);
      }
      await db.close();
      res.json({
        category: "total",
        budget: totalBudget,
        expenses: allExpenses,
      });
    } else {
      await db.close();
      res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
    }
  } catch (err) {
    res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
  }
});

/**
 * Adds a new category to the specified user's expenses
 */
app.post("/addCategory", async (req, res) => {
  let username = req.session.username;
  let category = req.body.category;
  let budget = parseInt(req.body.budget);
  if (budget && category) {
    if (budget <= 0) {
      res.type("text").status(CLIENT_ERROR_CODE).send("Budget must be > 0");
    } else if (containsWhitespace(category)) {
      res
        .type("text")
        .status(CLIENT_ERROR_CODE)
        .send("Category must not contain whitespace");
    } else {
      try {
        let db = await getDBConnection();
        let user = await usernameID(db, username);
        if (user) {
          let categoryObj = await categoryID(db, category, user.id);
          if (!categoryObj) {
            let query =
              "INSERT INTO categories (category, budget, user_id) VALUES (?, ?, ?);";
            await db.run(query, [category, budget, user.id]);
            query =
              "SELECT id, category, budget FROM categories WHERE user_id = ? AND category = ?";
            let categoryRes = await db.get(query, [user.id, category]);
            if (categoryRes) {
              query = "SELECT * FROM expenses WHERE category_id = ?";
              let expenses = await db.all(query, categoryRes.id);
              categoryRes.expenses = expenses;
              await db.close();
              res.json(categoryRes);
            } else {
              await db.close();
              res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
            }
          } else {
            await db.close();
            res.type("text").status(CLIENT_ERROR_CODE).send(CATEGORY_EXIST);
          }
        } else {
          await db.close();
          res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
        }
      } catch (err) {
        res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
      }
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(MISSING_PARAMS);
  }
});

/**
 * Adds a new expense to the specified user's given category. Returns the new expenses.
 */
app.post("/addExpense", async (req, res) => {
  let username = req.session.username;
  let category = req.body.category;
  let name = req.body.name;
  let description = req.body.description;
  let expense = parseInt(req.body.expense);
  if (category && name && expense) {
    if (expense >= 0) {
      try {
        let db = await getDBConnection();
        let user = await usernameID(db, username);
        if (user) {
          let categoryObj = await categoryID(db, category, user.id);
          if (categoryObj) {
            let query =
              "INSERT INTO expenses (category_id, name, expense, description) \
              VALUES (?, ?, ?, ?);";
            await db.run(query, [categoryObj.id, name, expense, description]);

            query = "SELECT id, category, budget FROM categories WHERE id = ?";
            let categoryRes = await db.get(query, categoryObj.id);
            if (categoryRes) {
              query = "SELECT * FROM expenses WHERE category_id = ?";
              let expenses = await db.all(query, categoryRes.id);
              categoryRes.expenses = expenses;
              await db.close();
              res.json(categoryRes);
            } else {
              await db.close();
              res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
            }
          } else {
            await db.close();
            res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
          }
        } else {
          await db.close();
          res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
        }
      } catch (err) {
        res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
      }
    } else {
      res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_PARAMS);
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(MISSING_PARAMS);
  }
});

/**
 * Deletes a category from the user's expenses
 */
app.delete("/deleteCategory", async (req, res) => {
  let category = req.body.category;
  let username = req.session.username;
  if (category) {
    try {
      let db = await getDBConnection();
      let user = await usernameID(db, username);
      if (user) {
        let categoryObj = await categoryID(db, category, user.id);
        if (categoryObj) {
          let query = "DELETE FROM expenses WHERE category_id = ?";
          await db.run(query, categoryObj.id);
          query = "DELETE FROM categories WHERE id = ?";
          await db.run(query, categoryObj.id);
          await db.close();
          res.type("text").send(SUCCESSFUL_DELETE);
        } else {
          await db.close();
          res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
        }
      } else {
        await db.close();
        res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
      }
    } catch (err) {
      res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(MISSING_PARAMS);
  }
});

/**
 * Deletes an expense with given id from the user's expenses
 */
app.delete("/deleteExpense", async (req, res) => {
  let username = req.session.username;
  let id = parseInt(req.body.id);
  if (id) {
    try {
      let db = await getDBConnection();
      let user = await usernameID(db, username);
      if (user) {
        let expenseObj = await expenseValid(db, id, user.id);
        if (expenseObj) {
          let query = "DELETE FROM expenses WHERE id = ?";
          await db.run(query, id);

          query = "SELECT id, category, budget FROM categories WHERE id = ?";
          let categoryRes = await db.get(query, expenseObj.category_id);
          if (categoryRes) {
            query = "SELECT * FROM expenses WHERE category_id = ?";
            let expenses = await db.all(query, categoryRes.id);
            categoryRes.expenses = expenses;
            await db.close();
            res.json(categoryRes);
          } else {
            await db.close();
            res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_CATEGORY);
          }
        } else {
          await db.close();
          res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_EXPENSE);
        }
      } else {
        await db.close();
        res.type("text").status(CLIENT_ERROR_CODE).send(INVALID_USERNAME);
      }
    } catch (err) {
      res.type("text").status(SERVER_ERROR_CODE).send(SERVER_ERROR_MSG);
    }
  } else {
    res.type("text").status(CLIENT_ERROR_CODE).send(MISSING_PARAMS);
  }
});

/**
 * Checks if given str contains whitespace
 * @param {String} str String to check
 * @returns {boolean} True if str contains whitespace, false otherwise
 */
function containsWhitespace(str) {
  return /\s+/.test(str);
}

/**
 * Rules: Must not contain whitespace
 * @param {String} username username to check if valid
 * @returns {boolean} true if username is valid, false otherwise
 */
function usernameValid(username) {
  return !containsWhitespace(username);
}

/**
 * Rules: 3-8 characters, must contain at least 1 letter and number
 * @param {String} password password to check if valid
 * @returns {boolean} true if password is valid, false otherwise
 */
function passwordValid(password) {
  return (
    password.length <= 8 &&
    password.length >= 3 &&
    /[0-9]+/.test(password) &&
    /[a-zA-Z]+/.test(password)
  );
}

/**
 * Returns an object with category id with name of given category and user id of given user id
 * @param {Object} db Database
 * @param {String} category Category to check
 * @param {number} user_id User's id to check
 * @returns {Object} id of category with given category and user id
 */
async function categoryID(db, category, user_id) {
  let query = "SELECT id FROM categories WHERE category = ? AND user_id = ?";
  let categoryID = await db.get(query, [category, user_id]);
  return categoryID;
}

/**
 * Returns id of username with given name
 * @param {Object} db Database
 * @param {String} username Name to check
 * @returns {Object} id of username with given name
 */
async function usernameID(db, username) {
  let query = "SELECT id FROM users WHERE username = ?";
  let userID = await db.get(query, username);
  return userID;
}

/**
 * Returns id of expense with given id and owned by user
 * @param {Object} db Database
 * @param {number} id Id of expense
 * @param {number} user_id Id of user
 * @returns {Object} id of expense with given id and owned by user
 */
async function expenseValid(db, id, user_id) {
  let query =
    "SELECT * FROM expenses e \
    JOIN categories c ON c.id = e.category_id \
    JOIN users u ON u.id = c.user_id \
    WHERE e.id = ? AND u.id = ?";
  let expenseID = await db.get(query, [id, user_id]);
  return expenseID;
}

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: BUDGET_DB,
    driver: sqlite3.Database,
  });
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT);
