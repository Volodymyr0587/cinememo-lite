"use strict";

/* ==========================================================================
   Configuration
   ========================================================================== */

const API_URL = "/api/content";
const PLACEHOLDER_IMAGE = "/assets/images/placeholder.jpg";

/* ==========================================================================
   State
   ========================================================================== */

let contentItems = [];
let editingId = null;
let deletingId = null;
let toastTimeout = null;

/* ==========================================================================
   DOM
   ========================================================================== */

const contentList = document.querySelector("#content-list");

const searchInput = document.querySelector("#search-input");
const typeFilter = document.querySelector("#type-filter");
const statusFilter = document.querySelector("#status-filter");

const resultCount = document.querySelector("#result-count");

const totalCount = document.querySelector("#total-count");
const movieCount = document.querySelector("#movie-count");
const seriesCount = document.querySelector("#series-count");
const animeCount = document.querySelector("#anime-count");
const watchedCount = document.querySelector("#watched-count");

const addContentButton = document.querySelector("#add-content-button");

const contentModal = document.querySelector("#content-modal");

const contentForm = document.querySelector("#content-form");

const modalTitle = document.querySelector("#modal-title");

const modalDescription = document.querySelector("#modal-description");

const modalClose = document.querySelector("#modal-close");

const cancelButton = document.querySelector("#cancel-button");

const saveButton = document.querySelector("#save-button");

const contentIdInput = document.querySelector("#content-id");

const titleInput = document.querySelector("#title");

const typeInput = document.querySelector("#type");

const yearInput = document.querySelector("#year");

const statusInput = document.querySelector("#status");

const genresInput = document.querySelector("#genres");

const imageInput = document.querySelector("#image");

const descriptionInput = document.querySelector("#description");

const posterPreview = document.querySelector("#poster-preview");

/* Delete modal */

const deleteModal = document.querySelector("#delete-modal");

const deleteModalClose = document.querySelector("#delete-modal-close");

const deleteCancelButton = document.querySelector("#delete-cancel-button");

const deleteConfirmButton = document.querySelector("#delete-confirm-button");

const deleteContentTitle = document.querySelector("#delete-content-title");

/* Toast */

const toast = document.querySelector("#toast");

const toastMessage = document.querySelector("#toast-message");

/* ==========================================================================
   Initialization
   ========================================================================== */

document.addEventListener("DOMContentLoaded", loadContent);

/* ==========================================================================
   Load content
   ========================================================================== */

async function loadContent() {
    renderLoading();

    try {
        const response = await fetch(API_URL, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid API response.");
        }

        contentItems = data;

        updateStatistics();
        renderContent();
    } catch (error) {
        console.error(error);

        renderError(
            "Could not load content. Make sure the CineMemo server is running.",
        );

        showToast("Could not load content.", "error");
    }
}

/* ==========================================================================
   Render
   ========================================================================== */

function renderContent() {
    const filteredItems = getFilteredContent();

    updateResultCount(filteredItems.length);

    if (filteredItems.length === 0) {
        renderEmpty();

        return;
    }

    contentList.innerHTML = filteredItems.map(renderContentItem).join("");
}

function renderContentItem(item) {
    const title = escapeHtml(item.title || "Untitled");

    const type = escapeHtml(item.type || "Unknown");

    const status = escapeHtml(item.status || "Unknown");

    const year = item.year ? escapeHtml(String(item.year)) : "";

    const description = item.description ? escapeHtml(item.description) : "";

    const image = getImagePath(item.image);

    const genres = Array.isArray(item.genres) ? item.genres : [];

    const genreHtml = genres
        .slice(0, 5)
        .map((genre) => `<span class="genre">${escapeHtml(genre)}</span>`)
        .join("");

    const statusClass = getStatusClass(item.status);

    return `
        <article class="content-item">

            <div class="content-poster">
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                    onerror="this.src='${PLACEHOLDER_IMAGE}'"
                >
            </div>


            <div class="content-info">

                <div class="content-title-row">

                    <h2 class="content-title">
                        ${title}
                    </h2>

                    <span class="badge badge-type">
                        ${type}
                    </span>

                </div>


                <div class="content-meta">

                    ${year ? `<span>${year}</span>` : ""}

                    ${year ? `<span class="meta-separator">·</span>` : ""}

                    <span class="badge ${statusClass}">
                        ${status}
                    </span>

                </div>


                ${
                    genreHtml
                        ? `
                            <div class="genre-list">
                                ${genreHtml}
                            </div>
                        `
                        : ""
                }


                ${
                    description
                        ? `
                            <p class="content-description">
                                ${description}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="content-actions">

                <button
                    type="button"
                    class="action-button"
                    data-action="edit"
                    data-id="${item.id}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="action-button delete"
                    data-action="delete"
                    data-id="${item.id}"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}

