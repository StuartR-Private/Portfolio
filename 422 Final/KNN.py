import seaborn as sns
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.neighbors import NearestNeighbors, KNeighborsClassifier
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression




stellarData = pd.read_csv('stellarData.csv')
stellarData.drop(stellarData.index[0])
X = stellarData.drop(columns = ['class_GALAXY','class_QSO','class_STAR','class'])
y = stellarData[['class']]

#
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

KNN = KNeighborsClassifier(n_neighbors=5)

KNN.fit(X_train, y_train)

y_pred = KNN.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print("Accuracy:", accuracy)



conf_matrix_knn = confusion_matrix(y_test, y_pred)

tags = ["Galaxy", "Star", "QSD"]

plt.figure(figsize=(3, 3))
sns.heatmap(conf_matrix_knn, annot=True, fmt='d', cmap="Blues", xticklabels=tags, yticklabels=tags)
plt.xlabel('Predicted')
plt.ylabel('Real')
plt.title('Confusion Matrix - KNN')
plt.show()

#
# log_reg = LogisticRegression(max_iter=1000)
#
# # Step 3: Train the model
# log_reg.fit(X_train, y_train)
#
# # Step 4: Predictions
# y_pred = log_reg.predict(X_test)
#
# # Step 5: Evaluate the model
# accuracy = accuracy_score(y_test, y_pred)
# print("Accuracy:", accuracy)