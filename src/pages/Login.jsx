import { useState, useEffect } from 'react'
import { login } from '../firebase/auth'

const FinanceSVG = () => (
  <svg width="78" height="30" viewBox="0 0 13 5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M-3.03984e-06 4V-5.96046e-08H1.3925V0.38H0.422497V1.795H1.3425V2.175H0.422497V4H-3.03984e-06ZM1.68375 4V0.52H2.10875V4H1.68375ZM2.64078 4V0.52H3.34078L3.57328 1.6225L3.96828 3.6475H4.08328L4.02078 1.8275L3.99328 0.52H4.38828V4H3.68578L3.42578 2.7825L3.07078 0.8725H2.94828L3.00828 2.6875L3.03828 4H2.64078ZM4.75617 4L5.24617 0.52H5.95367L6.44117 4H6.02367L5.91367 3.0775H5.28367L5.17617 4H4.75617ZM5.32867 2.72H5.87117L5.78117 1.9575L5.66117 0.8725H5.53617L5.41867 1.96L5.32867 2.72ZM6.81558 4V0.52H7.51558L7.74808 1.6225L8.14308 3.6475H8.25808L8.19558 1.8275L8.16808 0.52H8.56308V4H7.86058L7.60058 2.7825L7.24558 0.8725H7.12308L7.18308 2.6875L7.21308 4H6.81558ZM9.81847 4.0375C9.54847 4.0375 9.35514 3.98583 9.23847 3.8825C9.12347 3.77917 9.06181 3.60917 9.05347 3.3725C9.05014 3.1625 9.04681 2.96333 9.04347 2.775C9.04181 2.58667 9.04097 2.4025 9.04097 2.2225C9.04097 2.0425 9.04181 1.86417 9.04347 1.6875C9.04681 1.51083 9.05014 1.33083 9.05347 1.1475C9.05847 0.9325 9.12097 0.769166 9.24097 0.6575C9.36264 0.544167 9.55347 0.4875 9.81347 0.4875C10.0768 0.4875 10.2685 0.5375 10.3885 0.6375C10.5101 0.7375 10.5751 0.899167 10.5835 1.1225C10.5868 1.19083 10.5885 1.26417 10.5885 1.3425C10.5901 1.42083 10.5901 1.49667 10.5885 1.57C10.5885 1.64333 10.5876 1.70583 10.586 1.7575H10.176C10.1776 1.70083 10.1785 1.6375 10.1785 1.5675C10.1801 1.4975 10.181 1.4225 10.181 1.3425C10.181 1.26083 10.1801 1.175 10.1785 1.085C10.1785 0.991667 10.1485 0.924167 10.0885 0.8825C10.0285 0.839167 9.93681 0.8175 9.81347 0.8175C9.69847 0.8175 9.61181 0.838333 9.55347 0.88C9.49681 0.921667 9.46681 0.99 9.46347 1.085C9.45514 1.31 9.44931 1.55833 9.44597 1.83C9.44431 2.1 9.44514 2.37417 9.44847 2.6525C9.45181 2.93083 9.45681 3.19333 9.46347 3.44C9.46681 3.53 9.49597 3.59667 9.55097 3.64C9.60764 3.68167 9.69681 3.7025 9.81847 3.7025C9.95181 3.7025 10.0476 3.68167 10.106 3.64C10.166 3.59833 10.1968 3.53167 10.1985 3.44C10.2035 3.295 10.2043 3.16917 10.201 3.0625C10.1993 2.95417 10.1976 2.8425 10.196 2.7275H10.6085C10.6118 2.81583 10.6143 2.91667 10.616 3.03C10.6176 3.14333 10.616 3.25667 10.611 3.37C10.601 3.605 10.5351 3.775 10.4135 3.88C10.2918 3.985 10.0935 4.0375 9.81847 4.0375ZM11.0587 4V0.52H12.3862V0.8725H11.4687V2.065H12.3312V2.4175H11.4687V3.645H12.3862V4H11.0587Z" fill="white" fillOpacity="0.5"/>
  </svg>
)

