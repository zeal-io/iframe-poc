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
        id: 'customise',
        label: 'Customise',
        path: '/card-machines/customise',
      },
    ],
  },
] as const

type Section = (typeof SECTIONS)[number]
type Subtab = Section['subtabs'][number]

type ThirdPartyAuthResponse = {
  token?: string
  refresh_token?: string | null
  expires_at?: string | null
}

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
  const [token, setToken] = useState('2vu6txLPYjdNZr6AtmAfv5vjRPYxP9Thc6ygdEyeJngzDREt2XAvXL5VUJykvTyC')
  const [merchantId, setMerchantId] = useState('46086c91-68f5-4a5a-bed5-cab009e99134')
  const [authTokens, setAuthTokens] = useState<ThirdPartyAuthResponse | null>(null)
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

      const { type } = event.data as {
        type?: string
        url?: string
        lang?: string
      }

      if (type === 'ZEAL_IFRAME_READY' && authTokens?.token) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ZEAL_IFRAME_TOKEN', ...authTokens },
          vendorOrigin
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [trimmedBaseUrl, authTokens])

  const handleAuthenticate = async () => {
    if (!trimmedBaseUrl || !token || !merchantId) {
      return
    }

    
    // setAuthTokens({ token: '50652|IqwfZrNHTBH6HxoTTC6UfqI6d5JfEyKrgzg6j6hHb40247d0'})
    // iframeRef.current?.contentWindow?.postMessage(
    //     { type: 'ZEAL_IFRAME_TOKEN', token: '50652|IqwfZrNHTBH6HxoTTC6UfqI6d5JfEyKrgzg6j6hHb40247d0' },
    //     trimmedBaseUrl
    //   )
    // return

    const apiBase =
      (import.meta.env.VITE_PUBLIC_VENDOR_URL as string | undefined)?.trim() ||
      trimmedBaseUrl

    let apiUrl: string
    try {
      apiUrl = new URL(
        '/api/third-party/auth-token',
        apiBase
      ).toString()
    } catch {
      console.error('Invalid vendor API base URL', apiBase)
      return
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ merchant_id: merchantId }),
      })

      if (!response.ok) {
        console.error('Auth token request failed', response.status)
        return
      }

      const data: ThirdPartyAuthResponse = await response.json()
      setAuthTokens(data)

      let vendorOrigin: string
      try {
        vendorOrigin = new URL(trimmedBaseUrl).origin
      } catch {
        return
      }

      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ZEAL_IFRAME_TOKEN', ...data },
        vendorOrigin
      )
    } catch (error) {
      console.error('Auth token request error', error)
    }
  }

  useEffect(() => {
    if (!trimmedBaseUrl || !token.trim() || !merchantId.trim()) return
    handleAuthenticate()
    // Only re-auth when base URL changes; token/merchantId are read from closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedBaseUrl])

  return (
    <div className="app">
      <header className="topbar">
        <input
          className="navInput navInput-base-url"
          type="url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://staging.vendor-portal.example.com"
        />

        <input
          className="navInput navInput--token"
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Token"
        />

        <input
          className="navInput navInput--merchant"
          type="text"
          value={merchantId}
          onChange={(event) => setMerchantId(event.target.value)}
          placeholder="Merchant ID"
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
