"""
INTELLCAP — API ML de prédiction de retard
Endpoint : POST /predict
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="INTELLCAP ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model_retard.pkl")
features = joblib.load("model_features.pkl")


class TaskInput(BaseModel):
    progress_percent: float
    consumed_hours: float
    estimated_hours: float
    blocked_count: int = 0
    days_since_start: int = 1


class PredictionResult(BaseModel):
    task_name: str
    is_late: bool
    probability: float
    risk_level: str
    explanation: str


class PredictRequest(BaseModel):
    tasks: list[TaskInput]
    task_names: list[str] = []


class PredictResponse(BaseModel):
    predictions: list[PredictionResult]
    model_name: str = "Random Forest Classifier"
    model_accuracy: str = "95%+"


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    predictions = []

    for i, task in enumerate(request.tasks):
        ratio = task.consumed_hours / task.estimated_hours if task.estimated_hours > 0 else 0
        velocity = task.progress_percent / task.consumed_hours if task.consumed_hours > 0 else 0
        remaining = 100 - task.progress_percent
        overrun = (task.consumed_hours / task.progress_percent * 100) / task.estimated_hours if task.progress_percent > 0 and task.estimated_hours > 0 else 1

        feature_values = np.array([[
            task.progress_percent,
            task.consumed_hours,
            task.estimated_hours,
            round(ratio, 3),
            round(velocity, 3),
            task.blocked_count,
            task.days_since_start,
            remaining,
            round(overrun, 3)
        ]])

        proba = model.predict_proba(feature_values)[0]
        is_late = bool(proba[1] > 0.5)
        probability = round(float(proba[1]) * 100, 1)

        if probability >= 75:
            risk_level = "CRITIQUE"
        elif probability >= 50:
            risk_level = "ÉLEVÉ"
        elif probability >= 30:
            risk_level = "MODÉRÉ"
        else:
            risk_level = "FAIBLE"

        # Explication basée sur les features les plus influentes
        explanations = []
        if overrun > 1.3:
            explanations.append(f"projection de {round(overrun * task.estimated_hours)}h dépasse l'estimation de {task.estimated_hours}h")
        if velocity < 1.0 and task.consumed_hours > 10:
            explanations.append(f"vitesse d'avancement faible ({round(velocity, 2)}%/h)")
        if task.blocked_count >= 2:
            explanations.append(f"{task.blocked_count} blocages détectés")
        if ratio > 0.8 and task.progress_percent < 50:
            explanations.append(f"{round(ratio * 100)}% du budget consommé pour seulement {task.progress_percent}% de progression")
        if not explanations:
            explanations.append("indicateurs dans les normes" if not is_late else "combinaison de facteurs à risque")

        task_name = request.task_names[i] if i < len(request.task_names) else f"Tâche {i + 1}"

        predictions.append(PredictionResult(
            task_name=task_name,
            is_late=is_late,
            probability=probability,
            risk_level=risk_level,
            explanation=". ".join(explanations)
        ))

    return PredictResponse(predictions=predictions)


@app.get("/health")
def health():
    return {"status": "ok", "model": "Random Forest Classifier"}
