// @shared
import { jsx } from "@app/html-jsx"
import TelegramPublisherForm from './pages/TelegramPublisherForm.vue'

// Use export to access index route in components and other modules
export const indexPageRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Telegram Channel Publisher</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/metric/clarity.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <style type="text/tailwindcss">{`
          body {
            --color-primary: #0088cc;
            --color-secondary: #1976d2;
            --color-accent: #2196f3;
            --color-dark: #212121;
            --color-light: #f5f5f5;
            --color-success: #4caf50;
            --color-danger: #f44336;
            --color-warning: #ff9800;
            --color-info: #2196f3;
            --color-telegram-bg: #0f1419;
            --color-telegram-message: #182533;
            --color-telegram-text: #ffffff;
            --color-telegram-secondary: #8774e1;
            --font-sans: Inter, system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 0;
            font-family: var(--font-sans);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          
          .telegram-preview {
            background: var(--color-telegram-bg);
            border-radius: 12px;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          
          .telegram-message {
            background: var(--color-telegram-message);
            border-radius: 12px;
            padding: 12px 16px;
            color: var(--color-telegram-text);
            margin-bottom: 8px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .telegram-button {
            background: var(--color-telegram-secondary);
            border: none;
            border-radius: 6px;
            color: white;
            padding: 8px 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .telegram-button:hover {
            background: #7c5ce0;
          }
          
          .form-field {
            margin-bottom: 1.5rem;
          }
          
          .form-label {
            display: block;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          
          .form-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(0, 136, 204, 0.1);
          }
          
          .form-textarea {
            min-height: 120px;
            resize: vertical;
            font-family: inherit;
          }
          
          .formatting-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            padding: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
          }
          
          .formatting-button {
            padding: 6px 10px;
            border: 1px solid #dee2e6;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          
          .formatting-button:hover {
            background: #e9ecef;
          }
          
          .formatting-button.active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
          }
          
          .char-counter {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
          }
          
          .char-counter.warning {
            color: var(--color-warning);
          }
          
          .char-counter.error {
            color: var(--color-danger);
          }
          
          .file-upload-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            transition: border-color 0.2s, background-color 0.2s;
            cursor: pointer;
          }
          
          .file-upload-area:hover {
            border-color: var(--color-primary);
            background-color: rgba(0, 136, 204, 0.05);
          }
          
          .file-upload-area.dragover {
            border-color: var(--color-primary);
            background-color: rgba(0, 136, 204, 0.1);
          }
          
          .btn-primary {
            background: var(--color-primary);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
          }
          
          .btn-primary:hover {
            background: #0077b3;
            transform: translateY(-1px);
          }
          
          .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
          }
          
          .error-message {
            color: var(--color-danger);
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
          
          .success-message {
            color: var(--color-success);
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
        `}</style>
      </head>
      <body>
        <TelegramPublisherForm />
      </body>
    </html>
  )
})