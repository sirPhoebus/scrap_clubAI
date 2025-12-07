<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ChatLog Visualizer

A React application for parsing and visualizing chat export files. Upload your text-based chat logs to extract, search, and explore links shared in conversations through an intuitive card-based interface.

## Features

- **File Upload**: Drag and drop or browse to upload .txt chat export files
- **Link Extraction**: Automatically parses chat logs to extract URLs, authors, and context
- **Interactive Cards**: Displays extracted links in responsive, visually appealing cards
- **Top Search**: Fuzzy search across URLs, authors, and original messages using Fuse.js
- **Responsive Design**: Optimized for desktop and mobile viewing

## Run Locally

**Prerequisites:** Node.js (v20 or higher recommended)

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Usage

1. Open the app in your browser (usually at `http://localhost:5173`)
2. Upload a .txt file containing your chat export (see `export/` folder for a sample file)
3. The app will parse the file and display extracted links as cards
4. Use the search bar at the top to filter links by URL, author, or message content
5. Click on cards to interact with the links

## Sample Data

A sample chat export file is provided in the `export/` directory for testing purposes.

Enjoy :)
