from flask import Flask, request, jsonify
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import os

app = Flask(__name__)

# --- Load Model and Embeddings ONCE on startup ---
print("Loading model and embeddings...")
model = SentenceTransformer('all-MiniLM-L6-v2')
knowledge_base_embeddings = np.load('knowledge_base_embeddings.npy')

# Load the knowledge base from the parquet file
corpus_df = pd.read_parquet('data/data/corpus/corpus.parquet')
knowledge_base = corpus_df['doc'].tolist()
print("Model and data loaded successfully!")


# --- End of loading ---

def get_best_answer(user_query):
    query_embedding = model.encode([user_query])
    similarities = cosine_similarity(query_embedding, knowledge_base_embeddings)
    best_answer_index = np.argmax(similarities)
    return knowledge_base[best_answer_index]


# This is our API endpoint
@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "Query not provided"}), 400

    user_query = data['query']
    answer = get_best_answer(user_query)

    return jsonify({"answer": answer})


if __name__ == '__main__':
    # Run the Flask app on port 5001 to avoid conflicts
    app.run(host='0.0.0.0', port=5001)