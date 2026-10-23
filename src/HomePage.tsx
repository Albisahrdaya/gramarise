
import { useState } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Search,
  Users,
  TrendingUp,
  Handshake,
  Sprout,
  Menu,
  X,
} from 'lucide-react'
import './App.css'


const opportunities = [
  {
    icon: BriefcaseBusiness,
    title: 'Find Local Jobs',
    description:
      'Discover job openings and career opportunities close to home.',
    link: 'Explore jobs',
    href: '/jobs',
  },
  {
    icon: Users,
    title: 'Discover Local Talent',
    description:
      'Connect with skilled people, graduates, and experienced professionals.',
    link: 'Explore talent',
    href: '/talent',
  },
  {
    icon: Building2,
    title: 'Find Land & Property',
    description:
      'Explore spaces available for businesses, offices, and new ventures.',
    link: 'View properties',
    href: '/land',
  },
  {
    icon: Handshake,
    title: 'Grow Local Businesses',
    description:
      'Discover local businesses and connect with people ready to collaborate.',
    link: 'Explore businesses',
    href: '/businesses',
  },
  {
    icon: Sprout,
    title: 'Join GramaRise',
    description:
      'Create your resident profile, showcase your skills, and become part of village growth.',
    link: 'Create your profile',
    href: '/profile',
  },
  {
    icon: Building2,
    title: 'Hire Local Talent',
    description:
      'Register your business, get verified, and publish job opportunities.',
    link: 'Register as employer',
    href: '/employer/register',
  },
]


function App() {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon"><Sprout size={25} /></span>
          <span>Grama<span className="brand-accent">Rise</span>
            <small>GROWING TOGETHER</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        
<nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'}>
  <a href="#opportunities" onClick={() => setMenuOpen(false)}>
    Explore
  </a>
  <a href="/jobs" onClick={() => setMenuOpen(false)}>
    Find Jobs
  </a>
  <a href="/employer/register" onClick={() => setMenuOpen(false)}>
    For Employers
  </a>
  <a href="#about" onClick={() => setMenuOpen(false)}>
    About Us
  </a>
  <a
    className="nav-cta"
    href="/profile"
    onClick={() => setMenuOpen(false)}
  >
    Join GramaRise <ArrowRight size={16} />
  </a>
</nav>

      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              A NEW CHAPTER FOR KADUPASSERY
            </div>

            <h1>
              Great opportunities
              <br />
              can <span>grow right here.</span>
            </h1>

            <p className="hero-description">
              Connecting local talent, businesses, and property to build
              a stronger future for our village. Your next opportunity
              might be closer than you think.
            </p>

            <form
              className="search-box"
              onSubmit={(event) => {
                event.preventDefault()
                document.getElementById('opportunities')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }}
            >
              <Search size={21} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="What opportunity are you looking for?"
                aria-label="Search opportunities"
              />
              <button type="submit">Explore <ArrowRight size={17} /></button>
              
<div className="hero-actions">
  <a href="/jobs" className="hero-action-primary">
    <BriefcaseBusiness size={18} />
    Find a Job
    <ArrowRight size={16} />
  </a>

  <a href="/employer/register" className="hero-action-secondary">
    <Building2 size={18} />
    Hire Local Talent
  </a>
</div>

            </form>

            <div className="hero-note">
              <MapPin size={16} />
              <span>Made for Kadupassery. Built for a better tomorrow.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-card main-visual-card">
              <div className="visual-card-top">
                <span className="mini-icon"><Sprout size={22} /></span>
                <span className="live-label"><span /> LOCAL GROWTH</span>
              </div>
              <div className="growth-illustration">
                <div className="growth-sun" />
                <div className="hill hill-back" />
                <div className="hill hill-front" />
                <Sprout className="large-sprout" size={95} strokeWidth={1.2} />
              </div>
              <h3>Rooted in community.</h3>
              <p>Growing with opportunity.</p>
              <div className="visual-card-footer">
                <span><Users size={15} /> Local people</span>
                <span><TrendingUp size={15} /> Shared progress</span>
              </div>
            </div>
            <div className="floating-card floating-top">
              <span className="float-icon"><BriefcaseBusiness size={19} /></span>
              <div><strong>Local talent</strong><small>Skills meet opportunity</small></div>
            </div>
            <div className="floating-card floating-bottom">
              <span className="float-icon property-icon"><Building2 size={19} /></span>
              <div><strong>Business-ready spaces</strong><small>Build something here</small></div>
            </div>
          </div>
          <div className="hero-decoration decoration-one" />
          <div className="hero-decoration decoration-two" />
        </section>

        <section className="opportunities section" id="opportunities">
          <div className="section-heading">
            <div>
              <span className="section-kicker">ONE VILLAGE. MANY POSSIBILITIES.</span>
              <h2>What would you like to <span>discover?</span></h2>
            </div>
            <p>Whether you're looking for work, talent, land, or ways to grow your business, start here.</p>
          </div>

          <div className="opportunity-grid">
            {opportunities.map((item) => {
              const Icon = item.icon
              return (
                <article className="opportunity-card" key={item.title}>
                  <div className="opportunity-icon"><Icon size={25} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a href={item.href} className="card-link">
                    {item.link} <ArrowRight size={16} />
                  </a>
                </article>
              )
            })}
          </div>
        </section>

        <section className="community-section" id="about">
          <div className="community-mark"><Sprout size={36} /></div>
          <div>
            <span className="section-kicker">PROGRESS STARTS LOCALLY</span>
            <h2>A village that grows when its people grow.</h2>
            <p>
              GramaRise brings people and opportunities together, helping local
              skills find meaningful work and local spaces become places for
              new ideas and businesses.
            </p>
          </div>
          <a href="#get-started" className="community-link">
            Be part of the change <ArrowRight size={17} />
          </a>
        </section>

        <section className="impact-section section" id="impact">
          <span className="section-kicker">OUR VISION</span>
          <h2>Build opportunity <span>closer to home.</span></h2>
          <p>
            A connected local economy begins with people, useful information,
            and the right connections. Let's create more reasons to grow here.
          </p>
          <div className="impact-points">
            <div><Users size={22} /><strong>Empower local talent</strong></div>
            <div><Building2 size={22} /><strong>Unlock local spaces</strong></div>
            <div><TrendingUp size={22} /><strong>Support local growth</strong></div>
          </div>
        </section>

        <section className="get-started" id="get-started">
          <div>
            <span className="section-kicker">YOUR VILLAGE. YOUR FUTURE.</span>
            <h2>Let's grow something meaningful.</h2>
            <p>Every connection can be the beginning of a new opportunity.</p>
          </div>
          <a href="mailto:hello@gramarise.in" className="get-started-button">
            Get in touch <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-icon"><Sprout size={23} /></span>
          <span>Grama<span className="brand-accent">Rise</span>
            <small>GROWING TOGETHER</small>
          </span>
        </a>
        <p>Growing villages. Creating opportunities.</p>
        <span className="footer-location"><MapPin size={14} /> Kadupassery, Kerala</span>
        <span className="copyright">© {new Date().getFullYear()} GramaRise</span>
      </footer>
    </div>
  )
}

export default App
