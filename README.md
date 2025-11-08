# 📚 BookMatch - Find your next favorite book

<div align="center">
  <br/>
  <img src="static/images/logo_dark.svg" alt="BookMatch Logo" width="250"> <br/><br/>
  
  **An AI-powered book recommendation system that helps you discover your next great read based on collaborative filtering and machine learning.**
  
  [![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)](https://www.python.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0.3-000000.svg)](https://flask.palletsprojects.com/)
  [![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.6.1-F7931E.svg)](https://scikit-learn.org/)
  [![Pandas](https://img.shields.io/badge/Pandas-2.2.3-150458.svg)](https://pandas.pydata.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4.svg)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## ✨ Key Features

- **🤖 AI-Powered Recommendations** - Uses K-Nearest Neighbors algorithm for intelligent book suggestions
- **⚡ Instant Search** - Real-time book search with autocomplete suggestions
- **🎨 Modern UI** - Clean, responsive interface with dark/light mode toggle
- **📖 Comprehensive Book Data** - Access to thousands of books with ratings, authors, and cover images
- **🔍 Smart Filtering** - Find books based on similar user preferences and reading patterns
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **🌓 Dark/Light Theme** - Toggle between dark and light modes with smooth transitions
- **📜 Search History** - Keep track of your recent searches with local storage
- **🎯 Quick Discovery** - Explore random popular books on the homepage
- **🔗 Google Integration** - Search for books directly on Google with one click

## 🏗️ Architecture

```
book_recommendation_system/
├── 📁 data/
│   ├── Books.csv                    # 📚 Book metadata (titles, authors, publishers)
│   ├── Ratings.csv                  # ⭐ User ratings dataset
│   └── Users.csv                    # 👥 User information
│
├── 📁 models/
│   ├── model.pkl                    # 🤖 Trained KNN model
│   ├── book_names.pkl               # 📖 List of all book titles
│   ├── final_rating.pkl             # ⭐ Processed rating data
│   └── book_pivot.pkl               # 🔄 Pivot table for recommendations
│
├── 📁 static/
│   ├── 📁 css/
│   │   └── styles.css               # 🎨 Custom styles
│   ├── 📁 images/
│   │   ├── logo_light.svg           # 🌞 Light mode logo
│   │   ├── logo_dark.svg            # 🌙 Dark mode logo
│   │   └── placeholder.png          # 🖼️ Fallback book cover
│   ├── 📁 js/
│   │   ├── app.js                   # 📜 Main application logic
│   │   └── minimal-app.js           # ⚡ Optimized app logic
│   └── favicon.ico                  # 🏷️ Favicon
│
├── 📁 templates/
│   └── index.html                   # 🏠 Main HTML template
│
├── app.py                           # 🚀 Flask backend server
├── notebook.ipynb                   # 📓 Data analysis & model training
├── requirements.txt                 # 📦 Python dependencies
└── README.md                        # 📖 Project documentation
```

## 🚀 Quick Start

### Prerequisites

- **Python** 3.8+
- **pip** (Python package manager)
- **Git** (for cloning)

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/BhumikaNair/BookMatch.git
cd BookMatch

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt
```

### 3. Prepare the Data

Ensure the following files are in the `data/` directory:

- `Books.csv`
- `Ratings.csv`
- `Users.csv`

### 4. Train the Model (Optional)

If you need to retrain the model:

```bash
# Open and run the Jupyter notebook
jupyter notebook notebook.ipynb
```

This will generate the model files in the `models/` directory.

### 5. Start the Application

```bash
# Run the Flask server
python app.py
```

### 6. Access the Application

- **Frontend**: [http://localhost:5000](http://localhost:5000)

The application will be available on all network interfaces (`0.0.0.0:5000`).

## 🛠️ Tech Stack

### Backend

- **🐍 Python 3.8+** - Core programming language
- **🌶️ Flask 3.0.3** - Lightweight web framework
- **📊 Pandas 2.2.3** - Data manipulation and analysis
- **🧮 NumPy 2.2.4** - Numerical computing
- **🤖 Scikit-learn 1.6.1** - Machine learning library (KNN algorithm)
- **🔄 Flask-CORS** - Cross-origin resource sharing

### Frontend

- **⚡ Vanilla JavaScript** - Core interactivity
- **🎨 Tailwind CSS 3.4** - Utility-first CSS framework
- **🎭 HTML5** - Modern semantic markup
- **🌐 Fetch API** - RESTful API communication

### Machine Learning

- **📊 Collaborative Filtering** - User-based recommendation approach
- **🎯 K-Nearest Neighbors (KNN)** - Similarity-based algorithm
- **🔢 Cosine Similarity** - Distance metric for recommendations

## 🎯 How It Works

1. **Data Collection** - User ratings and book metadata are collected and preprocessed
2. **Model Training** - K-Nearest Neighbors algorithm learns from user-book interaction patterns
3. **Similarity Calculation** - Cosine similarity finds books with similar rating patterns
4. **Recommendation Generation** - Top 5 similar books are returned based on collaborative filtering
5. **Real-time Search** - Fast autocomplete using indexed book titles
6. **Responsive UI** - Modern interface with smooth transitions and error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for book lovers everywhere**

[🌟 Star this repo](../../stargazers) • [🐛 Report Bug](../../issues) • [💡 Request Feature](../../issues)

Made by [Bhumika](https://github.com/BhumikaNair)

</div>
