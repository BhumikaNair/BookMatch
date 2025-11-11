from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pickle
import numpy as np
import json
import random
from datetime import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Load the model and data
try:
    model = pickle.load(open("models/model.pkl", "rb"))
    book_names = pickle.load(open("models/book_names.pkl", "rb"))
    final_rating = pickle.load(open("models/final_rating.pkl", "rb"))
    book_pivot = pickle.load(open("models/book_pivot.pkl", "rb"))
    print(f"Loaded {len(book_names)} books successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    model = None
    book_names = []
    final_rating = None
    book_pivot = None


def fetch_poster(suggestion):
    book_name = []
    ids_index = []
    poster_url = []

    for book_id in suggestion:
        book_name.append(book_pivot.index[book_id])

    for name in book_name[0]:
        ids = np.where(final_rating["title"] == name)[0][0]
        ids_index.append(ids)

    for idx in ids_index:
        url = final_rating.iloc[idx]["image_url"]
        poster_url.append(url)

    return poster_url


def get_book_details(book_name):
    """Get detailed information about a book"""
    try:
        book_info = final_rating[final_rating["title"] == book_name].iloc[0]
        return {
            "title": book_info["title"],
            "author": book_info.get("author", "Unknown"),
            "image_url": book_info["image_url"],
            "publisher": book_info.get("publisher", "Unknown"),
            "year": book_info.get("year", "Unknown"),
        }
    except:
        return {
            "title": book_name,
            "author": "Unknown",
            "image_url": "https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover",
            "publisher": "Unknown",
            "year": "Unknown",
        }


def recommend_book(book_name):
    try:
        books_list = []
        book_id = np.where(book_pivot.index == book_name)[0][0]
        _, suggestion = model.kneighbors(
            book_pivot.iloc[book_id, :].values.reshape(1, -1), n_neighbors=6
        )

        poster_url = fetch_poster(suggestion)

        for i in range(len(suggestion)):
            books = book_pivot.index[suggestion[i]]
            for j in books:
                books_list.append(j)

        return books_list[1:], poster_url[1:]
    except Exception as e:
        print(f"Error in recommendation: {e}")
        return [], []


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/books")
def get_books():
    """Get all available books for search suggestions"""
    return jsonify({"books": list(book_names), "total": len(book_names)})


@app.route("/api/search")
def search_books():
    """Search books by query"""
    query = request.args.get("q", "").lower()
    if not query:
        return jsonify({"books": []})

    filtered_books = [book for book in book_names if query in book.lower()]
    filtered_books = filtered_books[:20]

    results = []
    for book in filtered_books:
        book_details = get_book_details(book)
        results.append(book_details)

    return jsonify({"books": results})


@app.route("/api/recommend")
def get_recommendations():
    """Get book recommendations"""
    book_name = request.args.get("book")

    if not book_name:
        return jsonify({"error": "Book name is required"}), 400

    if book_name not in book_names:
        return jsonify({"error": "Book not found"}), 404

    try:
        recommended_books, poster_urls = recommend_book(book_name)

        recommendations = []
        for i, book in enumerate(recommended_books):
            book_details = get_book_details(book)
            recommendations.append(book_details)

        return jsonify(
            {
                "input_book": get_book_details(book_name),
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        return jsonify({"error": f"Error generating recommendations: {str(e)}"}), 500


@app.route("/api/book-details")
def get_book_info():
    """Get detailed information about a specific book"""
    book_name = request.args.get("book")

    if not book_name:
        return jsonify({"error": "Book name is required"}), 400

    book_details = get_book_details(book_name)
    return jsonify(book_details)


@app.route("/api/popular")
def get_popular_books():
    """Get random books for homepage showcase (18 random books each time)"""
    try:
        random_books = random.sample(list(book_names), min(18, len(book_names)))
        popular = []

        for book in random_books:
            book_details = get_book_details(book)
            popular.append(book_details)

        return jsonify({"books": popular})
    except Exception as e:
        return jsonify({"error": f"Error fetching popular books: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
