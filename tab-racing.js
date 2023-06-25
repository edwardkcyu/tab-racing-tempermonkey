// ==UserScript==
// @name         TAB Bonus Back Blitz App
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Fetches data from API and calculates bonus back blitz
// @author       Your Name
// @match        https://www.tab.co.nz/*/bonus-back-blitz
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tab.co.nz
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const BONUS_BACK_RATE = 0.75;

const processRaceResults = (raceResults, accountCount, bets) => {
  const raceResultsWithBetResults = raceResults.map((raceResult) => {
    const marketOutcomesWithBetResults = raceResult.marketOutcomes.map((outcome, index) => {
      const hasWon = outcome.position === 1;
      const betReturn = hasWon && index < bets.length ? bets[index] * outcome.price : 0;
      const hasBonus =
        index < accountCount &&
        Number.isInteger(bets[index]) &&
        bets[index] > 0 &&
        !hasWon &&
        Number.isInteger(outcome.position) &&
        outcome.position <= 4;
      const bonusReturn = hasBonus ? bets[index] * BONUS_BACK_RATE : 0;

      return {
        ...outcome,
        hasWon,
        betReturn: betReturn,
        hasBonus,
        bonusReturn: bonusReturn,
      };
    });

    return {
      ...raceResult,
      marketOutcomes: marketOutcomesWithBetResults,
    };
  });

  let totalBetReturn = 0;
  let totalBonus = 0;
  let totalBonusReturn = 0;
  raceResultsWithBetResults.forEach((raceResult) => {
    raceResult.marketOutcomes.forEach((outcome) => {
      totalBetReturn += outcome.betReturn;
      totalBonusReturn += outcome.bonusReturn;
      totalBonus += outcome.hasBonus ? 1 : 0;
    });
  });

  const totalBet = bets.reduce((acc, bet) => acc + bet, 0) * raceResultsWithBetResults.length;
  const finalReturn = totalBetReturn + totalBonusReturn - totalBet;

  return {
    raceResultsWithBetResults,
    totalBet,
    totalBetReturn,
    totalBonus,
    totalBonusReturn,
    finalReturn,
  };
};

const initPage = (raceResults) => {
  const rootElementId = 'tabRacingResults';
  let rootElement = document.getElementById(rootElementId);

  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = rootElementId;
    rootElement.style = 'padding: 20px; background-color: #333; color: #fff; ';
    rootElement.innerHTML = '<h2>Results</h2>';
    document.body.prepend(rootElement);

    const numberOfAccountsLabelElement = document.createElement('div');
    numberOfAccountsLabelElement.innerHTML = '<div>Number of accounts</div>';
    rootElement.appendChild(numberOfAccountsLabelElement);

    const numberOfAccountsInputElement = document.createElement('input');
    numberOfAccountsInputElement.id = 'numberOfAccounts';
    numberOfAccountsInputElement.type = 'number';
    numberOfAccountsInputElement.style = 'color: white;margin-bottom: 5px; border: 1px solid white;';
    numberOfAccountsInputElement.value = window.state.numberOfAccounts;
    numberOfAccountsInputElement.addEventListener('input', (evt) => {
      window.state.numberOfAccounts = evt.target.value;
      renderResults(raceResults, window.state.numberOfAccounts, window.state.bets);
    });
    rootElement.appendChild(numberOfAccountsInputElement);

    const betsLabelElement = document.createElement('div');
    betsLabelElement.innerHTML = '<div>Bets</div>';
    rootElement.appendChild(betsLabelElement);

    const betsInputElement = document.createElement('input');
    betsInputElement.id = 'bets';
    betsInputElement.type = 'text';
    betsInputElement.style = 'color: white;margin-bottom: 5px; border: 1px solid white;';
    betsInputElement.value = window.state.bets.join(',');
    betsInputElement.addEventListener('input', (evt) => {
      window.state.bets = evt.target.value.split(',').map((bet) => +bet);
      renderResults(raceResults, window.state.numberOfAccounts, window.state.bets);
    });
    rootElement.appendChild(betsInputElement);

    const summaryElement = document.createElement('div');
    summaryElement.id = 'returnSummary';
    summaryElement.style = 'margin-top: 20px';
    rootElement.appendChild(summaryElement);

    const resultElement = document.createElement('div');
    resultElement.id = 'raceResults';
    resultElement.style = 'margin-top: 20px';
    rootElement.appendChild(resultElement);
  }

  renderResults(raceResults, window.state.numberOfAccounts, window.state.bets);
};

const renderSummary = (raceReturns) => {
  const raceReturnElement = document.getElementById('returnSummary');
  raceReturnElement.innerHTML = `
    <div>Bets: ${raceReturns.totalBet}</div>
    <div>Won Return: ${raceReturns.totalBetReturn}</div>
    <div>Bonus: ${raceReturns.totalBonus}</div>
    <div>Bonus Return: ${raceReturns.totalBonusReturn}</div>
    <div>Final Return: ${raceReturns.finalReturn}</div>
  `;
};

