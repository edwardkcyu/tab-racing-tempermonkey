// ==UserScript==
// @name         TAB Single Bonus
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Fetches data from API and calculates bonus back blitz
// @author       Your Name
// @match        https://www.tab.co.nz/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tab.co.nz
// @grant        GM_xmlhttpRequest
// ==/UserScript==

function run() {
  // Get the elements with class "flex gap-2"
  const elements = document.querySelectorAll('.flex.gap-2');

  // Filter elements with only two button children
  const filteredElements = Array.from(elements).filter((element) => element.querySelectorAll('button').length === 2);

  filteredElements.forEach((element) => {
    const odds = [];

    const buttons = element.querySelectorAll('button');
    buttons.forEach((button) => {
      const oddsSpan = button.querySelector('span[data-testid="price-button-odds"]');
      odds.push(parseFloat(oddsSpan.innerHTML));
    });

    odds.sort();
    const [lowOdd, highOdd] = odds;
    const potentialReturn = highOdd - 1;
    const stake = potentialReturn / lowOdd;
    const cashoutRate = potentialReturn - stake;

    // Create a new button with the concatenated HTML string
    const newButton = document.createElement('button');
    newButton.innerHTML = Number(cashoutRate).toFixed(2) + ', ' + Number(stake).toFixed(2);
    let color;
    if (cashoutRate > 0.575) {
      color = 'lightgreen';
    } else if (cashoutRate > 0.545) {
      color = 'gold';
    } else {
      color = 'red';
    }
    newButton.style.backgroundColor = color;

    const lastButton = element.querySelector('button:last-of-type');
    lastButton.insertAdjacentElement('afterend', newButton.cloneNode(true));
  });
}

(async function () {
  'use strict';
  const newButton = document.createElement('button');
  newButton.innerHTML = 'Run';

  // Style the new button to be fixed to the bottom left of the screen
  newButton.style.position = 'fixed';
  newButton.style.bottom = '50px';
  newButton.style.left = '10px';
  newButton.style.zIndex = 99999;
  newButton.style.width = '200px';
  newButton.style.height = '100px';
  newButton.addEventListener('click', function () {
    run();
  });

  document.body.addEventListener('keydown', function (event) {
    if (event.shiftKey && event.metaKey && event.key === 'f') {
      run();
    }
  });

  // Append the new button to the document body
  document.body.appendChild(newButton);
})();
