import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from './i18n'
import { App } from './App'
import './styles.css'
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <main className="phone">
        <h1>{i18n.t('errors.root')}</h1>
        <button onClick={() => location.reload()}>{i18n.t('reload')}</button>
      </main>
    ) : (
      this.props.children
    )
  }
}
createRoot(document.getElementById('root')!).render(
  <Boundary>
    <App />
  </Boundary>,
)
