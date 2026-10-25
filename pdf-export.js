"use strict";

const PDF_EXPORT_CONFIG = {
    dataUrl: "data.json",
    placeholderImage: "assets/images/placeholder.jpg",
};

const PDF_EXPORT_LABELS = {
    types: {
        Movie: "Movie",
        Series: "Series",
        Anime: "Anime",
        "TV Show": "TV Show",
    },

    statuses: {
        watched: "Watched",
        watching: "Watching",
        "will watch": "Will Watch",
        willwatch: "Will Watch",
        waiting: "Waiting",
    },
};

document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("#export-pdf-button");

    if (!button) {
        return;
    }

    button.addEventListener("click", exportCollectionToPdf);
});

async function exportCollectionToPdf() {
    const button = document.querySelector("#export-pdf-button");

    if (button.disabled) {
        return;
    }

    // Відкриваємо вікно безпосередньо під час кліку,
    // щоб браузер не заблокував його.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert(
            "The browser blocked a new window. " +
                "Allow pop-ups for CineMemo Lite " +
                "and try again.",
        );

        return;
    }

    button.disabled = true;
    button.textContent = "Formation PDF...";

    try {
        const response = await fetch(PDF_EXPORT_CONFIG.dataUrl, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(
                `Failed to load data.json: HTTP ${response.status}`,
            );
        }

        const items = await response.json();

        if (!Array.isArray(items)) {
            throw new Error("data.json must contain an array of records.");
        }

        // Експортуємо всі записи, а не відфільтрований список.
        const collection = [...items].sort((a, b) =>
            String(a.title ?? "").localeCompare(String(b.title ?? ""), "uk", {
                sensitivity: "base",
            }),
        );

        printWindow.document.open();
        printWindow.document.write(createPdfDocument(collection));
        printWindow.document.close();

        await waitForImages(printWindow);

        printWindow.focus();
        printWindow.print();
    } catch (error) {
        console.error("CineMemo Lite PDF export:", error);

        if (!printWindow.closed) {
            printWindow.close();
        }

        alert(
            "Failed to create the catalog PDF.\n\n" +
                (error.message || "Unknown error."),
        );
    } finally {
        button.disabled = false;
        button.textContent = "Export to PDF";
    }
}

