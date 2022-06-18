"use strict";

(function() {
  window.addEventListener("load", init);

  function init() {
    id("login-btn").addEventListener("click", login);
  }

  function login() {
    let params = new FormData();
    params.append("username", id("input-username").value);
    params.append("password", id("input-password").value);
    fetch("/login", {method: "POST", body: params})
      .then(checkStatus)
      .then(() => {
        window.location.href = "index.html";
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