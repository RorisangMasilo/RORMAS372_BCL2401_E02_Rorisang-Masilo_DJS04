import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

export class BookPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.page = 1;
    this.matches = books;

    this.render();
    this.initElements();
    this.addEventListeners();
    this.initializeData();
    customElements.define("book-preview", BookPreview);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --color-dark: 10, 10, 20;
          --color-light: 255, 255, 255;
        }
        .preview {
          display: flex;
          align-items: center;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          margin: 10px 0;
        }
        .preview__image {
          width: 100px;
          height: 150px;
          object-fit: cover;
        }
        .preview__info {
          padding-left: 10px;
        }
        .preview__title {
          font-size: 1.2em;
          margin: 0;
        }
        .preview__author {
          color: grey;
        }
        /* Additional styles here */
      </style>
      <div id="list">
        <div id="items"></div>
        <button id="list-button">Show more</button>
      </div>
      <dialog id="active">
        <img id="list-blur" />
        <img id="list-image" />
        <h2 id="list-title"></h2>
        <p id="list-subtitle"></p>
        <p id="list-description"></p>
        <button id="list-close">Close</button>
      </dialog>
      <dialog id="search-overlay">
        <form id="search-form">
          <input id="search-title" name="title" placeholder="Search by title">
          <select id="search-authors" name="author"></select>
          <select id="search-genres" name="genre"></select>
          <button type="submit">Search</button>
          <button type="button" id="search-cancel">Cancel</button>
        </form>
      </dialog>
      <dialog id="settings-overlay">
        <form id="settings-form">
          <label>
            Theme:
            <select name="theme">
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </label>
          <button type="submit">Save</button>
          <button type="button" id="settings-cancel">Cancel</button>
        </form>
      </dialog>
    `;
  }

  initElements() {
    this.listItems = this.shadowRoot.querySelector("#items");
    this.listButton = this.shadowRoot.querySelector("#list-button");
    this.listActive = this.shadowRoot.querySelector("#active");
    this.listClose = this.shadowRoot.querySelector("#list-close");
    this.listBlur = this.shadowRoot.querySelector("#list-blur");
    this.listImage = this.shadowRoot.querySelector("#list-image");
    this.listTitle = this.shadowRoot.querySelector("#list-title");
    this.listSubtitle = this.shadowRoot.querySelector("#list-subtitle");
    this.listDescription = this.shadowRoot.querySelector("#list-description");
    this.searchOverlay = this.shadowRoot.querySelector("#search-overlay");
    this.searchForm = this.shadowRoot.querySelector("#search-form");
    this.searchTitle = this.shadowRoot.querySelector("#search-title");
    this.searchAuthors = this.shadowRoot.querySelector("#search-authors");
    this.searchGenres = this.shadowRoot.querySelector("#search-genres");
    this.searchCancel = this.shadowRoot.querySelector("#search-cancel");
    this.settingsOverlay = this.shadowRoot.querySelector("#settings-overlay");
    this.settingsForm = this.shadowRoot.querySelector("#settings-form");
    this.settingsCancel = this.shadowRoot.querySelector("#settings-cancel");
  }

  addEventListeners() {
    this.listButton.addEventListener("click", this.handleShowMore.bind(this));
    this.listItems.addEventListener(
      "click",
      this.handleListItemClick.bind(this)
    );
    this.listClose.addEventListener("click", () =>
      this.closeOverlay(this.listActive)
    );
    this.searchCancel.addEventListener("click", () =>
      this.closeOverlay(this.searchOverlay)
    );
    this.settingsCancel.addEventListener("click", () =>
      this.closeOverlay(this.settingsOverlay)
    );
    this.searchForm.addEventListener(
      "submit",
      this.handleSubmitSearch.bind(this)
    );
    this.settingsForm.addEventListener(
      "submit",
      this.handleSubmitSettings.bind(this)
    );
  }

  initializeData() {
    this.createOptions(genres, "All Genres", this.searchGenres);
    this.createOptions(authors, "All Authors", this.searchAuthors);
    this.applyTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "night"
        : "day"
    );
    this.createBookPreviews(this.matches.slice(0, BOOKS_PER_PAGE));
    this.updateShowMoreButton();
  }

  createBookPreviews(books) {
    const fragment = document.createDocumentFragment();
    books.forEach(({ author, id, image, title }) => {
      const element = document.createElement("button");
      element.classList.add("preview");
      element.setAttribute("data-preview", id);
      element.innerHTML = `
        <img class="preview__image" src="${image}" />
        <div class="preview__info">
          <h3 class="preview__title">${title}</h3>
          <div class="preview__author">${authors[author]}</div>
        </div>
      `;
      fragment.appendChild(element);
    });
    this.listItems.appendChild(fragment);
  }

  createOptions(options, defaultOption, container) {
    const fragment = document.createDocumentFragment();
    const firstOption = document.createElement("option");
    firstOption.value = "any";
    firstOption.innerText = defaultOption;
    fragment.appendChild(firstOption);
    Object.entries(options).forEach(([id, name]) => {
      const element = document.createElement("option");
      element.value = id;
      element.innerText = name;
      fragment.appendChild(element);
    });
    container.appendChild(fragment);
  }

  applyTheme(theme) {
    const isNight = theme === "night";
    this.shadowRoot.host.style.setProperty(
      "--color-dark",
      isNight ? "255, 255, 255" : "10, 10, 20"
    );
    this.shadowRoot.host.style.setProperty(
      "--color-light",
      isNight ? "10, 10, 20" : "255, 255, 255"
    );
  }

  updateShowMoreButton() {
    const remainingBooks = this.matches.length - this.page * BOOKS_PER_PAGE;
    this.listButton.innerText = `Show more (${remainingBooks})`;
    this.listButton.disabled = remainingBooks <= 0;
  }

  closeOverlay(overlay) {
    overlay.close();
  }

  openOverlay(overlay, focusElement = null) {
    overlay.showModal();
    if (focusElement) this.shadowRoot.querySelector(focusElement).focus();
  }

  applySearchFilters(filters) {
    return books.filter((book) => {
      const titleMatch =
        filters.title.trim() === "" ||
        book.title.toLowerCase().includes(filters.title.toLowerCase());
      const authorMatch =
        filters.author === "any" || book.author === filters.author;
      const genreMatch =
        filters.genre === "any" || book.genres.includes(filters.genre);
      return titleMatch && authorMatch && genreMatch;
    });
  }

  handleShowMore() {
    this.createBookPreviews(
      this.matches.slice(
        this.page * BOOKS_PER_PAGE,
        (this.page + 1) * BOOKS_PER_PAGE
      )
    );
    this.page += 1;
    this.updateShowMoreButton();
  }

  handleListItemClick(event) {
    const pathArray = Array.from(event.composedPath());
    const active = pathArray.find((node) => node?.dataset?.preview);
    if (active) {
      const book = books.find((book) => book.id === active.dataset.preview);
      if (book) {
        this.listActive.showModal();
        this.listBlur.src = book.image;
        this.listImage.src = book.image;
        this.listTitle.innerText = book.title;
        this.listSubtitle.innerText = `${authors[book.author]} (${new Date(
          book.published
        ).getFullYear()})`;
        this.listDescription.innerText = book.description;
      }
    }
  }

  handleSubmitSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    this.matches = this.applySearchFilters(filters);
    this.page = 1;
    this.listItems.innerHTML = "";
    this.createBookPreviews(this.matches.slice(0, BOOKS_PER_PAGE));
    this.updateShowMoreButton();
    this.closeOverlay(this.searchOverlay);
  }

  handleSubmitSettings(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    this.applyTheme(theme);
    this.closeOverlay(this.settingsOverlay);
  }
}

customElements.define("book-preview", BookPreview);
