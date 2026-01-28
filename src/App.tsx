import { useMemo, useState } from 'react'
import './App.css'

type ViewConfig = {
  id: string
  label: string
  description: string
}

const VIEWS: ViewConfig[] = [
  {
    id: 'loyalty',
    label: 'Loyalty',
    description: 'Rewards and loyalty program configuration.',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Payment history and transaction monitoring.',
  },
  {
    id: 'terminal-customization',
    label: 'Terminal customization',
    description: 'Branding, receipts, and terminal settings.',
  },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
]

const DEFAULT_BASE_URL =
  import.meta.env.VITE_VENDOR_PORTAL_BASE_URL?.trim() ?? ''

const DEFAULT_LANGUAGE = import.meta.env.VITE_VENDOR_PORTAL_LANG ?? 'en'

const buildIframeUrl = (baseUrl: string, view: string, lang: string) => {
  if (!baseUrl) {
    return ''
  }

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('lang', lang)
    url.searchParams.set('view', view)
    url.searchParams.set('embed', '1')
    return url.toString()
  } catch {
    return ''
  }
}

function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [activeView, setActiveView] = useState(VIEWS[0].id)

  const trimmedBaseUrl = baseUrl.trim()
  const iframeUrl = useMemo(
    () => buildIframeUrl(trimmedBaseUrl, activeView, language),
    [trimmedBaseUrl, activeView, language]
  )

  const activeViewConfig =
    VIEWS.find((view) => view.id === activeView) ?? VIEWS[0]

  const validationMessage =
    trimmedBaseUrl.length === 0
      ? 'Enter a staging base URL to load the iframe.'
      : iframeUrl.length === 0
        ? 'Base URL must be a full URL (include https://).'
        : ''

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Zeal vendor portal</p>
          <h1>Iframe embedding POC</h1>
          <p className="subtitle">
            Test vendor portal pages embedded in an iframe with view and
            language parameters.
          </p>
        </div>
        <div className="tags">
          <span className="tag">embed=1</span>
          <span className="tag">view param</span>
          <span className="tag">lang param</span>
        </div>
      </header>

      <section className="controls">
        <label className="field">
          <span className="fieldLabel">Staging base URL</span>
          <input
            type="url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://staging.vendor-portal.example.com"
          />
          <span className="fieldHint">
            Root URL for the vendor portal app (include https://).
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

      <div className="tabs" role="tablist" aria-label="Vendor portal views">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={view.id === activeView}
            data-active={view.id === activeView}
            className="tabButton"
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>{activeViewConfig.label}</h2>
            <p className="panelDescription">{activeViewConfig.description}</p>
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
            title={`${activeViewConfig.label} view`}
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
