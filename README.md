# TempBin

TempBin is a secure, client-side temporary file sharing application powered by Cloudflare R2. It allows you to upload files directly from your browser to your own Cloudflare R2 bucket, generating shareable links that automatically expire.

![TempBin Screenshot](public/og-image.png)

## ✨ Features

- **Serverless Architecture**: Runs entirely in the browser. No backend server required.
- **Own Your Data**: Connects directly to your Cloudflare R2 bucket. You maintain full control over your files.
- **Secure**: AWS v4 signing is performed locally. Your credentials are stored in your browser's LocalStorage and never sent to any third-party server.
- **Auto-Expiration**: Links are generated with a built-in expiration time. The app also attempts to delete expired files from storage when active.
- **Modern UI**: Clean, responsive interface with Dark/Light mode support.
- **Internationalization**: Support for multiple languages (English, Spanish, French, German, Japanese, Korean, Chinese).
- **Drag & Drop**: Easy file upload interface.

## ⚙️ Configuration

TempBin uses environment variables for configuration. You can create a `.env` file in the root directory to override the defaults.

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_APP_URL` | The public URL of your application | `http://localhost:5173` |
| `VITE_OG_IMAGE_URL` | URL for the Open Graph image (Facebook/LinkedIn) | `http://localhost:5173/og-image.png` |
| `VITE_TWITTER_IMAGE_URL` | URL for the Twitter card image | `http://localhost:5173/twitter-image.png` |

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18 or later)
2.  **Cloudflare R2 Bucket**: You need a Cloudflare account and an R2 bucket.

### R2 Configuration (Crucial!)

Since TempBin runs in the browser, you must configure CORS (Cross-Origin Resource Sharing) on your R2 bucket to allow your browser to upload files directly.

1.  Go to your Cloudflare Dashboard > R2 > Select your bucket.
2.  Go to **Settings** > **CORS Policy**.
3.  Add a policy like this (replace `http://localhost:5173` with your production domain when deploying):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kazeochan/tempbin.git
    cd tempbin
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

5.  **Onboarding**: On the first visit, you will be prompted to enter your Cloudflare R2 credentials:
    *   **Account ID**: Found in the Cloudflare R2 dashboard sidebar.
    *   **Access Key ID**: Create an API token with "Object Read & Write" permissions.
    *   **Secret Access Key**: The secret key for the token.
    *   **Bucket Name**: The name of the bucket you created.
    *   **Public URL (Optional)**: If you have a custom domain connected to your bucket.

## 🛠️ Building & Deployment

TempBin is a static application, so it can be hosted on any static site provider.

### Build

To create a production build:

```bash
npm run build
```

This will generate a `dist` folder containing the static assets.

### Deploy to Vercel

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` inside the project folder.
3.  Follow the prompts. Vercel will automatically detect the Vite settings.

### Deploy to Cloudflare Pages

1.  Connect your GitHub repository to Cloudflare Pages.
2.  Select **Vite** as the framework preset.
3.  Build command: `npm run build`
4.  Output directory: `dist`

### Deploy to Netlify

1.  Drag and drop the `dist` folder to Netlify Drop, or connect your repository.
2.  Build command: `npm run build`
3.  Publish directory: `dist`

## 🔒 Security & Privacy

*   **Credentials**: Your R2 Access Keys are stored in your browser's `localStorage`. They are strictly used to sign requests within the browser and are never transmitted to any backend server managed by TempBin.
> [!WARNING]
> Do not use your root Cloudflare account API keys. Instead, create a specific API Token with **Object Read & Write** permissions scoped *only* to the specific bucket you are using for this application. This limits the potential impact if your browser environment is ever compromised.
*   **File Access**: Files are uploaded directly to R2.
*   **Expiration**:
    *   **Links**: The generated download links are "presigned URLs" that expire after a set time (default 10 minutes).
    *   **Files**: The application attempts to delete expired files when you have the app open. 
    *   **Recommendation**: Set up an Object Lifecycle Rule in your R2 bucket settings to automatically delete files after 1 day as a fallback to ensure storage cleanup.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