const KlosrSVG = () => (
  <>
    <style>{`
      @keyframes klosrDraw {
        0% {
          stroke-dashoffset: 50;
        }
        80% {
          fill: url(#kgrad);
        }
        100% {
          stroke-dashoffset: 0;
          fill: url(#kgrad);
        }
      }

      .klosr-path {
        fill: transparent;
        stroke: url(#kgrad);
        stroke-width: 0.1;
        stroke-dasharray: 55.5;
        stroke-dashoffset: 50;
        animation: klosrDraw 5.5s ease-in-out 1 forwards;
      }
    `}</style>
    <svg width="100%" height="100%" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kgrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e9d5ff"/>
          <stop offset="50%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#5b21b6"/>
        </linearGradient>
      </defs>
      <path
        className="klosr-path"
        d="M7.09295e-06 9.6V4.704H0.990007L1.73401 2.076L2.41801 -1.66893e-06H3.37201L0.888007 7.02V9.6H7.09295e-06ZM2.61601 9.6L1.62001 6.15L2.11801 4.902L3.51601 9.6H2.61601ZM7.09295e-06 4.338V-1.66893e-06H0.918007L0.906007 2.1L0.768007 4.338H7.09295e-06ZM4.01898 9.6V1.248H4.84698V9.6H4.01898ZM5.37498 9.6V8.862H6.77898V9.6H5.37498ZM8.68341 9.666C8.20741 9.63 7.86541 9.498 7.65741 9.27C7.45341 9.042 7.34541 8.688 7.33341 8.208C7.32541 7.668 7.31741 7.17 7.30941 6.714C7.30541 6.258 7.30341 5.818 7.30341 5.394C7.30341 4.966 7.30541 4.53 7.30941 4.086C7.31741 3.638 7.32541 3.154 7.33341 2.634C7.34541 2.154 7.45541 1.8 7.66341 1.572C7.87141 1.344 8.21141 1.214 8.68341 1.182V1.89C8.50741 1.918 8.37741 1.98 8.29341 2.076C8.21341 2.172 8.17141 2.314 8.16741 2.502C8.15141 3.054 8.13941 3.564 8.13141 4.032C8.12341 4.496 8.11941 4.95 8.11941 5.394C8.12341 5.834 8.12941 6.292 8.13741 6.768C8.14541 7.244 8.15541 7.77 8.16741 8.346C8.17141 8.534 8.21341 8.676 8.29341 8.772C8.37741 8.868 8.50741 8.93 8.68341 8.958V9.666ZM9.21141 9.666V8.958C9.39141 8.93 9.52141 8.868 9.60141 8.772C9.68541 8.676 9.72941 8.532 9.73341 8.34C9.74541 7.768 9.75341 7.244 9.75741 6.768C9.76541 6.292 9.76941 5.834 9.76941 5.394C9.76941 4.95 9.76541 4.496 9.75741 4.032C9.75341 3.564 9.74541 3.056 9.73341 2.508C9.72941 2.316 9.68541 2.172 9.60141 2.076C9.52141 1.98 9.39141 1.918 9.21141 1.89V1.182C9.68741 1.214 10.0274 1.346 10.2314 1.578C10.4354 1.806 10.5454 2.16 10.5614 2.64C10.5694 3.052 10.5754 3.442 10.5794 3.81C10.5834 4.174 10.5854 4.528 10.5854 4.872C10.5894 5.216 10.5894 5.562 10.5854 5.91C10.5854 6.254 10.5834 6.616 10.5794 6.996C10.5754 7.372 10.5694 7.774 10.5614 8.202C10.5494 8.682 10.4394 9.038 10.2314 9.27C10.0274 9.498 9.68741 9.63 9.21141 9.666ZM13.399 9.666V8.958C13.575 8.926 13.701 8.86 13.777 8.76C13.857 8.656 13.905 8.508 13.921 8.316C13.937 8.064 13.943 7.824 13.939 7.596C13.935 7.368 13.929 7.116 13.921 6.84C13.909 6.592 13.865 6.384 13.789 6.216C13.717 6.048 13.565 5.938 13.333 5.886L12.685 5.742C12.377 5.67 12.139 5.564 11.971 5.424C11.807 5.284 11.693 5.102 11.629 4.878C11.565 4.65 11.527 4.374 11.515 4.05C11.511 3.85 11.511 3.624 11.515 3.372C11.519 3.12 11.523 2.876 11.527 2.64C11.539 2.156 11.647 1.802 11.851 1.578C12.055 1.35 12.395 1.218 12.871 1.182V1.89C12.699 1.918 12.573 1.984 12.493 2.088C12.417 2.188 12.371 2.33 12.355 2.514C12.339 2.75 12.331 3.002 12.331 3.27C12.335 3.534 12.343 3.794 12.355 4.05C12.367 4.334 12.411 4.552 12.487 4.704C12.563 4.852 12.721 4.952 12.961 5.004L13.555 5.13C13.875 5.194 14.117 5.3 14.281 5.448C14.449 5.596 14.567 5.786 14.635 6.018C14.703 6.246 14.741 6.52 14.749 6.84C14.757 7.024 14.761 7.186 14.761 7.326C14.765 7.462 14.765 7.596 14.761 7.728C14.761 7.86 14.757 8.014 14.749 8.19C14.729 8.682 14.613 9.042 14.401 9.27C14.189 9.498 13.855 9.63 13.399 9.666ZM12.871 9.66C12.403 9.624 12.067 9.49 11.863 9.258C11.663 9.026 11.553 8.67 11.533 8.19C11.529 7.898 11.527 7.628 11.527 7.38C11.527 7.132 11.537 6.862 11.557 6.57H12.343C12.335 6.762 12.329 6.958 12.325 7.158C12.321 7.358 12.321 7.556 12.325 7.752C12.329 7.948 12.335 8.138 12.343 8.322C12.355 8.51 12.401 8.656 12.481 8.76C12.565 8.86 12.695 8.926 12.871 8.958V9.66ZM13.903 4.176C13.911 3.976 13.915 3.786 13.915 3.606C13.919 3.422 13.919 3.24 13.915 3.06C13.915 2.88 13.911 2.698 13.903 2.514C13.895 2.33 13.851 2.188 13.771 2.088C13.691 1.988 13.567 1.922 13.399 1.89V1.182C13.839 1.218 14.163 1.35 14.371 1.578C14.579 1.802 14.693 2.16 14.713 2.652C14.717 2.748 14.719 2.886 14.719 3.066C14.719 3.242 14.717 3.43 14.713 3.63C14.709 3.83 14.705 4.012 14.701 4.176H13.903ZM15.808 9.6V1.248H16.636V9.6H15.808ZM19.21 9.6H18.328L17.464 6.468H17.164V5.724H17.398C17.538 5.724 17.664 5.71 17.776 5.682C17.888 5.65 17.98 5.586 18.052 5.49C18.128 5.394 18.176 5.248 18.196 5.052C18.208 4.912 18.216 4.732 18.22 4.512C18.228 4.292 18.23 4.062 18.226 3.822C18.226 3.582 18.222 3.358 18.214 3.15C18.21 2.942 18.204 2.78 18.196 2.664C18.18 2.464 18.136 2.316 18.064 2.22C17.992 2.124 17.9 2.06 17.788 2.028C17.676 1.996 17.55 1.98 17.41 1.98H17.164V1.248H17.41C17.558 1.248 17.72 1.258 17.896 1.278C18.072 1.294 18.242 1.344 18.406 1.428C18.574 1.512 18.714 1.654 18.826 1.854C18.938 2.054 19.004 2.336 19.024 2.7C19.032 2.812 19.038 2.966 19.042 3.162C19.046 3.354 19.048 3.562 19.048 3.786C19.052 4.01 19.052 4.232 19.048 4.452C19.044 4.668 19.036 4.856 19.024 5.016C19 5.428 18.912 5.732 18.76 5.928C18.612 6.124 18.442 6.258 18.25 6.33L19.21 9.6Z"
      />
    </svg>
  </>
)

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [animFinance, setAnimFinance] = useState(false)
  const [animCard, setAnimCard] = useState(false)

  useEffect(() => {
    // Finance e card aparecem suavemente após o logo terminar de desenhar
    const t1 = setTimeout(() => setAnimFinance(true), 2400)
    const t2 = setTimeout(() => setAnimCard(true), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const email = usuario.includes('@') ? usuario : `${usuario}@klosr.com`
      await login(email, senha)
    } catch (err) {
      setErro('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">

        {/* LOGO */}
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="w-40 h-20">
            <KlosrSVG />
          </div>

          <div
            style={{
              opacity: animFinance ? 1 : 0,
              transform: animFinance ? 'translateY(0px)' : 'translateY(4px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >
            <FinanceSVG />
          </div>
        </div>

        {/* CARD */}
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-purple-900/20"
          style={{
            opacity: animCard ? 1 : 0,
            transform: animCard ? 'translateY(0px)' : 'translateY(14px)',
            transition: 'opacity 0.9s ease, transform 0.9s ease',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Bem-vindo de volta 👋
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            <div>
              <label className="text-xs text-purple-400 uppercase tracking-wide">
                Usuário
              </label>
              <div className="flex items-center mt-1 rounded-xl border border-white/10 bg-white/5 focus-within:border-purple-500 transition-all overflow-hidden">
                <input
                  autoFocus
                  type="text"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="seu.usuario"
                  required
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-purple-500 outline-none text-sm"
                />
                <span className="px-3 py-3 text-sm text-purple-400 border-l border-white/10">
                  @klosr.com
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-purple-400 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-500 outline-none text-sm focus:border-purple-500 transition-all"
              />
            </div>

            {erro && (
              <p className="text-red-400 text-sm text-center">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-900/40 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.97] transition-transform"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}