import pandas as pd
from psycopg2.extras import execute_batch
import psycopg2
import os

# =========================
# DATABASE CONNECTION
# =========================
def get_connection():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_8GBNDwtvF4LK@ep-young-waterfall-anxtt2ju.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
conn = get_connection()
cur = conn.cursor()
# =========================
# LOAD ALL EXCEL FILES
# =========================
def load_data():
    folder_path = os.path.join(os.path.dirname(__file__), "dataset")
    all_data = []

    for file in os.listdir(folder_path):
        if file.endswith(".xls"):
            file_path = os.path.join(folder_path, file)
            print("Reading:", file)

            df = pd.read_excel(file_path, engine="xlrd")
            all_data.append(df)

    df = pd.concat(all_data, ignore_index=True)

    print("Total rows loaded:", len(df))
    return df


# =========================
# CLEAN DATA
# =========================
def clean_data(df):

    print("Original Columns:")
    print(df.columns)

    df = df.iloc[:, [0,1,2,3,4,5,6,7]].copy()

    df.columns = [
        "state_code",
        "state_name",
        "district_code",
        "district_name",
        "subdistrict_code",
        "subdistrict_name",
        "village_code",
        "village_name"
    ]

    # convert to string
    df["state_code"] = df["state_code"].astype(str)
    df["district_code"] = df["district_code"].astype(str)
    df["subdistrict_code"] = df["subdistrict_code"].astype(str)
    df["village_code"] = df["village_code"].astype(str)

    df = df.drop_duplicates()

    df["state_name"] = df["state_name"].str.strip()
    df["district_name"] = df["district_name"].str.strip()
    df["subdistrict_name"] = df["subdistrict_name"].str.strip()
    df["village_name"] = df["village_name"].str.strip()

    print("After cleaning:", len(df))

    return df


# =========================
# INSERT STATES
# =========================
def insert_states(df):

    states = df[["state_code", "state_name"]].drop_duplicates()

    data = [
        (row.state_code, row.state_name)
        for _, row in states.iterrows()
    ]

    execute_batch(
        cur,
        """
        INSERT INTO state (code, name)
        VALUES (%s, %s)
        ON CONFLICT (code) DO NOTHING
        """,
        data,
        page_size=5000
    )

    conn.commit()
    print("States inserted")


# =========================
# INSERT DISTRICTS
# =========================
def insert_districts(df):

    global conn, cur

    districts = df[
        ["district_code", "district_name", "state_code"]
    ].drop_duplicates()

    count = 0

    for _, row in districts.iterrows():

        try:
            cur.execute(
                "SELECT id FROM state WHERE code=%s",
                (row.state_code,)
            )

            result = cur.fetchone()
            if not result:
                continue

            state_id = result[0]

            cur.execute(
                """
                INSERT INTO district (code, name, state_id)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (row.district_code, row.district_name, state_id)
            )

            count += 1

            if count % 500 == 0:
                conn.commit()
                print("Inserted districts:", count)

        except psycopg2.OperationalError:
            print("Reconnecting to DB...")
            conn = get_connection()
            cur = conn.cursor()

    conn.commit()
    print("Districts inserted")


# =========================
# INSERT SUBDISTRICTS
# =========================
def insert_subdistricts(df):

    subs = df[
        ["subdistrict_code", "subdistrict_name", "district_code"]
    ].drop_duplicates()

    data = [
        (row.subdistrict_code, row.subdistrict_name, row.district_code)
        for _, row in subs.iterrows()
    ]

    execute_batch(
        cur,
        """
        INSERT INTO sub_district (code, name, district_id)
        SELECT %s, %s, d.id
        FROM district d
        WHERE d.code = %s
        ON CONFLICT DO NOTHING
        """,
        data,
        page_size=5000
    )

    conn.commit()
    print("Subdistricts inserted")


# =========================
# INSERT VILLAGES
# =========================
def insert_villages(df):

    villages = df[
        ["village_code", "village_name", "subdistrict_code"]
    ].drop_duplicates()

    data = [
        (row.village_code, row.village_name, row.subdistrict_code)
        for _, row in villages.iterrows()
    ]

    execute_batch(
        cur,
        """
        INSERT INTO village (code, name, sub_district_id)
        SELECT %s, %s, s.id
        FROM sub_district s
        WHERE s.code = %s
        ON CONFLICT DO NOTHING
        """,
        data,
        page_size=5000
    )

    conn.commit()
    print("Villages inserted")


# =========================
# MAIN EXECUTION
# =========================
if __name__ == "__main__":

    print("Loading data...")
    df = load_data()

    print("Cleaning data...")
    df = clean_data(df)

    print("Inserting states...")
    insert_states(df)

    print("Inserting districts...")
    insert_districts(df)

    print("Inserting subdistricts...")
    insert_subdistricts(df)

    print("Inserting villages...")
    insert_villages(df)

    print("DATA IMPORT COMPLETED")