//////////////
// we have a basic skeleton here to help you start.
// if you dont want to use it you dont have to -
// just clear the file and start from scratch
//////////////

// notice in our html we have a node with ID "app"
// hint: use this reference later to inject data into your page
const app = document.getElementById('app');

async function getData() {
  // write you logic for getting the data from the API here
  // return your data from this function
  const data = null;
  return data;
}

function clearUI() {
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
}

async function renderUI(data) {

  clearUI();

  // you have your data! add logic here to render it to the UI
  // notice in the HTML file we call render();
  const dummyItemElement = Object.assign(document.createElement("div"), { className: "item" })
  const dummyContentElement = Object.assign(document.createElement("div"), { className: "content" })
  dummyContentElement.innerHTML = "hey";
  dummyItemElement.appendChild(dummyContentElement);
  app.appendChild(dummyItemElement);
}

const data = await getData();

await renderUI(data);
