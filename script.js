const state = {
    items: [],
    filteredItems: [],
};

const elements = {
    mediaList: document.querySelector("#media-list"),
    emptyState: document.querySelector("#empty-state"),

    search: document.querySelector("#search"),
    typeFilter: document.querySelector("#type-filter"),
    statusFilter: document.querySelector("#status-filter"),
    sortFilter: document.querySelector("#sort-filter"),

    resultCount: document.querySelector("#result-count"),
    totalCount: document.querySelector("#total-count"),

    clearFilters: document.querySelector("#clear-filters"),
};

/*
|--------------------------------------------------------------------------
| Load data
|--------------------------------------------------------------------------
*/

async function loadData() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        state.items = await response.json();

        state.filteredItems = [...state.items];

        elements.totalCount.textContent = state.items.length;

        render();
    } catch (error) {
        console.error("Failed to load data:", error);

        elements.mediaList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">!</div>

                <h2>Unable to load library</h2>

                <p>
                    Make sure <strong>data.json</strong> exists
                    and the project is running through a local server.
                </p>
            </div>
        `;
    }
}

/*
|--------------------------------------------------------------------------
| Filtering
|--------------------------------------------------------------------------
*/

function filterItems() {
    const search = elements.search.value.trim().toLowerCase();

    const type = elements.typeFilter.value;
    const status = elements.statusFilter.value;

    state.filteredItems = state.items.filter((item) => {
        const searchableText = [
            item.title,
            item.description,
            item.type,
            item.status,
            ...(item.genres ?? []),
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch = search === "" || searchableText.includes(search);

        const matchesType = type === "all" || item.type === type;

        const matchesStatus = status === "all" || item.status === status;

        return matchesSearch && matchesType && matchesStatus;
    });

    sortItems();
}

/*
|--------------------------------------------------------------------------
| Sorting
|--------------------------------------------------------------------------
*/

function sortItems() {
    const sort = elements.sortFilter.value;

    state.filteredItems.sort((a, b) => {
        switch (sort) {
            case "title-asc":
                return a.title.localeCompare(b.title);

            case "title-desc":
                return b.title.localeCompare(a.title);

            case "year-desc":
                return (b.year ?? 0) - (a.year ?? 0);

            case "year-asc":
                return (a.year ?? 0) - (b.year ?? 0);

            case "rating-desc":
                return (b.rating ?? -1) - (a.rating ?? -1);

            case "rating-asc":
                return (a.rating ?? 11) - (b.rating ?? 11);

            default:
                return 0;
        }
    });

    render();
}

/*
|--------------------------------------------------------------------------
| Render
|--------------------------------------------------------------------------
*/

function render() {
    elements.resultCount.textContent = state.filteredItems.length;

    if (state.filteredItems.length === 0) {
        elements.mediaList.innerHTML = "";

        elements.emptyState.classList.remove("hidden");

        return;
    }

    elements.emptyState.classList.add("hidden");

    elements.mediaList.innerHTML = state.filteredItems
        .map((item, index) => renderItem(item, index))
        .join("");
}

/*
|--------------------------------------------------------------------------
| Render item
|--------------------------------------------------------------------------
*/

function renderItem(item, index) {
    const rating = item.rating
        ? `
            <div class="rating">
                <span class="star">★</span>
                <span>${item.rating}</span>
            </div>
        `
        : `
            <div class="rating rating-empty">
                <span>—</span>
            </div>
        `;

    const genres = (item.genres ?? [])
        .map((genre) => `<span class="genre">${escapeHtml(genre)}</span>`)
        .join("");

    const statusClass = getStatusClass(item.status);

    return `
        <article class="media-item">

            <div class="media-index">
                ${String(index + 1).padStart(2, "0")}
            </div>


            <div class="media-content">

                <div class="media-main">

                    <div class="title-row">

                        <h2>
                            ${escapeHtml(item.title)}
                        </h2>

                        <span class="year">
                            ${item.year ?? "—"}
                        </span>

                    </div>


                    <div class="meta">

                        <span class="type">
                            ${escapeHtml(item.type)}
                        </span>

                        <span class="dot">•</span>

                        <span class="status ${statusClass}">
                            ${escapeHtml(item.status)}
                        </span>

                    </div>


                    <div class="genres">
                        ${genres}
                    </div>


                    ${
                        item.description
                            ? `
                                <p class="description">
                                    ${escapeHtml(item.description)}
                                </p>
                            `
                            : ""
                    }

                </div>


                <div class="media-rating">
                    ${rating}
                </div>

            </div>

        </article>
    `;
}

/*
|--------------------------------------------------------------------------
| Status classes
|--------------------------------------------------------------------------
*/

function getStatusClass(status) {
    switch (status) {
        case "Watched":
            return "status-watched";

        case "Watching":
            return "status-watching";

        case "Will Watch":
            return "status-will-watch";

        case "Waiting":
            return "status-waiting";

        default:
            return "";
    }
}

/*
|--------------------------------------------------------------------------
| Clear filters
|--------------------------------------------------------------------------
*/

function clearFilters() {
    elements.search.value = "";

    elements.typeFilter.value = "all";

    elements.statusFilter.value = "all";

    elements.sortFilter.value = "title-asc";

    filterItems();
}

/*
|--------------------------------------------------------------------------
| HTML escaping
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

elements.search.addEventListener("input", filterItems);

elements.typeFilter.addEventListener("change", filterItems);

elements.statusFilter.addEventListener("change", filterItems);

elements.sortFilter.addEventListener("change", filterItems);

elements.clearFilters.addEventListener("click", clearFilters);

/*
|--------------------------------------------------------------------------
| Start application
|--------------------------------------------------------------------------
*/

loadData();
