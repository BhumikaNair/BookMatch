// Minimal BookFinder App
class BookFinder {
  constructor() {
    this.searchTimeout = null;
    this.searchHistory =
      JSON.parse(localStorage.getItem("searchHistory")) || [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialData();
    this.applyTheme();
    this.renderHistory();
  }

  bindEvents() {
    const searchInput = document.getElementById("bookSearch");
    searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
    searchInput.addEventListener("keydown", (e) => this.handleSearchKeydown(e));

    document.addEventListener("click", (e) => {
      const suggestions = document.getElementById("searchSuggestions");
      if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    document
      .getElementById("themeToggle")
      .addEventListener("click", () => this.toggleTheme());
    document
      .getElementById("historyToggle")
      .addEventListener("click", () => this.toggleHistory());
    document
      .getElementById("closeHistory")
      .addEventListener("click", () => this.closeHistory());
    document
      .getElementById("sidebarOverlay")
      .addEventListener("click", () => this.closeHistory());
    document
      .getElementById("clearHistory")
      .addEventListener("click", () => this.clearHistory());
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());

    document.getElementById("bookModal").addEventListener("click", (e) => {
      if (e.target.id === "bookModal") this.closeModal();
    });
  }

  async loadInitialData() {
    try {
      const response = await fetch("/api/popular");
      const data = await response.json();
      this.renderBooks(data.books, "popularBooksList");
    } catch (error) {
      console.error("Error loading books:", error);
    }
  }

  async handleSearch(query) {
    clearTimeout(this.searchTimeout);

    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        this.renderSuggestions(data.books);
        this.showSuggestions();
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);
  }

  renderSuggestions(books) {
    const container = document.getElementById("searchSuggestions");

    if (books.length === 0) {
      container.innerHTML =
        '<div class="p-3 text-gray-500 dark:text-gray-400 text-sm">No books found</div>';
      return;
    }

    container.innerHTML = books
      .slice(0, 8)
      .map(
        (book) => `
            <div class="search-suggestion" data-book-title="${book.title}">
                <div class="flex items-center gap-3">
                    <img src="${book.image_url}" alt="${book.title}" class="w-8 h-12 object-cover rounded" onerror="this.src='/static/images/placeholder.png'" onload="if(this.naturalWidth<10||this.naturalHeight<10){this.src='/static/images/placeholder.png'}">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate">${book.title}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${book.author}</p>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    container.querySelectorAll(".search-suggestion").forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const bookTitle = suggestion.dataset.bookTitle;
        this.selectBook(bookTitle);
      });
    });
  }

  async selectBook(bookTitle) {
    this.hideSuggestions();
    document.getElementById("bookSearch").value = bookTitle;
    this.addToHistory(bookTitle);
    await this.getRecommendations(bookTitle);
  }

  async getRecommendations(bookTitle) {
    this.showLoading();

    try {
      const response = await fetch(
        `/api/recommend?book=${encodeURIComponent(bookTitle)}`
      );
      const data = await response.json();

      if (response.ok) {
        this.renderSelectedBook(data.input_book);
        this.renderBooks(data.recommendations, "recommendationsList");
        this.hidePopular();
        this.showToast("Recommendations loaded!");
      } else {
        throw new Error(data.error || "Failed to get recommendations");
      }
    } catch (error) {
      this.showToast(error.message, "error");
      this.showPopular();
    } finally {
      this.hideLoading();
    }
  }

  renderSelectedBook(book) {
    const container = document.getElementById("selectedBookInfo");
    container.innerHTML = `
            <img src="${book.image_url}" alt="${book.title}" class="w-12 h-18 object-cover rounded" onerror="this.src='/static/images/placeholder.png'" onload="if(this.naturalWidth<10||this.naturalHeight<10){this.src='/static/images/placeholder.png'}">
            <div>
                <p class="font-medium text-sm">${book.title}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">${book.author}</p>
            </div>
        `;
    container.classList.remove("hidden");
  }

  renderBooks(books, containerId) {
    const container = document.getElementById(containerId);

    container.innerHTML = books
      .map(
        (book) => `
            <div class="book-card" data-book='${JSON.stringify(book)}'>
                <img src="${book.image_url}" 
                     alt="${book.title}" 
                     class="book-image w-full"
                     onerror="this.src='/static/images/placeholder.png'"
                     onload="if(this.naturalWidth<10||this.naturalHeight<10){this.src='/static/images/placeholder.png'}">
                <div class="p-3">
                    <p class="font-medium text-sm leading-tight mb-1 line-clamp-2">${
                      book.title
                    }</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">${
                      book.author
                    }</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">${
                      book.year
                    }</p>
                </div>
            </div>
        `
      )
      .join("");

    container.querySelectorAll(".book-card").forEach((card) => {
      card.addEventListener("click", () => {
        const book = JSON.parse(card.dataset.book);
        this.showBookModal(book);
      });
    });
  }

  showBookModal(book) {
    const content = document.getElementById("modalContent");
    content.innerHTML = `
            <div class="flex gap-4 mb-4">
                <img src="${book.image_url}" alt="${
      book.title
    }" class="w-20 h-30 object-cover rounded" onerror="this.src='/static/images/placeholder.png'" onload="if(this.naturalWidth<10||this.naturalHeight<10){this.src='/static/images/placeholder.png'}">
                <div class="flex-1">
                    <h4 class="font-medium mb-2">${book.title}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">by ${
                      book.author
                    }</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">${
                      book.publisher
                    }</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500">${
                      book.year
                    }</p>
                </div>
            </div>
            <div class="flex gap-3">
                <button onclick="bookFinder.getRecommendationsAndClose('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')" 
                        class="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm rounded-md transition-colors">
                    Get Recommendations
                </button>
                <button onclick="bookFinder.searchBookOnGoogle('${book.title.replace(
                  /'/g,
                  "\\'"
                )}', '${book.author.replace(/'/g, "\\'")}')"
                        class="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center"
                        title="Search on Google">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </div>
        `;
    document.getElementById("bookModal").classList.remove("hidden");
  }

  closeModal() {
    document.getElementById("bookModal").classList.add("hidden");
  }

  async getRecommendationsAndClose(bookTitle) {
    // Close the modal first
    this.closeModal();

    // Then get recommendations
    await this.getRecommendations(bookTitle);
  }

  searchBookOnGoogle(bookTitle, bookAuthor) {
    // Create a Google search query for the book
    const searchQuery = `"${bookTitle}" "${bookAuthor}" book`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      searchQuery
    )}`;

    // Open Google search in a new tab
    window.open(googleSearchUrl, "_blank");

    // Show a toast notification
    this.showToast(`Searching for "${bookTitle}" on Google`, "info");
  }

  addToHistory(bookTitle) {
    const item = {
      title: bookTitle,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };

    this.searchHistory = this.searchHistory.filter(
      (h) => h.title !== bookTitle
    );
    this.searchHistory.unshift(item);

    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }

    localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    this.renderHistory();
  }

  renderHistory() {
    const container = document.getElementById("historyList");

    if (this.searchHistory.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 text-sm">No recent searches</p>';
      return;
    }

    container.innerHTML = this.searchHistory
      .map(
        (item) => `
            <div class="history-item" data-book-title="${item.title}">
                <p class="text-sm font-medium truncate">${item.title}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatDate(
                  item.timestamp
                )}</p>
            </div>
        `
      )
      .join("");

    container.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", () => {
        const title = item.dataset.bookTitle;
        this.selectBook(title);
        this.closeHistory();
      });
    });
  }

  clearHistory() {
    this.searchHistory = [];
    localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    this.renderHistory();
    this.showToast("History cleared");
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    this.updateThemeIcon(isDark);
  }

  updateThemeIcon(isDark) {
    const themeToggle = document.getElementById("themeToggle");
    const iconSVG = isDark
      ? // Moon icon for light mode
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>`
      : // Sun icon for dark mode
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`;
    themeToggle.innerHTML = iconSVG;
  }

  applyTheme() {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = saved === "dark" || (saved === null && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
    this.updateThemeIcon(isDark);
  }

  async goHome() {
    // Reset to home state
    document.getElementById("bookSearch").value = "";
    document.getElementById("selectedBookInfo").classList.add("hidden");
    document.getElementById("recommendationsList").innerHTML = "";
    this.hideSuggestions();
    this.hideLoading();

    // Reload random popular books
    await this.loadInitialData();
    this.showPopular();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  toggleHistory() {
    const sidebar = document.getElementById("historySidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const isOpen = !sidebar.classList.contains("translate-x-full");

    if (isOpen) {
      this.closeHistory();
    } else {
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("hidden");
    }
  }

  closeHistory() {
    document.getElementById("historySidebar").classList.add("translate-x-full");
    document.getElementById("sidebarOverlay").classList.add("hidden");
  }

  showSuggestions() {
    document.getElementById("searchSuggestions").classList.remove("hidden");
  }

  hideSuggestions() {
    document.getElementById("searchSuggestions").classList.add("hidden");
  }

  showLoading() {
    document.getElementById("loadingIndicator").classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loadingIndicator").classList.add("hidden");
  }

  showPopular() {
    document.getElementById("popularBooksSection").classList.remove("hidden");
  }

  hidePopular() {
    document.getElementById("popularBooksSection").classList.add("hidden");
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  handleSearchKeydown(e) {
    const suggestions = document.querySelectorAll(".search-suggestion");
    let current = Array.from(suggestions).findIndex((s) =>
      s.classList.contains("bg-gray-50")
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      current = (current + 1) % suggestions.length;
      this.highlightSuggestion(suggestions, current);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      current = current <= 0 ? suggestions.length - 1 : current - 1;
      this.highlightSuggestion(suggestions, current);
    } else if (e.key === "Enter" && current >= 0 && suggestions[current]) {
      e.preventDefault();
      const title = suggestions[current].dataset.bookTitle;
      this.selectBook(title);
    } else if (e.key === "Escape") {
      this.hideSuggestions();
    }
  }

  highlightSuggestion(suggestions, index) {
    suggestions.forEach((s, i) => {
      s.classList.toggle("bg-gray-50", i === index);
      s.classList.toggle("dark:bg-gray-800", i === index);
    });
  }
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  window.bookFinder = new BookFinder();
});
