import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function MagicLinkAuth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (!error) setSent(true)
  }

  if (sent) return <div>✅ Check {email} for magic link</div>

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button disabled={loading}>
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
    </form>
  )
}
