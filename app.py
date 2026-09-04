from flask import Flask, render_template, request
import pandas as pd
import joblib
import os


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ============================================================
# FILE PATHS
# ============================================================

PIPELINE_FILE = os.path.join(
    BASE_DIR,
    "pipeline.pkl"
)

DATASET_FILE = os.path.join(
    BASE_DIR,
    "medical.csv"
)




# ============================================================
# MODEL THRESHOLD
# ============================================================

THRESHOLD = 0.20


# ============================================================
# FEATURES USED BY THE MODEL
# ============================================================

FEATURES = [
    "Gender",
    "Age",
    "Neighbourhood",
    "Scholarship",
    "Hipertension",
    "Diabetes",
    "Alcoholism",
    "Handcap",
    "SMS_received",
    "LeadTime",
    "AppointmentWeekday",
    "IsWeekend",
    "AgeGroup"
]


# ============================================================
# LOAD TRAINED PIPELINE
# ============================================================

pipeline = None


try:

    print()
    print("=" * 60)
    print("LOADING MODEL")
    print("=" * 60)

    print(
        "Pipeline path:"
    )

    print(
        PIPELINE_FILE
    )


    if not os.path.exists(
        PIPELINE_FILE
    ):

        print()
        print(
            "ERROR: pipeline.pkl was not found!"
        )

    else:

        pipeline = joblib.load(
            PIPELINE_FILE
        )

        print()
        print(
            "Pipeline loaded successfully."
        )

        print("=" * 60)


except Exception as e:

    print()
    print(
        "ERROR LOADING PIPELINE"
    )

    print(
        type(e).__name__,
        ":",
        str(e)
    )

    print("=" * 60)


# ============================================================
# LOAD NEIGHBOURHOODS FROM DATASET
# ============================================================

def load_neighbourhoods():

    print()
    print("=" * 60)
    print("LOADING MEDICAL DATASET")
    print("=" * 60)

    print(
        "Dataset path:"
    )

    print(
        DATASET_FILE
    )


    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not os.path.exists(
        DATASET_FILE
    ):

        print()
        print(
            "ERROR: medical.csv NOT FOUND!"
        )

        print()
        print(
            "Make sure medical.csv is located here:"
        )

        print(
            DATASET_FILE
        )

        print("=" * 60)

        return []


    try:

        # ----------------------------------------------------
        # Read CSV
        # ----------------------------------------------------

        df = pd.read_csv(
            DATASET_FILE
        )


        print()
        print(
            "Dataset loaded successfully."
        )

        print(
            "Dataset shape:",
            df.shape
        )


        # ----------------------------------------------------
        # Clean column names
        # ----------------------------------------------------

        df.columns = (
            df.columns
            .astype(str)
            .str.strip()
        )


        print()
        print(
            "Dataset columns:"
        )

        print(
            df.columns.tolist()
        )


        # ----------------------------------------------------
        # Check neighbourhood column
        # ----------------------------------------------------

        if "Neighbourhood" not in df.columns:

            print()
            print(
                "ERROR: 'Neighbourhood' column "
                "was not found."
            )

            print(
                "Available columns:"
            )

            print(
                df.columns.tolist()
            )

            print("=" * 60)

            return []


        # ----------------------------------------------------
        # Extract neighbourhood values
        # ----------------------------------------------------

        neighbourhood_series = (
            df["Neighbourhood"]
            .dropna()
            .astype(str)
            .str.strip()
        )


        # ----------------------------------------------------
        # Remove empty strings
        # ----------------------------------------------------

        neighbourhood_series = (
            neighbourhood_series[
                neighbourhood_series != ""
            ]
        )


        # ----------------------------------------------------
        # Get unique values
        # ----------------------------------------------------

        neighbourhoods = (
            neighbourhood_series
            .unique()
            .tolist()
        )


        # ----------------------------------------------------
        # Sort alphabetically
        # ----------------------------------------------------

        neighbourhoods = sorted(
            neighbourhoods,
            key=lambda x: x.lower()
        )


        # ----------------------------------------------------
        # Display information
        # ----------------------------------------------------

        print()
        print(
            "Neighbourhoods found:",
            len(neighbourhoods)
        )


        print()
        print(
            "First 10 neighbourhoods:"
        )


        for neighbourhood in (
            neighbourhoods[:10]
        ):

            print(
                " -",
                neighbourhood
            )


        print()
        print(
            "Neighbourhood loading complete."
        )

        print("=" * 60)


        return neighbourhoods


    except Exception as e:

        print()
        print(
            "ERROR READING medical.csv"
        )

        print(
            type(e).__name__,
            ":",
            str(e)
        )

        print("=" * 60)

        return []


# ============================================================
# LOAD NEIGHBOURHOODS WHEN APP STARTS
# ============================================================

NEIGHBOURHOODS = (
    load_neighbourhoods()
)


# ============================================================
# AGE GROUP
# ============================================================

def get_age_group(age):

    if age <= 12:

        return "Child"

    elif age <= 19:

        return "Teen"

    elif age <= 35:

        return "Young Adult"

    elif age <= 60:

        return "Adult"

    else:

        return "Senior"


