import { useMemo, useState } from 'react'
import './App.css'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
]

const DEFAULT_BASE_URL =
  import.meta.env.VITE_VENDOR_PORTAL_BASE_URL?.trim() ?? ''

const DEFAULT_LANGUAGE = import.meta.env.VITE_VENDOR_PORTAL_LANG ?? 'en'

const buildIframeUrl = (baseUrl: string, lang: string) => {
  if (!baseUrl) {
    return ''
  }

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('lang', lang)
    url.searchParams.set('embed', '1')
    return url.toString()
  } catch {
    return ''
  }
}

function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)

  const trimmedBaseUrl = baseUrl.trim()
  const iframeUrl = useMemo(
    () => buildIframeUrl(trimmedBaseUrl, language),
    [trimmedBaseUrl, language]
  )

  const validationMessage =
    trimmedBaseUrl.length === 0
      ? 'Enter the URL to load the iframe.'
      : iframeUrl.length === 0
        ? 'URL must be a full URL (include https://).'
        : ''

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Zeal vendor portal</p>
          <h1>Iframe embedding POC</h1>
          <p className="subtitle">
            Test vendor portal pages embedded in an iframe with language
            parameters.
          </p>
        </div>
        <div className="tags">
          <span className="tag">embed=1</span>
          <span className="tag">lang param</span>
        </div>
      </header>

      <section className="controls">
        <label className="field">
          <span className="fieldLabel">URL</span>
          <input
            type="url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://staging.vendor-portal.example.com"
          />
          <span className="fieldHint">
            Full URL for the vendor portal app (include https://).
          </span>
        </label>

        <label className="field">
          <span className="fieldLabel">Language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="fieldHint">
            Sent as <code>lang</code> query parameter.
          </span>
        </label>

        <div className="field">
          <span className="fieldLabel">Embed indicator</span>
          <div className="pill">embed=1</div>
          <span className="fieldHint">
            Lets the portal know it is rendered inside an iframe.
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Iframe URL</h2>
            <p className="panelDescription">
              Generated from the URL input without overriding subpaths.
            </p>
          </div>
          {iframeUrl ? (
            <a href={iframeUrl} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          ) : null}
        </div>
        <div className="urlPreview">
          {iframeUrl || 'Iframe URL will appear here once the base URL is valid.'}
        </div>
      </section>

      <section className="iframeCard" role="tabpanel">
        {iframeUrl ? (
          <iframe
            key={iframeUrl}
            className="iframe"
            src={iframeUrl}
            title="Vendor portal iframe"
          />
        ) : (
          <div className="emptyState">
            <p className="emptyTitle">Iframe not loaded</p>
            <p className="emptyHint">{validationMessage}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
