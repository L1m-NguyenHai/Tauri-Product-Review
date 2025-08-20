import json
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

hostname = "localhost"
database = "LimReview"
username = "postgres"
pwd = "13579-97531"
port = "5432"

def fetch_products():
    """
    Connects to the database, fetches all rows from the `product` table,
    and returns a list of dictionaries (one per row).
    """
    conn = None
    try:
        conn = psycopg2.connect(
            host=hostname,
            database=database,
            user=username,
            password=pwd,
            port=port
        )
        # Use RealDictCursor so rows are returned as dictionaries
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM products;")
            rows = cur.fetchall()
            # rows is a list of RealDictRow (dict-like)
            return rows
    except Exception as e:
        # Propagate the exception after printing to stderr
        print(f"An error occurred while fetching products: {e}", file=sys.stderr)
        raise
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

def main():
    try:
        rows = fetch_products()
        # Convert to regular list of dicts (RealDictRow is serializable but ensure portability)
        # Pretty-print JSON with indent; convert non-serializable objects to strings
        json_output = json.dumps(rows, default=str, ensure_ascii=False, indent=2)
        print(json_output)
    except Exception:
        # fetch_products already printed the error; exit with non-zero status
        sys.exit(1)

if __name__ == "__main__":
    main()