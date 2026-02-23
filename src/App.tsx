import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
]

const DEFAULT_BASE_URL =
  import.meta.env.VITE_VENDOR_PORTAL_BASE_URL?.trim() ?? ''

const DEFAULT_LANGUAGE = import.meta.env.VITE_VENDOR_PORTAL_LANG ?? 'en'

const SECTIONS = [
  {
    id: 'customers',
    label: 'Customers',
    subtabs: [
      { id: 'overview', label: 'Overview', path: '/customers/overview' },
      { id: 'exports', label: 'Exports', path: '/customers/exports' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    subtabs: [
      { id: 'overview', label: 'Overview', path: '/transactions/list' },
      { id: 'exports', label: 'Exports', path: '/transactions/downloads' },
    ],
  },
  {
    id: 'card-machines',
    label: 'Card machines',
    subtabs: [
      {
        id: 'all',
        label: 'All card machines',
        path: '/card-machines/card-machines',
      },
      {
        id: 'customise',
        label: 'Customise',
        path: '/card-machines/customise',
      },
    ],
  },
] as const

type Section = (typeof SECTIONS)[number]
type Subtab = Section['subtabs'][number]

const buildIframeUrl = (baseUrl: string, path: string, lang: string) => {
  if (!baseUrl) {
    return ''
  }

  try {
    const url = new URL(baseUrl)
    url.pathname = path.startsWith('/') ? path : `/${path}`
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
  const [activeSectionId, setActiveSectionId] =
    useState<Section['id']>('customers')
  const [activeSubtabId, setActiveSubtabId] =
    useState<Subtab['id']>('overview')

  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const trimmedBaseUrl = baseUrl.trim()

  const currentSection: Section =
    SECTIONS.find((section) => section.id === activeSectionId) ?? SECTIONS[0]

  const currentSubtab: Subtab =
    currentSection.subtabs.find((subtab) => subtab.id === activeSubtabId) ??
    currentSection.subtabs[0]

  const iframeUrl = useMemo(
    () => buildIframeUrl(trimmedBaseUrl, currentSubtab.path, language),
    [trimmedBaseUrl, currentSubtab.path, language]
  )

  const validationMessage =
    trimmedBaseUrl.length === 0
      ? 'Enter the URL to load the iframe.'
      : iframeUrl.length === 0
        ? 'URL must be a full URL (include https://).'
        : ''

  const handleSectionClick = (section: Section) => {
    setActiveSectionId(section.id)
    setActiveSubtabId(section.subtabs[0]?.id ?? 'overview')
  }

  const handleSubtabClick = (section: Section, subtab: Subtab) => {
    setActiveSectionId(section.id)
    setActiveSubtabId(subtab.id)
  }

  useEffect(() => {
    if (!trimmedBaseUrl) return

    let vendorOrigin: string
    try {
      vendorOrigin = new URL(trimmedBaseUrl).origin
    } catch {
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== vendorOrigin) return
      if (!event.data || typeof event.data !== 'object') return

      const { type, url, lang } = event.data as {
        type?: string
        url?: string
        lang?: string
      }

      console.log('Received message from iframe', { event, url, lang })

      if (type === 'ZEAL_IFRAME_READY') {
        const token = '<your-login-token-here>'

        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ZEAL_IFRAME_TOKEN', token },
          vendorOrigin
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [trimmedBaseUrl])

  return (
    <div className="app">
      <header className="topbar">
        <input
          className="navInput"
          type="url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://staging.vendor-portal.example.com"
        />

        <select
          className="navSelect"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {LANGUAGES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="topbarUrl">
          <div className="urlPreview">
            {iframeUrl ||
              'Iframe URL will appear here once the base URL is valid.'}
          </div>
          {iframeUrl ? (
            <a
              href={iframeUrl}
              target="_blank"
              rel="noreferrer"
              className="openLink"
            >
              Open
            </a>
          ) : null}
        </div>
      </header>

      <div className="contentLayout">
        <aside className="sidebar">
          {SECTIONS.map((section) => (
            <div key={section.id} className="sidebarSection">
              <button
                type="button"
                className="sidebarSectionButton"
                data-active={section.id === currentSection.id}
                onClick={() => handleSectionClick(section)}
              >
                {section.label}
              </button>
              <div className="sidebarSubtabs">
                {section.subtabs.map((subtab) => (
                  <button
                    key={subtab.id}
                    type="button"
                    className="sidebarSubtabButton"
                    data-active={
                      section.id === currentSection.id &&
                      subtab.id === currentSubtab.id
                    }
                    onClick={() => handleSubtabClick(section, subtab)}
                  >
                    {subtab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="iframeLayout" role="tabpanel">
          {iframeUrl ? (
            <iframe
              key={iframeUrl}
              className="iframe"
              id="zeal-vendor-iframe"
              ref={iframeRef}
              src={iframeUrl}
              title="Vendor portal iframe"
            />
          ) : (
            <div className="emptyState">
              <p className="emptyTitle">Iframe not loaded</p>
              <p className="emptyHint">{validationMessage}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
