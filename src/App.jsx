import { useEffect, useMemo, useState } from 'react'
import { COUNTRIES, LANGS, RTL_LANGS, CURRENCIES, FALLBACK_RATES, LIVE_RATES_URL, PRODUCTS, I18N } from './data'

const load = (k, d) => { try { return localStorage.getItem(k) || d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

function detectCountry() {
  const saved = load('pt_country', '')
  if (saved && COUNTRIES[saved]) return saved
  const region = (navigator.language || 'en-US').split('-')[1]?.toUpperCase()
  return COUNTRIES[region] ? region : 'US'
}

function useRates() {
  const [state, setState] = useState({ rates: FALLBACK_RATES, live: false })
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('pt_rates') || 'null')
      if (c && Date.now() - c.t < 12 * 3600e3) { setState({ rates: c.rates, live: true }); return }
    } catch {}
    fetch(LIVE_RATES_URL).then(r => r.json()).then(d => {
      if (!d.rates) return
      const rates = Object.fromEntries(CURRENCIES.map(c => [c, d.rates[c] ?? FALLBACK_RATES[c]]))
      save('pt_rates', JSON.stringify({ t: Date.now(), rates }))
      setState({ rates, live: true })
    }).catch(() => {})
  }, [])
  return state
}

export default function App() {
  const [country, setCountry] = useState(detectCountry)
  const [lang, setLang] = useState(() => load('pt_lang', '') || COUNTRIES[detectCountry()].lang)
  const [currency, setCurrency] = useState(() => load('pt_cur', '') || COUNTRIES[detectCountry()].currency)
  const [tab, setTab] = useState('all')
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState(null) // product id or 'general'
  const [calc, setCalc] = useState({ id: 'flowers', tons: 15 })
  const { rates, live } = useRates()

  const t = useMemo(() => ({ ...I18N.en, ...I18N[lang] }), [lang])
  const rtl = RTL_LANGS.includes(lang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [lang, rtl])

  const pickCountry = (code) => {
    const c = COUNTRIES[code]
    setCountry(code); setLang(c.lang); setCurrency(c.currency)
    save('pt_country', code); save('pt_lang', c.lang); save('pt_cur', c.currency)
  }
  const pickLang = (v) => { setLang(v); save('pt_lang', v) }
  const pickCur = (v) => { setCurrency(v); save('pt_cur', v) }

  const money = (usd, digits = 2) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency, maximumFractionDigits: digits })
      .format(usd * (rates[currency] ?? 1))

  const name = (id) => t['p_' + id] || I18N.en['p_' + id]
  const desc = (id) => t['p_' + id + '_d'] || I18N.en['p_' + id + '_d']
  const shown = tab === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.id === tab)

  const cp = PRODUCTS.find(p => p.id === calc.id)
  const tons = Math.max(0, Number(calc.tons) || 0)
  const container = tons <= 12 ? t.c20 || I18N.en.c20 : tons <= 26 ? t.c40 || I18N.en.c40 : t.cMulti || I18N.en.cMulti
  const stats = [['18+', t.s1], ['34+', t.s2], ['99.8%', t.s3], ['500+', t.s4]]

  const submit = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target))
    const body = `Product: ${f.product}\nName: ${f.name}\nCompany: ${f.company}\nEmail: ${f.email}\nPhone: ${f.phone}\nDetails: ${f.details}`
    window.location.href = `mailto:info@pengiatrades.com?subject=${encodeURIComponent('RFQ: ' + f.product)}&body=${encodeURIComponent(body)}`
    setModal(null)
  }

  return (
    <>
      <div className="util">
        <div className="wrap util-in">
          <a href="mailto:info@pengiatrades.com">info@pengiatrades.com</a>
          <div className="pickers">
            <label>{t.country}
              <select value={country} onChange={e => pickCountry(e.target.value)}>
                {Object.entries(COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.flag} {c.name}</option>)}
              </select>
            </label>
            <label>{t.language}
              <select value={lang} onChange={e => pickLang(e.target.value)}>
                {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>{t.currency}
              <select value={currency} onChange={e => pickCur(e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <header className="head">
        <div className="wrap head-in">
          <a className="brand" href="#top"><span className="mark">P</span><span>Pengia Trades</span></a>
          <nav className={menu ? 'nav open' : 'nav'}>
            <a href="#catalog" onClick={() => setMenu(false)}>{t.navProducts}</a>
            <a href="#calc" onClick={() => setMenu(false)}>{t.navCalc}</a>
            <a href="#contact" onClick={() => setMenu(false)}>{t.navContact}</a>
          </nav>
          <button className="btn small" onClick={() => setModal('general')}>{t.rfq}</button>
          <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? '✕' : '☰'}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-in">
            <div>
              <p className="badge">{t.badge}</p>
              <h1>{t.heroTitle}</h1>
              <p className="lead">{t.heroSub}</p>
              <div className="row">
                <button className="btn" onClick={() => setModal('general')}>{t.rfq}</button>
                <a className="btn ghost" href="#catalog">{t.explore}</a>
              </div>
            </div>
            <figure className="hero-img">
              <img src={PRODUCTS[0].img} alt="Sun-dried Mahua flowers" />
            </figure>
          </div>
          <div className="wrap stats">
            {stats.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
          </div>
        </section>

        <section id="catalog" className="wrap sec">
          <h2>{t.catTitle}</h2>
          <p className="sub">{t.catSub}</p>
          <div className="tabs" role="tablist">
            {['all', ...PRODUCTS.map(p => p.id)].map(id => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'tab on' : 'tab'} onClick={() => setTab(id)}>{t[id]}</button>
            ))}
          </div>
          <div className="grid">
            {shown.map(p => (
              <article className="card" key={p.id}>
                <img src={p.img} alt={name(p.id)} loading="lazy" />
                <div className="card-b">
                  <h3>{name(p.id)}</h3>
                  <p>{desc(p.id)}</p>
                  <dl>
                    <div><dt>{t.moq}</dt><dd>{p.moq}</dd></div>
                    <div><dt>{t.moisture}</dt><dd>{p.moisture}</dd></div>
                    <div><dt>{t.hs}</dt><dd>{p.hs}</dd></div>
                  </dl>
                  <div className="price">
                    <div><small>{t.from}</small><strong>{money(p.priceUsdPerKg)}</strong> <small>{t.perKg}</small></div>
                    <button className="btn small" onClick={() => setModal(p.id)}>{t.ask}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="note">{t.indicative} <span className={live ? 'dot live' : 'dot'}>{live ? t.live : t.offline}</span></p>
        </section>

        <section id="calc" className="calc-sec">
          <div className="wrap calc">
            <div>
              <h2>{t.calcTitle}</h2>
              <p className="sub left">{t.calcSub}</p>
            </div>
            <div className="calc-box">
              <label>{t.calcProduct}
                <select value={calc.id} onChange={e => setCalc({ ...calc, id: e.target.value })}>
                  {PRODUCTS.map(p => <option key={p.id} value={p.id}>{name(p.id)}</option>)}
                </select>
              </label>
              <label>{t.calcTons}
                <input type="number" min="1" max="200" inputMode="decimal" value={calc.tons} onChange={e => setCalc({ ...calc, tons: e.target.value })} />
              </label>
              <dl className="result">
                <div><dt>{t.calcVol}</dt><dd>{(tons * cp.cbmPerTon).toFixed(1)} CBM</dd></div>
                <div><dt>{t.calcCont}</dt><dd>{container}</dd></div>
                <div><dt>{t.calcVal}</dt><dd>{money(tons * 1000 * cp.priceUsdPerKg, 0)}</dd></div>
              </dl>
              <button className="btn" onClick={() => setModal(calc.id)}>{t.rfq}</button>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="foot">
        <div className="wrap foot-in">
          <div><h4>Pengia Trades Private Limited</h4><p>{t.footDesc}</p></div>
          <div><h4>{t.desk}</h4>
            <p>{t.inquiries}<br /><a href="mailto:info@pengiatrades.com">info@pengiatrades.com</a></p>
            <p>{t.logistics}<br /><a href="mailto:support@pengiatrades.com">support@pengiatrades.com</a></p>
            <p><a href="tel:+919876543210">+91 98765 43210</a></p></div>
          <div><h4>{t.compliance}</h4><p>{t.certs}</p><p className="small">{t.pay}</p></div>
        </div>
        <p className="wrap copy">© {new Date().getFullYear()} Pengia Trades Private Limited</p>
      </footer>

      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
            <button type="button" className="x" aria-label="Close" onClick={() => setModal(null)}>✕</button>
            <h3>{t.formTitle}</h3>
            <p className="small">{t.formNote || I18N.en.formNote}</p>
            <label>{t.fProduct}
              <select name="product" defaultValue={modal === 'general' ? 'flowers' : modal}>
                {PRODUCTS.map(p => <option key={p.id} value={name(p.id)}>{name(p.id)}</option>)}
              </select>
            </label>
            <label>{t.fName}<input required name="name" autoComplete="name" /></label>
            <label>{t.fCompany}<input required name="company" autoComplete="organization" /></label>
            <label>{t.fEmail}<input required type="email" name="email" autoComplete="email" /></label>
            <label>{t.fPhone}<input required name="phone" autoComplete="tel" /></label>
            <label>{t.fDetails}<textarea name="details" rows="3" /></label>
            <button className="btn" type="submit">{t.send}</button>
          </form>
        </div>
      )}
    </>
  )
}
