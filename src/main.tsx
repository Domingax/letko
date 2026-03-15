import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDb } from '@/shared/db'
import { runMigrations } from '@/shared/db/migrate'
import { seedLanguages } from '@/shared/db/seed-languages'

function showError(message: string) {
  const el = document.getElementById('root')!
  const p = document.createElement('p')
  p.style.cssText = 'color:red;padding:1rem'
  p.textContent = message
  el.replaceChildren(p)
}

export async function start() {
  const db = await initDb()
  if (db.isErr()) {
    showError(`Database initialization failed: ${db.error}`)
    return
  }

  const migrations = await runMigrations()
  if (migrations.isErr()) {
    showError(`Database migration failed: ${migrations.error}`)
    return
  }

  const seed = await seedLanguages()
  if (seed.isErr()) {
    showError(`Database seed failed: ${seed.error}`)
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
