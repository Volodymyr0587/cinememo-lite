const PLACEHOLDER_IMAGE = "assets/images/placeholder.jpg";

const state = {
    items: [],
    filteredItems: [],
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#show-page")) {
        initShowPage();

        return;
    }

    if (document.querySelector("#media-list")) {
        initLibraryPage();
    }
});

/*
|--------------------------------------------------------------------------
| Shared
|--------------------------------------------------------------------------
*/

async function loadData() {
    const response = await fetch("data.json");

    if (!response.ok) {
        throw new Error("Failed to load data.json");
    }

    return response.json();
}

function getImage(image) {
    return image && image.trim() ? image : PLACEHOLDER_IMAGE;
}

function getStatusClass(status) {
    return String(status).toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

/*
|--------------------------------------------------------------------------
| Library page
|--------------------------------------------------------------------------
*/

async function initLibraryPage() {
    const elements = {
        search: document.querySelector("#search"),
        typeFilter: document.querySelector("#type-filter"),
        statusFilter: document.querySelector("#status-filter"),
        sortFilter: document.querySelector("#sort-filter"),
        clearFilters: document.querySelector("#clear-filters"),

        resultCount: document.querySelector("#result-count"),
        resultTotal: document.querySelector("#result-total"),
        totalCount: document.querySelector("#total-count"),

        mediaList: document.querySelector("#media-list"),
        emptyState: document.querySelector("#empty-state"),
    };

    try {
        state.items = await loadData();
        state.filteredItems = [...state.items];

        elements.totalCount.textContent = state.items.length;
        elements.resultTotal.textContent = state.items.length;

        sortItems(elements);
        renderLibrary(elements);

        elements.search.addEventListener("input", () => {
            filterItems(elements);
        });

        elements.typeFilter.addEventListener("change", () => {
            filterItems(elements);
        });

        elements.statusFilter.addEventListener("change", () => {
            filterItems(elements);
        });

        elements.sortFilter.addEventListener("change", () => {
            filterItems(elements);
        });

        elements.clearFilters.addEventListener("click", () => {
            clearFilters(elements);
        });
    } catch (error) {
        console.error(error);

        elements.mediaList.innerHTML = `
            <div class="error-message">
                Failed to load library.
            </div>
        `;
    }
}

function filterItems(elements) {
    const searchTerm = elements.search.value.trim().toLowerCase();

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

        const matchesSearch =
            !searchTerm || searchableText.includes(searchTerm);

        const matchesType = !type || item.type === type;

        const matchesStatus = !status || item.status === status;

        return matchesSearch && matchesType && matchesStatus;
    });

    sortItems(elements);
    renderLibrary(elements);
}

function sortItems(elements) {
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
}

function renderLibrary(elements) {
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

function renderItem(item, index) {
    const image = getImage(item.image);

    const genres = (item.genres ?? [])
        .map(
            (genre) => `
            <span class="genre">
                ${escapeHtml(genre)}
            </span>
        `,
        )
        .join("");

    const rating =
        item.rating !== null && item.rating !== undefined
            ? `
                <span class="rating">
                    ★ ${escapeHtml(item.rating)}
                </span>
            `
            : "";

    return `
        <article class="media-item">

            <div class="media-index">
                ${index + 1}
            </div>


            <a
                href="show.html?id=${encodeURIComponent(item.id)}"
                class="media-poster-link"
                aria-label="Open ${escapeHtml(item.title)}"
            >

                <img
                    class="media-poster"
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(item.title)} poster"
                    loading="lazy"
                    onerror="
                        this.onerror = null;
                        this.src = '${PLACEHOLDER_IMAGE}';
                    "
                >

            </a>


            <div class="media-content">

                <div class="media-title-row">

                    <h2 class="media-title">

                        <a
                            href="show.html?id=${encodeURIComponent(item.id)}"
                        >
                            ${escapeHtml(item.title)}
                        </a>

                    </h2>


                    <span class="media-year">
                        ${escapeHtml(item.year)}
                    </span>

                </div>


                <div class="media-meta">

                    <span class="media-type">
                        ${escapeHtml(item.type)}
                    </span>


                    <span
                        class="status ${getStatusClass(item.status)}"
                    >
                        ${escapeHtml(item.status)}
                    </span>


                    ${rating}

                </div>


                <div class="genres">
                    ${genres}
                </div>


                <p class="media-description">
                    ${escapeHtml(item.description)}
                </p>

            </div>

        </article>
    `;
}

function clearFilters(elements) {
    elements.search.value = "";
    elements.typeFilter.value = "";
    elements.statusFilter.value = "";
    elements.sortFilter.value = "title-asc";

    state.filteredItems = [...state.items];

    sortItems(elements);
    renderLibrary(elements);
}

/*
|--------------------------------------------------------------------------
| Show page
|--------------------------------------------------------------------------
*/

async function initShowPage() {
    const elements = {
        page: document.querySelector("#show-page"),
        notFound: document.querySelector("#show-not-found"),

        poster: document.querySelector("#show-poster"),
        title: document.querySelector("#show-title"),
        type: document.querySelector("#show-type"),
        year: document.querySelector("#show-year"),
        status: document.querySelector("#show-status"),
        rating: document.querySelector("#show-rating"),
        genres: document.querySelector("#show-genres"),
        description: document.querySelector("#show-description"),
    };

    try {
        const items = await loadData();

        const params = new URLSearchParams(window.location.search);

        const id = params.get("id");

        const item = items.find((item) => String(item.id) === String(id));

        if (!item) {
            showNotFound(elements);

            return;
        }

        renderShow(item, elements);
    } catch (error) {
        console.error(error);

        showNotFound(elements);
    }
}

function renderShow(item, elements) {
    document.title = `${item.title} — CineMemo Lite`;

    elements.poster.src = getImage(item.image);

    elements.poster.alt = `${item.title} poster`;

    elements.poster.onerror = () => {
        elements.poster.onerror = null;
        elements.poster.src = PLACEHOLDER_IMAGE;
    };

    elements.title.textContent = item.title;

    elements.type.textContent = item.type;

    elements.year.textContent = item.year;

    elements.status.textContent = item.status;

    elements.status.className = `status ${getStatusClass(item.status)}`;

    if (item.rating !== null && item.rating !== undefined) {
        elements.rating.innerHTML = `
            <span class="rating-star">★</span>

            <span>
                ${escapeHtml(item.rating)}
            </span>

            <small>/ 10</small>
        `;

        elements.rating.classList.remove("hidden");
    } else {
        elements.rating.innerHTML = "";
        elements.rating.classList.add("hidden");
    }

    elements.genres.innerHTML = (item.genres ?? [])
        .map(
            (genre) => `
                <span class="genre">
                    ${escapeHtml(genre)}
                </span>
            `,
        )
        .join("");

    elements.description.textContent = item.description ?? "";
}

function showNotFound(elements) {
    elements.page.classList.add("hidden");

    elements.notFound.classList.remove("hidden");

    document.title = "Title not found — CineMemo Lite";
}
