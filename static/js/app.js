// BookFinder App - Interactive JavaScript functionality
class BookFinder {
  constructor() {
    this.searchTimeout = null;
    this.currentBooks = [];
    this.searchHistory =
      JSON.parse(localStorage.getItem("searchHistory")) || [];
    this.totalRecommendations =
      parseInt(localStorage.getItem("totalRecommendations")) || 0;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialData();
    this.applyTheme();
    this.updateStats();
    this.renderHistory();
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById("bookSearch");
    const searchSuggestions = document.getElementById("searchSuggestions");

    searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
    searchInput.addEventListener("focus", () => this.showSuggestions());
    searchInput.addEventListener("keydown", (e) => this.handleSearchKeydown(e));

    // Click outside to hide suggestions
    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target) &&
        !searchSuggestions.contains(e.target)
      ) {
        this.hideSuggestions();
      }
    });

    // Theme toggle
    document
      .getElementById("themeToggle")
      .addEventListener("click", () => this.toggleTheme());

    // Sidebar toggles
    document
      .getElementById("historyToggle")
      .addEventListener("click", () => this.toggleSidebar("history"));
    document
      .getElementById("closeHistory")
      .addEventListener("click", () => this.closeSidebar("history"));
    document
      .getElementById("sidebarOverlay")
      .addEventListener("click", () => this.closeAllSidebars());

    // History actions
    document
      .getElementById("clearHistory")
      .addEventListener("click", () => this.clearHistory());

    // Modal
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());
    document.getElementById("bookModal").addEventListener("click", (e) => {
      if (e.target.id === "bookModal") this.closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );
  }

  async loadInitialData() {
    try {
      // Load total books count
      const response = await fetch("/api/books");
      const data = await response.json();
      this.currentBooks = data.books;
      document.getElementById("totalBooks").textContent =
        data.total.toLocaleString();

      // Load popular books
      await this.loadPopularBooks();
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.showToast("Error loading data. Please refresh the page.", "error");
    }
  }

  async loadPopularBooks() {
    try {
      const response = await fetch("/api/popular");
      const data = await response.json();
      this.renderBookGrid(data.books, "popularBooksList");
    } catch (error) {
      console.error("Error loading popular books:", error);
      this.showToast("Error loading popular books", "error");
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
        this.renderSearchSuggestions(data.books);
        this.showSuggestions();
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);
  }

  renderSearchSuggestions(books) {
    const container = document.getElementById("searchSuggestions");

    if (books.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-gray-500 dark:text-gray-400">No books found</div>';
      return;
    }

    container.innerHTML = books
      .map(
        (book) => `
            <div class="search-suggestion p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0" 
                 data-book-title="${book.title}">
                <div class="flex items-center space-x-3">
                    <img src="${book.image_url}" alt="${book.title}" class="w-10 h-14 object-cover rounded">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 dark:text-white truncate">${book.title}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${book.author}</p>
                    </div>
                    <i class="fas fa-arrow-right text-gray-400"></i>
                </div>
            </div>
        `
      )
      .join("");

    // Add click handlers to suggestions
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

    // Add to search history
    this.addToHistory(bookTitle);

    // Get recommendations
    await this.getRecommendations(bookTitle);
  }

  async getRecommendations(bookTitle) {
    this.showLoading();
    this.hidePopularBooks();

    try {
      const response = await fetch(
        `/api/recommend?book=${encodeURIComponent(bookTitle)}`
      );
      const data = await response.json();

      if (response.ok) {
        this.renderRecommendations(data);
        this.totalRecommendations++;
        localStorage.setItem("totalRecommendations", this.totalRecommendations);
        this.updateStats();
        this.showToast("Recommendations loaded successfully!", "success");
      } else {
        throw new Error(data.error || "Failed to get recommendations");
      }
    } catch (error) {
      console.error("Recommendation error:", error);
      this.showToast(error.message, "error");
      this.showPopularBooks();
    } finally {
      this.hideLoading();
    }
  }

  renderRecommendations(data) {
    // Show selected book info
    const selectedBookInfo = document.getElementById("selectedBookInfo");
    selectedBookInfo.innerHTML = `
            <div class="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                <img src="${data.input_book.image_url}" alt="${data.input_book.title}" class="w-16 h-24 object-cover rounded">
                <div>
                    <p class="text-lg font-semibold text-gray-800 dark:text-white">${data.input_book.title}</p>
                    <p class="text-gray-600 dark:text-gray-300">${data.input_book.author}</p>
                    <p class="text-sm text-primary-500">Selected for recommendations</p>
                </div>
            </div>
        `;

    // Show recommendations
    this.renderBookGrid(data.recommendations, "recommendationsList");
    document
      .getElementById("recommendationsSection")
      .classList.remove("hidden");

    // Smooth scroll to recommendations
    setTimeout(() => {
      document.getElementById("recommendationsSection").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  renderBookGrid(books, containerId) {
    const container = document.getElementById(containerId);

    container.innerHTML = books
      .map(
        (book) => `
            <div class="book-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer group"
                 data-book='${JSON.stringify(book)}'>
                <div class="relative overflow-hidden">
                    <img src="${book.image_url}" 
                         alt="${book.title}" 
                         class="book-image w-full h-64 object-cover"
                         onerror="this.src='https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover'">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 leading-tight">${
                      book.title
                    }</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">${
                      book.author
                    }</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500 dark:text-gray-400">${
                          book.year
                        }</span>
                        <button class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    // Add click handlers to book cards
    container.querySelectorAll(".book-card").forEach((card) => {
      card.addEventListener("click", () => {
        const book = JSON.parse(card.dataset.book);
        this.showBookDetails(book);
      });
    });

    // Animate cards
    this.animateElements(container.querySelectorAll(".book-card"));
  }

  showBookDetails(book) {
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <img src="${book.image_url}" 
                         alt="${book.title}" 
                         class="w-full h-auto object-cover rounded-lg shadow-lg"
                         onerror="this.src='https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover'">
                </div>
                <div class="md:w-2/3">
                    <h4 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">${
                      book.title
                    }</h4>
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <i class="fas fa-user text-primary-500 w-5"></i>
                            <span class="ml-2 text-gray-700 dark:text-gray-300"><strong>Author:</strong> ${
                              book.author
                            }</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-building text-primary-500 w-5"></i>
                            <span class="ml-2 text-gray-700 dark:text-gray-300"><strong>Publisher:</strong> ${
                              book.publisher
                            }</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-calendar text-primary-500 w-5"></i>
                            <span class="ml-2 text-gray-700 dark:text-gray-300"><strong>Year:</strong> ${
                              book.year
                            }</span>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button onclick="bookFinder.getRecommendationsAndClose('${book.title.replace(
                          /'/g,
                          "\\'"
                        )}')"
                                class="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                            <i class="fas fa-magic"></i>
                            <span>Get Recommendations</span>
                        </button>
                        <button onclick="bookFinder.searchBookOnGoogle('${book.title.replace(
                          /'/g,
                          "\\'"
                        )}', '${book.author.replace(/'/g, "\\'")}')"
                                class="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fab fa-google"></i>
                            <span>Google It</span>
                        </button>
                    </div>
                </div>
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
    const historyItem = {
      title: bookTitle,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };

    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(
      (item) => item.title !== bookTitle
    );

    // Add to beginning
    this.searchHistory.unshift(historyItem);

    // Limit to 50 items
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

    localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    this.renderHistory();
  }

  renderHistory() {
    const container = document.getElementById("historyList");

    if (this.searchHistory.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No search history yet</p>';
      return;
    }

    container.innerHTML = this.searchHistory
      .map(
        (item) => `
            <div class="history-item p-3 rounded-lg cursor-pointer" data-book-title="${
              item.title
            }">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 dark:text-white truncate">${
                          item.title
                        }</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${this.formatDate(
                          item.timestamp
                        )}</p>
                    </div>
                    <button class="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            onclick="event.stopPropagation(); bookFinder.removeFromHistory(${
                              item.id
                            })">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    // Add click handlers
    container.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", () => {
        const bookTitle = item.dataset.bookTitle;
        this.selectBook(bookTitle);
        this.closeSidebar("history");
      });
    });
  }

  removeFromHistory(id) {
    this.searchHistory = this.searchHistory.filter((item) => item.id !== id);
    localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    this.renderHistory();
  }

  clearHistory() {
    if (confirm("Are you sure you want to clear your search history?")) {
      this.searchHistory = [];
      localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
      this.renderHistory();
      this.showToast("Search history cleared", "info");
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    const themeIcon = document.getElementById("themeIcon");
    themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";

    this.showToast(`${isDark ? "Dark" : "Light"} mode enabled`, "info");
  }

  applyTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark =
      savedTheme === "dark" || (savedTheme === null && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
    const themeIcon = document.getElementById("themeIcon");
    themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  }

  toggleSidebar(type) {
    const sidebar = document.getElementById(`${type}Sidebar`);
    const overlay = document.getElementById("sidebarOverlay");

    const isOpen = !sidebar.classList.contains("translate-x-full");

    if (isOpen) {
      this.closeSidebar(type);
    } else {
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("hidden");
    }
  }

  closeSidebar(type) {
    const sidebar = document.getElementById(`${type}Sidebar`);
    const overlay = document.getElementById("sidebarOverlay");

    sidebar.classList.add("translate-x-full");
    overlay.classList.add("hidden");
  }

  closeAllSidebars() {
    this.closeSidebar("history");
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

  showPopularBooks() {
    document.getElementById("popularBooksSection").classList.remove("hidden");
  }

  hidePopularBooks() {
    document.getElementById("popularBooksSection").classList.add("hidden");
  }

  updateStats() {
    document.getElementById("totalRecommendations").textContent =
      this.totalRecommendations.toLocaleString();
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString();
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");

    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const icons = {
      success: "fa-check-circle",
      error: "fa-times-circle",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
    };

    toast.className = `toast ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 mb-2`;
    toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;

    container.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  animateElements(elements) {
    elements.forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(20px)";

      setTimeout(() => {
        element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
      }, index * 100);
    });
  }

  handleSearchKeydown(e) {
    const suggestions = document.querySelectorAll(".search-suggestion");
    let currentIndex = -1;

    // Find currently highlighted suggestion
    suggestions.forEach((suggestion, index) => {
      if (suggestion.classList.contains("bg-gray-100")) {
        currentIndex = index;
      }
    });

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % suggestions.length;
      this.highlightSuggestion(suggestions, currentIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex =
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1;
      this.highlightSuggestion(suggestions, currentIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex >= 0 && suggestions[currentIndex]) {
        const bookTitle = suggestions[currentIndex].dataset.bookTitle;
        this.selectBook(bookTitle);
      }
    } else if (e.key === "Escape") {
      this.hideSuggestions();
    }
  }

  highlightSuggestion(suggestions, index) {
    suggestions.forEach((suggestion, i) => {
      suggestion.classList.toggle("bg-gray-100", i === index);
      suggestion.classList.toggle("dark:bg-gray-600", i === index);
    });
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("bookSearch").focus();
    }

    // Ctrl/Cmd + H to toggle history
    if ((e.ctrlKey || e.metaKey) && e.key === "h") {
      e.preventDefault();
      this.toggleSidebar("history");
    }

    // Escape to close modals and sidebars
    if (e.key === "Escape") {
      this.closeModal();
      this.closeAllSidebars();
      this.hideSuggestions();
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.bookFinder = new BookFinder();
});