function renderLoading() {
    contentList.innerHTML = `
        <div class="loading-state">
            Loading content...
        </div>
    `;
}

function renderEmpty() {
    const hasFilters =
        searchInput.value.trim() !== "" ||
        typeFilter.value !== "" ||
        statusFilter.value !== "";

    contentList.innerHTML = `
        <div class="empty-state">

            <div class="empty-icon">
                ${hasFilters ? "⌕" : "🎬"}
            </div>

            <h2>
                ${hasFilters ? "No content found" : "No content yet"}
            </h2>

            <p>
                ${
                    hasFilters
                        ? "Try changing your search or filters."
                        : "Add your first movie, series or anime."
                }
            </p>

        </div>
    `;
}

function renderError(message) {
    contentList.innerHTML = `
        <div class="empty-state">

            <div class="empty-icon">
                ⚠
            </div>

            <h2>
                Something went wrong
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}

/* ==========================================================================
   Filtering
   ========================================================================== */

function getFilteredContent() {
    const search = searchInput.value.trim().toLowerCase();

    const type = typeFilter.value;
    const status = statusFilter.value;

    return contentItems
        .filter((item) => {
            if (type && item.type !== type) {
                return false;
            }

            if (status && item.status !== status) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchableText = [
                item.title,
                item.description,
                item.type,
                item.status,
                item.year,
                ...(Array.isArray(item.genres) ? item.genres : []),
            ]
                .filter((value) => value !== null && value !== undefined)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(search);
        })
        .sort((a, b) => Number(b.id) - Number(a.id));
}

/* ==========================================================================
   Statistics
   ========================================================================== */

function updateStatistics() {
    totalCount.textContent = contentItems.length;

    movieCount.textContent = countByType("Movie");

    seriesCount.textContent = countByType("Series");

    animeCount.textContent = countByType("Anime");

    watchedCount.textContent = countByStatus("Watched");
}

function countByType(type) {
    return contentItems.filter((item) => item.type === type).length;
}

function countByStatus(status) {
    return contentItems.filter((item) => item.status === status).length;
}

function updateResultCount(count) {
    resultCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
}

/* ==========================================================================
   Add / Edit modal
   ========================================================================== */

function openCreateModal() {
    editingId = null;

    contentForm.reset();

    contentIdInput.value = "";

    modalTitle.textContent = "Add Content";

    modalDescription.textContent = "Add a new movie, series or anime.";

    saveButton.textContent = "Save Content";

    updatePosterPreview("");

    showModal(contentModal);

    titleInput.focus();
}

function openEditModal(id) {
    const item = contentItems.find(
        (content) => Number(content.id) === Number(id),
    );

    if (!item) {
        showToast("Content not found.", "error");

        return;
    }

    editingId = Number(item.id);

    contentIdInput.value = item.id;

    titleInput.value = item.title || "";

    typeInput.value = item.type || "";

    yearInput.value = item.year || "";

    statusInput.value = item.status || "";

    genresInput.value = Array.isArray(item.genres)
        ? item.genres.join(", ")
        : "";

    imageInput.value = item.image || "";

    descriptionInput.value = item.description || "";

    modalTitle.textContent = "Edit Content";

    modalDescription.textContent = "Update the content information.";

    saveButton.textContent = "Save Changes";

    updatePosterPreview(item.image || "");

    showModal(contentModal);

    titleInput.focus();
}

function closeContentModal() {
    hideModal(contentModal);

    editingId = null;
}

/* ==========================================================================
   Save
   ========================================================================== */

async function handleFormSubmit(event) {
    event.preventDefault();

    const content = getFormData();

    if (!content.title) {
        showToast("Title is required.", "error");

        titleInput.focus();

        return;
    }

    if (!content.type) {
        showToast("Please select a type.", "error");

        typeInput.focus();

        return;
    }

    if (!content.status) {
        showToast("Please select a status.", "error");

        statusInput.focus();

        return;
    }

    setSaveButtonLoading(true);

    try {
        const isEditing = editingId !== null;

        const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",

                Accept: "application/json",
            },
            body: JSON.stringify(content),
        });

        const result = await parseResponse(response);

        if (!response.ok) {
            throw new Error(result.error || "Could not save content.");
        }

        if (isEditing) {
            contentItems = contentItems.map((item) =>
                Number(item.id) === editingId ? result : item,
            );

            showToast("Content updated successfully.", "success");
        } else {
            contentItems.push(result);

            showToast("Content added successfully.", "success");
        }

        updateStatistics();
        renderContent();

        closeContentModal();
    } catch (error) {
        console.error(error);

        showToast(error.message || "Could not save content.", "error");
    } finally {
        setSaveButtonLoading(false);
    }
}

function getFormData() {
    const yearValue = yearInput.value.trim();

    const genres = genresInput.value
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean);

    return {
        title: titleInput.value.trim(),

        type: typeInput.value,

        year: yearValue ? Number(yearValue) : null,

        status: statusInput.value,

        image: imageInput.value.trim() || null,

        genres,

        description: descriptionInput.value.trim(),
    };
}

function setSaveButtonLoading(loading) {
    saveButton.disabled = loading;

    saveButton.textContent = loading
        ? "Saving..."
        : editingId !== null
          ? "Save Changes"
          : "Save Content";
}

/* ==========================================================================
   Delete
   ========================================================================== */

function openDeleteModal(id) {
    const item = contentItems.find(
        (content) => Number(content.id) === Number(id),
    );

    if (!item) {
        showToast("Content not found.", "error");

        return;
    }

    deletingId = Number(item.id);

    deleteContentTitle.textContent = item.title || "this content";

    showModal(deleteModal);
}

function closeDeleteModal() {
    hideModal(deleteModal);

    deletingId = null;
}

async function confirmDelete() {
    if (deletingId === null) {
        return;
    }

    deleteConfirmButton.disabled = true;
    deleteConfirmButton.textContent = "Deleting...";

    try {
        const response = await fetch(`${API_URL}/${deletingId}`, {
            method: "DELETE",

            headers: {
                Accept: "application/json",
            },
        });

        const result = await parseResponse(response);

        if (!response.ok) {
            throw new Error(result.error || "Could not delete content.");
        }

        contentItems = contentItems.filter(
            (item) => Number(item.id) !== deletingId,
        );

        updateStatistics();
        renderContent();

        closeDeleteModal();

        showToast("Content deleted successfully.", "success");
    } catch (error) {
        console.error(error);

        showToast(error.message || "Could not delete content.", "error");
    } finally {
        deleteConfirmButton.disabled = false;
        deleteConfirmButton.textContent = "Delete";
    }
}

/* ==========================================================================
   Poster preview
   ========================================================================== */

function updatePosterPreview(image) {
    const imagePath = getImagePath(image);

    posterPreview.src = imagePath;
}

imageInput.addEventListener("input", () => {
    updatePosterPreview(imageInput.value.trim());
});

posterPreview.addEventListener("error", () => {
    posterPreview.src = PLACEHOLDER_IMAGE;
});

/* ==========================================================================
   Modals
   ========================================================================== */

function showModal(modal) {
    modal.hidden = false;

    document.body.style.overflow = "hidden";
}

function hideModal(modal) {
    modal.hidden = true;

    if (contentModal.hidden && deleteModal.hidden) {
        document.body.style.overflow = "";
    }
}

/* ==========================================================================
   Toast
   ========================================================================== */

function showToast(message, type = "success") {
    clearTimeout(toastTimeout);

    toastMessage.textContent = message;

    toast.className = `toast ${type}`;

    toast.hidden = false;

    toastTimeout = setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function getImagePath(image) {
    if (!image) {
        return PLACEHOLDER_IMAGE;
    }

    const imagePath = String(image).trim();

    if (!imagePath) {
        return PLACEHOLDER_IMAGE;
    }

    if (
        imagePath.startsWith("/") ||
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `/${imagePath}`;
}

function getStatusClass(status) {
    switch (status) {
        case "Watched":
            return "badge-watched";

        case "Watching":
            return "badge-watching";

        case "Will Watch":
            return "badge-will-watch";

        case "Waiting":
            return "badge-waiting";

        default:
            return "";
    }
}

async function parseResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            error: text,
        };
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

/* ==========================================================================
   Event listeners
   ========================================================================== */

/* Add */

addContentButton.addEventListener("click", openCreateModal);

/* Search */

searchInput.addEventListener("input", renderContent);

/* Filters */

typeFilter.addEventListener("change", renderContent);

statusFilter.addEventListener("change", renderContent);

/* Content actions */

contentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;

    const id = Number(button.dataset.id);

    if (action === "edit") {
        openEditModal(id);
    }

    if (action === "delete") {
        openDeleteModal(id);
    }
});

/* Content modal */

contentForm.addEventListener("submit", handleFormSubmit);

modalClose.addEventListener("click", closeContentModal);

cancelButton.addEventListener("click", closeContentModal);

/* Delete modal */

deleteModalClose.addEventListener("click", closeDeleteModal);

deleteCancelButton.addEventListener("click", closeDeleteModal);

deleteConfirmButton.addEventListener("click", confirmDelete);

/* Close modal by clicking backdrop */

contentModal.addEventListener("click", (event) => {
    if (event.target === contentModal) {
        closeContentModal();
    }
});

deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

/* Escape */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    if (!contentModal.hidden) {
        closeContentModal();
    }

    if (!deleteModal.hidden) {
        closeDeleteModal();
    }
});
