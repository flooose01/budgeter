# Budget API Documentation
The Budget API provides information about the client's expenses on different categories added by the clients and to be able to edit each category and expenses.

## Register username
**Request Format:** /register endpoint with POST parameters of `username`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a valid `username`, registers the given username and return an empty expenses object if the username is new, or return an old expenses object if it is a returning user.


**Example Request:** /register with POST parameters of `username=admin`

**Example Response:**

```json
{
  "entertainment": {
    "category": "entertainment",
    "name": "Entertainment",
    "max-budget": 2000,
    "curr-expense": 100,
    "expenses": [
      {
        "id": 1652910370347,
        "category": "entertainment",
        "name": "Music concert",
        "expense": 100
      }
    ]
  },
  "food": {
    "category": "food",
    "name": "Food",
    "max-budget": 2000,
    "curr-expense": 20,
    "expenses": [
      {
        "id": 1652911018603,
        "category": "food",
        "name": "pho",
        "expense": 20
      }
    ]
  }
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If missing the username or username contains whitespace, an error is returned with the message: `Invalid username`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`

## Get all expenses of client
**Request Format:** /getAllExpense/:username

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a valid username, it returns a JSON of all of user's expenses. A valid username is registered and not empty.

**Example Request:** /getAllExpense/admin

**Example Response:**

```json
{
  "entertainment": {
    "category": "entertainment",
    "name": "Entertainment",
    "max-budget": 2000,
    "curr-expense": 100,
    "expenses": [
      {
        "id": 1652910370347,
        "category": "entertainment",
        "name": "Music concert",
        "expense": 100
      }
    ]
  },
  "food": {
    "category": "food",
    "name": "Food",
    "max-budget": 2000,
    "curr-expense": 20,
    "expenses": [
      {
        "id": 1652911018603,
        "category": "food",
        "name": "pho",
        "expense": 20
      }
    ]
  }
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If passed in an invalid username, returns an error with the message: `Username not registered`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`

## Get expense category
**Request Format:** /getCategory/:username/:category

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a valid username and category, it returns a JSON of the specified expense category. A valid username and category is registered and not empty.

**Example Request:** /getCategory/admin/food

**Example Response:**

```json
{
  "category": "food",
  "name": "Food",
  "max-budget": 2000,
  "curr-expense": 20,
  "expenses": [
    {
      "id": 1652911018603,
      "category": "food",
      "name": "pho",
      "expense": 20
    }
  ]
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If passed in an invalid username or category, returns an error with the message: `Unknown category or invalid username`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`

## Get total expenses
**Request Format:** /getTotalExpense/:username

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a valid username, it returns a JSON of the total category i.e. all expense category combined to one. A valid username is registered and not empty.

**Example Request:** /getTotalExpense/admin

**Example Response:**

```json
{
  "category": "total",
  "name": "Total",
  "max-budget": 4000,
  "curr-expense": 120,
  "expenses": [
    {
      "id": 1652910370347,
      "category": "entertainment",
      "name": "Music concert",
      "expense": 100
    },
    {
      "id": 1652911018603,
      "category": "food",
      "name": "pho",
      "expense": 20
    }
  ]
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If passed in an invalid username, returns an error with the message: `Invalid username`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error getting total`

## Adding a new expense category
**Request Format:** /addExpense/:username endpoint with POST parameters of `category` and `budget`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a valid username, `category`, and `budget`, adds a new category to user's expense categories with specified budget. A valid username must be registered and not empty. A valid budget must be a number bigger than 0. A valid category must not contain whitespace, must not be registered, and must not be `total`. It returns the new updated expense categories object.


**Example Request:** /addCategory/admin with POST parameters of `category=food` and `budget=2000`

**Example Response:**

```json
{
  "entertainment": {
    "category": "entertainment",
    "name": "Entertainment",
    "max-budget": 2000,
    "curr-expense": 100,
    "expenses": [
      {
        "id": 1652910370347,
        "category": "entertainment",
        "name": "Music concert",
        "expense": 100
      }
    ]
  },
  "food": {
    "category": "food",
    "name": "Food",
    "max-budget": 2000,
    "curr-expense": 0,
    "expenses": []
  }
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If username not registered or category is registered or category is `total`, an error is returned with the message: `Category already exist or invalid username`
  - If budget is less than 0 or category has whitespace, an error is returned with the message: `Budget must be > 0 or category must not contain whitespace`
  - If given category or username is empty, an error is returned with the message: `Field must not be empty`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`

## Adding a new expense to specified category
**Request Format:** /addCategory/:username/:category endpoint with POST parameters of `name` and `expense`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a valid username, category, `name`, and `expense`, adds a new expense to user's category with specified expense. A valid username must be registered and not empty. A valid `expense` must be bigger than 0. A valid category must be registered. It returns the updated category object


**Example Request:** /addExpense/admin/food with POST parameters of `name=pho` and `expense=20`

**Example Response:**

```json
{
  "category": "food",
  "name": "Food",
  "max-budget": 2000,
  "curr-expense": 20,
  "expenses": [
    {
      "id": 1652911018603,
      "category": "food",
      "name": "pho",
      "expense": 20
    }
  ]
}

```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If expense is <= 0 or username not registered, or category not registered, an error is returned with the message: `Invalid input`
  - If given name or expense is empty, an error is returned with the message: `Field must not be empty`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`

## Deleting an existing category
**Request Format:** /deleteCategory/:username/:category

**Request Type:** DELETE

**Returned Data Format**: JSON

**Description:** Given a valid username and category, deletes an existing category from the user's expense categories. A valid username and category must be registered. It returns the updated category object.

**Example Request:** /deleteCategory/admin/entertainment

**Example Response:**

```json
{
  "category": "food",
  "name": "Food",
  "max-budget": 2000,
  "curr-expense": 20,
  "expenses": [
    {
      "id": 1652911018603,
      "category": "food",
      "name": "pho",
      "expense": 20
    }
  ]
}

```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If category or username not registered, an error is returned with the message: `category not in expenses or username invalid`
  - If given name or expense is empty, an error is returned with the message: `Field must not be empty`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`
  - If something goes wrong while saving the deleted file, returns an error with the message: `Error deleting category`

## Deleting an existing expense
**Request Format:** /deleteExpense/:username/:category/:id

**Request Type:** DELETE

**Returned Data Format**: JSON

**Description:** Given a valid username, category, and id, deletes an existing expense with given id from the user's specified category. A valid username and category must be registered. If the given id, does not exist, it does not delete anything. It returns the updated category object.

**Example Request:** /deleteExpense/admin/food/1652911018603

**Example Response:**

```json
{
  "category": "food",
  "name": "Food",
  "max-budget": 2000,
  "curr-expense": 20,
  "expenses": []
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If category or username not registered, an error is returned with the message: `Category not in expenses or username invalid`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Error accessing expenses`