# ============================================================
# BINARY VALUE CONVERSION
# ============================================================

def get_binary_value(
    value,
    field_name
):

    value = (
        str(value)
        .strip()
        .lower()
    )


    if value in [
        "0",
        "no",
        "false"
    ]:

        return 0


    if value in [
        "1",
        "yes",
        "true"
    ]:

        return 1


    raise ValueError(
        f"{field_name} must be Yes/No or 1/0."
    )


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html",
        neighbourhoods=NEIGHBOURHOODS
    )


# ============================================================
# ABOUT PAGE
# ============================================================

@app.route("/about")
def about():

    return render_template(
        "about.html"
    )


# ============================================================
# PREDICTION
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # ====================================================
        # CHECK PIPELINE
        # ====================================================

        if pipeline is None:

            return render_template(

                "index.html",

                neighbourhoods=
                    NEIGHBOURHOODS,

                error=(
                    "Prediction pipeline could not "
                    "be loaded. Check pipeline.pkl."
                )

            )


        # ====================================================
        # GENDER
        # ====================================================

        gender = request.form.get(
            "Gender",
            ""
        ).strip().upper()


        if gender not in [
            "M",
            "F"
        ]:

            raise ValueError(
                "Gender must be M or F."
            )


        # ====================================================
        # AGE
        # ====================================================

        age_text = request.form.get(
            "Age",
            ""
        ).strip()


        if age_text == "":

            raise ValueError(
                "Age is required."
            )


        try:

            age = int(
                age_text
            )

        except ValueError:

            raise ValueError(
                "Age must be a whole number."
            )


        if age < 0:

            raise ValueError(
                "Age cannot be negative."
            )


        if age > 120:

            raise ValueError(
                "Age must be between 0 and 120."
            )


        # ====================================================
        # NEIGHBOURHOOD
        # ====================================================

        neighbourhood = request.form.get(
            "Neighbourhood",
            ""
        ).strip()


        if neighbourhood == "":

            raise ValueError(
                "Please select a neighbourhood."
            )


        # ----------------------------------------------------
        # Verify selected neighbourhood
        # ----------------------------------------------------

        if (
            len(NEIGHBOURHOODS) > 0
            and neighbourhood not in NEIGHBOURHOODS
        ):

            raise ValueError(
                "Invalid neighbourhood selected."
            )


        # ====================================================
        # SCHOLARSHIP
        # ====================================================

        scholarship = get_binary_value(

            request.form.get(
                "Scholarship",
                "0"
            ),

            "Scholarship"

        )


        # ====================================================
        # HYPERTENSION
        # ====================================================

        hipertension = get_binary_value(

            request.form.get(
                "Hipertension",
                "0"
            ),

            "Hipertension"

        )


        # ====================================================
        # DIABETES
        # ====================================================

        diabetes = get_binary_value(

            request.form.get(
                "Diabetes",
                "0"
            ),

            "Diabetes"

        )


        # ====================================================
        # ALCOHOLISM
        # ====================================================

        alcoholism = get_binary_value(

            request.form.get(
                "Alcoholism",
                "0"
            ),

            "Alcoholism"

        )


        # ====================================================
        # HANDICAP
        # ====================================================

        handcap = get_binary_value(

            request.form.get(
                "Handcap",
                "0"
            ),

            "Handcap"

        )


        # ====================================================
        # SMS RECEIVED
        # ====================================================

        sms_received = get_binary_value(

            request.form.get(
                "SMS_received",
                "0"
            ),

            "SMS_received"

        )


        # ====================================================
        # LEAD TIME
        # ====================================================

        lead_time_text = request.form.get(
            "LeadTime",
            ""
        ).strip()


        if lead_time_text == "":

            raise ValueError(
                "Lead Time is required."
            )


        try:

            lead_time = int(
                lead_time_text
            )

        except ValueError:

            raise ValueError(
                "Lead Time must be a whole number."
            )


        if lead_time < 0:

            raise ValueError(
                "Lead Time cannot be negative."
            )


        if lead_time > 3650:

            raise ValueError(
                "Lead Time cannot be greater than "
                "3650 days."
            )


        # ====================================================
        # APPOINTMENT WEEKDAY
        # ====================================================

        appointment_weekday = request.form.get(
            "AppointmentWeekday",
            ""
        ).strip()


        valid_weekdays = [

            "Monday",

            "Tuesday",

            "Wednesday",

            "Thursday",

            "Friday",

            "Saturday",

            "Sunday"

        ]


        if (
            appointment_weekday
            not in valid_weekdays
        ):

            raise ValueError(
                "Please select a valid appointment weekday."
            )


        # ====================================================
        # WEEKEND
        # ====================================================

        if appointment_weekday in [
            "Saturday",
            "Sunday"
        ]:

            is_weekend = 1

        else:

            is_weekend = 0


        # ====================================================
        # AGE GROUP
        # ====================================================

        age_group = get_age_group(
            age
        )


        # ====================================================
        # CREATE INPUT DATAFRAME
        # ====================================================

        input_df = pd.DataFrame({

            "Gender": [
                gender
            ],

            "Age": [
                age
            ],

            "Neighbourhood": [
                neighbourhood
            ],

            "Scholarship": [
                scholarship
            ],

            "Hipertension": [
                hipertension
            ],

            "Diabetes": [
                diabetes
            ],

            "Alcoholism": [
                alcoholism
            ],

            "Handcap": [
                handcap
            ],

            "SMS_received": [
                sms_received
            ],

            "LeadTime": [
                lead_time
            ],

            "AppointmentWeekday": [
                appointment_weekday
            ],

            "IsWeekend": [
                is_weekend
            ],

            "AgeGroup": [
                age_group
            ]

        })


        # ====================================================
        # FORCE EXACT FEATURE ORDER
        # ====================================================

        input_df = input_df[
            FEATURES
        ]


        # ====================================================
        # DEBUG INPUT
        # ====================================================

        print()
        print("=" * 60)
        print("PATIENT INPUT")
        print("=" * 60)

        print(
            input_df.to_string(
                index=False
            )
        )

        print()

        print(
            "Feature order:"
        )

        print(
            input_df.columns.tolist()
        )


        # ====================================================
        # MODEL PREDICTION
        # ====================================================

        probability = (
            pipeline
            .predict_proba(
                input_df
            )[0][1]
        )


        probability = float(
            probability
        )


        # ----------------------------------------------------
        # Safety
        # ----------------------------------------------------

        probability = max(
            0.0,
            min(
                1.0,
                probability
            )
        )


        probability_percent = (
            probability * 100
        )


        # ====================================================
        # THRESHOLD CLASSIFICATION
        # ====================================================

        prediction = int(
            probability >= THRESHOLD
        )


        # ====================================================
        # RISK LEVEL
        # ====================================================

        if probability < 0.20:

            risk = "Low Risk"

            color = "success"

            risk_icon = (
                "fa-circle-check"
            )

            recommendation = (
                "The predicted no-show probability "
                "is low. A standard appointment "
                "reminder is recommended."
            )


        elif probability < 0.50:

            risk = "Medium Risk"

            color = "warning"

            risk_icon = (
                "fa-triangle-exclamation"
            )

            recommendation = (
                "The patient has a moderate predicted "
                "no-show probability. Consider sending "
                "an additional appointment reminder."
            )


        else:

            risk = "High Risk"

            color = "danger"

            risk_icon = (
                "fa-circle-exclamation"
            )

            recommendation = (
                "The patient has a high predicted "
                "no-show probability. Consider SMS "
                "and phone confirmation."
            )


        # ====================================================
        # PREDICTION LABEL
        # ====================================================

        if prediction == 1:

            prediction_label = (
                "Potential No-show"
            )

        else:

            prediction_label = (
                "Likely to Attend"
            )


        # ====================================================
        # TERMINAL RESULT
        # ====================================================

        print()
        print("=" * 60)
        print("PREDICTION RESULT")
        print("=" * 60)

        print(
            f"Probability : "
            f"{probability:.4f}"
        )

        print(
            f"Percentage  : "
            f"{probability_percent:.2f}%"
        )

        print(
            f"Threshold   : "
            f"{THRESHOLD}"
        )

        print(
            f"Prediction  : "
            f"{prediction_label}"
        )

        print(
            f"Risk        : "
            f"{risk}"
        )

        print("=" * 60)


        # ====================================================
        # RESULT PAGE
        # ====================================================

        return render_template(

            "result.html",

            probability=round(
                probability_percent,
                2
            ),

            probability_decimal=round(
                probability,
                4
            ),

            threshold=THRESHOLD,

            prediction=prediction,

            prediction_label=
                prediction_label,

            risk=risk,

            color=color,

            risk_icon=risk_icon,

            recommendation=
                recommendation,

            patient=
                input_df.iloc[
                    0
                ].to_dict()

        )


    # ========================================================
    # VALIDATION ERROR
    # ========================================================

    except ValueError as e:

        print()
        print(
            "VALIDATION ERROR:"
        )

        print(
            str(e)
        )


        return render_template(

            "index.html",

            neighbourhoods=
                NEIGHBOURHOODS,

            error=str(e)

        )


    # ========================================================
    # GENERAL ERROR
    # ========================================================

    except Exception as e:

        print()
        print("=" * 60)
        print("PREDICTION ERROR")
        print("=" * 60)

        print(
            type(e).__name__,
            ":",
            str(e)
        )

        print("=" * 60)


        return render_template(

            "index.html",

            neighbourhoods=
                NEIGHBOURHOODS,

            error=(
                "An error occurred while "
                "making the prediction: "
                + str(e)
            )

        )


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("HEALTHPREDICT")
    print("=" * 60)

    print(
        "Server starting..."
    )

    print(
        "Threshold:",
        THRESHOLD
    )

    print(
        "Neighbourhoods:",
        len(NEIGHBOURHOODS)
    )

    print("=" * 60)


    app.run(

        debug=True,

        host="127.0.0.1",

        port=5000

    )