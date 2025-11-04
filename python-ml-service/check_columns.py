import pandas as pd

# The path to your data file
file_path = 'data/data/corpus/corpus.parquet'

print(f"Inspecting file: {file_path}")
try:
    df = pd.read_parquet(file_path)
    print("\nSUCCESS: File loaded.")
    print("--> Here are the exact column names in your file:")
    print(list(df.columns))
except Exception as e:
    print(f"\nERROR: Could not read the file. {e}")