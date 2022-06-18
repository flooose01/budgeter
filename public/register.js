"use strict";

(function() {
  window.addEventListener("load", init);

  function init() {
    id("register-btn").addEventListener("click", register);
  }

  function register() {
    let params = new FormData();
    params.append("username", id("register-username").value);
    params.append("password", id("register-password").value);
    fetch("/register", {method: "POST", body: params})
      .then(checkStatus)
      .then(() => {
        window.location.href = "login.html";
      })
      .catch(handleError);
  }

  function handleError(err) {
    qs(".status").textContent = err;
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