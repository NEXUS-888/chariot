import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv('PGDATABASE', 'globemap'),
    user=os.getenv('PGUSER', 'postgres'),
    password=os.getenv('PGPASSWORD', ''),
    host=os.getenv('PGHOST', 'localhost'),
    port=os.getenv('PGPORT', '5432'),
)
# Avoid “current transaction is aborted” after any prior error
conn.autocommit = True
