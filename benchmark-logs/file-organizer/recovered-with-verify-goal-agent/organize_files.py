import os
import shutil
import argparse

# Define file type categories
FILE_TYPES = {
    "images": [".jpeg", ".jpg", ".tiff", ".gif", ".bmp", ".png", ".bpg", ".svg", ".heif", ".indd", ".ai", ".eps", ".pdf"],
    "documents": [".oxps", ".epub", ".pages", ".docx", ".doc", ".fdf", ".ods", ".odt", ".pwi", ".xsn", ".xps", ".dotx", ".docm", ".dox", ".rvg", ".rtf", ".rtfd", ".wpd", ".xls", ".xlsx", ".ppt", "pptx"],
    "audio": [".aif", ".cda", ".mid", ".midi", ".mp3", ".mpa", ".ogg", ".wav", ".wma", ".wpl", ".m3u", ".m4a", ".flac"]
}

def organize_files(directory_path):
    for filename in os.listdir(directory_path):
        file_extension = os.path.splitext(filename)[1]
        for category, extensions in FILE_TYPES.items():
            if file_extension in extensions:
                category_path = os.path.join(directory_path, category)
                if not os.path.exists(category_path):
                    os.makedirs(category_path)
                shutil.move(os.path.join(directory_path, filename), category_path)
                break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Organize files in a directory based on their file types.')
    parser.add_argument('--directory_path', type=str, required=True, help='The directory to organize.')
    args = parser.parse_args()
    organize_files(args.directory_path)