const renderRaceResult = (raceResultWithBetResults) => `
  <div style="display:block">
    ${raceResultWithBetResults.marketOutcomes
      .map(
        (outcome) => `
        <div style="display:flex">
          <div>${outcome.runnerNumber}. ${outcome.name} (${outcome.price})</div>
          <div style="color: pink">${outcome.hasWon ? '(WINNER)' : ''}</div>
          <div style="color: lightgreen">${outcome.betReturn ? `(WON: ${outcome.betReturn.toFixed(2)})` : ''}</div>
          <div style="color: yellow">${outcome.bonusReturn ? `(BB: ${outcome.bonusReturn.toFixed(2)})` : ''}</div>
        </div>
    `,
      )
      .join('')}
  </div>
`;

const renderRaceResults = (raceResultsWithBetResults) => {
  const raceResultsElement = document.getElementById('raceResults');

  raceResultsElement.innerHTML = `
    <div >
      ${raceResultsWithBetResults
        .map(
          (raceResult, index) => `
            <div style="border: 1px solid; margin-bottom:10px; padding: 10px">
              <div style="margin-bottom: 10px">
                <a href="${raceResult.raceUrl}" target="_blank" style="color: lightskyblue">
                  ${index + 1}) ${new Date(raceResult.startTime).toLocaleTimeString()} - ${raceResult.name}
                </a>
              </div>
              ${renderRaceResult(raceResult)}
            </div>
      `,
        )
        .join('')}
    </div>

  `;
};

const renderResults = (raceResults, numberOfAccounts, bets) => {
  const raceReturns = processRaceResults(raceResults, numberOfAccounts, bets);
  renderSummary(raceReturns);
  renderRaceResults(raceReturns.raceResultsWithBetResults);
};

const getRaceUrls = async () => {
  const res = await (await fetch('https://fobcms.tab.co.nz/api/content/get-by-alias/offers/bonus-back-blitz')).json();

  const html = res.body || '';
  const regex = /https:\/\/www\.tab\.co\.nz\/racing\/meeting\/.+\/race\/.+/g;

  const extractedUrls = html.match(regex) || [];
  const uniqueUrls = [];
  for (const url of extractedUrls) {
    if (!uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }
  }
  return uniqueUrls;
};

const extractRaceId = (url) => {
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split('/');

  let raceId = '';

  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === 'race' && i < pathParts.length - 1) {
      raceId = pathParts[i + 1];

      break;
    }
  }

  return raceId;
};

const getRaceResults = async (raceIds) => {
  const queryString = `eventIds=${raceIds.join(
    ',',
  )}&includeChildMarkets=true&includePools=true&includeRace=true&includeRunners=true`;

  const res = await (
    await fetch(`https://content.tab.co.nz/content-service/api/v1/q/resulted-events?${queryString}`)
  ).json();

  const eventResults = res.data?.eventResults || [];

  const raceResults = eventResults?.map((eventResult) => {
    const ffWinMarket = eventResult.markets.find((market) => market.name === 'FFWIN');
    const marketOutcomes = ffWinMarket.outcomes
      ?.filter((outcome) => ['W', 'L', 'P'].includes(outcome.result.resultCode))
      .map((outcome) => {
        return {
          horseId: outcome.id,
          name: outcome.name,
          runnerNumber: outcome.runnerNumber,
          position: outcome.result.position,
          price: outcome.prices.find((price) => price.place === false && price.priceType === 'LP')?.decimal || 0,
        };
      });

    marketOutcomes.sort((a, b) => {
      if (a.price > b.price) {
        return 1;
      } else if (a.price < b.price) {
        return -1;
      } else {
        return 0;
      }
    });

    const positions = eventResult.result?.finalPositions
      ?.map((position) => {
        return {
          horseId: position.id,
          runnerName: position.name,
          runnerNumber: position.runnerNumber,
          position: position.position,
          price: position.startingPriceDec,
        };
      })
      ?.sort((a, b) => a.position - b.position);

    const raceId = eventResult.id;
    const meetingId = eventResult.meeting.id;

    return {
      raceId,
      raceUrl: `https://www.tab.co.nz/racing/meeting/${meetingId}/race/${raceId}`,
      name: eventResult.name,
      startTime: eventResult.startTime,
      raceNumber: eventResult.raceNumber,
      positions,
      marketOutcomes,
    };
  });

  return raceResults.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

(async function () {
  'use strict';

  window.state = {
    numberOfAccounts: 2,
    bets: [50, 50],
  };

  const racingUrls = await getRaceUrls();
  const raceIds = racingUrls.map((url) => extractRaceId(url));
  const raceResults = await getRaceResults(raceIds);

  initPage(raceResults);
})();
