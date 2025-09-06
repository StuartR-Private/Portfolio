# Implement a Linear Regression to classify space objects
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import KFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder, StandardScaler


# read in data
stellarData = pd.read_csv('stellarData.csv')
stellarData.drop(stellarData.index[0])
X = stellarData.drop(columns=['class_GALAXY','class_QSO','class_STAR','class'])
y = stellarData[['class']]

# Encode the classification values
y = LabelEncoder().fit_transform(y)

# Scale the data
X = StandardScaler().fit_transform(X)

# Initialize k-fold cross-validation
kf = KFold(n_splits=5, shuffle=True, random_state=42)

mse_scores = []
r2_scores = []

# Perform k-fold cross-validation
for train_index, test_index in kf.split(X):
    X_train, X_test = X[train_index], X[test_index]
    y_train, y_test = y[train_index], y[test_index]

    # Create a linear regression model
    model = LogisticRegression(max_iter=1000)

    # Fit the model
    model.fit(X_train, y_train)

    # Predict on the testing set
    y_pred = model.predict(X_test)

    # Calculate MSE and R^2 score
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    mse_scores.append(mse)
    r2_scores.append(r2)

# Calculate average MSE and R^2 scores
avg_mse = np.mean(mse_scores)
avg_r2 = np.mean(r2_scores)

print(f"Mean Squared Error (MSE) across 5 folds: {mse_scores}")
print(f"Average Mean Squared Error (MSE) across 5 folds: {avg_mse}")
print(f"R^2 Score across 5 folds: {r2_scores}")
print(f"Average R^2 Score across 5 folds: {avg_r2}")

# Plot MSE scores
plt.figure(figsize=(10, 5))
plt.plot(range(1, 6), mse_scores, marker='o', linestyle='-', color='b')
plt.title('MSE Scores across 5 Folds')
plt.xlabel('Fold')
plt.ylabel('MSE')
plt.grid(True)
plt.show()

# Plot R^2 scores
plt.figure(figsize=(10, 5))
plt.plot(range(1, 6), r2_scores, marker='o', linestyle='-', color='r')
plt.title('R^2 Scores across 5 Folds')
plt.xlabel('Fold')
plt.ylabel('R^2 Score')
plt.grid(True)
plt.show()