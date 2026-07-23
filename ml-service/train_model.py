"""
INTELLCAP — Entraînement du modèle ML de prédiction de retard
Algorithme : Random Forest (classification supervisée)
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

np.random.seed(42)

# --- Génération de données synthétiques réalistes ---
n_samples = 500
data = []

for _ in range(n_samples):
    estimated_hours = np.random.choice([20, 40, 60, 80, 100, 120, 160])
    progress = np.random.randint(5, 100)

    # Simuler le comportement réel
    if np.random.random() < 0.4:
        # Tâche en retard : consomme plus que prévu proportionnellement
        consumed_hours = (progress / 100) * estimated_hours * np.random.uniform(1.3, 2.5)
    else:
        # Tâche dans les temps
        consumed_hours = (progress / 100) * estimated_hours * np.random.uniform(0.7, 1.2)

    consumed_hours = round(consumed_hours, 1)
    ratio = consumed_hours / estimated_hours if estimated_hours > 0 else 0
    velocity = progress / consumed_hours if consumed_hours > 0 else 0
    blocked_count = np.random.choice([0, 0, 0, 1, 1, 2, 3])
    days_since_start = int(consumed_hours / np.random.uniform(4, 8))
    remaining_progress = 100 - progress

    # Projection : heures totales prédites
    projected_total = (consumed_hours / progress * 100) if progress > 0 else estimated_hours * 2
    overrun_ratio = projected_total / estimated_hours if estimated_hours > 0 else 1

    # Label : en retard ou pas (1 = retard, 0 = dans les temps)
    is_late = 1 if overrun_ratio > 1.15 or (blocked_count >= 2 and progress < 50) else 0
    # Ajouter du bruit pour rendre le modèle réaliste
    if np.random.random() < 0.05:
        is_late = 1 - is_late

    data.append({
        'progress_percent': progress,
        'consumed_hours': consumed_hours,
        'estimated_hours': estimated_hours,
        'ratio_consumed_estimated': round(ratio, 3),
        'velocity': round(velocity, 3),
        'blocked_count': blocked_count,
        'days_since_start': days_since_start,
        'remaining_progress': remaining_progress,
        'overrun_ratio': round(overrun_ratio, 3),
        'is_late': is_late
    })

df = pd.DataFrame(data)

print(f"Dataset: {len(df)} échantillons")
print(f"Répartition: {df['is_late'].value_counts().to_dict()}")
print()

# --- Features et labels ---
features = [
    'progress_percent',
    'consumed_hours',
    'estimated_hours',
    'ratio_consumed_estimated',
    'velocity',
    'blocked_count',
    'days_since_start',
    'remaining_progress',
    'overrun_ratio'
]

X = df[features]
y = df['is_late']

# --- Split train/test ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Entraînement Random Forest ---
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# --- Évaluation ---
y_pred = model.predict(X_test)
print("=== Résultats du modèle ===")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print()
print(classification_report(y_test, y_pred, target_names=['Dans les temps', 'En retard']))

# --- Importance des features ---
print("=== Importance des features ===")
importances = sorted(zip(features, model.feature_importances_), key=lambda x: -x[1])
for feat, imp in importances:
    print(f"  {feat}: {imp:.3f}")

# --- Sauvegarde du modèle ---
joblib.dump(model, 'model_retard.pkl')
joblib.dump(features, 'model_features.pkl')
print()
print("Modèle sauvegardé: model_retard.pkl")
