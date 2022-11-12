// notice in our html we have a node with ID "app"
// hint: use this reference later to inject data into your page
const app = document.getElementById('app');

//////// DATA functions and consts
// Endpoint URLs consts
const baseURL = "https://www.balldontlie.io/api/v1";
const allTeamsSuffix = "/teams";
const allPlayersSuffix = "/players"
const teamSearchByIdTemplate = (teamId) => `/${teamId}`

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function queryEndpoint(endpoint, start_page, max_page, isSearch = false) {
  let response = { meta: { next_page: start_page } };
  let data = null;
  try {
    while (response.meta != null && response.meta.next_page != null && response.meta.next_page < max_page + 1) {
      const current_page = response.meta.next_page;
      response = await fetch(endpoint.concat(`${isSearch ? `&` : '?'}page=${current_page}&per_page=100`));
      if (response.status === 200) {
        const parsedResponse = await response.json();
        response = parsedResponse;
        if (data == null) {
          data = { data: parsedResponse.data != null ? parsedResponse.data : parsedResponse };
        } else {
          data.data = [...data.data, ...parsedResponse.data]
        }
      } else if (response.status === 429) {
        await delay(1000);
        response = await fetch(endpoint.concat(`${isSearch ? `&` : '?'}page=${current_page}&per_page=100`));
        if (response.status === 429) {
          console.log(`got 429 twice. current page: ${res}`)
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
  return (await queryEndpoint(baseURL.concat(allTeamsSuffix), 1, 15)).data;
}

async function getTeamById(id) {
  return (await queryEndpoint(baseURL.concat(allTeamsSuffix).concat(teamSearchByIdTemplate(id)), 1, 2, true)).data;
}

async function getAllPlayers() {
  var raw_data = (await queryEndpoint(baseURL.concat(allPlayersSuffix), 1, 10)).data;
  return Object.values(raw_data)
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

function getPosition(position_char) {
  switch (position_char) {
    case 'G':
      return "Guard"
    case 'F':
      return "Front"
    default:
      return Math.floor(Math.random() * 2) == 0 ? "Guard" : "Front"
  }
}

function populateContentElementWithData(contentElement, teamDataElement, playersDataElement) {

  const player_details_template = document.getElementById("player-details-template");

  contentElement.innerHTML = `
  <h2 class=teamTitle>${teamDataElement.full_name}</h2>
  <div class="contentDetails">
    <p>City: ${teamDataElement.city}</p>
    <p>Abbr: ${teamDataElement.abbreviation}</p>
  </div>
  <p>Division: ${teamDataElement.division}</p>
  <div class="contentPlayersList">
  ${playersDataElement.length != 0 ? `<p>Partial players list:</p>
  <table class="playerListTable">
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

  const players_with_position = playersDataElement.filter(player => player.position !== '');
  if (players_with_position.length < 10) {
    const players_without_position = playersDataElement.filter(player => player.position === '');
    for (let i = 0; i < 10 - players_with_position.length; i++) {
      players_with_position.push(players_without_position[i])
    }
  }

  playersDataElement.slice(0, 10).forEach(playerElement => {
    const player_details_clone = player_details_template.content.firstElementChild.cloneNode(true);
    const playerDetails = player_details_clone.querySelectorAll("td");

    playerDetails[0].innerHTML = playerElement.first_name;
    playerDetails[1].innerHTML = playerElement.last_name;
    playerDetails[2].innerHTML = getPosition(playerElement.position);

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
allPlayersData.sort(((a, b) => a.first_name < b.first_name ? -1 : 1));
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
