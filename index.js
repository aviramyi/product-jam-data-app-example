//////////////
// we have a basic skeleton here to help you start.
// if you dont want to use it you dont have to -
// just clear the file and start from scratch
//////////////

// notice in our html we have a node with ID "app"
// hint: use this reference later to inject data into your page
const app = document.getElementById('app');

//////// DATA functions and consts
// Endpoint URLs consts
const baseURL = "https://www.balldontlie.io/api/v1/";
const allTeamsSuffix = "/teams";
const allPlayersSuffix = "/players"

async function queryEndpoint(endpoint) {
  let data = null;
  try {
    const response = await fetch(endpoint);
    console.log(response);
    if (response.status === 200) {
      data = await response.json();
    }
  } catch (error) {
    console.log('api error');
    console.error(error);
  }
  return data;
}

async function getAllTeams() {
  return (await queryEndpoint(baseURL.concat(allTeamsSuffix))).data;
}

async function getAllPlayers() {
  return await queryEndpoint(baseURL.concat(allPlayersSuffix)).data;
}

//////// END DATA

function clearUI() {
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
}

function populateContentElementWithData(contentElement, dataElement) {

  contentElement.innerHTML = `<h2>${dataElement.full_name}</h2><p>${dataElement.city}</p>`

}

async function renderUI() {

  clearUI();

  // you have your data! add logic here to render it to the UI
  // notice in the HTML file we call render();

  allTeamsData.forEach(teamElement => {
    const dummyItemElement = Object.assign(document.createElement("div"), { className: "item" })
    const dummyContentElement = Object.assign(document.createElement("div"), { className: "content" })
    populateContentElementWithData(dummyContentElement, teamElement);
    dummyItemElement.appendChild(dummyContentElement);
    app.appendChild(dummyItemElement);
  }); {
  }
}

const allTeamsData = await getAllTeams();
console.log(allTeamsData);
const allPlayersData = await getAllPlayers();

await renderUI();
