import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import KFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
import tensorflow as tf

# read in data
stellarData = pd.read_csv('stellarData.csv')
stellarData.drop(stellarData.index[0])
X = stellarData.drop(columns=['class_GALAXY','class_QSO','class_STAR','class']).values
y = stellarData[['class']].values.ravel()

# Encode the classification values
y = LabelEncoder().fit_transform(y)

# Scale the data
X = StandardScaler().fit_transform(X)

# Create a 5-fold cross validation
kf = KFold(n_splits=5, shuffle=True)
accuracies = []

# Perform 5-fold cross-validation
fold_number = 1
for train, test in kf.split(X):
    # Grab the train and test subsets in the current split
    X_train, X_test = X[train], X[test]
    y_train, y_test = y[train], y[test]

    # model layers
    model = tf.keras.models.Sequential()
    model.add(tf.keras.layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)))
    model.add(tf.keras.layers.Dense(64, activation='relu'))
    model.add(tf.keras.layers.Dense(len(np.unique(y)), activation='softmax'))

    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # Train model with the train data
    history = model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test), verbose=0)

    # Visualize the training/validation loss and accuracy
    plt.figure(figsize=(12, 6))

    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title(f'Training and Validation Loss (Fold {fold_number})')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.title(f'Training and Validation Accuracy (Fold {fold_number})')
    plt.legend()

    plt.tight_layout()
    plt.show()

    # Evaluate the model on the validation set
    _, scores = model.evaluate(X_test, y_test, verbose=0)
    accuracies.append(scores)

    fold_number += 1

# Output the accuracies
print(f"Accuracies: {accuracies}")
print(f"Average Accuracy: {np.mean(accuracies)}")
