// notice in our html we have a node with ID "app"
// hint: use this reference later to inject data into your page
const app = document.getElementById('app');

//////// DATA functions and consts
// Endpoint URLs consts
const baseURL = "https://www.balldontlie.io/api/v1";
const allTeamsSuffix = "/teams";
const allPlayersSuffix = "/players"
const teamSearchByIdTemplate = (teamId) => `/${teamId}`

async function queryEndpoint(endpoint, start_page, max_page, isSearch = false) {
  let response = { meta: { next_page: start_page } };
  let data = null;
  try {
    while (response.meta != null && response.meta.next_page != null && response.meta.next_page < max_page + 1) {
      response = await fetch(endpoint.concat(`${isSearch ? `&` : '?'}page=${response.meta.next_page}`));
      console.log(response);
      if (response.status === 200) {
        const parsedResponse = await response.json();
        response = parsedResponse;
        if (data == null) {
          data = { data: parsedResponse.data != null ? parsedResponse.data : parsedResponse };
        } else {
          data.data = { ...data.data, ...parsedResponse.data };
        }
      }
    }
  } catch (error) {
    console.log('api error');
    console.error(error);
  }
  return data;
}

async function getAllTeams() {
  return (await queryEndpoint(baseURL.concat(allTeamsSuffix), 1, 8)).data;
}

async function getTeamById(id) {
  return (await queryEndpoint(baseURL.concat(allTeamsSuffix).concat(teamSearchByIdTemplate(id)), 1, 2, true)).data;
}

async function getAllPlayers() {
  return (await queryEndpoint(baseURL.concat(allPlayersSuffix), 1, 8)).data;
}

/// FILTER FUNCTIONS

function getPlayerOfSelectedTeams(selectedTeams, allPlayers) {
  const teamIds = Object.values(selectedTeams).map((element) => element.id);
  const currentPlayers = JSON.parse(JSON.stringify(allPlayersData));
  return Object.values(currentPlayers).filter((player) => teamIds.includes(player.team.id));
}

//////// END DATA

function clearUI() {
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
  app.innerHTML = `<h1>Loading Data...</h1>`
}

function populateContentElementWithData(contentElement, teamDataElement, playersDataElement) {

  const player_details_template = document.getElementById("player-details-template");

  contentElement.innerHTML = `
  <h2>${teamDataElement.full_name}</h2>
  <div class="contentDetails">
    <p>City: ${teamDataElement.city}</p>
    <p>Abbr: ${teamDataElement.abbreviation}</p>
  </div>
  <p>Division: ${teamDataElement.division}</p>
  <div class="contentPlayersList">
  ${playersDataElement.length != 0 ? `<p>players:</p>
  <table>
    <thead>
      <tr>
        <td>First Name</td>
        <td>Last Name</td>
        <td>Position</td>
      </tr>
    </thead>
    <tbody>
    </tbody>
  </table>` : "<p>No player were found.</p>"
    }
  </div>
  `

  const content_element_table_body = contentElement.querySelector("tbody");

  playersDataElement.forEach(playerElement => {
    const player_details_clone = player_details_template.content.firstElementChild.cloneNode(true);
    const playerDetails = player_details_clone.querySelectorAll("td");

    playerDetails[0].innerHTML = playerElement.first_name;
    playerDetails[1].innerHTML = playerElement.last_name;
    playerDetails[2].innerHTML = playerElement.position == "" ? "Unkown" : "G" ? "Guard" : "Center";

    content_element_table_body.appendChild(player_details_clone);
  })


}

async function renderUI(allPlayersData, teamsData) {
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
  if (allPlayersData && teamsData) {
    // you have your data! add logic here to render it to the UI
    // notice in the HTML file we call render();
    teamsData.forEach(teamElement => {
      const dummyItemElement = Object.assign(document.createElement("div"), { className: "item" });
      const dummyContentElement = Object.assign(document.createElement("div"), { className: "content" });
      const playerDataCopy = JSON.parse(JSON.stringify(allPlayersData));
      const relevantPlayers = Object.values(playerDataCopy).filter((player) => player.team.id == teamElement.id);
      populateContentElementWithData(dummyContentElement, teamElement, relevantPlayers);
      dummyItemElement.appendChild(dummyContentElement);
      app.appendChild(dummyItemElement);
    });
  } else {
    noTeamsMeetCondition();
  }
}

let [allTeamsData, allPlayersData] = await Promise.all([getAllTeams(), getAllPlayers()]);
let currentlySelectTeams = allTeamsData;

////// filters and listeners

// getting elements
const teamSearchBox = document.getElementById("teamNameSearch");
const playerSearchDropDown = document.getElementById("searchPlayer");
const teamSortByDropDown = document.getElementById("teamsSortBy");

// populate filters with data

const dropDownElements = playerSearchDropDown;
Object.values(allPlayersData).forEach(player => {
  dropDownElements.appendChild(new Option(`${player.first_name} ${[player.last_name]}`, `${player.team.id}`))
});

// listeners
teamSearchBox.addEventListener("change", (event) => {
  clearUI();

  console.log(`change in team search box detected with text ${event.target.value}`);
  const teamSearchResults = Object.values(JSON.parse(JSON.stringify(allTeamsData))).filter(element => element.full_name.toLowerCase().includes(event.target.value.toLowerCase()));
  let relevantPlayers = {};

  if (teamSearchResults.length > 0) {
    relevantPlayers = getPlayerOfSelectedTeams(teamSearchResults, allPlayersData);
  }
  currentlySelectTeams = teamSearchResults;
  renderUI(relevantPlayers, teamSearchResults);
});

dropDownElements.addEventListener("change", async (event) => {
  clearUI();

  console.log(`change in player selection dropdown detected with option ${event.target.value}`);
  if (event.target.value === 'Select player...') {
    currentlySelectTeams = allTeamsData;
    renderUI(allPlayersData, allTeamsData);
    return;
  }
  let teamOfSelectedPlayer = Object.values(JSON.parse(JSON.stringify(allTeamsData))).filter(element => element.id === event.target.value);
  if (teamOfSelectedPlayer.length == 0) {
    // team not found in existing data
    teamOfSelectedPlayer = [await getTeamById(event.target.value)];
  }
  currentlySelectTeams = teamOfSelectedPlayer;
  renderUI(allPlayersData, teamOfSelectedPlayer);
});

teamSortByDropDown.addEventListener("change", async (event) => {
  clearUI();

  switch (event.target.value) {
    case 'nameAsc':
      currentlySelectTeams.sort((a, b) => a.full_name < b.full_name ? -1 : 1);
      break;
    case 'nameDesc':
      currentlySelectTeams.sort((a, b) => a.full_name > b.full_name ? -1 : 1);
      break;
    case 'division':
      currentlySelectTeams.sort((a, b) => a.division < b.division ? -1 : 1);
      break;
  }

  await renderUI(allPlayersData, currentlySelectTeams);
});



await renderUI(allPlayersData, allTeamsData);
