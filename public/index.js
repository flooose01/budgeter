/*
 * Name: Darel Hansel Gunawan
 * Date: 05.18.2022
 * Section: CSE 154 AC
 *
 * This is the client-side JS to implement my budget manager web app. It handles getting
 * and updating the necessary information about the client's expense in different categories
 * of expense.
 */

"use strict";

(function() {
  const ONE_HUNDRED = 100;
  const RED_REGION = 75;

  window.addEventListener("load", init);

  /**
   * Initializes the login page
   */
  function init() {
    qs("#total button").setAttribute("category", "total");
    id("add-category-btn").addEventListener("click", addCategory);
    id("add-expense-btn").addEventListener("click", fetchAddExpense);
    id("delete-category-btn").addEventListener("click", fetchDeleteCategory);

    id("add-expense-modal").addEventListener("show.bs.modal", addExpense);
    id("view-expense-modal").addEventListener("show.bs.modal", viewExpenses);
    id("delete-category-modal").addEventListener("show.bs.modal", deleteCategory);

    id("logout").addEventListener("click", logout);
    loadAllExpenses();
  }

  /**
   * Logs out account
   */
  async function logout() {
    fetch("/logout")
      .then(checkStatus)
      .then(() => {
        window.location.href = "/login.html";
      })
      .catch(console.error);
  }

  /**
   * Load user's previous expenses
   */
  function loadAllExpenses() {
    fetch("/categories")
      .then(checkStatus)
      .then(res => res.json())
      .then(expenses => Object.values(expenses).forEach(showCategory))
      .then(updateTotal)
      .catch(() => {
        id("expense-container").textContent = "Error loading expenses. Try again";
      });
  }

  /**
   * Set the delete modal to have current category of specified event
   * @param {Event} event The event when the delete modal is shown
   */
  function deleteCategory(event) {
    let category = event.relatedTarget.getAttribute("category");
    qs("#delete-category-modal .modal-body h6 strong").textContent = category;
    id("delete-category-btn").setAttribute("curr-category", category);
  }

  /**
   * Deletes the expense category specified inside the event.
   * @param {Event} event The event when delete button is clicked
   */
  function fetchDeleteCategory(event) {
    let category = event.currentTarget.getAttribute("curr-category");
    let params = new FormData();
    params.append("category", category);
    fetch("/deleteCategory", {method: "DELETE", body: params})
      .then(checkStatus)
      .then(() => id(category).remove())
      .then(updateTotal)
      .catch(err => showErrorMessage(err, "delete-category-modal"));
  }

  /**
   * Show the list of expenses of the specified category inside event to the view modal
   * @param {Event} event The event when view modal is shown
   */
  function viewExpenses(event) {
    let category = event.relatedTarget.getAttribute("category");
    let promise;
    if (category === "total") {
      promise = fetch("/total");
    } else {
      promise = fetch("/categories?name=" + category);
    }
    promise
      .then(checkStatus)
      .then(res => res.json())
      .then(showExpenses)
      .catch(err => showErrorMessage(err, "view-expense-modal"));
  }

  /**
   * Put the list of expenses onto the view modal
   * @param {Object} exp Expense category object
   */
  function showExpenses(exp) {
    let expensesList = exp.expenses;
    let expensesContainer = qs("#view-expense-modal .table tbody");
    expensesContainer.innerHTML = "";
    for (let i = 0; i < expensesList.length; i++) {
      let tr = gen("tr");
      tr.id = expensesList[i].id;
      let td1 = gen("td");
      td1.textContent = expensesList[i].name;
      let td2 = gen("td");
      td2.textContent = "$" + expensesList[i].expense;
      let td3 = gen("td");
      if (exp.category !== "total") {
        let delButton = genElement("button", "btn btn-sm btn-close");
        delButton.addEventListener("click", () => deleteExpense(expensesList[i]));
        td3.appendChild(delButton);
      }
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      expensesContainer.appendChild(tr);
    }
  }

  /**
   * Deletes the given expense
   * @param {Object} exp Expense object
   */
  function deleteExpense(exp) {
    let params = new FormData();
    params.append("id", exp.id);
    fetch("/deleteExpense", {method: "DELETE", body: params})
      .then(checkStatus)
      .then(res => res.json())
      .then(updateCategory)
      .then(() => id(exp.id).remove())
      .then(updateTotal)
      .catch(err => showErrorMessage(err, "view-expense-modal"));
  }

  /**
   * Set the add expense modal to have current category of specified event
   * @param {Event} event The event when the add expense modal is shown
   */
  function addExpense(event) {
    let category = event.relatedTarget.getAttribute("category");
    id("add-expense-btn").setAttribute("curr-category", category);
  }

  /**
   * Adds a new expense based on the specified category inside event and user
   * form input.
   * @param {Event} event The event when the add expense button is clicked
   */
  function fetchAddExpense(event) {
    let category = event.currentTarget.getAttribute("curr-category");
    let params = new FormData(id("expense-form"));
    params.append("category", category);
    fetch("/addExpense", {method: "POST", body: params})
      .then(checkStatus)
      .then(res => res.json())
      .then(updateCategory)
      .then(updateTotal)
      .then(() => showSuccessMessage("add-expense-modal"))
      .catch(err => showErrorMessage(err, "add-expense-modal"));
  }

  /**
   * Adds a new expense category
   */
  function addCategory() {
    let params = new FormData(id("category-form"));
    fetch("/addCategory", {method: "POST", body: params})
      .then(checkStatus)
      .then(res => res.json())
      .then(showCategory)
      .then(updateTotal)
      .then(() => showSuccessMessage("add-category-modal"))
      .catch(err => showErrorMessage(err, "add-category-modal"));
  }

  /**
   * Show the success message of adding
   * @param {String} modalID Modal to show the success message to
   */
  function showSuccessMessage(modalID) {
    let status = qs("#" + modalID + " .status");
    status.textContent = "Successfully added";
    status.style.color = "green";
  }

  /**
   * Show error message from fetching
   * @param {String} err Error from fetching
   * @param {String} modalID Modal to show the error message to
   */
  function showErrorMessage(err, modalID) {
    let status = qs("#" + modalID + " .status");
    status.textContent = err;
    status.style.color = "red";
  }

  /**
   * Generate and show a new expense category
   * @param {Object} exp The new expense category to be added
   */
  function showCategory(exp) {
    id("expenses").insertBefore(generateCategoryCard(exp), id("total"));
  }

  /**
   * Update expense category with the new expense category.
   * @param {Object} expense The updated expense category
   */
  function updateCategory(expense) {
    let currExpense = getTotalExpense(expense.expenses);
    let category = expense.category;
    let categoryCard = id(category);
    categoryCard.querySelector(".expense").textContent = currExpense;
    categoryCard.querySelector(".budget").textContent = expense["budget"];
    let progressBar = categoryCard.querySelector(".progress-bar");
    progressBar.setAttribute("aria-valuemax", expense["budget"]);
    if (expense["budget"] !== 0) {
      categoryCard.querySelector(".progress").classList.remove("invisible");
      let percent = Math.floor(ONE_HUNDRED * currExpense / expense["budget"]);
      if (percent >= RED_REGION) {
        progressBar.classList.add("bg-danger");
      } else {
        progressBar.classList.remove("bg-danger");
      }
      progressBar.style.width = percent + "%";
    } else {
      categoryCard.querySelector(".progress").classList.add("invisible");
    }
  }

  /**
   * Updates the total category
   */
  function updateTotal() {
    fetch("/total")
      .then(checkStatus)
      .then(res => res.json())
      .then(updateCategory)
      .catch(handleErrorTotal);
  }

  /**
   * Handles the error of updating total. Shows the error as the header of total.
   * @param {String} err Error message
   */
  function handleErrorTotal(err) {
    qs("#total .me-2").textContent = err;
  }

  /**
   * Returns an expense category card based on the given expense category object
   * @param {Object} exp Expense category
   * @returns {HTMLElement} Expense category card
   */
  function generateCategoryCard(exp) {
    let card = genElement("div", "card m-4");
    card.id = exp.category;
    let cardBody = genElement("div", "card-body");
    let cardTitle = generateCardTitle(exp);
    let progressBar = generateCardProgress(exp);
    let cardButtons = generateCardButtons(exp);
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(progressBar);
    cardBody.appendChild(cardButtons);
    card.appendChild(cardBody);
    return card;
  }

  /**
   * Returns the title of expense category card based on the given expense category object
   * @param {Object} exp Expense category
   * @returns {HTMLElement} Title of expense category card
   */
  function generateCardTitle(exp) {
    let cardHeader = genElement(
      "div",
      "card-title d-flex justify-content-between align-items-baseline fw-normal mb-3"
    );
    let cardTitle = genElement("div", "me-2");
    cardTitle.textContent = exp["category"];
    let cardExpense = gen("div");
    cardExpense.textContent = "$";
    let expense = genElement("span", "expense");
    expense.textContent = getTotalExpense(exp["expenses"]);
    let budgetCont = genElement("span", "text-muted small ms-1");
    budgetCont.textContent = " / $";
    let budget = genElement("span", "budget");
    budget.textContent = exp["budget"];
    budgetCont.appendChild(budget);
    cardExpense.appendChild(expense);
    cardExpense.appendChild(budgetCont);
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(cardExpense);
    return cardHeader;
  }



  /**
   * Returns the progress bar of expense category card based on the given expense category object
   * @param {Object} exp Expense category
   * @returns {HTMLElement} Progress bar of expense category card
   */
  function generateCardProgress(exp) {
    let expense = getTotalExpense(exp["expenses"])
    let pill = genElement("div", "progress rounded-pill");
    let progressBar = genElement("div", "progress-bar");
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuenow", expense);
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", exp["budget"]);
    pill.appendChild(progressBar);

    if (exp["max-budget"] !== 0) {
      let percent = Math.floor(ONE_HUNDRED * expense / exp["budget"]);
      pill.classList.remove("invisible");
      if (percent >= RED_REGION) {
        progressBar.classList.add("bg-danger");
      } else {
        progressBar.classList.remove("bg-danger");
      }
      progressBar.style.width = percent + "%";
    } else {
      pill.classList.add("invisible");
    }

    return pill;
  }

  /**
   * Returns the controls of expense category card based on the given expense category object
   * @param {Object} exp Expense category
   * @returns {HTMLElement} Controls of expense category card
   */
  function generateCardButtons(exp) {
    let buttonContainer = genElement("div", "d-flex justify-content-end mt-4");
    let addButton = genElement("div", "btn btn-outline-primary mx-3");
    addButton.textContent = "Add Expense";
    addButton.setAttribute("type", "button");
    addButton.setAttribute("data-bs-toggle", "modal");
    addButton.setAttribute("data-bs-target", "#add-expense-modal");
    addButton.setAttribute("category", exp.category);

    let viewButton = genElement("div", "btn btn-outline-secondary mx-3 view-expense-btn");
    viewButton.textContent = "View Expenses";
    viewButton.setAttribute("type", "button");
    viewButton.setAttribute("data-bs-toggle", "modal");
    viewButton.setAttribute("data-bs-target", "#view-expense-modal");
    viewButton.setAttribute("category", exp.category);

    let delButton = genElement("div", "btn btn-outline-danger mx-3");
    delButton.textContent = "Delete";
    delButton.setAttribute("type", "button");
    delButton.setAttribute("data-bs-toggle", "modal");
    delButton.setAttribute("data-bs-target", "#delete-category-modal");
    delButton.setAttribute("category", exp.category);

    buttonContainer.appendChild(addButton);
    buttonContainer.appendChild(viewButton);
    buttonContainer.appendChild(delButton);

    return buttonContainer;
  }

  /**
   * Returns the total expenses of a category
   * @param {Object} expenses Expense category object
   * @returns {number} The total expenses of a category
   */
  function getTotalExpense(expenses) {
    let total = 0;
    for (let i = 0; i < expenses.length; i++) {
      total += expenses[i].expense;
    }
    return total;
  }

  /**
   * Returns an element with given tag with given classes. Given class list must not be
   * empty or contain empty string.
   * @param {String} tagName Tag name
   * @param {String} classes A string of classes separated by a space
   * @returns {HTMLElement} An element with given tag and given classes
   */
  function genElement(tagName, classes) {
    let div = gen(tagName);
    let classList = classes.split(" ");
    div.classList.add(...classList);
    return div;
  }

  /**
   * Checks if response from fetching resolves or rejected
   * @param {Promise} res The response to check
   * @returns {Promise | Error} Error if rejected, res if resolved
   */
  async function checkStatus(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Creates an HTML element based on given tag name
   * @param {String} tagName The tag name of the element to create
   * @returns {HTMLElement} The HTML element created
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Gets the HTML element with the specified id
   * @param {String} id ID to search
   * @returns {HTMLElement} The HTML element got
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Gets the first element within the document that matches the specified selector
   * @param {String} selectors CSS selector
   * @returns {HTMLElement} The HTML element got
   */
  function qs(selectors) {
    return document.querySelector(selectors);
  }
})();