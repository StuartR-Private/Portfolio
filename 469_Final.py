import cv2
import numpy as np
import tkinter as tk
from tkinter import filedialog
from tkinter import messagebox


def adaptive_median_filter(image):
    rows, cols = image.shape
    filtered_image = np.zeros_like(image)

    for i in range(1, rows - 1):
        for j in range(1, cols - 1):
            neighborhood = image[i - 1:i + 2, j - 1:j + 2].flatten()
            median_val = np.median(neighborhood)
            min_val = np.min(neighborhood)
            max_val = np.max(neighborhood)
            center_pixel = image[i, j]

            if center_pixel > max_val or center_pixel < min_val:
                filtered_image[i, j] = median_val
            else:
                filtered_image[i, j] = center_pixel

    return filtered_image


def plateau_histogram(image):
    hist = cv2.calcHist([image], [0], None, [256], [0, 256])
    hist = hist.flatten()

    threshold = 0
    for i in range(1, 255):
        if hist[i - 1] < hist[i] and hist[i] > hist[i + 1]:
            threshold += i

    threshold = int(threshold / 2)

    transformed_hist = np.zeros_like(hist)
    for i in range(256):
        if hist[i] > threshold:
            transformed_hist[i] = threshold
        else:
            transformed_hist[i] = hist[i]

    Ft = np.cumsum(transformed_hist)
    max_Ft = Ft[-1]

    Dt = (255 * Ft) // max_Ft

    return Dt


def edge_sharpening(image):
    # Low-pass filtering
    smoothed_image = cv2.GaussianBlur(image, (5, 5), 0)

    # Subtracting low-pass filtered image from original
    difference_image = cv2.subtract(image, smoothed_image)

    # Adding difference image to original
    sharpened_image = cv2.add(image, difference_image)

    return sharpened_image


def optimize_palette(image):
    return cv2.bitwise_not(image)


def process_image(image_path):
    # Load FLIR image
    flir_image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Apply adaptive median filter
    filtered_image = adaptive_median_filter(flir_image)

    # Apply contrast enhancement using plateau histogram method
    enhanced_image = np.zeros_like(filtered_image)
    for i in range(filtered_image.shape[0]):
        for j in range(filtered_image.shape[1]):
            enhanced_image[i, j] = plateau_histogram(filtered_image)[filtered_image[i, j]]

    # Apply edge sharpening
    sharpened_image = edge_sharpening(enhanced_image)

    # Optimize greyscale palette
    optimized_image = optimize_palette(sharpened_image)

    # Display the output image
    cv2.imshow("Output FLIR Image", optimized_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # Ask user to save the image
    save_option = messagebox.askyesno("Save Image", "Do you want to save the output image?")
    if save_option:
        save_path = filedialog.asksaveasfilename(defaultextension=".jpg")
        cv2.imwrite(save_path, optimized_image)
        messagebox.showinfo("Image Saved", f"The output image has been saved as {save_path}")


def main():
    # Create a Tkinter window
    root = tk.Tk()
    root.withdraw()  # Hide the root window

    # Ask user to select FLIR image
    image_path = filedialog.askopenfilename(title="Select FLIR Image",
                                            filetypes=[("Image Files", "*.jpg;*.jpeg;*.png;*.bmp")])
    if not image_path:
        messagebox.showerror("Error", "No image selected. Exiting program.")
        return

    # Process the selected image
    process_image(image_path)


if __name__ == "__main__":
    main()