function createPdfDocument(items) {
    const exportDate = new Date().toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const baseUrl = new URL(".", window.location.href).href;

    const cards = items
        .map((item, index) => {
            const title = escapePdfHtml(item.title || "Untitled");

            const originalTitle = item.original_title
                ? escapePdfHtml(item.original_title)
                : "";

            const image = escapePdfHtml(getPdfImage(item.image));
            const type = escapePdfHtml(getPdfType(item.type));
            const status = escapePdfHtml(getPdfStatus(item.status));

            const year = item.year ? escapePdfHtml(item.year) : "";

            const rating =
                item.rating !== null &&
                item.rating !== undefined &&
                item.rating !== ""
                    ? `<span class="rating">★ ${escapePdfHtml(item.rating)}</span>`
                    : "";

            const genres = Array.isArray(item.genres)
                ? item.genres
                      .filter(Boolean)
                      .map(
                          (genre) =>
                              `<span class="genre">${escapePdfHtml(genre)}</span>`,
                      )
                      .join("")
                : "";

            const description = item.description
                ? `<p class="description">${escapePdfHtml(item.description)}</p>`
                : "";

            return `
            <article class="media-card">
                <div class="poster-wrapper">
                    <img
                        class="poster"
                        src="${image}"
                        alt="Постер: ${title}"
                    >
                </div>

                <div class="card-content">
                    <div class="card-index">№ ${index + 1}</div>

                    <h2 class="title">${title}</h2>

                    ${
                        originalTitle && originalTitle !== title
                            ? `<p class="original-title">${originalTitle}</p>`
                            : ""
                    }

                    <div class="metadata">
                        ${type ? `<span>${type}</span>` : ""}
                        ${year ? `<span>${year}</span>` : ""}
                    </div>

                    ${status ? `<div class="status">${status}</div>` : ""}
                    ${rating}
                    ${genres ? `<div class="genres">${genres}</div>` : ""}
                    ${description}
                </div>
            </article>
        `;
        })
        .join("");

    return `<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <base href="${escapePdfHtml(baseUrl)}">

    <title>Catalog CineMemo Lite</title>

    <style>
        @page {
            size: A4;
            margin: 12mm;
        }

        * {
            box-sizing: border-box;
        }

        html {
            color: #222;
            background: #fff;
            font-family: "Noto Sans", "DejaVu Sans", Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.4;
        }

        body {
            margin: 0;
        }

        .catalog-header {
            margin-bottom: 8mm;
            padding-bottom: 5mm;
            border-bottom: 2px solid #9b6cff;
        }

        .brand {
            margin: 0 0 2mm;
            font-size: 23pt;
            font-weight: 800;
            letter-spacing: -0.5pt;
        }

        .brand span {
            color: #9b6cff;
        }

        .subtitle {
            margin: 0 0 3mm;
            color: #555;
            font-size: 11pt;
        }

        .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 4mm;
            color: #555;
            font-size: 9pt;
        }

        .summary strong {
            color: #222;
        }

        .catalog-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 5mm 4mm;
            align-items: start;
        }

        .media-card {
            min-width: 0;
            overflow: hidden;
            border: 1px solid #ddd;
            border-radius: 2mm;
            background: #fff;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .poster-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 48mm;
            overflow: hidden;
            background: #f1eff5;
            border-bottom: 1px solid #e5e1eb;
        }

        .poster {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .card-content {
            padding: 2.5mm;
            overflow-wrap: anywhere;
        }

        .card-index {
            margin-bottom: 1mm;
            color: #777;
            font-size: 7pt;
        }

        .title {
            margin: 0 0 1.5mm;
            color: #21192e;
            font-size: 10pt;
            font-weight: 700;
            line-height: 1.3;
        }

        .original-title {
            margin: 0 0 1.5mm;
            color: #666;
            font-size: 7.5pt;
        }

        .metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 1mm 2mm;
            margin-bottom: 1.5mm;
            color: #555;
            font-size: 7.5pt;
        }

        .status {
            display: inline-block;
            margin-bottom: 1.5mm;
            padding: 1mm 1.5mm;
            border: 1px solid #ddd;
            border-radius: 2mm;
            color: #4f327c;
            background: #f4efff;
            font-size: 7pt;
            font-weight: 600;
        }

        .rating {
            display: block;
            margin-bottom: 1.5mm;
            color: #805d13;
            font-size: 8pt;
            font-weight: 700;
        }

        .genres {
            display: flex;
            flex-wrap: wrap;
            gap: 1mm;
            margin-bottom: 1.5mm;
        }

        .genre {
            display: inline-block;
            padding: 0.5mm 1mm;
            border: 1px solid #e1dbea;
            border-radius: 1mm;
            color: #555;
            font-size: 6.5pt;
        }

        .description {
            display: -webkit-box;
            margin: 1.5mm 0 0;
            overflow: hidden;
            color: #555;
            font-size: 7pt;
            line-height: 1.4;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 5;
        }

        .empty {
            padding: 15mm 0;
            color: #666;
            text-align: center;
        }

        @media screen {
            body {
                max-width: 210mm;
                min-height: 297mm;
                margin: 12mm auto;
                padding: 12mm;
                box-shadow: 0 0 10px #ccc;
            }
        }

        @media print {
            .catalog-header {
                break-after: avoid;
            }

            .media-card {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
    <header class="catalog-header">
        <h1 class="brand">CineMemo <span>Lite</span></h1>

        <p class="subtitle">
            Catalog of movies, TV series and anime
        </p>

        <div class="summary">
            <span>
                Entries: <strong>${items.length}</strong>
            </span>

            <span>
                Export date:
                <strong>${escapePdfHtml(exportDate)}</strong>
            </span>
        </div>
    </header>

    ${
        items.length
            ? `<main class="catalog-grid">${cards}</main>`
            : `<p class="empty">The collection is currently empty..</p>`
    }

    <script>
        (() => {
            const fallback = ${JSON.stringify(PDF_EXPORT_CONFIG.placeholderImage)};

            document.querySelectorAll(".poster").forEach(image => {
                image.addEventListener("error", () => {
                    if (image.dataset.fallbackAttempted) {
                        return;
                    }

                    image.dataset.fallbackAttempted = "1";
                    image.src = fallback;
                });
            });
        })();
    </script>
</body>
</html>`;
}

function getPdfImage(image) {
    return typeof image === "string" && image.trim()
        ? image.trim()
        : PDF_EXPORT_CONFIG.placeholderImage;
}

function getPdfType(type) {
    return type ? PDF_EXPORT_LABELS.types[type] || type : "";
}

function getPdfStatus(status) {
    if (!status) {
        return "";
    }

    const normalized = String(status)
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    return PDF_EXPORT_LABELS.statuses[normalized] || status;
}

function escapePdfHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
}

async function waitForImages(printWindow) {
    const images = Array.from(printWindow.document.images);

    await Promise.all(
        images.map((image) => {
            if (image.complete && image.naturalWidth > 0) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                let finished = false;

                const finish = () => {
                    if (finished) {
                        return;
                    }

                    finished = true;
                    resolve();
                };

                image.addEventListener("load", finish, { once: true });
                image.addEventListener("error", finish, { once: true });

                // Не чекаємо нескінченно на недоступний постер.
                setTimeout(finish, 8000);
            });
        }),
    );
}
